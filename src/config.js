import { buildMissingPdpConfigIssue } from './sdeGuidance.js';

export const DEFAULT_ALLOWED_TOOLS = [
  'functions.shell_command',
  'functions.update_plan',
  'functions.view_image',
];
export const DEFAULT_ALLOWED_SHELL_PREFIXES = [
  'Get-ChildItem',
  'Get-Content',
  'rg',
  'git status',
  'git diff',
  'git show',
  'pwd',
  'ls',
  'cat',
];
export const DEFAULT_HIGH_RISK_TOOLS = ['functions.apply_patch', 'functions.shell_command'];

export function normalizeToolPolicyMode(value) {
  return typeof value === 'string' && value.trim().toUpperCase() === 'PDP'
    ? 'PDP'
    : 'ALLOWLIST_ONLY';
}

export function normalizeCertificationStatus(value) {
  const normalized = typeof value === 'string' ? value.trim().toUpperCase() : '';
  if (normalized === 'CERTIFIED_ENFORCED') return 'CERTIFIED_ENFORCED';
  if (normalized === 'UNSUPPORTED') return 'UNSUPPORTED';
  return 'LOCKDOWN_ONLY';
}

export function buildConfig(overrides = {}) {
  return {
    toolPolicyMode: normalizeToolPolicyMode(overrides.toolPolicyMode),
    allowedTools: Array.isArray(overrides.allowedTools) && overrides.allowedTools.length > 0
      ? overrides.allowedTools
      : DEFAULT_ALLOWED_TOOLS,
    allowedShellCommandPrefixes:
      Array.isArray(overrides.allowedShellCommandPrefixes) && overrides.allowedShellCommandPrefixes.length > 0
        ? overrides.allowedShellCommandPrefixes
        : DEFAULT_ALLOWED_SHELL_PREFIXES,
    highRiskTools: Array.isArray(overrides.highRiskTools) && overrides.highRiskTools.length > 0
      ? overrides.highRiskTools
      : DEFAULT_HIGH_RISK_TOOLS,
    certificationStatus: normalizeCertificationStatus(overrides.certificationStatus),
    failClosed: overrides.failClosed !== false,
    pdpUrl: typeof overrides.pdpUrl === 'string' ? overrides.pdpUrl : 'http://localhost:8001/v1/authorize',
    pdpTimeoutMs: Number.isFinite(overrides.pdpTimeoutMs) ? overrides.pdpTimeoutMs : 5000,
    pdpAuthToken:
      typeof overrides.pdpAuthToken === 'string'
        ? overrides.pdpAuthToken
        : process.env.PDP_AUTH_TOKEN || process.env.DEXGATE_PDP_AUTH_TOKEN || '',
    decisionSku:
      typeof overrides.decisionSku === 'string' ? overrides.decisionSku : 'codex.trusted_mode.authorize.v1',
    policyVariant:
      typeof overrides.policyVariant === 'string' ? overrides.policyVariant : 'codex-guard.v0.1.0',
    contractId: typeof overrides.contractId === 'string' ? overrides.contractId : 'codex-tool-governance',
    contractVersion: typeof overrides.contractVersion === 'string' ? overrides.contractVersion : '0.1.0',
    tenantId: typeof overrides.tenantId === 'string' ? overrides.tenantId : '',
    gatewayId: typeof overrides.gatewayId === 'string' ? overrides.gatewayId : '',
    environment: typeof overrides.environment === 'string' ? overrides.environment : 'dev',
  };
}

export function validateConfig(config) {
  const issues = [];
  const mode = normalizeToolPolicyMode(config.toolPolicyMode);
  if (mode === 'ALLOWLIST_ONLY') {
    if (!Array.isArray(config.allowedTools) || config.allowedTools.length === 0) {
      issues.push('ALLOWLIST_ONLY mode requires non-empty allowedTools');
    }
  }
  if (mode === 'PDP') {
    if (!config.pdpUrl) {
      issues.push(buildMissingPdpConfigIssue());
    }
    if (!config.tenantId) {
      issues.push('PDP mode requires tenantId so dexgate can match this workspace.');
    }
    if (!config.gatewayId) {
      issues.push('PDP mode requires gatewayId so dexgate can match this environment host.');
    }
    if (!config.environment) {
      issues.push('PDP mode requires environment so dexgate can apply the correct profile.');
    }
  }
  return { ok: issues.length === 0, issues };
}
