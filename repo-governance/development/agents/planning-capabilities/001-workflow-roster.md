---
description: >-
  Names the seven planning workflows a repository must make reachable, plus the implementation review that accompanies
  Gherkin criteria.
when_to_use: >-
  Use when checking that a repository can run the whole plan lifecycle, or when a stage appears to have no owner.
---

# Workflow Roster

Seven capabilities cover the plan lifecycle. Each must be **reachable**: a named workflow in the repository, or an
equivalent local procedure recorded as a deviation.

| Capability       | Canonical workflow                                                          |
| ---------------- | --------------------------------------------------------------------------- |
| idea grooming    | [`plan-ideas-grooming`](../../../workflows/plan/plan-ideas-grooming.md)     |
| backlog grooming | [`plan-backlog-grooming`](../../../workflows/plan/plan-backlog-grooming.md) |
| plan creation    | [`plan-planning`](../../../workflows/plan/plan-planning.md)                 |
| plan execution   | [`plan-execution`](../../../workflows/plan/plan-execution.md)               |
| quality review   | [`plan-quality-gate`](../../../workflows/plan/plan-quality-gate.md)         |
| execution review | [`plan-execution-check`](../../../workflows/plan/plan-execution-check.md)   |
| cleanup          | [`dev-artifact-clean-up`](../../../workflows/dev-artifact-clean-up.md)      |

A repository that supports Gherkin acceptance criteria additionally exposes exactly one
[`gherkin-implementation-review`](../../../workflows/gherkin-implementation-review.md). One, not several: the
review's value is that every scenario is walked, and two overlapping reviews each assume the other covered the gap.

## Why These Seven

Each boundary marks a point where the question genuinely changes.

Grooming ideas asks whether something is worth planning. Grooming the backlog asks whether a plan is still true. Those
are different judgements about different artifacts, and merging them means one of the two stops being asked.

Creation and execution split at the point where intent becomes action — the last moment a mistake is cheap.

Quality review and execution review split across execution itself: one asks whether the plan is sound before work
starts, the other whether the work matched the plan after it finishes. A single review at either end cannot see what the
other sees.

Cleanup is last because it is the stage most often skipped, and the only one whose omission leaves the repository
measurably worse than before the work began.

## Reachability Is the Test, Not Naming

A repository may name these differently, fold two into one procedure, or genuinely not need one. What it may not do is
leave a stage unowned and undocumented.

The check is behavioural: pick a stage, ask who runs it and how, and get a specific answer. "Somebody would notice" is
the failure this roster exists to catch.

Where a repository does diverge, it records which capability, what it does instead, and why — see
[Skill and Agent Roster](002-skill-and-agent-roster.md) for the same rule applied to capability form.
