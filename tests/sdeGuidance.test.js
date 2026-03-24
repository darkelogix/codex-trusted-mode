import test from 'node:test';
import assert from 'node:assert/strict';
import { maybeAppendSdeRuntimeGuidance, buildMissingPdpConfigIssue } from '../src/sdeGuidance.js';

test('adds guidance for local connectivity failures', () => {
  const result = maybeAppendSdeRuntimeGuidance('fetch failed', 'http://localhost:8001/v1/authorize');
  assert.match(result, /licensed SDE runtime/);
  assert.match(result, /ALLOWLIST_ONLY/);
});

test('does not add guidance for explicit PDP denials', () => {
  const result = maybeAppendSdeRuntimeGuidance('PDP unreachable (403): tenant blocked', 'http://localhost:8001/v1/authorize');
  assert.equal(result, 'PDP unreachable (403): tenant blocked');
});

test('missing pdp config issue explains the SDE boundary', () => {
  const result = buildMissingPdpConfigIssue();
  assert.match(result, /separately licensed SDE runtime/);
  assert.match(result, /customer console/);
});
