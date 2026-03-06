import assert from 'node:assert/strict';
import { evaluateCodexEvent } from '../src/index.js';

const allowed = await evaluateCodexEvent({ toolName: 'functions.shell_command', command: 'Get-ChildItem -Force' });
assert.equal(allowed.decision, 'allow');
assert.equal(allowed.reasonCode, 'LOCAL_READONLY_SHELL_ALLOW');

const denied = await evaluateCodexEvent({ toolName: 'functions.apply_patch' });
assert.equal(denied.decision, 'deny');
assert.equal(denied.reasonCode, 'LOCAL_ALLOWLIST_BLOCK');

console.log('Local hardening baseline verified.');
