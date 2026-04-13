export function buildInitializeRequest(id = 'init-1') {
  return {
    id,
    method: 'initialize',
    params: {
      clientInfo: {
        name: 'codex-trusted-mode-runner',
        version: '0.1.0',
      },
      capabilities: {
        experimentalApi: true,
      },
    },
  };
}

export function buildReadOnlySandboxPolicy() {
  return {
    type: 'readOnly',
    networkAccess: false,
  };
}

export function buildThreadStartRequest(id, cwd) {
  return {
    id,
    method: 'thread/start',
    params: {
      threadId: `codex-trusted-mode-thread-${Date.now()}`,
      cwd: cwd || null,
      approvalPolicy: 'untrusted',
      sandboxPolicy: buildReadOnlySandboxPolicy(),
      experimentalRawEvents: true,
      persistExtendedHistory: false,
    },
  };
}

export function buildTurnStartRequest(id, threadId, prompt, cwd) {
  return {
    id,
    method: 'turn/start',
    params: {
      threadId,
      input: [
        {
          type: 'text',
          text: prompt,
          text_elements: [],
        },
      ],
      cwd: cwd || null,
      approvalPolicy: 'untrusted',
      sandboxPolicy: buildReadOnlySandboxPolicy(),
    },
  };
}

export function buildCodexAppServerSpawn() {
  if (process.platform === 'win32') {
    return {
      command: process.env.ComSpec || 'cmd.exe',
      args: ['/d', '/s', '/c', 'codex.cmd app-server --listen stdio://'],
    };
  }

  return {
    command: 'codex',
    args: ['app-server', '--listen', 'stdio://'],
  };
}

export function summarizeDynamicToolCallParams(params = {}) {
  return {
    tool: typeof params.tool === 'string' ? params.tool : '',
    callId: typeof params.callId === 'string' ? params.callId : '',
    threadId: typeof params.threadId === 'string' ? params.threadId : '',
    turnId: typeof params.turnId === 'string' ? params.turnId : '',
    arguments: params.arguments ?? null,
  };
}

export function collectPostHocCommandExecutions(message = {}) {
  if (message?.method !== 'rawResponseItem/completed') return [];

  const executions = [];
  const seenObjects = new Set();
  const seenSummaries = new Set();

  function visit(value) {
    if (!value || typeof value !== 'object') return;
    if (seenObjects.has(value)) return;
    seenObjects.add(value);

    if (value.type === 'commandExecution' && typeof value.command === 'string') {
      const summary = {
        command: value.command,
        commandActions: Array.isArray(value.commandActions) ? value.commandActions : [],
        callId: typeof value.callId === 'string' ? value.callId : '',
        name: typeof value.name === 'string' ? value.name : '',
        arguments: typeof value.arguments === 'undefined' ? null : value.arguments,
        status: typeof value.status === 'string' ? value.status : '',
      };
      const key = JSON.stringify(summary);
      if (!seenSummaries.has(key)) {
        seenSummaries.add(key);
        executions.push(summary);
      }
    }

    if (Array.isArray(value)) {
      for (const entry of value) visit(entry);
      return;
    }

    for (const entry of Object.values(value)) visit(entry);
  }

  visit(message.params ?? message);
  return executions;
}

export function extractCompletedAgentMessage(message) {
  if (message?.method !== 'item/completed') return '';
  const item = message.params?.item;
  if (item?.type !== 'agent_message') return '';
  return typeof item.text === 'string' ? item.text : '';
}
