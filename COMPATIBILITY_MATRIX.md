# Compatibility Matrix

## Purpose

Track which Codex versions and decision-contract versions are validated for the governed integration.

## Current State

The observed Codex tool surface in this environment has been documented. The Codex app-server approval surface has also been identified, bridged locally, and validated against a real native approval callback captured from a live Codex runtime session.

| Codex Version | Repo Version | Certification | Notes |
| --- | --- | --- | --- |
| validated current workspace session | 0.1.0 | CERTIFIED_ENFORCED | Validated observed current workspace session only. |
| next candidate version | 0.1.0 | LOCKDOWN_ONLY | Retest before broader enforced claims. |
| latest (rolling) | 0.1.0 | UNSUPPORTED | Treat as uncertified until explicitly validated. |

## Policy

- `CERTIFIED_ENFORCED` requires validated tool IDs, request shape, and native enforcement behavior from a real Codex runtime
- `LOCKDOWN_ONLY` means local hardening is available but broad governed-enforcement claims are not yet made
- `UNSUPPORTED` means no claims are made

## Release Gate

- `LOCKDOWN_ONLY_READY`: observed surface, free demo evidence, governed example evidence, and native approval bridge evidence exist
- `CERTIFIED_ENFORCED_READY`: all of the above plus real native-hook evidence

## Evidence

- [release-evidence/native-hook-evidence.json](./release-evidence/native-hook-evidence.json)
- [release-evidence/live-native-approval-capture-repo.txt](./release-evidence/live-native-approval-capture-repo.txt)
- [release-evidence/20260306-certified-enforced-summary.md](./release-evidence/20260306-certified-enforced-summary.md)

## Observed V1 Surface

Validated for initial repo assumptions:
- `functions.shell_command`
- `functions.apply_patch`
- `functions.update_plan`
- `functions.view_image`
