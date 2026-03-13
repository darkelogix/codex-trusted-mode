import http from 'node:http';

const PORT = Number(process.env.MOCK_PDP_PORT || 8011);

function json(res, statusCode, body) {
  res.writeHead(statusCode, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body, null, 2));
}

function decide(request) {
  const toolName = request?.toolName || '';
  const command = String(request?.command || '').trim().toLowerCase();

  if (toolName === 'functions.apply_patch') {
    return {
      decision: 'deny',
      reasonCode: 'PDP_PATCH_DENY',
      trace: {
        traceId: 'trace-codex-patch-deny-001',
        contractId: 'codex-tool-governance',
        contractVersion: '0.1.0',
        policyPackVersion: 'codex-tool-governance-pack.0.1.0',
        decision: 'deny',
        reasonCode: 'PDP_PATCH_DENY',
        timestampUtc: new Date().toISOString(),
      },
    };
  }

  if (toolName === 'functions.shell_command') {
    if (
      command.startsWith('get-childitem') ||
      command.startsWith('get-content') ||
      command.startsWith('rg') ||
      command.startsWith('git status') ||
      command.startsWith('git diff') ||
      command.startsWith('git show') ||
      command.startsWith('pwd') ||
      command.startsWith('ls') ||
      command.startsWith('cat')
    ) {
      return {
        decision: 'allow',
        reasonCode: 'PDP_READONLY_SHELL_ALLOW',
        trace: {
          traceId: 'trace-codex-shell-allow-001',
          contractId: 'codex-tool-governance',
          contractVersion: '0.1.0',
          policyPackVersion: 'codex-tool-governance-pack.0.1.0',
          decision: 'allow',
          reasonCode: 'PDP_READONLY_SHELL_ALLOW',
          timestampUtc: new Date().toISOString(),
        },
      };
    }

    return {
      decision: 'deny',
      reasonCode: 'PDP_MUTATING_SHELL_DENY',
      trace: {
        traceId: 'trace-codex-shell-deny-001',
        contractId: 'codex-tool-governance',
        contractVersion: '0.1.0',
        policyPackVersion: 'codex-tool-governance-pack.0.1.0',
        decision: 'deny',
        reasonCode: 'PDP_MUTATING_SHELL_DENY',
        timestampUtc: new Date().toISOString(),
      },
    };
  }

  return {
    decision: 'deny',
    reasonCode: 'PDP_UNSUPPORTED_TOOL_DENY',
    trace: {
      traceId: 'trace-codex-unsupported-001',
      contractId: 'codex-tool-governance',
      contractVersion: '0.1.0',
      policyPackVersion: 'codex-tool-governance-pack.0.1.0',
      decision: 'deny',
      reasonCode: 'PDP_UNSUPPORTED_TOOL_DENY',
      timestampUtc: new Date().toISOString(),
    },
  };
}

const server = http.createServer((req, res) => {
  if (req.method !== 'POST' || req.url !== '/v1/authorize') {
    json(res, 404, { error: 'not_found' });
    return;
  }

  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
  });
  req.on('end', () => {
    try {
      const parsed = JSON.parse(body || '{}');
      const result = decide(parsed.inputs?.request || {});
      json(res, 200, result);
    } catch (error) {
      json(res, 400, { error: 'invalid_json', message: String(error.message || error) });
    }
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Mock PDP listening on http://127.0.0.1:${PORT}/v1/authorize`);
});
