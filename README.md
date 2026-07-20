> [!CAUTION]
> **This repository has moved and is archived.**
>
> **Canonical home:** [dexgate-ai/codex-trusted-mode](https://github.com/dexgate-ai/codex-trusted-mode)
>
> Do not open new issues or PRs here. Clone, push, and run CI against the **dexgate-ai** organization.
> Product site: [dexgate.ai](https://dexgate.ai) · X: [@dexgateAI](https://x.com/dexgateAI)

---
# @dexgate/codex-trusted-mode

[![npm version](https://img.shields.io/npm/v/%40dexgate%2Fcodex-trusted-mode)](https://www.npmjs.com/package/@dexgate/codex-trusted-mode)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![CI](https://github.com/dexgate-ai/codex-trusted-mode/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/dexgate-ai/codex-trusted-mode/actions/workflows/ci.yml)

Codex Trusted Mode is a Codex-to-SDE integration layer for governed tool execution.

## Links

| | |
|---|---|
| **Product** | [dexgate.ai](https://dexgate.ai) |
| **Codex quickstart** | [dexgate.ai/docs/codex/quickstart](https://dexgate.ai/docs/codex/quickstart/) |
| **Pricing** | [dexgate.ai/pricing](https://dexgate.ai/pricing/) |
| **Customer console** | [dexgate.ai/console](https://dexgate.ai/console/) |
| **GitHub** | [github.com/dexgate-ai/codex-trusted-mode](https://github.com/dexgate-ai/codex-trusted-mode) |
| **npm** | [@dexgate/codex-trusted-mode](https://www.npmjs.com/package/@dexgate/codex-trusted-mode) |
| **X** | [@dexgateAI](https://x.com/dexgateAI) |
| **Contact** | [dexgate.ai/contact](https://dexgate.ai/contact/) |

First-time setup in this repo: [`START_HERE.md`](./START_HERE.md).  
Hosted guide: [Codex quickstart](https://dexgate.ai/docs/codex/quickstart/).

Current public product boundary:
- standalone free mode is available from the public npm package (`latest` only; no `pilot` channel)
- destructive-action governance is validated through the hosted runner
- readonly actions on current Codex builds can surface only after completion and are reported as governance gaps

## Codex marketplace (discovery)

Skill-based Codex plugin + repo marketplace for Plugins Directory visibility:

```bash
codex plugin marketplace add dexgate-ai/codex-trusted-mode
```

Details: [CODEX_MARKETPLACE.md](./CODEX_MARKETPLACE.md). Runtime enforcement still comes from the npm adapter (`npx codex-local-hardening-check` / package CLIs), not from skills alone.

## npm Package

Install the public MIT adapter package with:

```bash
npm install @dexgate/codex-trusted-mode
```

Supported packaged commands:
- `codex-trusted-mode-bridge` for native Codex app-server approval callbacks over stdio JSON-RPC
- `codex-trusted-mode-run-turn` for the hosted governed-turn validation path

Both commands read governed values from `$CODEX_HOME/config.toml` / `~/.codex/config.toml` by default, or from `--codex-config <path>`.

## What `npm install` gives you

`npm install @dexgate/codex-trusted-mode` gives you the MIT adapter layer, local hardening path, and mock-PDP examples only. It does not grant access to the proprietary SDE runtime, enterprise evidence packs, or commercial governed entitlements.

## Need governed mode?

If you want SDE-backed governed mode, obtain your licensed SDE runtime and deployment instructions from the dexgate customer console. The public npm package is the adapter install surface; the customer console is the governed-runtime delivery surface.

Governed mode config must include:
- `pdpUrl`
- `tenantId`
- `gatewayId`
- `environment`

Those values let dexgate match the correct workspace and environment host.

For licensed governed deployments, also configure a PDP bearer token with either:
- `pdpAuthToken` in the Codex trusted-mode config block
- `PDP_AUTH_TOKEN` or `DEXGATE_PDP_AUTH_TOKEN` in the process environment

When present, the adapter sends `Authorization: Bearer <token>` on PDP requests.

The npm package is intentionally limited to the installable adapter surface:
- runtime source in `src/`
- baseline configs
- core docs needed to use the MIT adapter

It does not include the proprietary SDE runtime, enterprise packs, or full engineering evidence tree.

## Controlled Rollout Status

The current Codex governed path is a controlled rollout, not full parity with OpenClaw.

What is validated live today:
- native Codex app-server approval callbacks for destructive actions such as command execution and file changes
- bridge logic that maps those approval requests into Codex Trusted Mode decisions
- hosted-runner denial of destructive actions through SDE-backed policy
- explicit governance-gap detection when readonly execution is only surfaced after completion

What is not claimed on current Codex builds:
- full pre-execution governance parity for readonly actions
- broader certified-enforced claims across all Codex builds or platforms

## Free Mode

Default free posture:
- `ALLOWLIST_ONLY`
- allows `functions.shell_command` only for single-command read-only programs and subcommands
- allows `functions.update_plan` and `functions.view_image`
- blocks `functions.apply_patch`, shell chaining/redirection, broad interpreters, and mutating shell commands by default

This makes the standalone offering useful before any SDE deployment.

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
- deeper dexgate shell argument validation and governed command-policy semantics

For the current supported governed validation path, run Codex through the packaged hosted session runner from `latest`:

```bash
codex-trusted-mode-run-turn --prompt "Delete package.json." --json
```

Expected current boundary on supported Codex builds:
- destructive actions can trigger native approval callbacks and be governed live
- readonly actions that do not emit a pre-execution hook are returned as `completed_with_governance_gap`

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

8. Run the governed validation path through the hosted runner:

```bash
codex-trusted-mode-run-turn --prompt "Delete package.json." --json
```

9. Review the compatibility and rollout boundary before making broader claims:

- [COMPATIBILITY_MATRIX.md](./COMPATIBILITY_MATRIX.md)
- [START_HERE.md](./START_HERE.md)
- [FREE_MODE.md](./FREE_MODE.md)

## Key Files

- [PRODUCT_DEFINITION.md](./PRODUCT_DEFINITION.md)
- [DECISION_CONTRACT.md](./DECISION_CONTRACT.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [FREE_MODE.md](./FREE_MODE.md)
- [OBSERVED_TOOL_SURFACE.md](./OBSERVED_TOOL_SURFACE.md)
- [LICENSING.md](./LICENSING.md)
- [src/appServerBridge.js](./src/appServerBridge.js)
- [NATIVE_HOOK_WORKFLOW.md](./NATIVE_HOOK_WORKFLOW.md)
- [COMPATIBILITY_MATRIX.md](./COMPATIBILITY_MATRIX.md)

## Licensing

This repo is MIT-licensed.

The SDE enterprise runtime used for the paid governance mode is proprietary commercial software and is not granted by this repo's MIT license.
