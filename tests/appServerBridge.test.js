import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateAppServerApprovalRequest } from '../src/index.js';

test('native command approval request allows readonly shell command', async () => {
  const request = {
    id: '1',
    method: 'item/commandExecution/requestApproval',
    params: {
      itemId: 'item-1',
      threadId: 'thread-1',
      turnId: 'turn-1',
      command: 'Get-Content README.md',
      cwd: 'C:\\dev\\codex-trusted-mode',
    },
  };

  const result = await evaluateAppServerApprovalRequest(request);
  assert.equal(result.event.toolName, 'functions.shell_command');
  assert.equal(result.evaluation.decision, 'allow');
  assert.deepEqual(result.response, { decision: 'accept' });
});

test('native command approval request denies mutating shell command', async () => {
  const request = {
    id: '2',
    method: 'item/commandExecution/requestApproval',
    params: {
      itemId: 'item-2',
      threadId: 'thread-1',
      turnId: 'turn-1',
      command: 'git commit -m test',
      cwd: 'C:\\dev\\codex-trusted-mode',
    },
  };

  const result = await evaluateAppServerApprovalRequest(request);
  assert.equal(result.evaluation.decision, 'deny');
  assert.deepEqual(result.response, { decision: 'decline' });
});

test('native file change approval request denies apply_patch equivalent', async () => {
  const request = {
    id: '3',
    method: 'item/fileChange/requestApproval',
    params: {
      itemId: 'item-3',
      threadId: 'thread-1',
      turnId: 'turn-1',
      grantRoot: 'C:\\dev\\codex-trusted-mode',
    },
  };

  const result = await evaluateAppServerApprovalRequest(request);
  assert.equal(result.event.toolName, 'functions.apply_patch');
  assert.equal(result.evaluation.decision, 'deny');
  assert.deepEqual(result.response, { decision: 'decline' });
});

test('legacy exec approval request is mapped correctly', async () => {
  const request = {
    id: '4',
    method: 'execCommandApproval',
    params: {
      itemId: 'item-4',
      threadId: 'thread-1',
      turnId: 'turn-1',
      command: 'Get-Content README.md',
      cwd: 'C:\\dev\\codex-trusted-mode',
    },
  };

  const result = await evaluateAppServerApprovalRequest(request);
  assert.equal(result.evaluation.decision, 'allow');
  assert.deepEqual(result.response, { decision: 'approved' });
});
