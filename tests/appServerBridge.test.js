import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateAppServerApprovalRequest, mapEvaluationToApprovalResponse } from '../src/index.js';

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

test('native command approval request accepts constrained decisions', async () => {
  const request = {
    id: '5',
    method: 'item/commandExecution/requestApproval',
    params: {
      itemId: 'item-5',
      threadId: 'thread-1',
      turnId: 'turn-1',
      command: 'Get-Content README.md',
      cwd: 'C:\\dev\\codex-trusted-mode',
    },
  };

  assert.deepEqual(mapEvaluationToApprovalResponse(request, { decision: 'constrain' }), { decision: 'accept' });
});

test('legacy exec approval request approves constrained decisions', async () => {
  const request = {
    id: '6',
    method: 'execCommandApproval',
    params: {
      itemId: 'item-6',
      threadId: 'thread-1',
      turnId: 'turn-1',
      command: 'Get-Content README.md',
      cwd: 'C:\\dev\\codex-trusted-mode',
    },
  };

  assert.deepEqual(mapEvaluationToApprovalResponse(request, { decision: 'constrain' }), { decision: 'approved' });
});

test('requestUserInput returns a safe empty answer payload instead of throwing', async () => {
  const request = {
    id: '7',
    method: 'item/tool/requestUserInput',
    params: {
      toolCallId: 'tool-1',
      questions: [],
    },
  };

  const result = await evaluateAppServerApprovalRequest(request);
  assert.equal(result.evaluation.decision, 'unsupported');
  assert.equal(result.evaluation.reasonCode, 'UNSUPPORTED_APP_SERVER_METHOD');
  assert.deepEqual(result.response, { answers: {} });
});

test('dynamic tool call returns a failed protocol-shaped response instead of throwing', async () => {
  const request = {
    id: '8',
    method: 'item/tool/call',
    params: {
      threadId: 'thread-1',
      turnId: 'turn-1',
      callId: 'call-1',
      tool: 'demo_tool',
      arguments: {},
    },
  };

  const result = await evaluateAppServerApprovalRequest(request);
  assert.equal(result.evaluation.decision, 'unsupported');
  assert.equal(result.evaluation.reasonCode, 'UNSUPPORTED_APP_SERVER_METHOD');
  assert.equal(result.response.success, false);
  assert.match(result.response.contentItems[0].text, /Unsupported app-server request method: item\/tool\/call/);
});

test('unknown app-server methods return an explicit unsupported outcome', async () => {
  const request = {
    id: '9',
    method: 'something/unknown',
    params: {},
  };

  const result = await evaluateAppServerApprovalRequest(request);
  assert.equal(result.evaluation.decision, 'unsupported');
  assert.equal(result.evaluation.reasonCode, 'UNSUPPORTED_APP_SERVER_METHOD');
  assert.equal(result.response, null);
});
