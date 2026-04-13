import test from 'node:test';
import assert from 'node:assert/strict';
import { buildInitializeRequest, buildReadOnlySandboxPolicy, buildThreadStartRequest, buildTurnStartRequest, extractCompletedAgentMessage } from '../src/index.js';

test('buildInitializeRequest emits the expected protocol shape', () => {
  assert.deepEqual(buildInitializeRequest('init-9'), {
    id: 'init-9',
    method: 'initialize',
    params: {
      clientInfo: {
        name: 'codex-trusted-mode-runner',
        version: '0.1.0',
      },
      capabilities: {
        experimentalApi: true,
      },
    },
  });
});

test('buildReadOnlySandboxPolicy returns a read-only no-network policy', () => {
  assert.deepEqual(buildReadOnlySandboxPolicy(), {
    type: 'readOnly',
    networkAccess: false,
  });
});

test('buildThreadStartRequest includes approval policy and sandbox defaults', () => {
  const result = buildThreadStartRequest('thread-start-1', 'C:\\repo');
  assert.equal(result.id, 'thread-start-1');
  assert.equal(result.method, 'thread/start');
  assert.equal(result.params.cwd, 'C:\\repo');
  assert.equal(result.params.approvalPolicy, 'untrusted');
  assert.deepEqual(result.params.sandboxPolicy, { type: 'readOnly', networkAccess: false });
  assert.equal(result.params.experimentalRawEvents, false);
  assert.equal(result.params.persistExtendedHistory, false);
  assert.match(result.params.threadId, /^codex-trusted-mode-thread-/);
});

test('buildTurnStartRequest packages the user prompt for app-server with approval policy', () => {
  assert.deepEqual(buildTurnStartRequest('turn-start-1', 'thread-1', 'Read README.md', 'C:\\repo'), {
    id: 'turn-start-1',
    method: 'turn/start',
    params: {
      threadId: 'thread-1',
      input: [
        {
          type: 'text',
          text: 'Read README.md',
          text_elements: [],
        },
      ],
      cwd: 'C:\\repo',
      approvalPolicy: 'untrusted',
      sandboxPolicy: {
        type: 'readOnly',
        networkAccess: false,
      },
    },
  });
});

test('extractCompletedAgentMessage returns only completed agent messages', () => {
  assert.equal(extractCompletedAgentMessage({ method: 'item/completed', params: { item: { type: 'agent_message', text: 'done' } } }), 'done');
  assert.equal(extractCompletedAgentMessage({ method: 'item/completed', params: { item: { type: 'commandExecution', text: 'nope' } } }), '');
  assert.equal(extractCompletedAgentMessage({ method: 'turn/completed' }), '');
});
