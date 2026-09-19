---
description: "Child documents of the plan-quality-gate governance gate"
when_to_use: "Read this index to find the right plan-quality-gate child document."
---

# Plan Quality Gate

- [Execution and Delegation](./execution-and-delegation.md) — How the gate splits a delegated read-only `plan-checker` sweep from root-owned repair, why no separate fixer agent exists, and when the checker delegates multi-page research to `web-researcher`. Use when starting a run and deciding what the subagent does versus what the root must keep.
- [Sufficiency and Ownership](./sufficiency-and-ownership.md) — What a `PASS` asserts and does not assert, and the machine-decidable checks the gate must never reproduce because deterministic tooling already owns them. Use when deciding whether a gap is admissible to the ledger.
- [Audit Checklist](./audit-checklist.md) — The seven semantic checks completed in one non-editing pass before the ledger is frozen, plus the extra completion-checkpoint confirmations. Use during step 2 of the bounded procedure.
- [Deterministic Verification](./deterministic-verification.md) — The two canonical `Rhino` gate groups run once per cycle, their exit-code assertion rule, and how a HIPPO capacity deferral is handled without consuming a cycle. Use at step 4, and for the rules gate's `EFFECTIVE`-mode verification.
