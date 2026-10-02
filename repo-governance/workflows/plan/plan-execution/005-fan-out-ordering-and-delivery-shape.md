---
description: Defines the N+1 fan-out model, DAG-first ordering, and mode-specific delivery-unit integration shape.
when_to_use: Use when planning concurrency or mapping delivery units to the resolved delivery mode's work location and integration mechanism.
---

# Fan-Out, Ordering, and Delivery Shape

**Fan-out follows the N+1 model**: `1 main thread + N background agents = N+1 total`, default
**N=3**. The orchestrator keeps the main thread vacant and responsive — filling background slots
first — and never silently self-promotes beyond the plan's declared N. See the
[Agent Workflow Orchestration Convention](../../../development/agents/agent-workflow-orchestration.md).

**Ordering is DAG-first**: the plan's `## Parallelization Model` declares which nodes are
independent. Independent nodes fan out up to N; dependent nodes serialize; **sequence is not
dependency**. The DAG's independent-node width is the fan-out — N only caps it.

**Delivery follows the resolved mode at one natural seam per unit**: each independent DAG node
**that produces changes** is one delivery unit. Under `*-to-pr`, it gets one branch and one PR,
opened and merged at its boundary. Under a permitted direct mode, it reaches one direct integration
checkpoint. A worktree mode provisions at most one worktree per repo and reuses it across units;
a main mode uses the primary checkout and provisions none
([§Worktree Cap](../../../conventions/structure/plans/worktree-cap.md#worktree-cap--one-worktree-per-repository-per-plan-hard-rule)).
A **delivery unit** is the contiguous run of phases ending at a boundary; the plan's `### Delivery
Boundaries` table names which phase reaches the mode-specific integration opportunity, and
intermediate phases pass their own gate without integrating
([§PRs Open at Delivery Boundaries](../../../conventions/structure/plans/prs-open-at-delivery-boundaries-rules.md#prs-open-at-delivery-boundaries-not-every-phase-hard-rule)).
Each unit follows one natural cohesive seam, keeps all artifacts required for internal consistency,
and leaves `main` immediately safe to deploy to production. LOC and file counts never create,
erase, or force the boundary. Incomplete behaviour requires a temporary production-disabled flag,
tests for both paths, and rollout/rollback/removal evidence. Integrate a ready unit promptly rather
than holding it to batch.
Cleanup is the terminal DAG node, so a provisioned worktree is removed only once **every** delivery
unit that used it has landed and no in-flight node still needs it — not when the first one does.
**Phase 0 is not a delivery node** — it is setup and baseline only, so it opens no PR under any
delivery mode and the earliest PR belongs to Phase 1
([§Phase 0 Opens No PR](../../../conventions/structure/plans/phase-0-opens-no-pr.md#phase-0-opens-no-pr--the-earliest-pr-is-phase-1-hard-rule)).

**Git operations stay non-destructive and self-scoped**: assume other agents and engineers share
this machine's disk, git object store, and worktrees. Never run an operation that discards a
concurrent actor's uncommitted work, and never remove a worktree or branch you did not create. See
[No Destructive Git Operations](../../../development/workflow/no-destructive-git-operations.md) and
[Worktree and Artifact Cleanup](../../../development/workflow/worktree-and-artifact-cleanup.md).

**Status heartbeat**: when the main thread has no useful work left and only polls non-CI
background work, update the user every **5 minutes**, even when no state changed. Ordinary work
uses milestone updates; CI keeps its separate 2-minute status-read cadence. See
[Task List Discipline §Standard 6](../../../development/practice/task-list-discipline.md).
