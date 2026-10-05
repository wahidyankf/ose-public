---
description: Indexes end-to-end plan execution across per-topic children.
when_to_use: Use when executing a plan or locating one execution step.
---

# Plan Execution Workflow

**Purpose**: Execute a plan, validate it in at most three cycles, archive to `plans/done/`.

> **Pre-Execution Requirement**: invoke `grill-me` first, per
> [Grilling-With-Options](../../development/workflow/grilling-with-options.md).

## Goal and Termination

**Goal**: Execute a project plan, validate its completion and quality, then repair and re-validate for at most three cycles until all requirements are met and archive to plans/done/

**Termination**: End-to-end requirement-to-proof trace is complete, no blocking finding remains, and plan moved to done/

## Inputs

- **`plan-path`** (string, required) — Path to the plan file to execute (e.g., "plans/in-progress/new-feature/plan.md")
- **`max-cycles`** (number, optional, `1`, `2`, or `3`, default `3`) — Maximum number of execute-check cycles; any other value refuses to start
- **`max-concurrency`** (number, optional, default `3`) — Background agents run concurrently — the N in the N+1 model (1 main thread + N background agents = N+1 total). Raise only when independent work, machine capacity, and budget headroom all allow; lower under budget, runner, or disk pressure. Never self-promoted beyond the declared value.

## Outputs

- **`final-status`** (enum: pass, partial, fail) — Final execution and validation status
- **`cycles-completed`** (number) — Number of execute-check cycles performed
- **`final-report`** (file, pattern `local-tmp/plan-execution/plan-execution__*__validation.md`) — Final validation report from plan-execution-checker

## Contents

- [Execution Mode](./plan-execution/001-execution-mode.md) — orchestrator role.
- [How to Execute](./plan-execution/002-how-to-execute.md) — 12 actions through complete three-class cleanup.
- [Orchestration Model](./plan-execution/003-orchestration-model.md) — delegation rule.
- [Agent Selection](./plan-execution/004-agent-selection.md) — picking heuristics.
- [Fan-Out Shape](./plan-execution/005-fan-out-ordering-and-delivery-shape.md) — N+1, DAG.
- [Tester Gates](./plan-execution/006-surface-conditional-tester-gates.md) — per-surface.
- [Vercel MCP](./plan-execution/007-vercel-mcp-availability.md) — Phase 0 check.
- [Task-Checklist Sync](./plan-execution/008-task-checklist-synchronization.md) — strict action-level
  1:1 mapping, reconstructed even on first mid-run invocation or reinvocation.
- [Harness Task List](./plan-execution/009-harness-task-list-primary-observability-surface.md) — invariants.
- [Sync Ritual](./plan-execution/010-atomic-sync-ritual.md) — tick/notes/update.
- [Resume Reconciliation](./plan-execution/011-resume-reconciliation.md) — disk truth.
- [Iron Rules 1-5](./plan-execution/012-iron-rules-1-5.md) — task tracking.
- [Iron Rules 6-11](./plan-execution/013-iron-rules-6-11.md) — file-touch ledger.
- [Preconditions](./plan-execution/014-enter-worktree-preconditions-and-work-branch.md) — branch precedence.
- [Delivery-Mode](./plan-execution/015-enter-worktree-delivery-mode-resolution.md) — mode precedence.
- [Locate/Provision](./plan-execution/016-enter-worktree-locate-and-provision.md) — auto-provision.
- [Freshness Gate](./plan-execution/017-enter-worktree-freshness-gate.md) — pull latest.
- [Secrets/Rationale](./plan-execution/018-enter-worktree-secrets-output-and-rationale.md) — infra ops.
- [Load Checklist](./plan-execution/019-load-delivery-checklist-and-task-list.md) — task materialize.
- [Environment Setup](./plan-execution/020-environment-setup.md) — Phase 0.
- [Execution Loop](./plan-execution/021-initial-execution-loop.md) — items 1-4.
- [Verify/Sync](./plan-execution/022-initial-execution-items-5-8.md) — items 5-8.
- [Progress/Stopping](./plan-execution/023-initial-execution-progress-and-stopping-rules.md) — item 9.
- [Gates](./plan-execution/024-per-phase-quality-gate-gates.md) — Phase N Gate.
- [Push Targets](./plan-execution/025-per-phase-quality-gate-push-targets.md) — mode push.
- [Phase 0/Merging](./plan-execution/026-per-phase-quality-gate-phase0-and-boundary-merging.md) — boundary merge.
- [Cleanup Check](./plan-execution/027-per-phase-quality-gate-cleanup-and-invariant.md) — boundary assert.
- [CI Overview](./plan-execution/028-post-push-ci-verification-overview.md) — monitoring tool.
- [CI Direct-Push](./plan-execution/029-post-push-ci-verification-direct-push.md) — main CI.
- [CI PR-Branch](./plan-execution/030-post-push-ci-verification-pr-branch.md) — PR checks.
- [Assertions Web/API](./plan-execution/031-manual-behavioural-assertions-web-and-api.md) — Real-browser, HTTP curl, and non-HTTP native-client proof.
- [Assertions Evidence](./plan-execution/032-manual-behavioural-assertions-full-stack-and-evidence.md) — full-stack.
- [Validation](./plan-execution/033-validation-and-check-for-findings.md) — checker run.
- [Continue Execution](./plan-execution/034-continue-execution.md) — fix findings.
- [Re-validate](./plan-execution/035-revalidate-and-iteration-control.md) — loop/terminate.
- [Pre-Archival Gates](./plan-execution/036-finalization-pre-archival-gates.md) — rule-15.
- [Rule-16 Retest](./plan-execution/037-finalization-rule16-api-retest.md) — API retest.
- [Knowledge Capture](./plan-execution/038-finalization-knowledge-capture.md) — learnings.md.
- [Finalization and Archival — End-to-End Delivery Completeness Audit](./plan-execution/039-finalization-end-to-end-completeness-audit.md) — Reconciles the full plan from its first requirement through final proof before completion can be declared. Use preliminarily after pre-archival gates pass, then repeat terminally after the final delivery is pushed or merged and before assigning pass.
- [PR CI Gate](./plan-execution/040-finalization-pr-ci-gate.md) — exact-head/base evidence and optional review.
- [Status/Infra Gate](./plan-execution/041-finalization-status-logic-and-infra-gate.md) — pass/fail.
- [Cleanup/Archival](./plan-execution/042-finalization-worktree-cleanup-and-pr-archival.md) — archival-in-PR.
- [PR Merge/Status](./plan-execution/043-finalization-pr-merge-and-final-status.md) — merge/cleanup.
- [Task Rules](./plan-execution/045-task-management-rules-and-termination.md) — termination.
- [Example Usage](./plan-execution/046-example-usage-and-iteration-example.md) — invocations.
- [Safety Features](./plan-execution/047-safety-features-and-plan-specific-validation.md) — checker scope and complete cleanup safety.
- [Related Workflows](./plan-execution/048-related-workflows-and-success-metrics.md) — metrics.
- [Notes](./plan-execution/049-notes.md) — characteristics.
- [TDD/Principles](./plan-execution/050-tdd-principles-conventions-agents.md) — governance.
