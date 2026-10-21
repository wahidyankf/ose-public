---
description: Schedules several ready plans together via a dependency DAG bounded by worktree locks and HIPPO admission.
when_to_use: Use when two or more ready plans should run together, not one at a time.
---

# Multi-Plans Execution Workflow

**Purpose**: Run several plans to the delivered state `plan-execution.md` defines for one, plus scheduling and cross-plan learnings. Only the scheduling layer is new; every per-plan rule is inherited unchanged.

> **Pre-Execution Requirement**: invoke `grill-me` first, per [Grilling-With-Options](../../development/workflow/grilling-with-options.md) — here it stress-tests unresolved cross-plan ordering assumptions before scheduling.

## Agent References

Each plan retains its normal specialist ownership; final implementation verification uses
[plan-execution-checker](../../../agents/plan-execution-checker.md).

## Goal and Termination

**Goal**: Take several plan documents together to the same proven delivered state as `plan-execution.md` defines for one — requirements traced to proof, execution-checked, delivered, archived, cleaned up, learnings routed — scheduling their steps under the confirmed DAG, the worktree locks, and HIPPO admission, then consolidating what they taught together. This workflow adds only scheduling; no per-plan bar moves.

**Termination** — each plan ends in its single-plan state (`pass`, `handed-off`, `partial`, or quarantined on a hard blocker; see `plan-execution.md`), cleaned up as soon as it passes, and the run ends in exactly one state:

- **`pass`**: every plan is `pass` (archived, cleaned, learnings routed) or `handed-off` only where its own step requires a `[HUMAN]` merge, **and** cross-plan learnings are consolidated with no theme left undecided. The summary lists each handed-off plan's pending merge and deferred cleanup.
- **`partial`**: at least one plan is `partial` or quarantined while others finished. Independent plans still complete and clean up; the summary names each held plan and its reason.
- **`fail`**: no schedule could be built — a cyclic `Depends-on` or a named plan missing. No node ran.

Per-plan `pass` is permitted only by the [Execution Check](plan-execution-check.md) through `plan-execution-checker`, exactly as for one plan. This workflow never runs the [Plan Quality Gate](../quality/plan-quality-gate.md); verdicts stay advisory history.

## Inputs

- **`plans`** (selector, required) — Plans to run together: an explicit list (`"planA planB"`) or a bucket selector (`all-in-progress`, `all-backlog`, `all`, each optionally minus `except <ids>`). Resolved once at Phase A1, then frozen; never re-expanded.
- **`run-issue`** (number, optional) — Existing run-record Issue to resume/take over (e.g. `run-issue: 123`). Given: use as-is, never create anew. Omitted: fresh run creates its own claim issue. Must bind the same frozen set and SHA, or stop. See [Frozen Scope Recovery](./multi-plans-execution/004-phase-a-frozen-scope-recovery.md).
- **`max-cycles`** (number, optional, `1`–`3`, default `3`) — Maximum execute-check cycles **per plan**, exactly as in `plan-execution.md`; any other value refuses to start.
- **`max-worktrees-per-plan-repo`** (number, optional, default `1`) — Worktrees one plan may hold per repository, as in `plan-execution.md`. Only the user's explicit invocation may raise it.
- **`max-active-worktrees`** (number, optional, default `1`) — Worktree nodes active at once across the run (so `1` per plan by default). Only the user's explicit invocation may raise it, and only as far as HIPPO admits.
- **`mode`** (enum: execute, plan-only, optional, default `execute`) — In every mode the run stops after the Phase A DAG report until the user explicitly **confirms the DAG**; `execute` (default) then runs the confirmed schedule to completion, `plan-only` ends without scheduling.

## Outputs

- **`per-plan-status`** (map) — Per-plan terminal state, mirroring single-plan `final-status` (`pass` archived, `handed-off` awaiting `[HUMAN]` merge, `quarantined` hard-blocked, `partial` findings left). Run state follows [Iron Rules & Termination](./multi-plans-execution/010-iron-rules-and-termination-criteria.md).
- **`dag-report`** (file, pattern `local-tmp/multi-plans-execution/multi-plans-execution__*__dag.md`) — The computed dependency DAG, resource-overlap analysis, and which nodes overlap
- **`progress-ledger`** (file, pattern `local-tmp/multi-plans-execution/multi-plans-execution__*__progress.md`) — Live takeover record for the whole run: node states, weighted progress, worktrees, branches, PRs, cleanups, blockers, decisions, and next `[HUMAN]` timing. Updated after every transition; see [Frozen Scope Recovery](./multi-plans-execution/004-phase-a-frozen-scope-recovery.md).
- **`final-report`** (file, pattern `local-tmp/multi-plans-execution/multi-plans-execution__*__summary.md`) — Roll-up of every plan's outcome, quarantines, preexisting fixes, and the consolidated cross-plan learnings with their routing decisions

## Contents

- [Purpose & Mode](./multi-plans-execution/001-purpose-scope-and-execution-mode.md) — when to use, orchestrator.
- [Relationship & Concurrency](./multi-plans-execution/002-relationship-and-concurrency-model.md) — inherited vs. added.
- [Phase A — Scope](./multi-plans-execution/003-phase-a-scope-and-nodes.md) — A1-A3.
- [Phase A — Frozen Scope Recovery](./multi-plans-execution/004-phase-a-frozen-scope-recovery.md) — durable selection and promotion state.
- [Phase A — Edges](./multi-plans-execution/005-phase-a-edges-report-and-diagram.md) — A4-A7.
- [Phase B — Tasks](./multi-plans-execution/006-phase-b-union-task-list.md) — B1-B5.
- [Phase C — Scheduler](./multi-plans-execution/007-phase-c-ready-queue-scheduler.md) — C1-C6.
- [Phase D — Lifecycle](./multi-plans-execution/008-phase-d-lifecycle-and-failure-isolation.md) — D1-D4.
- [Phase D — Capture](./multi-plans-execution/009-phase-d-knowledge-capture-and-finalization.md) — D5-D6.
- [Iron Rules & Termination](./multi-plans-execution/010-iron-rules-and-termination-criteria.md) — 8 rules.
- [Example Usage](./multi-plans-execution/011-example-usage.md) — six patterns.
- [Safety & Related](./multi-plans-execution/012-safety-related-workflows-and-principles.md) — guardrails, links.
- [Conventions & Notes](./multi-plans-execution/013-conventions-and-notes.md) — governance, recap.
