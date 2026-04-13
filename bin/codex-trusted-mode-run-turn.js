#!/usr/bin/env node
import path from 'node:path';
import readline from 'node:readline';
import { spawn } from 'node:child_process';
import { buildCodexAppServerSpawn, buildInitializeRequest, buildThreadStartRequest, buildTurnStartRequest, extractCompletedAgentMessage } from '../src/appServerSession.js';
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
  console.error('Usage: codex-trusted-mode-run-turn --prompt <text> [--cwd <path>] [--codex-config <config.toml>] [--config <overrides.json>] [--json]');
  process.exit(1);
}

const overrides = loadBridgeOverrides({
  configPath: getFlag('--codex-config'),
  overridePath: getFlag('--config'),
  appId: getFlag('--app-id') || 'codex-trusted-mode',
});
const cwd = path.resolve(getFlag('--cwd') || process.cwd());
const asJson = hasFlag('--json');
const timeoutMs = Number.parseInt(getFlag('--timeout-ms') || '60000', 10);
const codexLaunch = buildCodexAppServerSpawn();

const transcript = [];
const agentMessages = [];
const approvalRequests = [];
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

function finalize(child, status, extra = {}) {
  if (completed) return;
  completed = true;
  try {
    child.kill();
  } catch {}

  const summary = {
    status,
    cwd,
    prompt,
    threadId,
    approvalHandled: approvalRequests.length > 0,
    approvalRequests,
    agentMessages,
    ...extra,
  };

  if (asJson) {
    console.log(JSON.stringify(summary, null, 2));
    process.exit(status === 'completed' ? 0 : 1);
  }

  if (agentMessages.length > 0) {
    console.log(agentMessages[agentMessages.length - 1]);
  }
  console.log(`status=${status}`);
  if (approvalRequests.length > 0) {
    console.log(`approval_decisions=${approvalRequests.map((entry) => entry.response.decision).join(',')}`);
  }
  process.exit(status === 'completed' ? 0 : 1);
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
