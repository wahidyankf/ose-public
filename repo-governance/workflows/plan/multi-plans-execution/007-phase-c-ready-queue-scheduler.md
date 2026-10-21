---
description: Covers C1-C6 — computing the ready set, filling under worktree locks and HIPPO, work-location isolation, executing a node, looping with DAG-drift adaptation, and streaming status.
when_to_use: Use when implementing or debugging the core scheduling loop that pulls ready nodes and drives each plan through its lifecycle.
---

# Phase C — Ready-Queue Scheduler (Continuous, Bounded Overlap)

The scheduler is the core loop. It repeatedly fills ready nodes under the worktree locks and HIPPO
admission and drives each through its per-plan lifecycle.

**C1. Compute the ready set.** A node is **ready** when: (a) all its DAG predecessors are `completed`;
(b) it is `[AI]` (a `[HUMAN]`/`[AI+HUMAN]` node is surfaced to the user and parks that plan's chain
until the human confirms — other plans keep running); (c) its resource-set does **not** intersect
any currently in-flight node's resource-set (the resource-conflict guard); and (d) this run still
holds the plan's lease at its current generation — re-read the issue record before starting any
worktree node, and if an override superseded the generation, start nothing and hand over per
[Frozen Scope Recovery](./004-phase-a-frozen-scope-recovery.md).

**C2. Fill ready nodes — `max-active-worktrees` at a time (default `1`).** Pull ready nodes into execution
subject to the worktree locks and HIPPO admission, **with at most `max-active-worktrees`
`worktree-to-*` node among them** unless the invocation explicitly allowed more worktrees (see
[Concurrency Model](./002-relationship-and-concurrency-model.md)). Prefer nodes on the **critical path**
(longest remaining chain) first, so the overall run finishes sooner; break ties by plan id for
determinism. Cross-repository resource-heavy worktree provisioning, toolchain setup, builds, and
validation are compute nodes admitted by HIPPO under their declared workload class; a deferral changes
timing, never dependency order.

**C3. Declared work-location locks make overlap safe.** Each `worktree-to-*` plan names its own
`worktrees/<plan-id>/` lock, and `max-active-worktrees` (default `1`) bounds how many hold at once
unless the user allowed more. All `main-to-*` plans in one repository share the primary-checkout lock
and therefore serialize there. File and project resources still guard logical and merge-time conflicts.
On the first node, provision a worktree or sync the primary checkout as the selected mode requires. The
Phase A promotion gate has already landed backlog-sourced plans on `origin/main`, so nodes resolve under
`plans/in-progress/`. Follow [`plan-execution.md` Step
0](../plan-execution/014-enter-worktree-preconditions-and-work-branch.md), including toolchain setup.

**C4. Execute a node = one step of that plan's `plan-execution.md` lifecycle.** Delegate the node to
its selected agent, then run the Atomic Sync Ritual (B3). When a node completes a **phase boundary**,
run that plan's [per-phase quality gate](../plan-execution/024-per-phase-quality-gate-gates.md),
[post-push CI verification](../plan-execution/028-post-push-ci-verification-overview.md),
and [manual behavioural assertions](../plan-execution/031-manual-behavioural-assertions-web-and-api.md)
exactly as the single-plan workflow prescribes — these are that plan's own gates, unaffected by other
plans in flight.

**C5. Loop — and adapt when the DAG moves.** After any node completes (or a plan reaches a `[HUMAN]`
gate, or a node fails), recompute the ready set (C1) and refill (C2). Continue until every plan has
reached a terminal state. **The DAG can change mid-run; adjust before it collides.** At every phase
boundary and before starting a worktree node, fetch `origin` and compare the Plan Order DAG in
`plans/README.md` and each in-scope plan's `Depends-on:` against the confirmed execution DAG. Such a
change arrives through a reviewed, merged PR, so treat it as authoritative — never wait to crash into
it. If it touches only out-of-scope plans, note it in the heartbeat and keep the frozen scope. If it
adds, removes, or reorders an edge among in-scope plans, recompute the affected edges and ready set,
record the change in the progress ledger, and re-confirm with the user **only** when it newly blocks
a ready node or invalidates confirmed overlap; otherwise apply it and report it in the next
heartbeat. Completed nodes are never rewound.

**C6. Streaming and the 20-minute heartbeat.** After each node and at every phase boundary, emit a
one-line user-visible status: which plans are in flight, nodes ticked / total per plan, and any
preexisting fixes. Independently, send the five-line heartbeat from the
[Concurrency Model](./002-relationship-and-concurrency-model.md) at least every **20 minutes** without
being asked (weighted progress, steps left, blockers, decisions, next `[HUMAN]` timing).
