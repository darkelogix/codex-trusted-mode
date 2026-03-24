import { maybeAppendSdeRuntimeGuidance } from './sdeGuidance.js';

export function buildPdpPayload(config, request) {
  return {
    decision_sku: config.decisionSku,
    policy_variant: config.policyVariant,
    tenant_id: config.tenantId || request.tenantId || '',
    gateway_id: config.gatewayId || '',
    environment: config.environment || request.environment || 'dev',
    inputs: {
      request,
    },
  };
}

export async function authorizeWithPdp(config, request) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.pdpTimeoutMs);
  try {
    const response = await fetch(config.pdpUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(buildPdpPayload(config, request)),
      signal: controller.signal,
    });
    const raw = await response.text();
    let body = null;
    if (raw) {
      try {
        body = JSON.parse(raw);
      } catch {
        body = raw;
      }
    }
    if (!response.ok) {
      const detail =
        typeof body === 'object' && body !== null
          ? body.message || body.detail || body.error || JSON.stringify(body)
          : raw || `HTTP ${response.status}`;
      throw new Error(`PDP unreachable (${response.status}): ${detail}`);
    }
    return {
      ok: response.ok,
      status: response.status,
      body,
    };
  } catch (error) {
    const detail = error?.name === 'AbortError'
      ? `PDP timeout after ${config.pdpTimeoutMs}ms`
      : String(error?.message || error);
    throw new Error(maybeAppendSdeRuntimeGuidance(detail, config.pdpUrl));
  } finally {
    clearTimeout(timeout);
  }
}
