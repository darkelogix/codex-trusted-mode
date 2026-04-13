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

export function buildThreadStartRequest(id, cwd) {
  return {
    id,
    method: 'thread/start',
    params: {
      cwd: cwd || null,
      experimentalRawEvents: false,
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
    },
  };
}

export function extractCompletedAgentMessage(message) {
  if (message?.method !== 'item/completed') return '';
  const item = message.params?.item;
  if (item?.type !== 'agent_message') return '';
  return typeof item.text === 'string' ? item.text : '';
}
