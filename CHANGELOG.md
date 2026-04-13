# Changelog

## 0.1.3

- add a fixed free-mode safety floor that blocks broad interpreters and shell launcher commands before any standalone allowlist match
- move richer per-command shell argument validation to the SDE Guard Pro pack so governed policy depth stays on the paid runtime side

## 0.1.1

- block shell commands that chain control operators or redirection behind an otherwise read-only prefix
- tighten local allowlist evaluation to exact program and subcommand matches instead of raw string prefix matching
- add PDP/mock-PDP regression coverage for chained shell command deny paths

## 0.1.0

- created the initial Codex Trusted Mode repo
- implemented standalone local hardening defaults
- implemented normalized Codex request contract
- implemented optional SDE PDP adapter
- added verification scripts and node:test coverage
- documented the free/paid product boundary
- aligned the repo to the observed Codex tool surface
- added a mock PDP, governed example flow, and initial release evidence artifacts


