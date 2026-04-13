# Codex Ubuntu Linux Validation Summary

Date: 2026-03-07

## Scope

Additional Linux validation for `codex-trusted-mode` `0.1.0` beyond the original validated workspace-session evidence.

## Completed

1. Ubuntu WSL first pass
2. Fresh non-WSL Ubuntu Azure VM first pass

## Confirmed

- Linux clean-room baseline passed
- Linux runtime stream capture succeeded
- Linux native `item/commandExecution/requestApproval` callback was captured
- adapter decision was `decline` for a disposable write attempt
- disposable proof target was not created
- certification gate remained `CERTIFIED_ENFORCED_READY`

## Primary Supporting Artifacts

- [native-hook-evidence.json](./native-hook-evidence.json)
- local Ubuntu validation artifacts retained outside the committed public evidence subset

## Conclusion

The Codex Linux evidence base is materially stronger than the original workspace-session proof alone.

Public compatibility wording should still remain precise, but the current declared Codex row is now supported by:

- validated workspace-session evidence
- Ubuntu WSL evidence
- fresh non-WSL Ubuntu VM evidence
