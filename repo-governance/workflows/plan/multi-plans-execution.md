---
description: Schedules several ready plans together via a dependency DAG and bounded parallelism.
when_to_use: Use when two or more gated plans should run together, not one at a time.
---

# Multi-Plans Execution Workflow

A scheduling layer over `plan-execution.md`, driving several ready plans together.

## Agent References

Each plan retains its normal specialist ownership; final implementation verification uses
[plan-execution-checker](../../../.agents/agents/plan-execution-checker.md).

## Goal and Termination

**Goal**: Execute several plans together — resolve dependencies, parallelize independent steps within bounded concurrency, drive each plan to its terminal state, and consolidate cross-plan learnings

**Termination**: Every named plan reached its delivery-mode terminal state (archived to plans/done/ or a green reviewed PR handed off) or was quarantined with a reported reason, AND cross-plan learnings were consolidated and routed to durable homes

## Inputs

- **`plans`** (selector, required) — Which plans to execute together. REQUIRED — the caller always states the scope. Accepts either form: (1) an EXPLICIT LIST of plan identifiers or paths ("planA planB planC"); or (2) a SET-SELECTOR naming a whole lifecycle bucket — `all-in-progress` (every folder in plans/in-progress/), `all-backlog` (every folder in plans/backlog/), or `all` (both) — OPTIONALLY minus an exclusion list via `except`/`--except`/"except planC planD". The selector resolves to a concrete, enumerated plan set at Phase A1 and is then frozen; it is never re-expanded mid-run. Examples: "planA planB", "all-in-progress", "all-in-progress except flaky-x", "all except planC planD".
- **`parallelism`** (number, optional, default `3`) — Maximum delivery-step nodes in flight across all plans. Caller-overridable.
- **`max-concurrency`** (number, optional, default `3`) — Background agents run concurrently — the N in the N+1 model (1 main thread + N background agents = N+1 total). The effective parallelism is min(parallelism, this, harness cap). Never self-promoted above the declared value or the harness limit.
- **`mode`** (enum: execute, plan-only, optional, default `execute`) — execute (default) runs the schedule to completion; plan-only stops after emitting the dependency DAG + parallelizability report so the caller can review the schedule before committing to it.

## Outputs

- **`per-plan-status`** (map) — Terminal status per plan — done | handed-off | quarantined | partial
- **`dag-report`** (file, pattern `local-tmp/multi-plans-execution/multi-plans-execution__*__dag.md`) — The computed dependency DAG, resource-overlap analysis, and which nodes were parallelized
- **`final-report`** (file, pattern `local-tmp/multi-plans-execution/multi-plans-execution__*__summary.md`) — Roll-up of every plan's outcome, quarantines, preexisting fixes, and the consolidated cross-plan learnings with their routing decisions

## Contents

- [Purpose & Mode](./multi-plans-execution/purpose-scope-and-execution-mode.md) — when to use, orchestrator.
- [Relationship & Concurrency](./multi-plans-execution/relationship-and-concurrency-model.md) — inherited vs. added.
- [Phase A — Scope](./multi-plans-execution/phase-a-scope-and-nodes.md) — A1-A3.
- [Phase A — Frozen Scope Recovery](./multi-plans-execution/phase-a-frozen-scope-recovery.md) — durable selection and promotion state.
- [Phase A — Edges](./multi-plans-execution/phase-a-edges-report-and-diagram.md) — A4-A7.
- [Phase B — Tasks](./multi-plans-execution/phase-b-union-task-list.md) — B1-B5.
- [Phase C — Scheduler](./multi-plans-execution/phase-c-ready-queue-scheduler.md) — C1-C6.
- [Phase D — Lifecycle](./multi-plans-execution/phase-d-lifecycle-and-failure-isolation.md) — D1-D4.
- [Phase D — Capture](./multi-plans-execution/phase-d-knowledge-capture-and-finalization.md) — D5-D6.
- [Iron Rules & Termination](./multi-plans-execution/iron-rules-and-termination-criteria.md) — 8 rules.
- [Example Usage](./multi-plans-execution/example-usage.md) — six patterns.
- [Safety & Related](./multi-plans-execution/safety-related-workflows-and-principles.md) — guardrails, links.
- [Conventions & Notes](./multi-plans-execution/conventions-and-notes.md) — governance, recap.
