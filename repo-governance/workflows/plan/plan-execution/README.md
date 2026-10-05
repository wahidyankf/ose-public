---
description: "Indexes end-to-end plan execution across its per-topic children."
when_to_use: "Use to locate a plan-execution child document."
---

# Plan Execution Workflow

- [Execution Mode](./001-execution-mode.md) — That the calling context, not a dedicated plan-executor agent, directly orchestrates plan execution.
- [How to Execute](./002-how-to-execute.md) — Tracing the ordered actions plan execution performs, from backlog promotion through complete worktree, branch, and build-output cleanup.
- [Orchestration Model](./003-orchestration-model.md) — That the calling context orchestrates plan execution, routing substantive work to specialized agents.
- [Agent Selection](./004-agent-selection.md) — Deciding which agent should execute a given delivery checklist item.
- [Fan-Out, Ordering, and Delivery Shape](./005-fan-out-ordering-and-delivery-shape.md) — The N+1 fan-out model, DAG-first ordering, and the one-PR-per-delivery-unit / one-worktree-per-repo delivery shape.
- [Surface-Conditional Tester Gates](./006-surface-conditional-tester-gates.md) — Determining which tester gates a plan's shipped surface requires before archival.
- [Vercel MCP Availability (Surface-Conditional)](./007-vercel-mcp-availability.md) — How execution reconfirms Vercel MCP availability at Phase 0 for plans touching a Vercel-deployed surface.
- [Task-Checklist Synchronization](./008-task-checklist-synchronization.md) — Proving the strict
  action-level task/checkbox bijection on startup, first mid-run invocation, and every re-entry.
- [Harness Task List as Primary Observability Surface](./009-harness-task-list-primary-observability-surface.md) — Auditing task creation, titling, and timing against the observability invariants.
- [Atomic Sync Ritual](./010-atomic-sync-ritual.md) — The mandatory three-step tick-notes-TaskUpdate sequence that must land together for every completed checklist item.
- [Resume Reconciliation (Disk Is Truth)](./011-resume-reconciliation.md) — Reconstructing the task
  list from disk on every entry or re-entry, including after work began outside this workflow.
