import test from 'node:test';
import assert from 'node:assert/strict';
import { buildConfig } from '../src/config.js';
import { normalizeCodexEvent } from '../src/normalize.js';
import { buildPdpHeaders, buildPdpPayload } from '../src/pdpClient.js';

test('buildPdpPayload emits the SDE authorize envelope for Codex', () => {
  const config = buildConfig({ toolPolicyMode: 'PDP', tenantId: 'trial-tenant', environment: 'prod' });
  const request = normalizeCodexEvent({
    toolName: 'functions.shell_command',
    command: 'Get-Content README.md',
    workingDirectory: 'C:\\dev\\codex-trusted-mode',
    environment: 'prod',
  });

  const payload = buildPdpPayload(config, request);

  assert.deepEqual(payload, {
    decision_sku: 'codex.trusted_mode.authorize.v1',
    policy_variant: 'codex-guard.v0.1.0',
    tenant_id: 'trial-tenant',
    gateway_id: '',
    environment: 'prod',
    inputs: {
      request,
    },
  });
});

test('buildPdpHeaders adds bearer auth when pdpAuthToken is configured', () => {
  assert.deepEqual(buildPdpHeaders({ pdpAuthToken: ' runtime-token ' }), {
    'content-type': 'application/json',
    authorization: 'Bearer runtime-token',
  });
});

test('buildPdpHeaders omits bearer auth when pdpAuthToken is absent', () => {
  assert.deepEqual(buildPdpHeaders({}), {
    'content-type': 'application/json',
  });
});
