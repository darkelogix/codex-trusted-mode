# Architecture

## V1 Shape

Codex Trusted Mode is intentionally split into three layers:

1. `normalize`
   - converts raw Codex tool events into a stable request contract
2. `engine`
   - applies local hardening or PDP-backed authorization
3. `trace`
   - emits the minimum evidence needed for local review or governed operation
4. `appServerBridge`
   - maps native Codex app-server approval requests into trusted-mode decisions and protocol responses

## Why This Shape

The Codex-native extension surface is still a validation task. Building the contract and enforcement core first avoids shipping marketing claims ahead of the real runtime behavior.

## Free Path

- `ALLOWLIST_ONLY`
- local decision source
- conservative defaults
- no dependency on external services

## Paid Path

- `PDP`
- normalized request to SDE
- fail-closed for protected actions by default
- future hooks for tenant/license entitlement checks

## Current Native Step

The repo now includes a thin native adapter for the validated app-server approval request surface:
- `item/commandExecution/requestApproval`
- `item/fileChange/requestApproval`
- `execCommandApproval`
- `applyPatchApproval`

## Remaining Native Step

Validate a live Codex app-server session that:
- sends a real approval request to the bridge
- accepts the returned decision
- produces evidence tying the native request, bridge response, and final runtime behavior together