- [Rules 1-5](./012-iron-rules-1-5.md) — Checking execution against the first five hard, non-negotiable rules governing every execution step.
- [Rules 6-11](./013-iron-rules-6-11.md) — Checking execution against rules 6-11 of the hard, non-negotiable rules governing every execution step.
- [Preconditions and Work Branch](./014-enter-worktree-preconditions-and-work-branch.md) — The backlog-promotion precondition and the three-tier precedence for selecting the plan's work branch.
- [Delivery-Mode Resolution](./015-enter-worktree-delivery-mode-resolution.md) — Resolving which delivery mode (worktree-to-pr, main-to-origin-main, etc.) a plan executes under.
- [Locate and Provision](./016-enter-worktree-locate-and-provision.md) — How the orchestrator finds the declared ## Worktree section and provisions it.
- [Freshness Gate](./017-enter-worktree-freshness-gate.md) — Syncing a work branch or worktree with origin/main before starting implementation.
- [Secrets, Output, and Rationale](./018-enter-worktree-secrets-output-and-rationale.md) — A checklist item runs a state-changing infrastructure operation.
- [Load Delivery Checklist and Materialize Task List](./019-load-delivery-checklist-and-task-list.md) — Starting or resuming plan execution and building the initial Task list from delivery.md.
- [Environment Setup](./020-environment-setup.md) — Running or auditing a plan's Phase 0 (environment setup and baseline) before implementation begins.
- [Execution Loop](./021-initial-execution-loop.md) — Walking through how each delivery checklist item is picked up, repo-grounded, and routed for execution.
- [Verify, Capture, and Atomic Sync](./022-initial-execution-items-5-8.md) — Execution-loop steps 5-8, through to the atomic sync ritual.
- [Progress, Output, and Stopping Rules](./023-initial-execution-progress-and-stopping-rules.md) — Execution-loop step 9, progress-streaming cadence, success/failure criteria, and the sanctioned stopping rules.
- [Gates](./024-per-phase-quality-gate-gates.md) — Verifying a phase's own gate, or running local and integration/e2e quality gates after a phase completes.
- [Push Targets](./025-per-phase-quality-gate-push-targets.md) — The push target per delivery mode and the direct-push vs. \*-to-pr branch/PR mechanics.
- [Phase 0 Exemption and Delivery-Boundary Merging](./026-per-phase-quality-gate-phase0-and-boundary-merging.md) — Phase 0's PR exemption and the delivery-boundary merge-not-batch rule.
- [Worktree Cleanup and Boundary Assertion](./027-per-phase-quality-gate-cleanup-and-invariant.md) — Deciding whether a worktree is safe to remove, or whether a boundary phase opened its PR.
- [Overview and Monitoring Tool](./028-post-push-ci-verification-overview.md) — When Post-Push CI Verification applies and the required ScheduleWakeup-based monitoring tool and cadence.
- [Direct-Push Modes](./029-post-push-ci-verification-direct-push.md) — Monitoring CI after a push under worktree-to-origin-main or main-to-origin-main.
- [PR-Branch Modes](./030-post-push-ci-verification-pr-branch.md) — Monitoring CI after a push under worktree-to-pr or main-to-pr.
- [Web UI and API Verification](./031-manual-behavioural-assertions-web-and-api.md) — A phase touches web UI or API code and needs manual verification.
- [Full-Stack Verification and Evidence](./032-manual-behavioural-assertions-full-stack-and-evidence.md) — Full-stack verification covering both UI and API, and the evidence-capture requirements for delivery.md.
- [Validation](./033-validation-and-check-for-findings.md) — Running independent validation after execution, or deciding whether a blocking finding remains.
- [Continue Execution](./034-continue-execution.md) — A validation report returns findings that must be fixed before re-validation.
- [Re-validate](./035-revalidate-and-iteration-control.md) — The re-validation step and the iteration-control logic that loops execution or proceeds to finalization.
- [Pre-Archival Gates](./036-finalization-pre-archival-gates.md) — A UI-bearing or web-UI feature-change plan approaches archival and must run its pre-archival visual and retest gates.
- [Rule-16 API Retest Gate](./037-finalization-rule16-api-retest.md) — An API feature-change plan approaches archival and must run its near-end exploratory retest gate.
- [Knowledge Capture Gate](./038-finalization-knowledge-capture.md) — Confirming every learnings.md entry reached a terminal state before archival.
- [Finalization and Archival — End-to-End Delivery Completeness Audit](./039-finalization-end-to-end-completeness-audit.md) — Reconciles the full plan from its first requirement through final proof before completion can be declared. Use preliminarily after pre-archival gates pass, then repeat terminally after the final delivery is pushed or merged and before assigning pass.
- [Exact-Head PR CI Gate](./040-finalization-pr-ci-gate.md) — A \*-to-pr plan approaches archival and must prove current-head/base CI plus applicable surface evidence before merge.
- [Status Logic, Infra-Execution Gate, and Direct-Push Archival](./041-finalization-status-logic-and-infra-gate.md) — The pass/partial/fail branching and the Infra-Execution Gate precondition.
- [Direct-Push Worktree Cleanup and PR-Mode Archival](./042-finalization-worktree-cleanup-and-pr-archival.md) — Worktree cleanup for direct-push modes, archival-in-PR for \*-to-pr modes.
- [PR Merge, Cleanup, and Final Status](./043-finalization-pr-merge-and-final-status.md) — The PR-mode merge, safe immediate worktree cleanup, and final pass/partial/fail status determination.
- [Task Management Rules](./045-task-management-rules-and-termination.md) — A compact reference for task-list discipline rules and the pass/partial/fail termination criteria.
- [Example Usage](./046-example-usage-and-iteration-example.md) — Learning how to invoke plan execution with different arguments, or tracing a typical execute-validate cycle.
- [Safety Features](./047-safety-features-and-plan-specific-validation.md) — Explaining plan execution safety, complete three-class cleanup, and checker coverage.
- [Related Workflows](./048-related-workflows-and-success-metrics.md) — Composing plan execution with other workflows, or when tracking success metrics across plan executions.
- [Notes](./049-notes.md) — A quick-reference summary of plan execution's operating characteristics and how it differs from plan-quality-gate.
- [Test-Driven Development](./050-tdd-principles-conventions-agents.md) — Confirming TDD is required for a code-shipping checklist item, or checking which principles/conventions this workflow follows.
