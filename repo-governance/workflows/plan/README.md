---
description: "Orchestrated workflows for plan creation, quality validation, and execution — from idea to archived delivery."
when_to_use: Use when routing to a workflow that authors, validates, executes, or takes over a project plan.
---

# Plan Workflows

Use these workflows to turn an idea into a well-grounded, checkable delivery plan, then carry it through execution without losing the evidence behind each decision.

## Purpose

These workflows define **WHEN and HOW to establish, validate, and execute plans**. The
plan-establishment workflow orchestrates the full prompt-to-pushed-plan lifecycle (repo
exploration → grill → research → plan-maker → quality gate → push). The plan-quality-gate
workflow delegates a read-only `plan-checker` sweep and repairs its own ledger. The
plan-execution workflow is orchestrated directly by the calling context (which delegates
per-item work to specialized agents) and invokes `plan-execution-checker` for independent
validation at the end.

## Scope

**✅ Workflows Here:**

- Plan quality validation
- Plan execution tracking
- Iterative plan improvement
- Multi-agent orchestration for plans/
- Check-fix-verify and execution cycles

**❌ Not Included:**

- Content quality validation (that's docs/)
- ayokoding-web content validation (that's ayokoding-web/)
- Single-agent operations (use agents directly)

## Workflows

- [plan-planning](./plan-planning.md) — Orchestrates a user prompt through repo exploration, two grill sessions, optional web research, plan-maker delegation, structural review, and the plan-quality-gate into a pushed, validated plan. Use when a user describes a new behaviour, pattern, or convention to adopt and needs it turned into a validated, execution-ready plan in plans/in-progress/ or plans/backlog/.
- [plan-backlog-grooming](./plan-backlog-grooming.md) — Reviews every formal plan in the backlog root and drives each to still-valid, needs-revision, or removal. Use before selecting the next plan to execute, or when the backlog has aged enough that its assumptions are suspect.
- [plan-handover-and-takeover](./plan-handover-and-takeover.md) — Writes a resumable handover record before unfinished plan work changes hands, and on resumption discovers, adopts, and cleans up every trace of the plan so execution resumes. Use when unfinished plan work passes to another session, agent, or person, or when resuming a plan that may already be partly worked.
- [plan-execution](./plan-execution.md) — Executes a project plan end-to-end — orchestration, delegation, quality gates, iteration, archival — split into per-topic children. Use when executing a plan, or looking up one step (worktree entry, a quality gate, finalization) of that execution.
- [plan-execution-check](./plan-execution-check.md) — Evaluates finished execution in a fixed order and records the terminal verdict that permits or blocks archival. Use once every substantive delivery item is terminal, before a plan is archived.
- [multi-plans-execution](./multi-plans-execution.md) — Schedules several ready plans together via a dependency DAG and bounded parallelism. Use when two or more gated plans should run together, not one at a time.
- [plan-multi-repo-parity-planning](./plan-multi-repo-parity-planning.md) — Authors aligned-but-divergent plans across sibling repos, grilling every deviation to a decision. Use when a change spans sibling repos and drift between them must not be silent.
- [plan-quality-gate](./plan-quality-gate.md) — Governance gate producing exactly one terminal verdict on a formal plan's semantic readiness, from a frozen ledger repaired in at most two cycles. Use only when the user explicitly names it, or from one of its three named callers.
- [plan-ideas-grooming](./plan-ideas-grooming.md) — Sweeps plans/ideas/ across repos, deduplicating, classifying into Eisenhower quadrants, and correcting cross-repo residency. Use when a repo's plans/ideas/ exceeds 60 files or 90 days have passed since the last grooming run.

## Orchestration Model Shared by These Workflows

Every workflow in this directory fans out under the **N+1 model** — `1 main thread + N background
agents = N+1 total`, default **N=3**, with the main thread kept vacant as orchestrator. Ordering is
**DAG-first**: a plan's `## Parallelization Model` declares which nodes are independent, independent
nodes fan out up to N, and dependent nodes serialize — sequence is not dependency. Delivery is
one natural unit per mode-specific integration. Under `*-to-pr`, each independent node gets one
branch and one PR at its boundary; under a permitted direct mode, it gets one direct checkpoint.
Worktree modes reuse at most one worktree per repository per plan; main modes use none. Cleanup is
the DAG's terminal node. See
[Plans Organization Convention §Worktree Cap](../../conventions/structure/plans/worktree-cap.md#worktree-cap--one-worktree-per-repository-per-plan-hard-rule).

## Related Documentation

- [Workflows Index](../README.md) - All orchestrated workflows
- [Plans Organization Convention](../../conventions/structure/plans.md) - Plan structure standards
- [Agent Workflow Orchestration Convention](../../development/agents/agent-workflow-orchestration.md) - The N+1 model, DAG-first ordering, and background-slot preference these workflows inherit
- [No Destructive Git Operations](../../development/workflow/no-destructive-git-operations.md) - Forbidden operations on the shared machine and the non-destructive equivalent for each
- [Worktree and Artifact Cleanup](../../development/workflow/worktree-and-artifact-cleanup.md) - The post-merge cleanup gate across worktrees, branches, and build output
- [Maker-Checker-Fixer Pattern](../../development/pattern/maker-checker-fixer.md) - Core workflow pattern
- [Repository Architecture](../../repository-governance-architecture.md) - Six-layer governance model
- [Grilling-With-Options Convention](../../development/workflow/grilling-with-options.md) - Every
  grill question must present 2-4 concrete options; open-ended questions are forbidden
