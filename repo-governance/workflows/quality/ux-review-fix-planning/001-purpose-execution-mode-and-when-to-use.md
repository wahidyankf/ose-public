---
description: "States the workflow's purpose (a combined fix plan, never live fixes), its execution modes, and when to run it."
when_to_use: "Use when deciding whether this workflow applies, or how it will be executed (delegated vs manual)."
---

# Purpose, Execution Mode, and When to Use

**Purpose**: Test a live website from the three complementary live-site UX-quality lenses in one pass —
spec-aware exploratory correctness (`web-exploratory-tester`), spec-blind heuristic-usability
(`web-usability-tester`), and design-aware design-fidelity (`web-design-tester`) — then fold all three
result sets into a single fix-ready plan whose findings stay attributed to their source and which
spells out, in `tech-docs.md` and a TDD-shaped `delivery.md`, exactly how to fix what was found.

> **The outcome is the plan, not the implementation.** This workflow never edits app/lib source,
> never runs a fix, and never lands behaviour changes. It produces a proposal under
> `plans/in-progress/`. The actual fixes happen later, only after a human reviews the plan and runs
> the [Plan Execution workflow](../../plan/plan-execution.md). `delivery.md` becomes the executable
> checklist then, not now.

This is a `planning`-type workflow: a single forward procedure whose terminal deliverable is a plan
document. It is **not** an iterative quality gate over the site.

## Execution Mode

**Agent Delegation (preferred)** — the calling context orchestrates the phases, delegating the three
testing passes to `web-exploratory-tester`, `web-usability-tester`, and `web-design-tester` via the
Agent tool **one at a time** (exploratory → integrate → usability → integrate → design → integrate),
running the solidification and plan authoring through `plan-maker`, and gating with `plan-checker` /
`plan-checker`. The human grill checkpoint runs inline so the user's conversation is preserved.

**Manual Orchestration (fallback)** — when those agents are unavailable as delegated agent types,
the assistant executes each phase directly using the testers' and plan agents' documented procedures
with Read/Write/Edit tools.

## When to use

- You have a running site (dev, preview, or production) and want a correctness sweep, a first-time-user
  usability read, and a design-fidelity check, delivered as one actionable fix plan rather than three
  disconnected reports.
- Before hardening a user-facing feature: capture defects, friction, and design drift together so the
  fix plan addresses all three in one delivery checklist. This is the near-end three-tester round that
  web-UI feature-change plans must run per
  [User-Facing Delivery Hardening](../../../development/quality/user-facing-delivery-hardening.md) (Rule 15).
- To refresh an existing findings plan: re-run all three testers and merge the new results into the
  prior plan folder (`plan-mode=merge`).

> **Output-mode note**: This explicitly invoked plan-authoring workflow passes **`output-mode:
plan`** to each tester; tester omission would default to `local-tmp`. Each tester files its
> findings into the new (or merged) authorized plan folder that this workflow consolidates.
> The **`delivery` output-mode** is the in-place rule-15 variant used when findings belong to a plan
> already in flight: invoke each tester directly with `output-mode: delivery` and the executing
> plan's `plan-path` (see the
> [Rule-15 three-tester retest in plan-execution](../../plan/plan-execution/036-finalization-pre-archival-gates.md#8-finalization-and-archival-sequential)).
> This workflow's behaviour is unchanged; the note clarifies which mode each path uses.
