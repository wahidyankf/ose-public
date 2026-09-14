---
name: plan-grooming-idea-briefs
description: >-
  Invocable entry point for the plan-ideas-grooming workflow: sweeps plans/ideas/ across repos into a deduplicated,
  Eisenhower-quadrant, correctly resident set of two-pagers, with residency rules, classification rubrics, fail-safe
  relocation, and a termination audit.
when_to_use: >-
  Use when a repo's flat idea count exceeds 60, 90 days have passed since the last recorded run, or a maintainer asks
  for idea grooming across repos.
---

# Grooming Idea Briefs

## Purpose

This Skill is the **invocable entry point** for the
[`plan-ideas-grooming` workflow](../../../repo-governance/workflows/plan/plan-ideas-grooming.md).
That workflow declares `Execution Mode: Direct Orchestration` and states that "the procedure lives
entirely in this workflow document" — meaning the calling context performs the steps itself and
there is no delegated agent behind it. This Skill exists so that running the workflow is a **named,
callable action** rather than an undifferentiated sequence of file edits: invoking it loads the
procedure below, and the run is attributable.

**Read the workflow document for the full normative text.** This Skill carries the operational
essentials and the traps; it does not restate all ten steps verbatim.

## When to use this Skill

- A repo's `plans/ideas/` (summed across quadrant folders, excluding `README.md`) exceeds **60**
  flat idea files.
- **90 days** have elapsed since the `> Last groomed: YYYY-MM-DD` line in that repo's
  `plans/ideas/README.md`.
- A maintainer explicitly asks for idea grooming across one or more repos.

Do **not** use it to file a new idea (write the two-pager directly) or to promote a ripe idea into a
backlog plan (that is `plan-planning`, following the Plans convention's promotion steps).

## Inputs

| Input           | Required | Default          | Notes                                                                                |
| --------------- | -------- | ---------------- | ------------------------------------------------------------------------------------ |
| `repos`         | yes      | none             | Comma-separated repo paths. Supply every repo in one run — Steps 3-4 are cross-repo. |
| `dry-run`       | no       | `false`          | Compute and log every decision without writing.                                      |
| `delivery-mode` | no       | `worktree-to-pr` | Fixed, no override — write scope below is never infra-as-code.                       |

## Hard scope boundary

Write scope is strictly `plans/ideas/**`, plus Step 9's sanctioned rewriting of inbound links
elsewhere. **Never** create, move, or write under `plans/backlog/` or `plans/in-progress/`, and
never promote an idea to a plan. If a step needs to write outside that scope, log it as a follow-up
in the grooming log instead.

## Procedure

See [Procedure](./reference/procedure.md) for the workflow's ten ordered steps (inventory, within/cross-repo dedup, residency rules R1-R3, fail-safe relocation, reshape, provenance, classify, link rewrite, recurrence-trigger stamp).

## Traps and Termination Audit

See [Traps and Termination Audit](./reference/traps-and-termination-audit.md) for the five traps this Skill exists to prevent and the six-clause termination audit to run before declaring a grooming run complete.

## Related

- [`plan-ideas-grooming` workflow](../../../repo-governance/workflows/plan/plan-ideas-grooming.md) — the normative procedure.
- [Ideas Folder (Two-Pagers) convention](../../../repo-governance/conventions/structure/plans/ideas-folder-overview-rationale-and-file-layout.md#ideas-folder-two-pagers) — the template every survivor is reshaped against.
- [Promoting a Two-Pager](../../../repo-governance/conventions/structure/plans/promoting-ideas-and-worked-examples.md) — how a groomed idea becomes a plan through `plan-planning`; this Skill never promotes.
