const ACTION_TYPE_MAP = new Map([
  ['functions.view_image', 'read'],
  ['functions.update_plan', 'meta'],
  ['functions.shell_command', 'execute'],
  ['functions.apply_patch', 'write'],
  ['functions.request_user_input', 'interaction'],
]);

export function normalizeActionType(toolName) {
  const normalized = String(toolName || '').trim().toLowerCase();
  return ACTION_TYPE_MAP.get(normalized) || 'unknown';
}

export function normalizeCodexEvent(event = {}) {
  const toolName = String(event.toolName || '').trim();
  return {
    runtime: 'codex',
    runtimeVersion: event.runtimeVersion || '',
    sessionId: event.sessionId || '',
    toolName,
    actionType: normalizeActionType(toolName),
    targetPath: event.targetPath || '',
    command: event.command || '',
    arguments: event.arguments || {},
    workingDirectory: event.workingDirectory || '',
    repoContext: event.repoContext || {},
    environment: event.environment || 'dev',
    tenantId: event.tenantId || '',
    userRole: event.userRole || '',
  };
}
