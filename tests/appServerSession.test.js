import test from 'node:test';
import assert from 'node:assert/strict';
import { buildInitializeRequest, buildThreadStartRequest, buildTurnStartRequest, extractCompletedAgentMessage } from '../src/index.js';

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

test('buildThreadStartRequest includes cwd and stable defaults', () => {
  assert.deepEqual(buildThreadStartRequest('thread-start-1', 'C:\\repo'), {
    id: 'thread-start-1',
    method: 'thread/start',
    params: {
      cwd: 'C:\\repo',
      experimentalRawEvents: false,
      persistExtendedHistory: false,
    },
  });
});

test('buildTurnStartRequest packages the user prompt for app-server', () => {
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
    },
  });
});

test('extractCompletedAgentMessage returns only completed agent messages', () => {
  assert.equal(extractCompletedAgentMessage({ method: 'item/completed', params: { item: { type: 'agent_message', text: 'done' } } }), 'done');
  assert.equal(extractCompletedAgentMessage({ method: 'item/completed', params: { item: { type: 'commandExecution', text: 'nope' } } }), '');
  assert.equal(extractCompletedAgentMessage({ method: 'turn/completed' }), '');
});
