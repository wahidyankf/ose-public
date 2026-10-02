---
description: "Index of the PR leak review's modules: leak classes, push review, merge execution, evidence, and enforcement."
when_to_use: "Use to locate the normative mechanics of pr-leak-review, in reading order."
---

# PR Leak Review Modules

Read in order. Together these hold the rules the [PR Leak Review](../pr-leak-review.md) entrypoint
applies.

- [Scope and Exclusions](./001-scope-and-exclusions.md) — Defines the three leak classes, what is not a
  leak, and why history is the subject. Use when deciding whether a candidate is a real leak.
- [Push Review](./002-push-review.md) — Reviews each outgoing range privately before a push, with
  remediation before and after it. Use immediately before every push.
- [Execution](./003-execution.md) — Defines the merge review's pinned-head, commit-by-commit inspection
  and sanitized review phases. Use when running the merge review.
- [Evidence and Outcomes](./004-evidence-and-outcomes.md) — Defines the posted current-head record,
  its read-back, and terminal states. Use when posting, authenticating, or consuming a leak result.
- [Enforcement](./005-enforcement.md) — Defines the history screen, hosted checks, required
  `leak-review` status, and adopter decisions. Use when wiring or tracing enforcement.
