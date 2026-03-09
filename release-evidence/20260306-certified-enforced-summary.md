# Certified Enforced Summary

## Result

- release gate status: `CERTIFIED_ENFORCED_READY`
- adapter: `codex-trusted-mode`
- version: `0.1.0`

## Evidence Index

- observed runtime/tool surface:
  - [20260306-observed-runtime-validation.md](./20260306-observed-runtime-validation.md)
- free standalone validation:
  - [20260306-free-demo-results.json](./20260306-free-demo-results.json)
- governed PDP validation:
  - [20260306-governed-example-results.json](./20260306-governed-example-results.json)
- real native callback transcript:
  - [live-native-approval-capture-repo.txt](./live-native-approval-capture-repo.txt)
- normalized native callback evidence:
  - [native-hook-evidence.json](./native-hook-evidence.json)

## Live Native Callback

The certified transition is based on a real Codex app-server callback captured from a repo-root session:

- callback method: `item/commandExecution/requestApproval`
- decision returned: `accept`
- cwd: `C:\dev\codex-trusted-mode`
- command under approval:
  - `Add-Content -Path 'release-evidence/native-approval-proof.tmp' -Value 'TEST_BRIDGE_CAPTURE'`

## Notes

- A prior home-directory run resolved the wrong working directory because the debug helper inherited the shell cwd.
- The final certified capture was rerun from `C:\dev\codex-trusted-mode` so the native callback targeted the repo path.
- The disposable proof file created during the live callback capture was removed after evidence was recorded.
> Publication note: keep public evidence bundles sanitized. Remove environment-specific paths, session identifiers, customer/repo names, diffs, tokens, and other operationally sensitive data before external distribution.
