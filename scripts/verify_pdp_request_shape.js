import assert from 'node:assert/strict';
import { buildConfig } from '../src/config.js';
import { normalizeCodexEvent } from '../src/normalize.js';

const config = buildConfig({ toolPolicyMode: 'PDP' });
const request = normalizeCodexEvent({
  toolName: 'functions.shell_command',
  command: 'git status',
  workingDirectory: '/repo',
  repoContext: { repoName: 'demo' },
  environment: 'dev',
});

assert.equal(config.contractId, 'codex-tool-governance');
assert.equal(request.runtime, 'codex');
assert.equal(request.actionType, 'execute');
assert.equal(request.toolName, 'functions.shell_command');
assert.equal(request.command, 'git status');

console.log('PDP request shape verified.');
