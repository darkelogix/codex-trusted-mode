import { buildConfig, normalizeCertificationStatus, normalizeToolPolicyMode } from './config.js';
import { normalizeCodexEvent } from './normalize.js';
import { containsShellControlOperator, isAllowedReadonlyShellCommand } from './shellPolicy.js';
import { createLocalTrace } from './trace.js';
import { authorizeWithPdp } from './pdpClient.js';

function containsTool(list, toolName) {
  const target = String(toolName || '').trim().toLowerCase();
  return Array.isArray(list) && list.some((item) => String(item).trim().toLowerCase() === target);
}

function shouldBlockForCertification(config, toolName) {
  const status = normalizeCertificationStatus(config.certificationStatus);
  if (status === 'CERTIFIED_ENFORCED' || status === 'LOCKDOWN_ONLY') return false;
  return containsTool(config.highRiskTools, toolName);
}

function isShellCommandTool(toolName) {
  return String(toolName || '').trim().toLowerCase() === 'functions.shell_command';
}

function isAllowedShellCommand(command, prefixes) {
  return isAllowedReadonlyShellCommand(command, prefixes);
}

export async function evaluateCodexEvent(event, overrides = {}) {
  const config = buildConfig(overrides);
  const request = normalizeCodexEvent({ ...event, environment: overrides.environment || event.environment });
  const mode = normalizeToolPolicyMode(config.toolPolicyMode);

  if (shouldBlockForCertification(config, request.toolName)) {
    return {
      decision: 'deny',
      reasonCode: 'CERT_LOCKDOWN_BLOCK',
      source: 'local',
      request,
      trace: createLocalTrace(config, request, 'deny', 'CERT_LOCKDOWN_BLOCK'),
    };
  }

  if (mode === 'ALLOWLIST_ONLY') {
    const allowed = containsTool(config.allowedTools, request.toolName);
    if (allowed && isShellCommandTool(request.toolName)) {
      if (containsShellControlOperator(request.command)) {
        return {
          decision: 'deny',
          reasonCode: 'LOCAL_SHELL_CONTROL_OPERATOR_BLOCK',
          source: 'local',
          request,
          trace: createLocalTrace(config, request, 'deny', 'LOCAL_SHELL_CONTROL_OPERATOR_BLOCK'),
        };
      }
      const shellAllowed = isAllowedShellCommand(request.command, config.allowedShellCommandPrefixes);
      const reasonCode = shellAllowed ? 'LOCAL_READONLY_SHELL_ALLOW' : 'LOCAL_READONLY_SHELL_BLOCK';
      return {
        decision: shellAllowed ? 'allow' : 'deny',
        reasonCode,
        source: 'local',
        request,
        trace: createLocalTrace(config, request, shellAllowed ? 'allow' : 'deny', reasonCode),
      };
    }
    const reasonCode = allowed ? 'LOCAL_ALLOWLIST_ALLOW' : 'LOCAL_ALLOWLIST_BLOCK';
    return {
      decision: allowed ? 'allow' : 'deny',
      reasonCode,
      source: 'local',
      request,
      trace: createLocalTrace(config, request, allowed ? 'allow' : 'deny', reasonCode),
    };
  }

  try {
    const pdp = await authorizeWithPdp(config, request);
    const decision = pdp.body?.decision || 'deny';
    const reasonCode =
      pdp.body?.reasonCode ||
      pdp.body?.deny_code ||
      (decision === 'allow' ? 'PDP_ALLOW' : decision === 'constrain' ? 'PDP_CONSTRAIN' : 'PDP_DENY');
    return {
      decision,
      reasonCode,
      source: 'pdp',
      request,
      constraints: pdp.body?.constraints || {},
      trace: pdp.body?.trace || null,
      pdpStatus: pdp.status,
    };
  } catch (error) {
    if (config.failClosed) {
      return {
        decision: 'deny',
        reasonCode: 'PDP_UNAVAILABLE_FAIL_CLOSED',
        source: 'local',
        request,
        trace: createLocalTrace(config, request, 'deny', 'PDP_UNAVAILABLE_FAIL_CLOSED'),
        error: String(error.message || error),
      };
    }
    return {
      decision: 'allow',
      reasonCode: 'PDP_UNAVAILABLE_FAIL_OPEN',
      source: 'local',
      request,
      trace: createLocalTrace(config, request, 'allow', 'PDP_UNAVAILABLE_FAIL_OPEN'),
      error: String(error.message || error),
    };
  }
}
