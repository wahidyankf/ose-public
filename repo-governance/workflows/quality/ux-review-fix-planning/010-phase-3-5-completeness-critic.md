---
description: "The pre-solidification critic pass that reconciles the three coverage maps into one control x surface grid and confirms no matrix cell, recurrence class, or changed surface was silently skipped."
when_to_use: "Use when checking exactly what the completeness critic verifies before Phase 4 solidification starts."
---

# Phase 3.5 — Cross-Tester Completeness Critic

Continued from [Phase 3 — Design Pass + Integrate](./009-phase-3-design-pass-and-completeness-critic.md).

## 3.5 Cross-tester completeness critic (Sequential)

Before solidifying, run one explicit critic pass over the three integrated result sets and their
coverage matrices, asking: **"which control, surface, tab, locale, breakpoint, edge state, declared
invariant, or recurrence-class did NONE of the three testers enumerate?"** Concretely:

- Reconcile the three coverage maps into a single control × surface grid; any cell no tester exercised
  is either filled by a targeted re-run of the relevant tester or recorded under "areas not covered"
  with the reason.
- Confirm every prior-class re-check item (Phase 0 recurrence list) and every changed-surface item
  (Phase 0 diff list) was actually exercised; re-dispatch the owning tester for any that slipped.
- Confirm the declared-invariant conformance pass enumerated **every** applicable element, not a sample.

Silent omission reads as "all clear" when it is not — this critic makes the gaps explicit before the
plan is authored. Record its outcome in the plan `README.md` coverage map.

**Success criteria**: every matrix cell is exercised or explicitly recorded as not-covered with a reason;
no Phase 0 recurrence/diff item is silently dropped.
