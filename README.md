# Codex Trusted Mode

Codex Trusted Mode is a Codex-to-SDE integration layer for governed tool execution.

## npm Package

Install the public MIT adapter package with:

```bash
npm install @darkelogix/codex-trusted-mode
```

Supported packaged commands:
- `codex-trusted-mode-bridge` for native Codex app-server approval callbacks over stdio JSON-RPC
- `codex-trusted-mode-run-turn` for a minimal hosted Codex governed-turn validation flow

Both commands read governed values from `$CODEX_HOME/config.toml` / `~/.codex/config.toml` by default, or from `--codex-config <path>`.

## What `npm install` gives you

`npm install @darkelogix/codex-trusted-mode` gives you the MIT adapter layer, local hardening path, and mock-PDP examples only. It does not grant access to the proprietary SDE runtime, enterprise evidence packs, or commercial governed entitlements.

## Need governed mode?

If you want SDE-backed governed mode, obtain your licensed SDE runtime and deployment instructions from the Darkelogix customer console. The public npm package is the adapter install surface; the customer console is the governed-runtime delivery surface.

The npm package is intentionally limited to the installable adapter surface:
- runtime source in `src/`
- baseline configs
- core docs needed to use the MIT adapter

It does not include the proprietary SDE runtime, enterprise packs, or full engineering evidence tree.

The product split is deliberate:
- Free mode: useful standalone local hardening
- Paid mode: optional SDE-backed governance with deterministic `allow`, `deny`, and `constrain` decisions

## What This Repo Is

This repo provides:
- a local hardening engine for Codex tool events
- a stable Codex decision contract
- an optional PDP adapter for SDE authorization
- a native app-server approval bridge for Codex approval callbacks
- a standalone free demo path with evidence output
- a runnable mock PDP and governed example flow
- verification scripts for free-mode posture and PDP request shape
- release/evidence scaffolding for a future production offering

This repo does not claim a native Codex extension API that has not been validated yet. It gives you the enforcement core and integration contract first, which is the correct technical foundation.

What is now validated:
- native Codex JSONL runtime stream capture
- native app-server approval request schemas for command execution and file changes
- bridge logic that maps those approval requests into Codex Trusted Mode decisions
- a live end-to-end app-server session where Codex emits a native `item/commandExecution/requestApproval` callback and accepts the returned decision

Current native bridge evidence:
- [release-evidence/native-approval-bridge-demo-results.json](./release-evidence/native-approval-bridge-demo-results.json)
- [release-evidence/app-server-bridge-stdio-smoke.jsonl](./release-evidence/app-server-bridge-stdio-smoke.jsonl)
- [release-evidence/live-app-server-session-summary.json](./release-evidence/live-app-server-session-summary.json)
- [release-evidence/live-native-approval-capture-repo.txt](./release-evidence/live-native-approval-capture-repo.txt)
- [release-evidence/native-hook-evidence.json](./release-evidence/native-hook-evidence.json)
- [release-evidence/20260306-certified-enforced-summary.md](./release-evidence/20260306-certified-enforced-summary.md)

## Free Mode

Default free posture:
- `ALLOWLIST_ONLY`
- allows `functions.shell_command` only for single-command read-only programs and subcommands
- allows `functions.update_plan` and `functions.view_image`
- blocks `functions.apply_patch`, shell chaining/redirection, broad interpreters, and mutating shell commands by default

This makes the standalone offering genuinely useful before any SDE deployment.

## Paid Mode

When `toolPolicyMode` is set to `PDP`, the adapter can send a normalized request to an SDE PDP and apply:
- `allow`
- `deny`
- `constrain`

Paid mode is where you add:
- signed policy packs
- tenant and license entitlements
- compatibility certification
- governed traces and release evidence
- deeper Guard Pro shell argument validation and governed command-policy semantics

For a supported end-to-end governed validation path, run Codex through the packaged hosted session:

```bash
codex-trusted-mode-run-turn --prompt "Read README.md and stop." --json
```

## Quick Start

1. Review the baseline config in [codex.integration.json](./codex.integration.json)
2. Review the decision contract in [DECISION_CONTRACT.md](./DECISION_CONTRACT.md)
3. Run the local verification scripts:

```bash
node scripts/verify_config_contract.js
node scripts/verify_local_hardening.js
node scripts/verify_pdp_request_shape.js
node scripts/verify_certification_gate.js
```

4. Run the test suite:

```bash
node --test
```

On Linux without PowerShell, run the clean-room baseline with:

```bash
npm run clean-room-smoke:linux -- ubuntu-vm-first-pass codex-current
```

For a full fresh-Ubuntu first pass, use the one-shot bootstrap:

```bash
npm run ubuntu-first-pass
```

5. Run the standalone free demo:

```bash
node scripts/run_free_demo.js
```

6. Evaluate a single sample event:

```bash
node scripts/evaluate_event.js --event examples/readonly-shell-event.json --config codex.user-config.entry.example.json
```

7. Evaluate a native approval request:

```bash
node scripts/evaluate_app_server_request.js --input examples/native-command-approval-request.json
```

8. Run the bridge demo evidence flow:

```bash
node scripts/run_native_bridge_demo.js
```

9. Smoke-test the stdio JSON-RPC bridge:

```bash
powershell -ExecutionPolicy Bypass -File scripts/run_app_server_bridge_smoke.ps1
```

10. Run the governed example with the mock PDP:

```bash
node scripts/mock_pdp.js
node scripts/run_governed_example.js
```

11. Try the live app-server session harness:

```bash
powershell -ExecutionPolicy Bypass -File scripts/capture_live_app_server_session.ps1
```

On Linux, use the Node harness directly:

```bash
npm run capture-live-app-server-session:node
```

Current harness status:
- `initialize` succeeds
- post-init requests are sent
- real native approval callback evidence has been captured from a live repo-root Codex app-server session

12. Review or refresh the final certification evidence:

```bash
node scripts/capture_native_hook_evidence.js --input release-evidence/native-hook-callback-raw.json --source real_runtime
node scripts/verify_certification_gate.js
```

## Key Files

- [PRODUCT_DEFINITION.md](./PRODUCT_DEFINITION.md)
- [DECISION_CONTRACT.md](./DECISION_CONTRACT.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [FREE_MODE.md](./FREE_MODE.md)
- [OBSERVED_TOOL_SURFACE.md](./OBSERVED_TOOL_SURFACE.md)
- [LICENSING.md](./LICENSING.md)
- [src/appServerBridge.js](./src/appServerBridge.js)
- [examples/codex-hook-adapter.js](./examples/codex-hook-adapter.js)
- [release-evidence/native-hook-evidence.template.json](./release-evidence/native-hook-evidence.template.json)
- [NATIVE_HOOK_WORKFLOW.md](./NATIVE_HOOK_WORKFLOW.md)

## Initial Product Boundary

- Free: local workstation hardening
- Paid: customer-controlled SDE PDP governance
- Enterprise services: separate engagement, not part of the self-serve product

## Licensing

This repo is MIT-licensed.

The SDE enterprise runtime used for the paid governance mode is proprietary commercial software and is not granted by this repo's MIT license.



