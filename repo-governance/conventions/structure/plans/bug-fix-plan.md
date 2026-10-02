---
description: >-
  Defines the bug-fix plan: one document carrying a defect's report, duplicate check, root cause, referenced solution,
  delivery, and learnings; what makes each section useful; and which plan rules it is exempt from.
when_to_use: >-
  Use when fixing a defect through a plan in the repository owning the defective code, or when reviewing, executing, or
  archiving one.
---

# Bug-Fix Plan

A bug-fix plan is the compressed formal plan for one defect. The defect already answers why the work is worth doing and
what the result must do (the behaviour should not happen), so separate business and product documents would only restate
the report. What a cold executor still needs is the evidence, the cause, and the change.

It is reserved for a defect that blocks the work in hand with no workaround. Any other defect is filed as a
[two-pager](./two-pager-template.md) and waits for grooming, per
[Upstream Tool Defects](../../../development/workflow/upstream-tool-defects.md) where that standard applies. It is a
current, distinct form with its own fixed sections, not the
[Retired Single-File Structure](./single-file-structure.md), which no new plan may use.

## Shape

One document, `plans/in-progress/fix-<slug>/README.md`, with these top-level sections in this order:

| Section            | Contains                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| Bug Report         | every field [Bug Reports](../../writing/bug-reports.md) requires, the version and commit included |
| Duplicate Check    | each search of open issues, pull requests, plans, and idea briefs, with its query and result      |
| Root Cause         | the mechanism that produces the symptom, with evidence a reviewer can check                       |
| Solution           | the change, why it removes the cause, and every reference consulted, cited by URL                 |
| Worktree           | the declaration [Worktree Specification](./worktree-specification.md) requires                    |
| Delivery Checklist | labelled items: failing regression test, fix, verification, release, Knowledge Capture, archival  |
| Learnings          | what executing it taught, triaged to a terminal state before archival                             |

The slug starts with `fix-` and names the symptom, not the suspected cause: `fix-gate-skips-renamed-files`.

## What Makes Each Section Useful

**Root Cause** separates the symptom from the mechanism. It names where the behaviour comes from (a file and line, a
commit, a condition) and shows why: a minimal reproduction, a trace, or the failing assertion. "The parser is buggy" is
a symptom restated; "an empty path reaches the matcher at this line and matches nothing" is a cause. A cause that is
still a hypothesis says so and states the test that would confirm it.

**Solution** says why the change removes the cause rather than the symptom, and which conditions it covers beyond the
reported one. Research before choosing: the tool's own documentation, the specification or upstream behaviour it
implements, and prior reports of the same failure, found by searching the web as well as the repository. Cite each with
its URL, primary sources first. An approach copied from a source names the source.

**Delivery Checklist** starts with a regression test that fails for the reported reason, so the fix is proven rather
than asserted, as the [Regression Test Mandate](../../../development/quality/regression-test-mandate.md) requires. Each
item carries its [executor tag](./executor-tagging-tags-and-bias.md).

## What It Is Exempt From

- **[Structure Decision](./structure-decision.md):** it is the one current plan with one document; its sections take
  the fixed core's roles, and `brd.md`, `prd.md`, and the technical-form rules do not apply.
- **[Folder Structure](./folder-structure.md):** it starts in `in-progress/`, with no idea or backlog stage, and moves
  to `done/` like any plan.
- **The planning workflow's decision gates:** a defect has one correct behaviour, so there is nothing to grill.
- **[Plan-Artifact Authorization](./plan-artifact-authorization-and-transition.md):** it needs no separate request when
  written under [Upstream Tool Defects](../../../development/workflow/upstream-tool-defects.md), or when the owner asks.
  That standing request also directs the plan's quality gate, execution, and release without a further prompt: once the
  plan lands, run the gate, execute once its verdict is recorded and open blocking rows have owners, and release
  once tests pass.

Every other plan rule holds: slug rules, one lifecycle root, executor tags, no time estimates, the delivery mode,
Knowledge Capture, and archival.

## When It Stops Being One

A fix that needs a design decision, changes an interface its consumers rely on, or needs more than one delivery unit is
not a bug-fix plan. Expand it to the fixed core in place, keeping the slug, and run the decision gates before
continuing.

## Landing the Plan First

The plan lands on the owning repository's trunk alone, through its route, before any fix is committed. A parallel
finder's duplicate check then sees it, and the fix follows in its own change.
