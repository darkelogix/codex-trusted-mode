import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { evaluateCodexEvent } from '../src/index.js';
import { containsShellControlOperator, isAllowedReadonlyShellCommand } from '../src/shellPolicy.js';

function startMockServer() {
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      const parsed = JSON.parse(body || '{}');
      const toolName = parsed.inputs?.request?.toolName;
      const command = String(parsed.inputs?.request?.command || '');
      let response;
      if (toolName === 'functions.apply_patch') {
        response = { decision: 'deny', reasonCode: 'PDP_PATCH_DENY', trace: { traceId: 't1' } };
      } else if (toolName === 'functions.shell_command' && containsShellControlOperator(command)) {
        response = { decision: 'deny', reasonCode: 'PDP_SHELL_CONTROL_OPERATOR_DENY', trace: { traceId: 't4' } };
      } else if (
        toolName === 'functions.shell_command' &&
        isAllowedReadonlyShellCommand(command, ['Get-Content'])
      ) {
        response = { decision: 'allow', reasonCode: 'PDP_READONLY_SHELL_ALLOW', trace: { traceId: 't2' } };
      } else {
        response = { decision: 'deny', reasonCode: 'PDP_MUTATING_SHELL_DENY', trace: { traceId: 't3' } };
      }
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(response));
    });
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

test('governed mode allows readonly shell via PDP', async () => {
  const { server, url } = await startMockServer();
  try {
    const result = await evaluateCodexEvent(
      { toolName: 'functions.shell_command', command: 'Get-Content README.md' },
      { toolPolicyMode: 'PDP', pdpUrl: url, failClosed: true }
    );
    assert.equal(result.decision, 'allow');
    assert.equal(result.reasonCode, 'PDP_READONLY_SHELL_ALLOW');
  } finally {
    server.close();
  }
});

test('governed mode denies apply_patch via PDP', async () => {
  const { server, url } = await startMockServer();
  try {
    const result = await evaluateCodexEvent(
      { toolName: 'functions.apply_patch' },
      { toolPolicyMode: 'PDP', pdpUrl: url, failClosed: true }
    );
    assert.equal(result.decision, 'deny');
    assert.equal(result.reasonCode, 'PDP_PATCH_DENY');
  } finally {
    server.close();
  }
});

test('governed mode denies shell control operators via PDP', async () => {
  const { server, url } = await startMockServer();
  try {
    const result = await evaluateCodexEvent(
      { toolName: 'functions.shell_command', command: 'Get-Content README.md; Remove-Item .\\tmp.txt' },
      { toolPolicyMode: 'PDP', pdpUrl: url, failClosed: true }
    );
    assert.equal(result.decision, 'deny');
    assert.equal(result.reasonCode, 'PDP_SHELL_CONTROL_OPERATOR_DENY');
  } finally {
    server.close();
  }
});
