import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { evaluateCodexEvent } from '../src/index.js';

function startMockServer(statusCode, body, contentType = 'application/json') {
  const server = http.createServer((req, res) => {
    res.writeHead(statusCode, { 'content-type': contentType });
    res.end(typeof body === 'string' ? body : JSON.stringify(body));
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/v1/authorize`,
      });
    });
  });
}

test('free mode allows readonly shell commands', async () => {
  const result = await evaluateCodexEvent({ toolName: 'functions.shell_command', command: 'Get-Content README.md' });
  assert.equal(result.decision, 'allow');
  assert.equal(result.reasonCode, 'LOCAL_READONLY_SHELL_ALLOW');
});

test('free mode blocks non-allowlisted shell commands', async () => {
  const result = await evaluateCodexEvent({ toolName: 'functions.shell_command', command: 'git commit -m test' });
  assert.equal(result.decision, 'deny');
  assert.equal(result.reasonCode, 'LOCAL_READONLY_SHELL_BLOCK');
});

test('free mode blocks apply_patch', async () => {
  const result = await evaluateCodexEvent({ toolName: 'functions.apply_patch' });
  assert.equal(result.decision, 'deny');
});

test('paid mode fails closed when pdp is unavailable', async () => {
  const result = await evaluateCodexEvent(
    { toolName: 'functions.shell_command', command: 'Get-Content README.md' },
    { toolPolicyMode: 'PDP', pdpUrl: 'http://127.0.0.1:9/v1/authorize', failClosed: true }
  );
  assert.equal(result.decision, 'deny');
  assert.equal(result.reasonCode, 'PDP_UNAVAILABLE_FAIL_CLOSED');
});

test('paid mode fails closed on non-2xx PDP JSON responses', async () => {
  const { server, url } = await startMockServer(403, { error: 'forbidden', message: 'tenant blocked' });
  try {
    const result = await evaluateCodexEvent(
      { toolName: 'functions.shell_command', command: 'Get-Content README.md' },
      { toolPolicyMode: 'PDP', pdpUrl: url, failClosed: true }
    );
    assert.equal(result.decision, 'deny');
    assert.equal(result.reasonCode, 'PDP_UNAVAILABLE_FAIL_CLOSED');
    assert.match(result.error, /PDP unreachable \(403\): tenant blocked/);
  } finally {
    server.close();
  }
});

test('paid mode fails closed on non-2xx PDP non-JSON responses', async () => {
  const { server, url } = await startMockServer(500, 'upstream failure', 'text/plain');
  try {
    const result = await evaluateCodexEvent(
      { toolName: 'functions.shell_command', command: 'Get-Content README.md' },
      { toolPolicyMode: 'PDP', pdpUrl: url, failClosed: true }
    );
    assert.equal(result.decision, 'deny');
    assert.equal(result.reasonCode, 'PDP_UNAVAILABLE_FAIL_CLOSED');
    assert.match(result.error, /PDP unreachable \(500\): upstream failure/);
  } finally {
    server.close();
  }
});
