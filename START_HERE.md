# Start Here

## Objective

Start with a useful free Codex hardening posture. Add SDE only when you need governed authorization, evidence, and certification.

## Free Standalone Path

1. Keep `toolPolicyMode` set to `ALLOWLIST_ONLY`
2. Allow only:
   - `functions.shell_command` with read-only prefixes
   - `functions.update_plan`
   - `functions.view_image`
3. Confirm high-risk tools remain blocked:
   - `functions.apply_patch`
   - `functions.shell_command` when used for mutating commands such as `git commit`

Run:

```bash
node scripts/verify_config_contract.js
node scripts/verify_local_hardening.js
node scripts/run_free_demo.js
```

## Paid Governed Path

Switch `toolPolicyMode` to `PDP` only after:
- the Codex event surface has been validated in your environment
- the SDE PDP endpoint is available
- the decision contract is agreed
- fail-safe posture is explicitly chosen

Then run:

```bash
node scripts/verify_pdp_request_shape.js
node scripts/mock_pdp.js
node scripts/run_governed_example.js
```

## Next Documents

- [DECISION_CONTRACT.md](./DECISION_CONTRACT.md)
- [PRODUCT_DEFINITION.md](./PRODUCT_DEFINITION.md)
- [COMPATIBILITY_MATRIX.md](./COMPATIBILITY_MATRIX.md)
- [RELEASE_EVIDENCE_TEMPLATE.md](./RELEASE_EVIDENCE_TEMPLATE.md)
