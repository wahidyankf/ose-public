---
description: What HIPPO exits 1, 2, 124, 125, 126, and 127 require before a retry, and the corrections that are never allowed.
when_to_use: Use when a guarded command exits non-zero and you are deciding whether and how to retry it.
---

# Recovery and Safe Retry

A status says what to do; the `hippo: [hippo.area.reason]` line on stderr says which case you are
in. Two reasons under one status can need opposite responses, so read both.

- Exit `124`: a limit stopped the work. `hippo.limit.storage-blocked` means free storage safely,
  then retry, because waiting frees no disk. `hippo.limit.capacity-deferred` requeues only when a
  new schema-1 receipt proves `never-started`; a pressure shed or a `started-safety-stop` requires
  payload-specific recovery.
- Exit `125`: HIPPO started nothing. `hippo.coordination.protocol-mismatch` is never retried: run
  `./hippo status`, then drain or upgrade the incompatible peer before retrying the original
  command. `hippo.policy.replan-required` and the `hippo.config.*` reasons mean correcting the
  configuration, reservation, mapping, or strict-profile planning before a retry.
- Exit `2`: the invocation itself is unusable. Read the diagnostic and fix the command.
- Exit `126`, `127`: the guarded command cannot be executed, or is not there.
- Exit `1`: the work ran and the answer is empty. This is a result, never a capacity signal.

Never bypass HIPPO, weaken a gate, delete possibly live state, or raise mapped concurrency.
Unreadable or corrupt shared state fails closed and `status` reports that error instead of a
partial document. Child codes pass through, including ones colliding with a status HIPPO uses; only
HIPPO's own failures write that `hippo:` line, and task-failed evidence without a new
`never-started` receipt keeps a code child-owned.

`hippo.lock` pins executable identity, not governance semantics. Before changing consumer behavior, read the Hippo
repository at the commit in `hippo.lock`, especially its exit-code and recovery references, then reconcile this rule,
Gherkin, and harness checks with the capabilities that commit actually provides. Never infer capability from SemVer
ordering or copy a release number into the rule.
