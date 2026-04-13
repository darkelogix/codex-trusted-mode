#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { spawn } from 'node:child_process';
import {
  buildCodexAppServerSpawn,
  buildInitializeRequest,
  buildThreadStartRequest,
  buildTurnStartRequest,
  summarizeDynamicToolCallParams,
  collectPostHocCommandExecutions,
  extractCompletedAgentMessage,
} from '../src/appServerSession.js';
import { evaluateAppServerApprovalRequest } from '../src/index.js';
import { loadBridgeOverrides } from '../src/codexConfigFile.js';

function getFlag(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return '';
  return process.argv[index + 1] || '';
}

function hasFlag(name) {
  return process.argv.includes(name);
}

const prompt = getFlag('--prompt');
if (!prompt) {
  console.error('Usage: codex-trusted-mode-run-turn --prompt <text> [--cwd <path>] [--codex-config <config.toml>] [--config <overrides.json>] [--trace-path <session.json>] [--json]');
  process.exit(1);
}

const overrides = loadBridgeOverrides({
  configPath: getFlag('--codex-config'),
  overridePath: getFlag('--config'),
  appId: getFlag('--app-id') || 'codex-trusted-mode',
});
const cwd = path.resolve(getFlag('--cwd') || process.cwd());
const tracePath = getFlag('--trace-path') ? path.resolve(getFlag('--trace-path')) : '';
const asJson = hasFlag('--json');
const timeoutMs = Number.parseInt(getFlag('--timeout-ms') || '60000', 10);
const codexLaunch = buildCodexAppServerSpawn();

const transcript = [];
const agentMessages = [];
const approvalRequests = [];
const toolCallRequests = [];
const postHocCommandExecutions = [];
const observedMethods = new Set();
const rawNotificationMethods = new Set();
let threadId = '';
let completed = false;
let nextId = 1;

function record(direction, message) {
  transcript.push({
    timestampUtc: new Date().toISOString(),
    direction,
    message,
  });
}

function send(child, message) {
  record('client->server', message);
  child.stdin.write(`${JSON.stringify(message)}\n`);
}

function persistTrace(summary) {
  if (!tracePath) return;
  fs.writeFileSync(tracePath, JSON.stringify({ summary, transcript }, null, 2));
}

function finalize(child, status, extra = {}) {
  if (completed) return;
  completed = true;
  try {
    child.kill();
  } catch {}

  const governanceGapDetected =
    postHocCommandExecutions.length > 0 && approvalRequests.length === 0 && toolCallRequests.length === 0;
  const warnings = [];
  if (governanceGapDetected) {
    warnings.push('Codex reported a commandExecution only after completion. No native pre-execution approval callback or tool-call hook was emitted for this turn.');
  }
  const finalStatus = status === 'completed' && governanceGapDetected ? 'completed_with_governance_gap' : status;

  const summary = {
    status: finalStatus,
    cwd,
    prompt,
    threadId,
    approvalHandled: approvalRequests.length > 0,
    approvalRequests,
    toolCallHandled: toolCallRequests.length > 0,
    toolCallRequests,
    postHocCommandExecutionDetected: postHocCommandExecutions.length > 0,
    postHocCommandExecutions,
    governanceGapDetected,
    observedMethods: Array.from(observedMethods),
    rawNotificationMethods: Array.from(rawNotificationMethods),
    agentMessages,
    warnings,
    ...extra,
  };

  persistTrace(summary);

  if (asJson) {
    console.log(JSON.stringify(summary, null, 2));
    process.exit(finalStatus === 'completed' ? 0 : 1);
  }

  if (agentMessages.length > 0) {
    console.log(agentMessages[agentMessages.length - 1]);
  }
  console.log(`status=${status}`);
  if (approvalRequests.length > 0) {
    console.log(`approval_decisions=${approvalRequests.map((entry) => entry.response.decision).join(',')}`);
  }
  if (toolCallRequests.length > 0) {
    console.log(`tool_calls=${toolCallRequests.map((entry) => entry.tool || 'unknown').join(',')}`);
  }
  if (warnings.length > 0) {
    console.log(`warnings=${warnings.join(' | ')}`);
  }
  if (tracePath) {
    console.log(`trace_path=${tracePath}`);
  }
  process.exit(finalStatus === 'completed' ? 0 : 1);
}

