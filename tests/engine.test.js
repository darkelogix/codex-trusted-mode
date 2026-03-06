import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateCodexEvent } from '../src/index.js';

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
