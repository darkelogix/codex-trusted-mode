# Codex Tool Governance Pack Scaffold

## Purpose

This pack scaffold defines the SDE-side policy contract for Codex Trusted Mode.

## Current Status

- scaffold only
- suitable for contract review and pack authoring
- not yet wired into a production SDE runtime

## Contract Focus

- normalize Codex tool events into the `codex-tool-governance` contract
- return deterministic `allow`, `deny`, or `constrain`
- preserve stable reason codes and trace fields

## Initial Governed Actions

- `functions.shell_command`
- `functions.apply_patch`

## Initial Free/Paid Boundary

- free mode remains local hardening
- paid mode uses this pack contract as the external governance authority
