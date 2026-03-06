# Native Hook Workflow

## Purpose

Move the remaining Codex certification blocker from "no native surface" to "live native session proof".

## What We Have Now

- real Codex JSONL runtime stream evidence from `codex exec --json`
- official app-server schemas with native approval request/response types
- a working bridge in `src/appServerBridge.js` for:
  - `item/commandExecution/requestApproval`
  - `item/fileChange/requestApproval`
  - `execCommandApproval`
  - `applyPatchApproval`

## What You Need Next

- a Codex app-server session or equivalent native session that sends a real approval request
- one observed allowed or denied governed action
- the raw approval request and the response returned by the bridge

## Evidence To Capture

- observed tool ID
- callback shape
- final decision applied by the runtime
- reason code returned by the adapter or PDP path
- timestamp

## Recommended Flow

1. Trigger a governed Codex action in a runtime where the app-server approval path is active.
2. Capture the raw approval request JSON.
3. Evaluate it with:
   - `node scripts\evaluate_app_server_request.js --input path\to\approval-request.json`
4. Save the raw request and the bridge response.
5. Use `scripts\capture_native_hook_evidence.js` to normalize a real runtime capture into `release-evidence\native-hook-evidence.json`.
6. Rerun `node scripts/verify_certification_gate.js`.

## Bridge Demo

You can validate the bridge logic today without a live app-server session:

1. `node scripts\run_native_bridge_demo.js`
2. Review `release-evidence\native-approval-bridge-demo-results.json`

## Stdio Bridge Smoke Test

You can also validate the bridge as a minimal JSON-RPC stdio process:

1. `powershell -ExecutionPolicy Bypass -File scripts\run_app_server_bridge_smoke.ps1`
2. Review `release-evidence\app-server-bridge-stdio-smoke.jsonl`

This proves the bridge can accept `initialize` plus native approval requests and return protocol-shaped responses.
It still does not prove a live Codex session was wired through it.

## Live Harness

There is now a live harness for probing the native app-server path:

1. `powershell -ExecutionPolicy Bypass -File scripts\capture_live_app_server_session.ps1`
2. Review:
   - `release-evidence\live-app-server-session.jsonl`
   - `release-evidence\live-app-server-session-summary.json`

Current state in this environment:
- `initialize` succeeds
- follow-on requests are accepted on the wire
- no native approval callback has been emitted yet

## Native Runtime Stream Capture

If you do not yet have a direct adapter callback payload, capture the Codex native event stream first:

1. Run `powershell -ExecutionPolicy Bypass -File scripts\capture_codex_jsonl.ps1`
2. Parse it with `node scripts\parse_codex_jsonl_evidence.js --input release-evidence\codex-exec-capture.jsonl`

This proves the live Codex event shape. It does not, by itself, unlock `CERTIFIED_ENFORCED_READY`.

## Important Rule

Do not make `CERTIFIED_ENFORCED` claims until the native-hook evidence file exists and reflects a real runtime callback path.
