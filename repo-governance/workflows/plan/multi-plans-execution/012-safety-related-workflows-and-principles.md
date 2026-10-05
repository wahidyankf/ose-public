---
description: The guardrails bounding a multi-plan run, links to plan-execution.md and the focused PR leak gate, and the five general principles this design maps to.
when_to_use: Use when verifying what safeguards a run relies on, navigating to a composed workflow, or checking which principles a rule implements.
---

# Safety Features, Related Workflows, and Principles

- **Plan-only dry run** (`mode: plan-only`) surfaces the schedule before any execution.
- **Conservative resource inference** — ambiguous footprints serialize, never parallelize.
- **Work-location isolation** — worktrees isolate; a shared primary-checkout lock serializes.
- **Byte-identity serialization** — plans sharing a declared byte-identity boundary never run concurrently.
- **Quarantine, not cascade** — a blocker confines to its plan + dependents.
- **Harness-cap respect** — effective concurrency never exceeds the platform agent limit.
- **Disk-is-truth resume** — re-entry rebuilds the union Task list from every plan's `delivery.md`.
- **Cross-plan learnings solidification** — a mandatory consolidation pass routes portfolio-level
  learnings to durable homes before `pass`, so recurring signal survives per-plan archival.

## Related Workflows

- [`plan-execution.md`](../plan-execution.md) — the per-plan lifecycle this workflow schedules; the
  single-plan case.
- [`plan-quality-gate.md`](../../quality/plan-quality-gate.md) — the pre-execution gate every named plan must
  pass before it is eligible (Phase A2).
- [PR Leak Review](../../quality/pr-leak-review.md) — the mandatory exact-current-head leak gate for each
  `*-to-pr` plan (D1).
- [PR Review Cycle](../../quality/pr-review-quality-gate.md) — an optional semantic cycle, run only when the
  user explicitly requests it.

## Principles Implemented/Respected

- PASS: **Explicit Over Implicit** — plans are named explicitly; ordering is an explicit DAG;
  parallel vs sequential is marked on every task.
- PASS: **Deliberate Problem-Solving** — the schedule is computed and reviewable (`plan-only`) before
  execution; uncertain footprints serialize.
- PASS: **Simplicity Over Complexity** — reuses `plan-execution.md` wholesale; adds only the
  scheduling layer.
- PASS: **Root Cause Orientation** — inherits "fix ALL issues including preexisting" per plan.
- PASS: **No Time Estimates** — schedules by dependency and resource, not by duration.
