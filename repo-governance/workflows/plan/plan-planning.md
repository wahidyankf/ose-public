---
description: Orchestrates a user prompt through repo exploration, two grill sessions, optional web research, plan-maker delegation, structural review, and the plan-quality-gate into a pushed, validated plan.
when_to_use: Use when a user describes a new behaviour, pattern, or convention to adopt and needs it turned into a validated, execution-ready plan in plans/in-progress/ or plans/backlog/.
---

# Plan Establishment Workflow

**Purpose**: Transform a user prompt into a production-ready plan in the resolved target stage
(`plans/in-progress/` by default, or `plans/backlog/`), validated by `plan-quality-gate` and
pushed to the confirmed target. A [Bug-Fix Plan](../../conventions/structure/plans/bug-fix-plan.md)
is not planned through this workflow.

## Goal and Termination

**Goal**: Create a well-researched, grill-validated project plan in the resolved target stage (plans/in-progress/ by default, or plans/backlog/ when target-stage=backlog) from a user prompt describing a desired behaviour or change, then push it to the confirmed target

**Termination**: Plan exists in the resolved target-stage directory, has a recorded plan-quality-gate verdict, and is pushed to the confirmed target

## Inputs

- **`prompt`** (string, required) — Description of the behaviour, change, or convention to adopt in the repository
- **`push-target`** (string, optional, default `origin main`) — Git push destination (e.g., 'origin main'). Confirmed in the Step 1 grill if not provided.
- **`target-stage`** (enum: in-progress, backlog, optional, default `in-progress`) — Which plans/ stage the finished plan lands in. `in-progress` (default) creates an immediately active plan at plans/in-progress/<identifier>/ (no date prefix). `backlog` creates a proposed-but-not-yet-scheduled plan at plans/backlog/<identifier>/ (no date prefix, per the Plans Organization Convention). Both stages stop at plan creation — neither executes the plan.

## Outputs

- **`plan-path`** (string) — Path to the created plan in the resolved target stage (plans/in-progress/<identifier>/ or plans/backlog/<identifier>/)
- **`final-status`** (enum: pass, partial, fail) — Final status after the quality gate
- **`final-report`** (file, pattern `local-tmp/plan/plan__*__audit.md`) — Frozen ledger returned by plan-quality-gate

## Contents

- [Stage Resolution](./plan-planning/001-stage-resolution.md) — how target-stage resolves `<plan-dir>`.
- [Execution Mode](./plan-planning/002-execution-mode.md) — direct orchestration, worktree default.
- [Planning Granularity and Mode-Specific Delivery](./plan-planning/003-planning-granularity-and-one-branch-rule.md) — one natural unit per resolved integration mechanism.
- [Merge Timing, Feature Flags, worktree-to-pr Binding](./plan-planning/004-delivery-merge-timing-flags-and-worktree-to-pr-binding.md) — when PRs merge.
- [Surface-Conditional Tester Gates](./plan-planning/005-surface-conditional-tester-gates.md) — routing table, three UI gates.
- [Vercel MCP Availability](./plan-planning/006-vercel-mcp-availability.md) — probe and boundary.
- [The Plan-Docs-Only Carve-Out (Superseded)](./plan-planning/007-plan-docs-only-carve-out.md) — retired, historical context.
- [File-Touch Ledger](./plan-planning/008-file-touch-ledger.md) — the two obligations.
- [Step 0 — Prompt Parsing and Repo Exploration](./plan-planning/009-step-0-prompt-parsing-and-repo-exploration.md) — pre-grill exploration.
- [Step 1 — First Grill](./plan-planning/010-step-1-first-grill.md) — the ten decisions.
- [Step 2 — Web Research](./plan-planning/011-step-2-web-research.md) — conditional delegation to web-researcher.
- [Step 3 — Second Grill: Post-Research Validation](./plan-planning/012-step-3-second-grill.md) — confirm direction.
- [Step 4 — Plan Creation](./plan-planning/013-step-4-plan-creation.md) — plan-maker handoff and envelope loop.
- [Step 4 — Automatic Rule-Impact Handoff](./plan-planning/014-step-4-automatic-rule-impact.md) — per-repository rules and docs propagation coverage.
- [Step 5 — Plan Review](./plan-planning/015-step-5-plan-review.md) — eleven structural checks.
- [Step 6 — Quality Gate](./plan-planning/016-step-6-plan-gate-run.md) — one of the gate's named callers.
- [Step 7 — Push and Verify](./plan-planning/017-step-7-push-and-verify.md) — commit, push, CI, and complete three-class cleanup.
- [Principles and Conventions Implemented/Respected](./plan-planning/018-principles-and-conventions.md) — the catalog entries.
- [Related Workflows and Documentation](./plan-planning/019-related-workflows-and-documentation.md) — cross-references.
