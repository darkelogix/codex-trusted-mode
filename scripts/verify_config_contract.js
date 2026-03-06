import assert from 'node:assert/strict';
import fs from 'node:fs';

const config = JSON.parse(fs.readFileSync(new URL('../codex.integration.json', import.meta.url)));

assert.equal(config.configSchema.toolPolicyMode.default, 'ALLOWLIST_ONLY');
assert.deepEqual(config.configSchema.allowedTools.default, [
  'functions.shell_command',
  'functions.update_plan',
  'functions.view_image',
]);
assert.deepEqual(config.configSchema.allowedShellCommandPrefixes.default, [
  'Get-ChildItem',
  'Get-Content',
  'rg',
  'git status',
  'git diff',
  'git show',
  'pwd',
  'ls',
  'cat',
]);
assert.deepEqual(config.configSchema.highRiskTools.default, [
  'functions.apply_patch',
  'functions.shell_command',
]);

console.log('Config contract verified.');
