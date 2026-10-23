---
description: The non-negotiable multi-plan additions to plan-execution.md's eleven Iron Rules, plus the pass/partial/fail terminal states for a run.
when_to_use: Use as the non-negotiable checklist before or during a multi-plan run, and when reporting a run's final status.
---

# Iron Rules and Termination Criteria

All eleven [`plan-execution.md` Iron Rules](../plan-execution/012-iron-rules-1-5.md) apply per
plan, unchanged. The multi-plan additions:

1. **Resolve scope once, then freeze it.** The caller states scope explicitly — an explicit plan list
   OR a set-selector (`all-in-progress` / `all-backlog` / `all`) optionally minus an `except` list.
   Resolve it to a concrete enumerated set at Phase A1, echo that set for confirmation, and **never
   re-expand it mid-run**. A selector is a one-time convenience for naming a bucket, not a standing
   subscription; plans created after resolution are out of scope. An `except` name that matches
   nothing in the set is a reported error, never a silent no-op.
2. **Verdicts are advisory, exactly as for one plan.** Record each plan's `plan-quality-gate` state at
   Phase A2; `FAIL`, `BLOCKED`, or missing never stops scheduling or execution, and open blocking rows keep their owners. Never gate or refuse a plan for its verdict.
3. **Resource-conflict guard is mandatory.** Two in-flight nodes MUST NOT share a resource. When in
   doubt about a node's footprint, treat it as conflicting (serialize) — never guess disjoint.
4. **Per-plan `delivery.md` is sacred.** Run the Atomic Sync Ritual against the correct plan's
   `delivery.md` in its declared work location. Cross-plan checkbox edits are forbidden.
5. **One `in_progress` per plan; `max-active-worktrees` at a time (default `1`).** Never exceed the worktree
   locks or HIPPO admission; more worktrees run at once only when the user explicitly allowed them.
6. **Failure isolates, never cascades to independent plans.** Quarantine the failing plan (and its
   dependents); keep disjoint plans running; never bypass a gate.
7. **Explicit `Depends-on` is authoritative.** Inference only fills gaps; it never overrides or
   relaxes a declared dependency.
8. **Cross-plan learnings are solidified before `pass`.** Per-plan Knowledge Capture (D4) is
   inherited unchanged, AND the run additionally runs the cross-plan consolidation (D5) over every
   executed plan's `learnings.md` before reporting `pass`. No cross-cutting theme may archive
   stranded in a single plan's folder; every theme reaches a durable home or is discarded with a
   reason, both safety gates applied.

## Termination Criteria

- **`pass`**: every named plan reached its clean terminal state (archived to `plans/done/` — the
  default path, since `[AI]` merges once the hardened preconditions hold; or a green exact-head-CI
  and leak-reviewed
  PR handed off, which applies only to a plan whose own step explicitly opts into a `[HUMAN]` merge
  gate) **and**
  cross-plan learnings were solidified (Phase D5 — every cross-cutting theme routed to a durable home).
- **`partial`**: one or more plans were quarantined or hit their `max-cycles` while others
  completed.
- **`fail`**: the schedule could not be built (cyclic `Depends-on` or a named plan missing).
