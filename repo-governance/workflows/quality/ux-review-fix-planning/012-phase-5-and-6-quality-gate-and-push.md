---
description: "The nested plan-quality-gate call that hardens the authored plan, and the final push-and-summary step that lands the plan and reports findings counts."
when_to_use: "Use when checking the plan-quality-gate args/output for this workflow, or exactly what the final push step stages and reports."
---

# Phase 5 and Phase 6 — Plan Quality Gate and Push & Hand-back

## Phase 5 — Plan Quality Gate (Nested Workflow)

**Workflow**: `quality/plan-quality-gate` — this phase is one of that gate's named callers.

- **Args**: `subject: {plan-path}`
- **Output**: `{verdict}`, `{ledger}`

The gate runs a read-only `plan-checker` sweep, freezes a ledger, and has `plan-fixer` repair it inside at most
three cycles, confirming the plan's requirements completeness, technical clarity, and delivery-checklist
executability (including the TDD shape and specs-coverage steps).

**Success criteria**: the gate returns a verdict, recorded in the plan's `delivery.md`.
**On `FAIL` or `BLOCKED`**: surface the returned ledger's open rows to the user before pushing. Do not re-run the
gate in a loop.

## Phase 6 — Push & Hand-back (Sequential)

- Stage the explicit plan paths and the workflow/governance edits only (never `git add -A`; sibling
  repos carry unrelated WIP). Commit with a Conventional Commit message and push to `push-target`.
- Emit a user-visible summary: `plan-path`, `exploratory-findings-count`, `usability-findings-count`,
  `design-findings-count`, `final-status`, and a reminder that the plan is a **snapshot of the site as
  tested** — re-run all three testers if the site changes materially before the plan is executed.

**Output**: `plan-path`, `final-status`, pushed commit.
