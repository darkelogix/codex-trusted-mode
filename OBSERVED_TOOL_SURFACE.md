# Observed Tool Surface

## Scope

This document records the callable tool surface observed in the current Codex environment on March 6, 2026.

## Observed Callable IDs

- `functions.shell_command`
- `functions.apply_patch`
- `functions.update_plan`
- `functions.view_image`

Plan-mode only:
- `functions.request_user_input`

Wrapper/orchestration surface:
- `multi_tool_use.parallel`

## Initial Normalization

| Observed Tool ID | Normalized Action Type | Initial Risk Posture |
| --- | --- | --- |
| `functions.shell_command` | `execute` | allowed only for read-only command prefixes in free mode |
| `functions.apply_patch` | `write` | blocked in free mode |
| `functions.update_plan` | `meta` | allowed in free mode |
| `functions.view_image` | `read` | allowed in free mode |
| `functions.request_user_input` | `interaction` | not part of default-mode v1 certification |

## Why This Matters

The product should govern the actual observed Codex surface, not an imagined file-tool API. This observed surface is the basis for the initial compatibility claim in this repo.

## Known Caveats

- This is an environment-specific observation, not yet a broad Codex platform certification.
- `multi_tool_use.parallel` is an orchestration wrapper and should not be treated as the primary governed action.
- Future Codex releases may change the callable surface, request shape, or enforcement integration points.
