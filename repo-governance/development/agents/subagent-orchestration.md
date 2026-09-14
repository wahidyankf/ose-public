---
description: "Standards for concurrency caps and stuck-detection when a main agent spawns subagents via the Agent tool, capping concurrent background subagents at two (three total including the main agent/thread) to control token burn and avoid Claude API rate-limit hits"
when_to_use: Use when spawning, polling, or capping background subagents, or diagnosing a stuck subagent.
---

# Subagent Orchestration Convention

This document defines how a main agent manages subagents it spawns via the Agent tool: how many to run in parallel, how to poll for stuck agents, and what signals distinguish healthy from stalled execution. These standards prevent Claude API per-minute rate-limit failures and ensure stuck agents are detected and relaunched rather than silently starving a batch.

## Foundations

- [Principles Implemented/Respected](./subagent-orchestration/principles-implemented-respected.md) — principle list.
- [Purpose](./subagent-orchestration/purpose.md) — why this matters.
- [Scope](./subagent-orchestration/scope.md) — what's covered.

## The Six Standards

- [Standard 1 — Default Concurrency](./subagent-orchestration/standard-1-default-concurrency.md) — the concurrency cap.
- [Standard 1 (Continued)](./subagent-orchestration/standard-1-worked-examples.md) — worked examples.
- [Standard 2 — 3-Minute Stuck-Detection Polling](./subagent-orchestration/standard-2-stuck-detection-polling.md) — polling, recovery.
- [Standard 2 (Continued)](./subagent-orchestration/standard-2-healthy-versus-stuck-signals.md) — signal table, examples.
- [Standard 3 and Standard 4](./subagent-orchestration/standard-3-and-4.md) — chunk sizing, task IDs.
- [Standard 5 — Status-Update Cadence](./subagent-orchestration/standard-5-status-update-cadence.md) — reporting cadence.
- [Standard 5 (Continued)](./subagent-orchestration/standard-5-heartbeat-trigger-examples.md) — rationale, examples.
- [Standard 6 — Touched-File Ledger](./subagent-orchestration/standard-6-touched-file-ledger.md) — the ledger requirement.

## Anti-Patterns and Tooling

- [Batching and Stuck-Detection Mistakes](./subagent-orchestration/anti-patterns-batching-and-detection.md) — batching mistakes.
- [Running Serially and Monolithic Chunks](./subagent-orchestration/anti-patterns-serial-and-monolithic.md) — sizing mistakes.
- [Open-Ended Poll Loops and Going Silent](./subagent-orchestration/anti-patterns-poll-loops-and-silence.md) — reporting mistakes.
- [References](./subagent-orchestration/references.md) — further reading.

## Conventions Implemented/Respected

This practice respects the following conventions:

- **[Content Quality Principles](../../conventions/writing/quality.md)**: This document follows active voice, proper heading hierarchy, and accessible examples throughout.

- **[File Naming Convention](../../conventions/structure/file-naming.md)**: This document uses a lowercase kebab-case filename consistent with repository naming rules.

The following Layer 3 development practice also informs this document:

- **[Agent Workflow Orchestration Convention](./agent-workflow-orchestration.md)**: Subagent orchestration is a specialization of delegated agent strategy. The rules here narrow the delegation model for the case where agents run in background.

## Tooling Reference

| Tool             | Purpose in This Convention                                     |
| ---------------- | -------------------------------------------------------------- |
| `Agent`          | Spawns subagent; returns `agentId`                             |
| `TaskStop`       | Terminates stuck agent by `agentId`                            |
| `SendMessage`    | Sends new instructions to a running agent                      |
| `TaskList`       | Lists TaskCreate tasks — does NOT show Agent IDs               |
| `ScheduleWakeup` | Schedules the main agent's next poll (use 180-second interval) |

**Note**: `ScheduleWakeup(delaySeconds=180)` is the preferred mechanism for 3-minute polling cadence. This is consistent with the pattern established by [CI Monitoring Convention](../workflow/ci-monitoring.md) for other scheduled checks.