const child = spawn(codexLaunch.command, codexLaunch.args, {
  cwd,
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: false,
});

child.stderr.on('data', (chunk) => {
  record('server-stderr', String(chunk));
});

const rl = readline.createInterface({
  input: child.stdout,
  crlfDelay: Infinity,
});

const timeout = setTimeout(() => {
  finalize(child, 'timeout', { reason: `No completion received within ${timeoutMs}ms.` });
}, timeoutMs);

rl.on('line', async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  let message;
  try {
    message = JSON.parse(trimmed);
  } catch {
    record('server->client:raw', trimmed);
    return;
  }

  record('server->client', message);

  if (typeof message.method === 'string') {
    observedMethods.add(message.method);
    if (typeof message.id === 'undefined') {
      rawNotificationMethods.add(message.method);
    }
  }

  const postHocExecutions = collectPostHocCommandExecutions(message);
  if (postHocExecutions.length > 0) {
    for (const execution of postHocExecutions) {
      const key = JSON.stringify(execution);
      if (!postHocCommandExecutions.some((existing) => JSON.stringify(existing) === key)) {
        postHocCommandExecutions.push(execution);
      }
    }
  }

  if (message.id && message.result?.userAgent) {
    send(child, buildThreadStartRequest(`thread-start-${nextId++}`, cwd));
    return;
  }

  if (typeof message.id !== 'undefined' && String(message.id).startsWith('thread-start-') && message.result?.thread?.id) {
    threadId = message.result.thread.id;
    send(child, buildTurnStartRequest(`turn-start-${nextId++}`, threadId, prompt, cwd));
    return;
  }

  if (
    message.method === 'item/commandExecution/requestApproval' ||
    message.method === 'item/fileChange/requestApproval' ||
    message.method === 'execCommandApproval' ||
    message.method === 'applyPatchApproval'
  ) {
    const result = await evaluateAppServerApprovalRequest(message, overrides);
    approvalRequests.push({
      method: message.method,
      toolName: result.event?.toolName || '',
      decision: result.evaluation?.decision || '',
      reasonCode: result.evaluation?.reasonCode || '',
      response: result.response,
    });
    send(child, {
      id: message.id,
      result: result.response,
    });
    return;
  }

  if (message.method === 'item/tool/call') {
    const result = await evaluateAppServerApprovalRequest(message, overrides);
    toolCallRequests.push({
      method: message.method,
      ...summarizeDynamicToolCallParams(message.params),
      decision: result.evaluation?.decision || '',
      reasonCode: result.evaluation?.reasonCode || '',
      response: result.response,
    });
    send(child, {
      id: message.id,
      result: result.response,
    });
    return;
  }

  const agentMessage = extractCompletedAgentMessage(message);
  if (agentMessage) {
    agentMessages.push(agentMessage);
    return;
  }

  if (message.method === 'turn/completed') {
    clearTimeout(timeout);
    finalize(child, 'completed', { finalNotification: 'turn/completed' });
  }
});

child.on('error', (error) => {
  clearTimeout(timeout);
  finalize(child, 'process_spawn_error', {
    error: String(error.message || error),
    spawnCommand: codexLaunch.command,
    spawnArgs: codexLaunch.args,
  });
});

child.on('exit', (code, signal) => {
  clearTimeout(timeout);
  if (!completed) {
    finalize(child, 'process_exit', { exitCode: code, signal });
  }
});

send(child, buildInitializeRequest(`init-${nextId++}`));
