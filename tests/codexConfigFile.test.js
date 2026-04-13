import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { defaultCodexConfigPath, loadBridgeOverrides, parseCodexTrustedModeSection, parseTomlValue } from '../src/index.js';

test('parseTomlValue handles strings, booleans, numbers, and arrays', () => {
  assert.equal(parseTomlValue('"abc"'), 'abc');
  assert.equal(parseTomlValue('true'), true);
  assert.equal(parseTomlValue('5000'), 5000);
  assert.deepEqual(parseTomlValue('["a", "b"]'), ['a', 'b']);
});

test('parseCodexTrustedModeSection extracts the codex app block only', () => {
  const parsed = parseCodexTrustedModeSection(`
[apps.other]
enabled = false

[apps.codex-trusted-mode]
enabled = true
toolPolicyMode = "PDP"
pdpUrl = "http://10.90.0.6:8001/v1/authorize"
failClosed = true
pdpTimeoutMs = 5000
allowedTools = ["functions.shell_command", "functions.update_plan"]
`);

  assert.deepEqual(parsed, {
    enabled: true,
    toolPolicyMode: 'PDP',
    pdpUrl: 'http://10.90.0.6:8001/v1/authorize',
    failClosed: true,
    pdpTimeoutMs: 5000,
    allowedTools: ['functions.shell_command', 'functions.update_plan'],
  });
});

test('defaultCodexConfigPath honors CODEX_HOME when present', () => {
  const resolved = defaultCodexConfigPath({
    env: { CODEX_HOME: path.join('C:', 'Users', 'demo', '.managed-codex') },
    homeDir: path.join('C:', 'Users', 'demo'),
  });

  assert.equal(resolved, path.join('C:', 'Users', 'demo', '.managed-codex', 'config.toml'));
});

test('loadBridgeOverrides merges config.toml values with JSON overrides', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-trusted-mode-'));
  const configPath = path.join(tempDir, 'config.toml');
  const overridePath = path.join(tempDir, 'overrides.json');

  fs.writeFileSync(configPath, `
[apps.codex-trusted-mode]
toolPolicyMode = "PDP"
pdpUrl = "http://10.90.0.6:8001/v1/authorize"
gatewayId = "gw-dev"
`);
  fs.writeFileSync(overridePath, JSON.stringify({ certificationStatus: 'LOCKDOWN_ONLY' }));

  assert.deepEqual(loadBridgeOverrides({ configPath, overridePath }), {
    toolPolicyMode: 'PDP',
    pdpUrl: 'http://10.90.0.6:8001/v1/authorize',
    gatewayId: 'gw-dev',
    certificationStatus: 'LOCKDOWN_ONLY',
  });
});
