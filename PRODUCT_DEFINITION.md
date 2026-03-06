# Product Definition

## Offering

Codex Trusted Mode is a governed tool-execution layer for Codex sessions.

## V1 Target Use Case

Governed coding in regulated or production-bound repositories where shell, file mutation, and git-changing actions require explicit policy control.

## V1 Control Surface

Initial high-impact tools:
- `functions.shell_command`
- `functions.apply_patch`

Initial low-risk tools:
- `functions.update_plan`
- `functions.view_image`

## Free Tier

- standalone local hardening
- allowlist-only mode
- read-only shell prefixes plus conservative defaults
- no external dependency on the SDE PDP

## Paid Tier

- SDE PDP-backed decisions
- deterministic reason codes
- versioned decision contract
- tenant/license entitlement hooks
- governed evidence and release validation
- native app-server approval bridge for Codex command and file-change approval requests

## Non-Goals For V1

- broad claims about every Codex capability
- cloud-hosted control plane
- end-user SSO
- native Codex UI integration beyond the validated app-server approval request surface
