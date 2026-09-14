---
description: "Standards for how AI agents plan, execute, verify, and self-improve during multi-step tasks"
when_to_use: Use when planning, delegating, verifying, or self-improving during a multi-step agent task.
---

# Agent Workflow Orchestration Convention

This document defines how AI agents plan, execute, verify, and improve their work during multi-step tasks. It covers when to enter plan mode, how to use delegated agents, how to manage task state, and how to verify completion before declaring a task done.

## Planning and Delegation

- [Principles Implemented/Respected](./agent-workflow-orchestration/principles-implemented-respected.md) — principle list.
- [When to Plan](./agent-workflow-orchestration/when-to-plan.md) — plan format, re-planning.
- [Delegated Agent Strategy](./agent-workflow-orchestration/delegated-agent-strategy.md) — when to delegate.

## Operating Budgets

- [Authoring and Propagating Repository Rules](./agent-workflow-orchestration/operating-budgets-authoring-repository-rules.md) — rule propagation.
- [Parallelism Budget](./agent-workflow-orchestration/operating-budgets-parallelism-budget.md) — concurrency cap.
- [DAG-First Orchestration and Background-Slot Preference](./agent-workflow-orchestration/operating-budgets-dag-first-and-background-slot.md) — sequencing.
- [Harness Capability Gating](./agent-workflow-orchestration/operating-budgets-harness-capability-gating.md) — capability checks.
- [The PR Is the Independent Merge Point](./agent-workflow-orchestration/operating-budgets-pr-independent-merge-point.md) — worktree isolation.
- [The PR Is the Independent Merge Point (Continued)](./agent-workflow-orchestration/operating-budgets-worktree-per-repository-unit.md) — per-repo scope.
- [CI and GitHub Actions Monitoring Cadence](./agent-workflow-orchestration/operating-budgets-ci-monitoring-cadence.md) — polling cadence.

## Verification and Bug Fixing

- [Verification Before Done](./agent-workflow-orchestration/verification-before-done.md) — pre-completion checks.
- [Autonomous Bug Fixing](./agent-workflow-orchestration/autonomous-bug-fixing.md) — expected behaviour, CI failures.

## Self-Improvement and Task Management

- [Self-Improvement Loop](./agent-workflow-orchestration/self-improvement-loop.md) — lessons file.
- [Task Management](./agent-workflow-orchestration/task-management.md) — planning, tracking, granular items.
- [Ask Last](./agent-workflow-orchestration/ask-last.md) — Defines the evidence and authority boundary an agent must exhaust before asking the user. Use before asking the user for information, preference, or authority during repository work.
- [Continuation-State Integrity](./agent-workflow-orchestration/continuation-state-integrity.md) — preserves active user-established rule decisions across compaction and handoff.
- [Anti-Patterns](./agent-workflow-orchestration/anti-patterns.md) — orchestration mistakes.
- [References](./agent-workflow-orchestration/references.md) — related conventions.

## Conventions Implemented/Respected

This practice respects the following conventions:

- **[Content Quality Principles](../../conventions/writing/quality.md)**: Plan documents and lessons files follow active voice, clear structure, and actionable content - not vague notes.

- **[CI Monitoring Convention](../workflow/ci-monitoring.md)**: Agents performing post-push CI verification MUST make one status read every 2 minutes via a scheduled wakeup. `gh run watch` and manual tight-loop polling are forbidden regardless of job duration. When rate-limited (HTTP 403): `ScheduleWakeup(delaySeconds=2100)` — not a retry loop.

## Demand Elegance (Balanced)

For non-trivial changes, pause and ask: "Is there a more elegant way to do this?"

If a solution feels hacky, reframe the task: "Knowing everything I now know, what is the elegant solution?" Then implement that instead.

**When to skip this step**: Simple, obvious fixes with a single clear approach. Do not over-engineer a one-line correction.

**Elegance is not complexity**: The more elegant solution is usually simpler, not more abstract. The question is whether the current approach is unnecessarily convoluted, not whether a more sophisticated pattern could be applied.
