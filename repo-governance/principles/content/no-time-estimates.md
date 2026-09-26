---
description: Plan documents schedule by dependency, order, and resource, never by time estimate; everywhere else a labelled estimate is permitted
when_to_use: Use when writing or reviewing a plan document, or when deciding whether a time estimate is permitted in other content.
---

# No Time Estimates

**Plan documents state no time estimates, durations, or dates as effort commitments.** They schedule
work by **dependency, order, and resource** instead. Plan documents are the core documents at every
plan lifecycle stage: `README.md`, `brd.md`, `prd.md`, `tech-docs.md` or `tech-docs/`,
`delivery.md`, and idea two-pagers or other plan-stage briefs.

**Everywhere else an estimate is permitted** and should be labelled as an estimate: conversation,
execution status updates, git-ignored scratch, a plan's `evidence/` and `learnings.md`, tutorials,
how-to guides, reference, and all other documentation.

## Foundations

- [Vision Supported](./no-time-estimates/vision-supported.md) — Explains how scheduling plans by dependency rather than duration advances the project's vision. Use when justifying the plan-document ban against the project's mission.
- [What](./no-time-estimates/what.md) — Defines which documents the ban covers, what counts as an effort estimate, and what stays permitted. Use for a quick scope check before writing or flagging a duration.
- [Why](./no-time-estimates/why.md) — Why estimates harm durable plan documents and why labelled estimates help everywhere else. Use when justifying the scope of the rule.

## Applying the Principle

- [How It Applies](./no-time-estimates/how-it-applies.md) — Pass/fail examples for plan documents and permitted examples for conversation, evidence, and documentation. Use when writing or reviewing content for a time estimate.
- [Anti-Patterns](./no-time-estimates/anti-patterns.md) — Common mistakes - effort-sized phases, forecast completion dates, unlabelled estimates, and over-applying the ban. Use when auditing a plan or a review finding.
- [PASS: Best Practices](./no-time-estimates/pass-best-practices.md) — Practices for scheduling plans by dependency, order, and resource, and for labelling estimates elsewhere. Use as a checklist when writing a plan.
- [Examples from This Repository](./no-time-estimates/examples-from-this-repository.md) — Real repository surfaces that schedule plans without durations. Use when looking for worked examples of the principle applied here.

## Related Conventions

- [Plans Organization Convention](../../conventions/structure/plans.md) - Defines the plan documents this principle covers
- [Delivery Checklists Express a DAG](../../conventions/structure/plans/delivery-checklists-express-a-dag.md) - Schedules delivery by dependency
- [Content Quality Principles](../../conventions/writing/quality.md) - Permits labelled estimates in documentation

## Relationship to Other Principles

- [Simplicity Over Complexity](../general/simplicity-over-complexity.md) - Simple dependency order, not complex schedules
- [Deliberate Problem-Solving](../general/deliberate-problem-solving.md) - Plans commit to verifiable outcomes, not guessed durations
