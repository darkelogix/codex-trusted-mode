import readline from 'node:readline';
import { evaluateAppServerApprovalRequest } from '../src/index.js';

function writeJson(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function isRequest(message) {
  return message && typeof message === 'object' && 'id' in message && typeof message.method === 'string';
}

function buildInitializeResponse(message) {
  return {
    id: message.id,
    result: {
      userAgent: 'codex-trusted-mode-bridge/0.1.0',
    },
  };
}

async function handleRequest(message) {
  if (message.method === 'initialize') {
    writeJson(buildInitializeResponse(message));
    return;
  }

  const result = await evaluateAppServerApprovalRequest(message);
  writeJson({
    id: message.id,
    result: result.response,
  });
}

const rl = readline.createInterface({
  input: process.stdin,
  crlfDelay: Infinity,
});

for await (const line of rl) {
  const trimmed = line.trim();
  if (!trimmed) continue;

  let message;
  try {
    message = JSON.parse(trimmed);
  } catch (error) {
    writeJson({
      error: {
        code: -32700,
        message: 'Invalid JSON',
        data: String(error.message || error),
      },
      id: null,
    });
    continue;
  }

  if (!isRequest(message)) continue;

  try {
    await handleRequest(message);
  } catch (error) {
    writeJson({
      id: message.id ?? null,
      error: {
        code: -32000,
        message: String(error.message || error),
      },
    });
  }
}
