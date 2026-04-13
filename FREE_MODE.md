# Free Mode

## What Users Get Without SDE

The free version is useful on its own as a local Codex hardening layer.

It gives users:
- a conservative read-only shell posture
- blocking of direct patch application
- blocking of mutating shell commands such as `git commit`
- a simple way to validate the local posture without deploying the SDE PDP

## Default Free Posture

- `toolPolicyMode`: `ALLOWLIST_ONLY`
- allowed tools:
  - `functions.shell_command` for read-only prefixes only
  - `functions.update_plan`
  - `functions.view_image`
- blocked by default:
  - `functions.apply_patch`
  - mutating shell commands

## Why This Adds Value

This is useful for:
- safer evaluation of Codex in a local workstation workflow
- reducing accidental repository mutation
- creating a clear low-risk baseline before enabling paid governed mode

## Run The Free Demo

```bash
node scripts/run_free_demo.js
```

This writes:
- `release-evidence/<timestamped-free-demo-results>.json` or the current repo-level summary artifact used for release review

## What The Free Tier Does Not Include

- external PDP authorization
- signed governance packs
- tenant/license entitlements
- enterprise release evidence from the SDE runtime
