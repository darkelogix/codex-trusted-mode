import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateCodexEvent } from '../src/index.js';

test('free mode allows update_plan', async () => {
  const result = await evaluateCodexEvent({ toolName: 'functions.update_plan' });
  assert.equal(result.decision, 'allow');
  assert.equal(result.reasonCode, 'LOCAL_ALLOWLIST_ALLOW');
});

test('free mode blocks apply_patch with local allowlist reason', async () => {
  const result = await evaluateCodexEvent({ toolName: 'functions.apply_patch' });
  assert.equal(result.decision, 'deny');
  assert.equal(result.reasonCode, 'LOCAL_ALLOWLIST_BLOCK');
});
