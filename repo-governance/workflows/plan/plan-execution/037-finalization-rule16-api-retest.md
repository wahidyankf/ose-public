---
description: Defines the rule-16 API exploratory retest gate that runs against the running endpoint(s) before archival.
when_to_use: Use when an API feature-change plan approaches archival and must run its near-end exploratory retest gate.
---

# Finalization and Archival — Rule-16 API Retest Gate

**Rule-16 API exploratory retest (near-end, before archival)**: For **API feature-change** plans
specifically (REST or GraphQL endpoints in a backend or tRPC app), after the implementation lands and
the contract (OpenAPI 3.x / GraphQL SDL) is updated, run a near-end `api-exploratory-tester` round
against the running endpoint(s). This is the API-surface counterpart to the rule-15 web triad — a
**single specialist tester**, no dedicated workflow, because the API surface has one exploratory lens.
Invoke it with **`output-mode: delivery`** and the executing plan's `plan-path`; its output is folded
back into THIS plan's `delivery.md`, not a separate plan, by the same mechanism as Rule 15:

1. `api-exploratory-tester` with `output-mode: delivery` appends each finding to `delivery.md` as a
   **new unchecked task-list checkbox**, source-attributed (`- [ ] AET-NNN: <defect> — fix before
archival`), and each `SG-###` spec-gap as its own unchecked checkbox folded into the specs/\*\*
   coverage steps. Findings land in a clearly labelled "Rule-16 API exploratory-test retest follow-ups"
   section at the end of the checklist.
2. Each new checkbox materializes as exactly one harness task per the
   [Task-Checklist Synchronization](./008-task-checklist-synchronization.md) 1:1 mapping, giving the user live
   visibility of the retest backlog.
3. Loop back into execution (Steps 2–7) to fix each finding and tick its checkbox via the Atomic Sync
   Ritual. **Exactly as with the rule-15 web-triad findings, every `AET-NNN` defect finding MUST be
   fixed and ticked during execution** — deferral of a defect finding requires explicit user permission
   and is allowed only when the fix is genuinely impossible. (`SG-###` spec-gap proposals are proposals,
   not defects, and may be triaged or deferred with written rationale recorded under the checkbox.)
4. Archival is blocked until every rule-16 `AET-###` defect checkbox is `- [x]` (fixed).

A plan that changes BOTH a web UI and its API runs both the rule-15 and the rule-16 rounds, and both
sets of defect checkboxes must be fixed before archival.
