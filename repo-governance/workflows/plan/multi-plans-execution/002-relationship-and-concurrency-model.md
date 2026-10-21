---
description: What this workflow inherits vs. adds relative to plan-execution.md, and the worktree-lock, HIPPO-admission, and status-cadence rules bounding a run.
when_to_use: Use when unsure whether a rule belongs here or in plan-execution.md, or when setting/reasoning about overlap.
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

## Overlap Model (no thread count)

There is no `1 + N` thread budget. Overlap is bounded by two things only, exactly as for one plan:
the **worktree locks** and **HIPPO admission** for compute. The orchestrator stays responsive by
delegating item work; it never counts threads or promotes a numeric ceiling. See
[Guarded Admission and Parallelism](../../../development/practice/resource-aware-development/guarded-admission-and-parallelism.md).

- **Worktree caps (defaults `1` and `1`; only the user may raise them; global across machines).**
  Each plan holds at most `max-worktrees-per-plan-repo` worktrees per repository (**default `1`**),
  and at most `max-active-worktrees` worktree nodes are active at once across the run (**default
  `1`**, so one per plan by default). Both caps bind **globally**: before starting a worktree node,
  prove from the plan's lease, its remote branch, and its open PRs that no other run on any machine
  holds that plan — the local `git worktree list` alone proves nothing about other machines. Raise
  either cap only when the user's invocation explicitly says so; the scheduler never self-promotes.
  A `git worktree add` beyond the effective cap is a defect.
- **HIPPO admits compute; read its pressure, never guess it.** Every compute-bearing node runs
  through one outer boundary from its worktree root: `rtk ./hippo run --class
<transactional|ephemeral> --resource-tier <light|standard|heavy> --disk-path . -- <command>`. Use
  `transactional` for writers (`npm install`, toolchain provision) and `ephemeral` for checks, tests,
  and builds. `npm run <script>` is already guarded — never wrap it again; `npm install` and
  `npm exec` do take the outer boundary. Before heavy work, read `./hippo status` (state/reason,
  free memory, CPU, owners, waiters). **If HIPPO is full, queue — never give up and never bypass.**
  Keep the node queued and retry the same guarded command until admission; a `capacity-deferred`
  result is never a failure, changes timing only, and never licenses a bare unguarded command.
- **Ordering is DAG-first**: independent nodes in different worktrees (or with no worktree) may
  overlap when HIPPO admits them; dependent nodes and nodes sharing a worktree serialize, and
  cleanup is each plan's terminal node. Sequence is not dependency.
- **Status heartbeat (every 20 minutes, unprompted)**: during active execution, send a user-visible
  update at least every **20 minutes**, even when no state changed, plus at each phase boundary and
  terminal state. Every update carries five lines: (1) **weighted progress** for the whole run so far,
  (2) **steps left** in grand-scheme order, (3) **blockers needing human intervention**,
  (4) **decisions needed from the user**, and (5) **when the next `[HUMAN]` step is required** (time or
  condition, or "none expected before \<milestone\>"). Weights come from each plan's `delivery.md` when
  it declares them (per outcome or phase); otherwise every node weighs `1`. Weighted progress is
  `sum(weights of completed nodes) / sum(weights of all nodes)`. State the source in the first update.
  If a node is queued on HIPPO, name it here with HIPPO's reason — report only; the scheduler keeps
  queueing and never stops, quarantines, or fails a plan for deferral alone. CI keeps its separate
  2-minute status-read cadence. See
  [Task List Discipline §Standard 6](../../../development/practice/task-list-discipline.md).
- **Delivery is one natural unit per mode-specific integration**: under `*-to-pr`, each independent
  node gets one branch and one PR, opened and merged as its boundary completes. Under a permitted
  direct mode, it gets one direct integration checkpoint. Do not integrate at every phase or batch
  ready units at plan end. Worktree modes reuse at most one worktree per repository per plan; main
  modes use the primary checkout and provision none, per
  [Plans Organization Convention §Worktree Cap](../../../conventions/structure/plans/worktree-cap.md#worktree-cap--one-worktree-per-repository-per-plan-hard-rule).
