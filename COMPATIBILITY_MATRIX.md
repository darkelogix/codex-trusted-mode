# Compatibility Matrix

## Purpose

Track which Codex versions and delivery surfaces are validated for the governed integration.

## Current State

The observed Codex tool surface and native app-server approval surface have been documented. The current public launch boundary is narrower than OpenClaw and should be read accordingly.

| Codex Surface / Version | Adapter Version | Certification | Notes |
| --- | --- | --- | --- |
| Windows hosted runner with `@openai/codex@0.120.0` | `0.1.8` | `LOCKDOWN_ONLY` | Destructive-action approval callbacks validated live. Readonly execution can surface only after completion and is returned as `completed_with_governance_gap`. |
| Historical Ubuntu validation harnesses | `0.1.0` | `LOCKDOWN_ONLY` | Native approval callback evidence captured historically. Rerun before making broader claims on newer adapter/runtime combinations. |
| latest (rolling) | `0.1.8` | `UNSUPPORTED` | Treat as uncertified until explicitly validated. |

## Policy

- `CERTIFIED_ENFORCED` requires validated request shape and native pre-execution enforcement behavior for the claimed surface
- `LOCKDOWN_ONLY` means local hardening and constrained governed claims are available, but broad pre-execution governed-enforcement claims are not made
- `UNSUPPORTED` means no claims are made

## Controlled-Rollout Release Gate

The current public Codex offering should not be described as full parity with OpenClaw.

Minimum bar for the current controlled rollout:
- destructive-action native approval callback evidence exists
- hosted-runner deny path is validated against the target SDE runtime
- readonly no-hook cases are surfaced as governance gaps rather than false green passes

Promotion beyond the current boundary requires:
- native readonly pre-execution hook validation on the claimed Codex build
- repeated evidence on the claimed host platforms
- a refreshed matrix row for the exact adapter/runtime combination being promoted

## Evidence

- [release-evidence/native-hook-evidence.json](./release-evidence/native-hook-evidence.json)
- [release-evidence/live-native-approval-capture-repo.txt](./release-evidence/live-native-approval-capture-repo.txt)
- [release-evidence/20260306-certified-enforced-summary.md](./release-evidence/20260306-certified-enforced-summary.md)
- [vm-artifacts/ubuntu-vm-native-hook-evidence.json](./vm-artifacts/ubuntu-vm-native-hook-evidence.json)
- [vm-artifacts/ubuntu-vm-live-app-server-session-summary.json](./vm-artifacts/ubuntu-vm-live-app-server-session-summary.json)
- [vm-artifacts/ubuntu-vm-first-pass-20260307-142859.json](./vm-artifacts/ubuntu-vm-first-pass-20260307-142859.json)

## Observed V1 Surface

Validated for initial repo assumptions:
- `functions.shell_command`
- `functions.apply_patch`
- `functions.update_plan`
- `functions.view_image`
