---
description: What HIPPO exits 1, 73, 75, 76, and 78 require before a retry, and the corrections that are never allowed.
when_to_use: Use when a guarded command exits non-zero and you are deciding whether and how to retry it.
---

# Recovery and Safe Retry

- Exit `73`: free storage safely, then retry.
- Exit `75`: requeue only when a new schema-1 receipt proves `never-started`; pressure-shed,
  storage-shed, `started-safety-stop`, and child-owned `75` require payload-specific recovery.
- Exit `76`: never retry. Run `./hippo status`, then drain or upgrade the incompatible peer
  before retrying the original command. A legacy client without distinct exit `76` can report this
  mismatch as `75`; its diagnostic plus the absence of a qualifying receipt still means drain-or-upgrade.
- Exit `78`: correct configuration, reservation, mapping, or strict-profile planning before retry.
- Exit `1`: diagnose malformed state or Hippo-owned post-launch cleanup; never treat it as capacity.

Never bypass HIPPO, weaken a gate, delete possibly live state, or raise mapped concurrency.
Unreadable or corrupt shared state fails closed and `status` reports that error instead of a
partial document. Child codes pass through, including `75` and `76`; task-failed evidence
without a new `never-started` receipt keeps them child-owned.

`hippo.lock` pins executable identity, not governance semantics. Before changing consumer behavior, read the Hippo
repository at the commit in `hippo.lock`, especially its exit-code and recovery references, then reconcile this rule,
Gherkin, and harness checks with the capabilities that commit actually provides. Never infer capability from SemVer
ordering or copy a release number into the rule.
