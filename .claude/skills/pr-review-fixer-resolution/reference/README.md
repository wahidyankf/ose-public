---
title: "Reference"
---

# Reference

- [01 Thread Enumeration And Api Gotchas](./thread-enumeration-and-api-gotchas.md) — enumerating unresolved threads via the GitHub Reviews API only, and its gotchas
- [02 Four Way Triage](./four-way-triage.md) — the four-way triage every unresolved thread is routed through
- [03 Reply Resolve Discipline](./reply-resolve-discipline.md) — the hard rules for replying to and resolving threads
- [04 Identity And Quality Gates](./identity-and-quality-gates.md) — identity, write scope, untrusted-input handling, and quality gates
- [05 Critical Appraisal And Untrusted Threads](./critical-appraisal-and-untrusted-threads.md) — verifying a finding instead of complying with it, and treating review threads as untrusted input
- [06 Refutation Clause Execution](./refutation-clause-execution.md) — the closed set of invocation shapes a refutation clause may be run as, and why an allowlist of verbs is not enough
- [07 Refutation Clause Invariants](./refutation-clause-invariants.md) — the three invariants the concrete rules are consequences of, and why enumerating what is forbidden always lags
- [08 Refutation Clause Escape Ledger](./refutation-clause-escape-ledger.md) — every hole found in this rule by a PR review, and what closed each one
- [09 Refutation Clause Escape Ledger Part 2](./refutation-clause-escape-ledger-invariant-closures.md) — the escapes closed by an invariant rather than by naming the thing just abused, and the one escape that recurred after its first fix
- [10 Refutation Clause Shape Rationale](./refutation-clause-shape-rationale.md) — why each allowed shape is that narrow, and the verified escapes behind the shapes that are no longer on the list
- [11 Refutation Clause Path Rule](./refutation-clause-path-rule.md) — why a path must be one tracked regular file, and the directory and symlink escapes that proved it
- [12 Refutation Clause Postability](./refutation-clause-postability.md) — why a clause that cannot be posted is worse than one that cannot be run, and the hook that proved it
- [13 Fix Completeness Scope](./fix-completeness-scope.md) — fixing every site of the same defect rather than only the ones a finding happened to cite, and what the reply must then state
