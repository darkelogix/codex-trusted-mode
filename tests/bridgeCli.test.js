import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { spawn } from 'node:child_process';

function runBridge(lines) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(process.cwd(), 'bin', 'codex-trusted-mode-bridge.js')], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const stdout = [];
    const stderr = [];

    child.stdout.on('data', (chunk) => stdout.push(String(chunk)));
    child.stderr.on('data', (chunk) => stderr.push(String(chunk)));
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`bridge exited ${code}: ${stderr.join('')}`));
        return;
      }
      resolve(stdout.join('').trim().split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line)));
    });

    child.stdin.write(`${lines.join('\n')}\n`);
    child.stdin.end();
  });
}

test('bridge binary responds to initialize and approval requests', async () => {
  const responses = await runBridge([
    JSON.stringify({ id: 'init-1', method: 'initialize', params: { clientInfo: { name: 'test', version: '1.0.0' } } }),
    JSON.stringify({
      id: 'req-1',
      method: 'item/commandExecution/requestApproval',
      params: {
        itemId: 'item-1',
        threadId: 'thread-1',
        turnId: 'turn-1',
        command: 'Get-Content README.md',
        cwd: 'C:\\dev\\codex-trusted-mode',
      },
    }),
  ]);

  assert.equal(responses[0].id, 'init-1');
  assert.match(responses[0].result.userAgent, /^codex-trusted-mode-bridge\//);
  assert.deepEqual(responses[1], { id: 'req-1', result: { decision: 'accept' } });
});
