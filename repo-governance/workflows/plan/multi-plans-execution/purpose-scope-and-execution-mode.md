---
description: What multi-plans-execution does, when (not) to use it, its pre-execution grill requirement, and who orchestrates it.
when_to_use: Use when deciding whether to run several ready plans together, and who owns the DAG, Task list, and scheduler.
---

# Purpose, Scope, and Execution Mode

**Purpose**: Execute several project plans in one coordinated run. This workflow is a **scheduling
layer on top of** [`plan-execution.md`](../plan-execution.md): it does not re-implement per-plan
delivery logic. It (1) resolves the caller's scope — an explicit plan list or a set-selector
(`all-in-progress` / `all-backlog` / `all`, optionally minus an `except` list) — to a frozen plan
set, (2) builds a dependency DAG that decides
what must be sequenced and what is safe to parallelize, (3) materializes one very-granular Task list
covering **every** delivery-checklist item across all plans, and (4) runs a bounded ready-queue
scheduler that pulls independent delivery-step nodes and drives each plan through its full
per-plan lifecycle (declared work location → gates → CI → validation → current-head leak review →
merge/handoff → archival), exactly as `plan-execution.md` does for one plan, and
(5) after all plans finish, runs one **cross-plan learnings solidification** pass so the recurring and
portfolio-level signal the plans produced _together_ reaches a durable home instead of being stranded
in each archived plan folder.

**When to use**:

- You have two or more ready plans (each already passed [`plan-quality-gate`](../plan-quality-gate.md))
  and want them driven together instead of one-at-a-time.
- The plans are partly independent, so parallelizing their delivery steps saves wall-clock.
- You want a single live observability surface showing all plans' progress at once, with clear
  marking of which work is running in parallel.

**When NOT to use**:

- A single plan → use [`plan-execution.md`](../plan-execution.md) directly.
- Plans that have not passed `plan-quality-gate` → gate them first; this workflow refuses to execute
  an unvetted plan (see Phase A).

> **Pre-Execution Requirement**: Before scheduling, invoke the `grill-me` skill
> (`.agents/skills/grill-me/SKILL.md`) to stress-test any unresolved cross-plan ordering assumptions
> (e.g., "does B really depend on A's shipped behaviour, or only on a file they happen to share?").
> Every question presents 2–4 concrete options per the
> [Grilling-With-Options Convention](../../../development/workflow/grilling-with-options.md).

## Execution Mode

**Direct Orchestration** — the calling context (top-level assistant session) is the orchestrator, as
in `plan-execution.md`. It owns the dependency DAG, the union Task list, and the ready-queue
scheduler. For each ready node it delegates the actual delivery work to the appropriate specialized
agent via the Agent tool, using the **identical Agent Selection rules** defined in
[`plan-execution.md` §Agent Selection](../plan-execution/agent-selection.md) (suggested-executor
annotation → project/app → file extension → content type → framework → direct execution).

The orchestrator invokes `plan-execution-checker` as a delegated agent for each plan's independent
validation, and requires one exact-current-head `pr-leak-review` pass for each `*-to-pr` plan;
broad semantic review remains explicit-only. The only thing this workflow adds is the **scheduling of
those per-plan steps across plans**.
