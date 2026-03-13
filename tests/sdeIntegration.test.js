import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { evaluateCodexEvent } from '../src/index.js';
import { startLiveSdePdp } from './liveSdeHarness.js';

test('live SDE integration allows readonly shell command for entitled Codex tenant', async () => {
  const server = await startLiveSdePdp({
    entitlements: {
      'trial-tenant': ['codex.trusted_mode.authorize.v1'],
    },
    tenantVariants: {
      'trial-tenant': {
        variants: {
          'codex.trusted_mode.authorize.v1': 'codex-guard.v0.1.0',
        },
      },
    },
    env: {
      ENFORCE_TENANT_POLICY_VARIANT_LOCK: 'true',
      REQUIRE_TENANT_VARIANT_MAPPING: 'true',
    },
  });

  try {
    const result = await evaluateCodexEvent(
      {
        toolName: 'functions.shell_command',
        command: 'Get-Content README.md',
        tenantId: 'trial-tenant',
        environment: 'prod',
      },
      {
        toolPolicyMode: 'PDP',
        pdpUrl: server.pdpUrl,
        failClosed: true,
        tenantId: 'trial-tenant',
        environment: 'prod',
        policyVariant: 'codex-guard.v0.1.0',
      }
    );

    assert.equal(result.decision, 'allow');
    assert.equal(result.source, 'pdp');
    assert.equal(result.trace?.decision_sku, 'codex.trusted_mode.authorize.v1');
  } finally {
    await server.stop();
  }
});

test('live SDE integration returns the real deny code for blocked Codex tools', async () => {
  const server = await startLiveSdePdp({
    entitlements: {
      'trial-tenant': ['codex.trusted_mode.authorize.v1'],
    },
  });

  try {
    const result = await evaluateCodexEvent(
      {
        toolName: 'functions.apply_patch',
        tenantId: 'trial-tenant',
      },
      {
        toolPolicyMode: 'PDP',
        pdpUrl: server.pdpUrl,
        failClosed: true,
        tenantId: 'trial-tenant',
      }
    );

    assert.equal(result.decision, 'deny');
    assert.equal(result.reasonCode, 'PDP_PATCH_DENY');
  } finally {
    await server.stop();
  }
});

test('live SDE integration enforces Codex tenant policy variant locks', async () => {
  const server = await startLiveSdePdp({
    entitlements: {
      'trial-tenant': ['codex.trusted_mode.authorize.v1'],
    },
    tenantVariants: {
      'trial-tenant': {
        variants: {
          'codex.trusted_mode.authorize.v1': 'codex-guard.v0.1.0',
        },
      },
    },
    env: {
      ENFORCE_TENANT_POLICY_VARIANT_LOCK: 'true',
      REQUIRE_TENANT_VARIANT_MAPPING: 'true',
    },
  });

  try {
    const result = await evaluateCodexEvent(
      {
        toolName: 'functions.shell_command',
        command: 'Get-Content README.md',
        tenantId: 'trial-tenant',
      },
      {
        toolPolicyMode: 'PDP',
        pdpUrl: server.pdpUrl,
        failClosed: true,
        tenantId: 'trial-tenant',
        policyVariant: 'guard-pro.v2026.02',
      }
    );

    assert.equal(result.decision, 'deny');
    assert.equal(result.reasonCode, 'POLICY_VARIANT_IMMUTABLE');
  } finally {
    await server.stop();
  }
});

test('live SDE integration reflects entitlement removal across sessions', async () => {
  const firstServer = await startLiveSdePdp({
    entitlements: {
      'trial-tenant': ['codex.trusted_mode.authorize.v1'],
    },
  });

  try {
    const first = await evaluateCodexEvent(
      {
        toolName: 'functions.shell_command',
        command: 'Get-Content README.md',
        tenantId: 'trial-tenant',
      },
      {
        toolPolicyMode: 'PDP',
        pdpUrl: firstServer.pdpUrl,
        failClosed: true,
        tenantId: 'trial-tenant',
      }
    );

    assert.equal(first.decision, 'allow');
  } finally {
    await firstServer.stop();
  }

  const secondServer = await startLiveSdePdp({
    entitlements: {},
  });

  try {
    const second = await evaluateCodexEvent(
      {
        toolName: 'functions.shell_command',
        command: 'Get-Content README.md',
        tenantId: 'trial-tenant',
      },
      {
        toolPolicyMode: 'PDP',
        pdpUrl: secondServer.pdpUrl,
        failClosed: true,
        tenantId: 'trial-tenant',
      }
    );

    assert.equal(second.decision, 'deny');
    assert.equal(second.reasonCode, 'ENTITLEMENT_DENIED');
  } finally {
    await secondServer.stop();
  }
});

test('live SDE integration denies requests after the decision volume limit is exhausted', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'codex-volume-limit-'));
  const server = await startLiveSdePdp({
    entitlements: {
      'trial-tenant': ['codex.trusted_mode.authorize.v1'],
    },
    license: {
      license_id: 'L-codex-volume',
      max_decisions_per_month: 1,
    },
    env: {
      SDE_LICENSE_TOKEN: 'present',
      DECISION_USAGE_STORE_PATH: path.join(tempDir, 'decision_usage.json'),
    },
  });

  try {
    const first = await evaluateCodexEvent(
      {
        toolName: 'functions.shell_command',
        command: 'Get-Content README.md',
        tenantId: 'trial-tenant',
      },
      {
        toolPolicyMode: 'PDP',
        pdpUrl: server.pdpUrl,
        failClosed: true,
        tenantId: 'trial-tenant',
      }
    );
    assert.equal(first.decision, 'allow');

    const second = await evaluateCodexEvent(
      {
        toolName: 'functions.shell_command',
        command: 'Get-Content README.md',
        tenantId: 'trial-tenant',
      },
      {
        toolPolicyMode: 'PDP',
        pdpUrl: server.pdpUrl,
        failClosed: true,
        tenantId: 'trial-tenant',
      }
    );

    assert.equal(second.decision, 'deny');
    assert.equal(second.reasonCode, 'DECISION_VOLUME_LIMIT_EXCEEDED');
  } finally {
    await server.stop();
    await rm(tempDir, { recursive: true, force: true });
  }
});
