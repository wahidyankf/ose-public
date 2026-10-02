---
description: Explains how the plan-establishment workflow resolves the target-stage input into the resolved <plan-dir> path, and when to use each stage.
when_to_use: Use when determining whether a new plan should land in plans/in-progress/ or plans/backlog/, or when checking that both stages stop at plan creation.
---

# Stage Resolution

This workflow places the finished plan according to the `target-stage` input. Throughout the
steps below, `<plan-dir>` resolves as:

- **`target-stage=in-progress`** (default): `plans/in-progress/<identifier>/` — no date prefix;
  the plan is immediately active.
- **`target-stage=backlog`**: `plans/backlog/<identifier>/` — no date prefix, per the
  [Plans Organization Convention](../../../conventions/structure/plans.md); the plan is a
  proposal awaiting promotion.

Both stages stop at plan creation. **Neither stage executes the plan** — execution is a separate
concern handled later by the [Plan Execution workflow](../plan-execution.md) after a backlog plan
is promoted to `in-progress/` (a pure move — neither stage carries a date prefix).

**When to use**:

- When the user describes a new behaviour, pattern, or convention to adopt in the repository
- When a vague idea needs to become a structured, executable plan
- When research is needed before writing a plan (library versions, best practices, prior art)
- When the user wants the full plan-creation lifecycle orchestrated automatically
- When a parent workflow needs a validated plan produced into a specific stage — e.g.
  `dependency-bump-planning` calls this with `target-stage=backlog`
