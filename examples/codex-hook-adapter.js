import { evaluateCodexEvent } from '../src/index.js';

// This is an example adapter, not a claim about the final Codex hook API.
// Replace `incomingEvent` and the returned integration logic with the real
// Codex runtime callback shape once the native extension surface is validated.
export async function handleCodexToolEvent(incomingEvent, config) {
  const result = await evaluateCodexEvent(
    {
      toolName: incomingEvent.toolName,
      command: incomingEvent.command,
      targetPath: incomingEvent.targetPath,
      arguments: incomingEvent.arguments,
      workingDirectory: incomingEvent.workingDirectory,
      repoContext: incomingEvent.repoContext,
      sessionId: incomingEvent.sessionId,
      runtimeVersion: incomingEvent.runtimeVersion,
      environment: incomingEvent.environment,
      tenantId: incomingEvent.tenantId,
      userRole: incomingEvent.userRole,
    },
    config
  );

  if (result.decision === 'deny') {
    return {
      allowed: false,
      message: `${result.reasonCode}: tool "${incomingEvent.toolName}" blocked`,
      trace: result.trace,
    };
  }

  if (result.decision === 'constrain') {
    return {
      allowed: true,
      constrained: true,
      constraints: result.constraints || {},
      trace: result.trace,
    };
  }

  return {
    allowed: true,
    trace: result.trace,
  };
}
