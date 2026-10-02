---
description: Covers C1-C6 — computing the ready set, filling to the concurrency ceiling, work-location isolation, executing a node, looping, and streaming status.
when_to_use: Use when implementing or debugging the core scheduling loop that pulls ready nodes and drives each plan through its lifecycle.
---

# Phase C — Ready-Queue Scheduler (Continuous, Bounded Parallel)

The scheduler is the core loop. It repeatedly fills up to the effective-concurrency ceiling with
non-conflicting ready nodes and drives each through its per-plan lifecycle.

**C1. Compute the ready set.** A node is **ready** when: (a) all its DAG predecessors are `completed`;
(b) it is `[AI]` (a `[HUMAN]`/`[AI+HUMAN]` node is surfaced to the user and parks that plan's chain
until the human confirms — other plans keep running); and (c) its resource-set does **not** intersect
any currently in-flight node's resource-set (the resource-conflict guard).

**C2. Fill up to the ceiling.** Pull ready nodes into execution until `min(parallelism,
max-concurrency, harness cap)` are in flight. Prefer nodes on the **critical path** (longest
remaining chain) first, so the overall run finishes sooner; break ties by plan id for determinism.

**C3. Declared work-location locks make parallelism safe.** Each `worktree-to-*` plan has its own
`worktrees/<plan-id>/` lock. All `main-to-*` plans in one repository share the primary-checkout lock
and therefore serialize there. File, project, and byte-identity resources still guard logical and
merge-time conflicts. On the first node, provision a worktree or sync the primary checkout as the
selected mode requires. A1 has already promoted backlog-sourced plans, so nodes resolve under
`plans/in-progress/`. Follow [`plan-execution.md` Step
0](../plan-execution/014-enter-worktree-preconditions-and-work-branch.md), including toolchain setup.

**C4. Execute a node = one step of that plan's `plan-execution.md` lifecycle.** Delegate the node to
its selected agent, then run the Atomic Sync Ritual (B3). When a node completes a **phase boundary**,
run that plan's [per-phase quality gate](../plan-execution/024-per-phase-quality-gate-gates.md),
[post-push CI verification](../plan-execution/028-post-push-ci-verification-overview.md),
and [manual behavioural assertions](../plan-execution/031-manual-behavioural-assertions-web-and-api.md)
exactly as the single-plan workflow prescribes — these are that plan's own gates, unaffected by other
plans in flight.

**C5. Loop.** After any node completes (or a plan reaches a `[HUMAN]` gate, or a node fails), recompute
the ready set (C1) and refill (C2). Continue until every plan has reached a terminal state.

**C6. Streaming.** After each node and at every phase boundary, emit a one-line user-visible status:
which plans are in flight, nodes ticked / total per plan, and any preexisting fixes — so the parallel
schedule is legible in real time.
