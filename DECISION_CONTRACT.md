# Codex Decision Contract

## Purpose

Define the normalized authorization request between a Codex enforcement point and the SDE PDP.

## Observed V1 Tool Surface

Observed callable IDs in this environment:
- `functions.shell_command`
- `functions.apply_patch`
- `functions.update_plan`
- `functions.view_image`

Primary governed tools for v1:
- `functions.shell_command`
- `functions.apply_patch`

## Inputs

- `runtime`: fixed as `codex`
- `runtimeVersion`: observed Codex version if available
- `sessionId`: Codex session identifier if available
- `toolName`: raw Codex tool identifier
- `actionType`: normalized action class such as `read`, `write`, `execute`, `meta`, `interaction`
- `targetPath`: affected path if applicable
- `command`: shell command if applicable
- `arguments`: normalized argument payload
- `workingDirectory`: current workspace path
- `repoContext`: repository metadata if available
- `environment`: `dev`, `uat`, `prod`, or equivalent local convention
- `tenantId`: optional paid-mode tenant identifier
- `userRole`: optional operator role

## Outputs

- `allow`
- `deny`
- `constrain`

## Constraint Examples

- allowed command prefixes only
- block access outside approved directories
- deny modification of protected files
- read-only mode for sensitive repositories
- max execution timeout
- network-disabled posture if supported by the execution environment

## Required Evidence Fields

- `traceId`
- `contractId`
- `contractVersion`
- `policyPackVersion`
- `decision`
- `reasonCode`
- `timestampUtc`

## Initial Reason Codes

- `LOCAL_ALLOWLIST_ALLOW`
- `LOCAL_ALLOWLIST_BLOCK`
- `LOCAL_READONLY_SHELL_ALLOW`
- `LOCAL_READONLY_SHELL_BLOCK`
- `UNSUPPORTED_TOOL_BLOCK`
- `PDP_DENY`
- `PDP_CONSTRAIN`
- `PDP_UNAVAILABLE_FAIL_CLOSED`

## Initial Fail-Safe Rule

- free standalone mode: local allowlist remains authoritative
- paid PDP mode: fail-closed should be the default for protected high-risk actions
