---
description: The canonical tooling a governance gate runs once per cycle and consumes without reproducing.
when_to_use: Use at step 4 of the plan quality gate, or the effective-mode verification of the rules quality gate.
---

# Deterministic Verification

Run the canonical repository gates once per cycle and consume their findings. Assert the exit code
of each; a validator that emits no failure token still fails, and a piped invocation loses every
exit code but the last.

```sh
./hippo run --class ephemeral --resource-tier standard --disk-path . -- \
  apps/rhino-cli/scripts/rhino-bin.sh gate run --surface=ci --group=governance
./hippo run --class ephemeral --resource-tier standard --disk-path . -- \
  apps/rhino-cli/scripts/rhino-bin.sh gate run --surface=ci --group=markdown
```

Together these own word budgets, README annotated indexes, Markdown links, Mermaid accessibility
and legibility, heading hierarchy, file naming, frontmatter, harness bindings and parity, vendor
independence, emoji and licence conventions, environment contracts, and `repo-config.yml` schema
parity. A governance gate never re-checks any of them by reading files itself.

HIPPO may defer either invocation for capacity. That deferral is
[infrastructure handling](../../../development/practice/resource-aware-development.md), not a gate
cycle and not a failure: retry the same invocation once its condition clears, and never bypass,
duplicate-retry, or change its workload class to force admission.

Where recovery still cannot obtain a deterministic verdict, return `BLOCKED_TOOLING` with the
failure evidence. Never simulate a check, and never retry without bound.

## Related Documents

- [Plan Quality Gate](../plan-quality-gate.md) — step 4 of its bounded procedure.
- [Rules Quality Gate](../../rules/rules-quality-gate.md) — its `EFFECTIVE`-mode verification.
