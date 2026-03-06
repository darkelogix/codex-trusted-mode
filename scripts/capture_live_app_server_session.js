import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { spawn } from 'node:child_process';
import { evaluateAppServerApprovalRequest } from '../src/index.js';

const repoRoot = process.cwd();
const outputPath = path.join(repoRoot, 'release-evidence', 'live-app-server-session.jsonl');
const evidencePath = path.join(repoRoot, 'release-evidence', 'live-app-server-session-summary.json');

const transcript = [];
let resolved = false;
let nextId = 1;
let approvalHandled = false;
let commandDecision = null;

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

function buildInitialize() {
  return {
    id: `init-${nextId++}`,
    method: 'initialize',
    params: {
      clientInfo: {
        name: 'codex-trusted-mode-harness',
        version: '0.1.0',
      },
      capabilities: {
        experimentalApi: true,
      },
    },
  };
}

function buildThreadStart() {
  return {
    id: `thread-start-${nextId++}`,
    method: 'thread/start',
    params: {
      threadId: `codex-trusted-mode-live-${Date.now()}`,
      cwd: repoRoot,
      approvalPolicy: 'untrusted',
      sandboxPolicy: {
        type: 'readOnly',
        networkAccess: false,
      },
      input: [
        {
          type: 'text',
          text: 'List the files in the current directory and then stop.',
        },
      ],
    },
  };
}

async function finalize(child, status, extra = {}) {
  if (resolved) return;
  resolved = true;
  try {
    child.kill();
  } catch {}

  const summary = {
    capturedAtUtc: new Date().toISOString(),
    status,
    approvalHandled,
    commandDecision,
    transcriptPath: path.relative(repoRoot, outputPath),
    ...extra,
  };

  fs.writeFileSync(outputPath, transcript.map((entry) => JSON.stringify(entry)).join('\n'));
  fs.writeFileSync(evidencePath, JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
}

const child = spawn('codex', ['app-server', '--listen', 'stdio://'], {
  cwd: repoRoot,
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true,
});

child.stderr.on('data', (chunk) => {
  const text = String(chunk);
  record('server-stderr', text);
});

const rl = readline.createInterface({
  input: child.stdout,
  crlfDelay: Infinity,
});

const timeout = setTimeout(() => {
  finalize(child, 'timeout', {
    reason: 'No live approval callback captured before timeout.',
  });
}, 45000);

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
    send(child, buildThreadStart());
    return;
  }

  if (message.method === 'item/commandExecution/requestApproval' || message.method === 'item/fileChange/requestApproval') {
    const result = await evaluateAppServerApprovalRequest(message);
    approvalHandled = true;
    commandDecision = result.response?.decision || null;
    send(child, {
      id: message.id,
      result: result.response,
    });
    return;
  }

  if (message.method === 'turn/completed') {
    clearTimeout(timeout);
    finalize(child, approvalHandled ? 'captured' : 'completed_without_approval', {
      finalNotification: message.method,
    });
  }
});

child.on('exit', (code, signal) => {
  clearTimeout(timeout);
  if (!resolved) {
    finalize(child, 'process_exit', {
      exitCode: code,
      signal,
    });
  }
});

send(child, buildInitialize());
