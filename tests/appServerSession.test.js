import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCodexAppServerSpawn,
  buildInitializeRequest,
  buildReadOnlySandboxPolicy,
  buildThreadStartRequest,
  buildTurnStartRequest,
  summarizeDynamicToolCallParams,
  collectPostHocCommandExecutions,
  extractCompletedAgentMessage,
} from '../src/index.js';

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

test('buildCodexAppServerSpawn returns a valid launch tuple for the current platform', () => {
  const launch = buildCodexAppServerSpawn();
  assert.equal(typeof launch.command, 'string');
  assert.ok(Array.isArray(launch.args));
  if (process.platform === 'win32') {
    assert.match(launch.command.toLowerCase(), /cmd\.exe$/);
    assert.deepEqual(launch.args, ['/d', '/s', '/c', 'codex.cmd app-server --listen stdio://']);
  } else {
    assert.equal(launch.command, 'codex');
    assert.deepEqual(launch.args, ['app-server', '--listen', 'stdio://']);
  }
});

test('buildThreadStartRequest includes approval policy and sandbox defaults', () => {
  const result = buildThreadStartRequest('thread-start-1', 'C:\\repo');
  assert.equal(result.id, 'thread-start-1');
  assert.equal(result.method, 'thread/start');
  assert.equal(result.params.cwd, 'C:\\repo');
  assert.equal(result.params.approvalPolicy, 'untrusted');
  assert.deepEqual(result.params.sandboxPolicy, { type: 'readOnly', networkAccess: false });
  assert.equal(result.params.experimentalRawEvents, true);
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

test('summarizeDynamicToolCallParams keeps only the useful tool call fields', () => {
  assert.deepEqual(
    summarizeDynamicToolCallParams({
      tool: 'functions.read_file',
      callId: 'call-1',
      threadId: 'thread-1',
      turnId: 'turn-1',
      arguments: { path: 'README.md' },
      ignored: true,
    }),
    {
      tool: 'functions.read_file',
      callId: 'call-1',
      threadId: 'thread-1',
      turnId: 'turn-1',
      arguments: { path: 'README.md' },
    },
  );
});

test('collectPostHocCommandExecutions finds commandExecution payloads inside rawResponseItem/completed messages', () => {
  assert.deepEqual(
    collectPostHocCommandExecutions({
      method: 'rawResponseItem/completed',
      params: {
        item: {
          type: 'function_call',
          name: 'shell_command',
          arguments: '{"command":"Get-Content -Raw package.json"}',
        },
        nested: [
          {
            type: 'commandExecution',
            command: '"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command \'Get-Content -Raw package.json\'',
            commandActions: [{ type: 'exec', command: 'Get-Content -Raw package.json' }],
            status: 'completed',
          },
        ],
      },
    }),
    [
      {
        command: '"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command \'Get-Content -Raw package.json\'',
        commandActions: [{ type: 'exec', command: 'Get-Content -Raw package.json' }],
        callId: '',
        name: '',
        arguments: null,
        status: 'completed',
      },
    ],
  );
});

test('collectPostHocCommandExecutions also finds local_shell_call payloads from raw response items', () => {
  assert.deepEqual(
    collectPostHocCommandExecutions({
      method: 'rawResponseItem/completed',
      params: {
        item: {
          type: 'local_shell_call',
          status: 'completed',
          call_id: 'call-raw-1',
          action: {
            type: 'exec',
            command: ['Get-Content', '-Raw', 'package.json'],
          },
        },
      },
    }),
    [
      {
        command: 'Get-Content -Raw package.json',
        commandActions: [{ type: 'exec', command: 'Get-Content -Raw package.json' }],
        callId: 'call-raw-1',
        name: '',
        arguments: null,
        status: 'completed',
      },
    ],
  );
});

test('extractCompletedAgentMessage returns only completed agent messages', () => {
  assert.equal(extractCompletedAgentMessage({ method: 'item/completed', params: { item: { type: 'agent_message', text: 'done' } } }), 'done');
  assert.equal(extractCompletedAgentMessage({ method: 'item/completed', params: { item: { type: 'commandExecution', text: 'nope' } } }), '');
  assert.equal(extractCompletedAgentMessage({ method: 'turn/completed' }), '');
});
