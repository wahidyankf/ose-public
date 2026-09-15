---
description: Indexes end-to-end plan execution across per-topic children.
when_to_use: Use when executing a plan or locating one execution step.
---

# Plan Execution Workflow

**Purpose**: Execute a plan, iterate to zero findings, archive to `plans/done/`.

> **Pre-Execution Requirement**: invoke `grill-me` first, per
> [Grilling-With-Options](../../development/workflow/grilling-with-options.md).

## Goal and Termination

**Goal**: Execute a project plan, validate its completion and quality, then iteratively continue until all requirements are met and archive to plans/done/

**Termination**: End-to-end requirement-to-proof trace is complete, zero findings remain, and plan moved to done/

## Inputs

- **`plan-path`** (string, required) — Path to the plan file to execute (e.g., "plans/in-progress/new-feature/plan.md")
- **`max-iterations`** (number, optional, default `10`) — Maximum number of execute-check cycles to prevent infinite loops
- **`max-concurrency`** (number, optional, default `3`) — Background agents run concurrently — the N in the N+1 model (1 main thread + N background agents = N+1 total). Raise only when independent work, machine capacity, and budget headroom all allow; lower under budget, runner, or disk pressure. Never self-promoted beyond the declared value.

## Outputs

- **`final-status`** (enum: pass, partial, fail) — Final execution and validation status
- **`iterations-completed`** (number) — Number of execute-check cycles performed
- **`final-report`** (file, pattern `local-tmp/plan-execution/plan-execution__*__validation.md`) — Final validation report from plan-execution-checker

## Contents

- [Execution Mode](./plan-execution/execution-mode.md) — orchestrator role.
- [How to Execute](./plan-execution/how-to-execute.md) — 12 actions through complete three-class cleanup.
- [Orchestration Model](./plan-execution/orchestration-model.md) — delegation rule.
- [Agent Selection](./plan-execution/agent-selection.md) — picking heuristics.
- [Fan-Out Shape](./plan-execution/fan-out-ordering-and-delivery-shape.md) — N+1, DAG.
- [Tester Gates](./plan-execution/surface-conditional-tester-gates.md) — per-surface.
- [Vercel MCP](./plan-execution/vercel-mcp-availability.md) — Phase 0 check.
- [Task-Checklist Sync](./plan-execution/task-checklist-synchronization.md) — strict action-level
  1:1 mapping, reconstructed even on first mid-run invocation or reinvocation.
- [Harness Task List](./plan-execution/harness-task-list-primary-observability-surface.md) — invariants.
- [Sync Ritual](./plan-execution/atomic-sync-ritual.md) — tick/notes/update.
- [Resume Reconciliation](./plan-execution/resume-reconciliation.md) — disk truth.
- [Iron Rules 1-5](./plan-execution/iron-rules-1-5.md) — task tracking.
- [Iron Rules 6-11](./plan-execution/iron-rules-6-11.md) — file-touch ledger.
- [Preconditions](./plan-execution/enter-worktree-preconditions-and-work-branch.md) — branch precedence.
- [Delivery-Mode](./plan-execution/enter-worktree-delivery-mode-resolution.md) — mode precedence.
- [Locate/Provision](./plan-execution/enter-worktree-locate-and-provision.md) — auto-provision.
- [Freshness Gate](./plan-execution/enter-worktree-freshness-gate.md) — pull latest.
- [Secrets/Rationale](./plan-execution/enter-worktree-secrets-output-and-rationale.md) — infra ops.
- [Load Checklist](./plan-execution/load-delivery-checklist-and-task-list.md) — task materialize.
- [Environment Setup](./plan-execution/environment-setup.md) — Phase 0.
- [Execution Loop](./plan-execution/initial-execution-loop.md) — items 1-4.
- [Verify/Sync](./plan-execution/initial-execution-items-5-8.md) — items 5-8.
- [Progress/Stopping](./plan-execution/initial-execution-progress-and-stopping-rules.md) — item 9.
- [Gates](./plan-execution/per-phase-quality-gate-gates.md) — Phase N Gate.
- [Push Targets](./plan-execution/per-phase-quality-gate-push-targets.md) — mode push.
- [Phase 0/Merging](./plan-execution/per-phase-quality-gate-phase0-and-boundary-merging.md) — boundary merge.
- [Cleanup Check](./plan-execution/per-phase-quality-gate-cleanup-and-invariant.md) — boundary assert.
- [CI Overview](./plan-execution/post-push-ci-verification-overview.md) — monitoring tool.
- [CI Direct-Push](./plan-execution/post-push-ci-verification-direct-push.md) — main CI.
- [CI PR-Branch](./plan-execution/post-push-ci-verification-pr-branch.md) — PR checks.
- [Assertions Web/API](./plan-execution/manual-behavioural-assertions-web-and-api.md) — Real-browser, HTTP curl, and non-HTTP native-client proof.
- [Assertions Evidence](./plan-execution/manual-behavioural-assertions-full-stack-and-evidence.md) — full-stack.
- [Validation](./plan-execution/validation-and-check-for-findings.md) — checker run.
- [Continue Execution](./plan-execution/continue-execution.md) — fix findings.
- [Re-validate](./plan-execution/revalidate-and-iteration-control.md) — loop/terminate.
- [Pre-Archival Gates](./plan-execution/finalization-pre-archival-gates.md) — rule-15.
- [Rule-16 Retest](./plan-execution/finalization-rule16-api-retest.md) — API retest.
- [Knowledge Capture](./plan-execution/finalization-knowledge-capture.md) — learnings.md.
- [Finalization and Archival — End-to-End Delivery Completeness Audit](./plan-execution/finalization-end-to-end-completeness-audit.md) — Reconciles the full plan from its first requirement through final proof before completion can be declared. Use preliminarily after pre-archival gates pass, then repeat terminally after the final delivery is pushed or merged and before assigning pass.
- [PR CI Gate](./plan-execution/finalization-pr-ci-gate.md) — exact-head/base evidence and optional review.
- [Status/Infra Gate](./plan-execution/finalization-status-logic-and-infra-gate.md) — pass/fail.
- [Cleanup/Archival](./plan-execution/finalization-worktree-cleanup-and-pr-archival.md) — archival-in-PR.
- [PR Merge/Status](./plan-execution/finalization-pr-merge-and-final-status.md) — merge/cleanup.
- [Paired Handoff](./plan-execution/finalization-paired-repository-terminal-handoff.md) — successor pin.
- [Task Rules](./plan-execution/task-management-rules-and-termination.md) — termination.
- [Example Usage](./plan-execution/example-usage-and-iteration-example.md) — invocations.
- [Safety Features](./plan-execution/safety-features-and-plan-specific-validation.md) — checker scope and complete cleanup safety.
- [Related Workflows](./plan-execution/related-workflows-and-success-metrics.md) — metrics.
- [Notes](./plan-execution/notes.md) — characteristics.
- [TDD/Principles](./plan-execution/tdd-principles-conventions-agents.md) — governance.
