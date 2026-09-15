---
description: The required parity contents of every mature-core plan.
when_to_use: Use when verifying an authored plan carries everything this workflow requires before it can pass the quality gate.
---

# Step 6 — Plan Authoring (Required Contents)

**Continues from** [Step 6 — Plan Authoring](./step-6-plan-authoring.md).

Each plan MUST include:

**(a) Full deviation matrix** with justifications in the chosen technical form. For a directory
form, `tech-docs/README.md` maps the companion containing it. Every row from the Steps 3 and 5
output appears verbatim, including the chosen resolution and justification for any deviation.

**(b) Cross-links to sibling plans** in each of the other target repos. Use the expected paths
at the agreed stage. Example (from a plan at `plans/in-progress/foo/README.md`):

```markdown
## Sibling Plans

This plan is part of a parity set. See sibling plans for context:

- `private-sibling`: `plans/in-progress/foo/README.md`
```

**(c) Delivery checklist item** to write a decision-rationale document at the agreed location per
Step 3 (e.g., `docs/explanation/<objective-slug>-parity-decisions.md`) explaining why each
decision was taken — especially deviations. The exact path is the grilled value from Step 3.

**(d) Delivery checklist item** to update any governance or convention docs the decisions touch
(e.g., if a decision changes a CI gate threshold, the relevant convention doc must be updated
as part of executing the plan).

**(e) Knowledge Capture phase**: `plan-maker` emits the standard Knowledge Capture phase plus a
`learnings.md` scaffold per repo plan, exactly as it does for single-repo plans. Any learning
surfaced during THIS parity-planning process itself (survey, grilling, research) that is
generalizable also flows through the triage rubric in the
[Knowledge Capture Convention](../../../development/quality/knowledge-capture.md) before the
corresponding plan is archived.

**Plans are plans only**. This workflow never implements the objective. The type `planning`
means the terminal deliverable is a validated plan document in `plans/` — not code, not config
changes, not convention edits. Execution of the objective is downstream work performed later by
the [plan-execution workflow](../plan-execution.md).

**Agent**: `plan-maker`

**Success criteria**: The mature core and exactly one mapped technical form exist at the resolved
path in each target repo.

**On failure**: Surface the error. Do not proceed to Step 7 for the failing repo until the plan
is authored.
