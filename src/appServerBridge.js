import { evaluateCodexEvent } from './engine.js';

function buildCommandEvent(params = {}) {
  return {
    toolName: 'functions.shell_command',
    command: params.command || '',
    workingDirectory: params.cwd || '',
    sessionId: params.threadId || params.conversationId || '',
  };
}

function buildFileChangeEvent(params = {}, method = '') {
  const base = {
    sessionId: params.threadId || params.conversationId || '',
  };

  if (method === 'applyPatchApproval') {
    const fileChanges = params.fileChanges || {};
    const targetPath = Object.keys(fileChanges)[0] || '';
    return {
      ...base,
      toolName: 'functions.apply_patch',
      targetPath,
      arguments: { fileChanges },
    };
  }

  return {
    ...base,
    toolName: 'functions.apply_patch',
    targetPath: params.grantRoot || '',
    arguments: { grantRoot: params.grantRoot || '' },
  };
}

function mapRequestToEvent(request = {}) {
  const method = String(request.method || '');
  const params = request.params || {};

  switch (method) {
    case 'item/commandExecution/requestApproval':
    case 'execCommandApproval':
      return buildCommandEvent(params);
    case 'item/fileChange/requestApproval':
    case 'applyPatchApproval':
      return buildFileChangeEvent(params, method);
    default:
      throw new Error(`Unsupported app-server approval method: ${method}`);
  }
}

function mapDecisionForCommand(decision) {
  if (decision === 'allow') return 'accept';
  return 'decline';
}

function mapDecisionForFileChange(decision) {
  if (decision === 'allow') return 'accept';
  return 'decline';
}

function mapDecisionForLegacyExec(decision) {
  if (decision === 'allow') return 'approved';
  return 'denied';
}

function mapDecisionForLegacyPatch(decision) {
  if (decision === 'allow') return 'approved';
  return 'denied';
}

export function mapEvaluationToApprovalResponse(request = {}, evaluation = {}) {
  const method = String(request.method || '');
  const decision = String(evaluation.decision || 'deny').toLowerCase();

  switch (method) {
    case 'item/commandExecution/requestApproval':
      return { decision: mapDecisionForCommand(decision) };
    case 'item/fileChange/requestApproval':
      return { decision: mapDecisionForFileChange(decision) };
    case 'execCommandApproval':
      return { decision: mapDecisionForLegacyExec(decision) };
    case 'applyPatchApproval':
      return { decision: mapDecisionForLegacyPatch(decision) };
    default:
      throw new Error(`Unsupported app-server approval method: ${method}`);
  }
}

export async function evaluateAppServerApprovalRequest(request = {}, overrides = {}) {
  const event = mapRequestToEvent(request);
  const evaluation = await evaluateCodexEvent(event, overrides);
  const response = mapEvaluationToApprovalResponse(request, evaluation);

  return {
    requestMethod: String(request.method || ''),
    event,
    evaluation,
    response,
  };
}
