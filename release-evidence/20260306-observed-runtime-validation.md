# Observed Runtime Validation

## Release Identification

- Release version: `0.1.0`
- Observation date: `2026-03-06`
- Contract version: `0.1.0`
- Environment: current Codex workspace session

## Claims

- Free-mode hardening claim: supported
- Paid-mode governance claim: supported for the observed current workspace session after live native callback validation

## Observed Tool Surface

- `functions.shell_command`
- `functions.apply_patch`
- `functions.update_plan`
- `functions.view_image`

Plan-mode only:
- `functions.request_user_input`

## Normalized Initial Policy Posture

- allow `functions.shell_command` only for read-only command prefixes
- deny `functions.apply_patch` in free mode
- allow `functions.update_plan`
- allow `functions.view_image`

## Validation Results

- config contract verification: passed
- local hardening verification: passed
- free demo run: passed
- PDP request-shape verification: passed
- node:test suite: passed
- governed example run with mock PDP: passed

## Evidence Artifacts

- `observed-tool-surface.json`
- `20260306-free-demo-results.json`
- `20260306-governed-example-results.json`
- local raw capture artifacts retained outside the committed public evidence subset
- `native-hook-evidence.json`
- `20260306-certified-enforced-summary.md`

## Evidence Caveats

- certification is scoped to the observed current workspace session and documented callback path
- broader Codex-platform claims still require additional compatibility validation
