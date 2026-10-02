---
description: What this workflow inherits vs. adds relative to plan-execution.md, and the parallelism, N+1 model, and status-cadence rules bounding a run.
when_to_use: Use when unsure whether a rule belongs here or in plan-execution.md, or when setting/reasoning about concurrency.
---

# Relationship to plan-execution.md and Concurrency Model

Everything about how a _single_ plan executes — the [Task-Checklist Synchronization
model](../plan-execution/008-task-checklist-synchronization.md), the [Atomic Sync
Ritual](../plan-execution/010-atomic-sync-ritual.md), [Resume Reconciliation (disk is
truth)](../plan-execution/011-resume-reconciliation.md), the [Iron
Rules](../plan-execution/012-iron-rules-1-5.md), Steps 0–8, per-phase quality gates,
post-push CI verification, manual behavioural assertions, and archival — is **inherited verbatim**
from `plan-execution.md` and applied per plan. This document specifies only the multi-plan additions:
the DAG (Phase A), the union granular Task list (Phase B), the ready-queue scheduler (Phase C), and
failure isolation (Phase D). Where the two ever appear to conflict, `plan-execution.md`'s per-plan
rules win for that plan's internal work; this document governs only cross-plan scheduling.

## Concurrency Model

- **`parallelism` (default 3)** is the maximum number of delivery-step **nodes** in flight at once
  across all plans — the "N parallel Tasks". The caller overrides it (e.g., "…with parallelism 2" or
  "…serially" = 1).
- The **effective** concurrency is `min(parallelism, max-concurrency, harness agent cap)`. Per the
  [Agent Workflow Orchestration Convention](../../../development/agents/agent-workflow-orchestration.md),
  concurrency follows the **N+1 model** — `1 main thread + N background agents = N+1 total`, default
  **N=3** (4 total). The orchestrator MUST NOT self-promote above the declared N or the harness cap.
  N is adjustable per-plan and along the way: raise it only when independent work, machine capacity,
  and budget headroom all allow, and lower it under budget, runner, or disk pressure.
- **Background-slot preference**: fill background slots up to N and keep the main thread vacant and
  responsive — orchestrator, not worker. Never split dependent work merely to fill a slot.
- **Ordering is DAG-first**: independent nodes fan out up to N, dependent nodes serialize, and
  cleanup is the terminal node. The DAG's independent-node width is the fan-out — N only caps it.
  Sequence is not dependency.
- Parallelism is a **ceiling, not a target** — the scheduler runs fewer nodes when the ready set is
  smaller or when resource conflicts force serialization.
- **Status heartbeat**: when the main thread has no useful work left and only polls non-CI
  background nodes, update the user every **5 minutes**, even when no state changed. While useful
  orchestration continues, report milestones normally. CI keeps its separate 2-minute status-read
  cadence. See
  [Task List Discipline §Standard 6](../../../development/practice/task-list-discipline.md).
- **Delivery is one natural unit per mode-specific integration**: under `*-to-pr`, each independent
  node gets one branch and one PR, opened and merged as its boundary completes. Under a permitted
  direct mode, it gets one direct integration checkpoint. Do not integrate at every phase or batch
  ready units at plan end. Worktree modes reuse at most one worktree per repository per plan; main
  modes use the primary checkout and provision none, per
  [Plans Organization Convention §Worktree Cap](../../../conventions/structure/plans/worktree-cap.md#worktree-cap--one-worktree-per-repository-per-plan-hard-rule).
