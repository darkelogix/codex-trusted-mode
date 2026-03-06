export async function authorizeWithPdp(config, request) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.pdpTimeoutMs);
  try {
    const response = await fetch(config.pdpUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contractId: config.contractId,
        contractVersion: config.contractVersion,
        runtime: request.runtime,
        request,
        tenantId: config.tenantId || request.tenantId || '',
        environment: config.environment || request.environment || 'dev',
      }),
      signal: controller.signal,
    });
    const body = await response.json();
    return {
      ok: response.ok,
      status: response.status,
      body,
    };
  } finally {
    clearTimeout(timeout);
  }
}
