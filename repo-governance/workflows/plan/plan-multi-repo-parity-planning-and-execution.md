---
description: Plans and executes a cross-repo parity objective in one run.
when_to_use: Use when a cross-repo objective should be planned AND delivered in one continuous run.
---

# Plan Multi-Repo Parity Planning and Execution Workflow

Plans then executes a cross-repo parity objective in one run.

## Goal and Termination

**Goal**: Author aligned-but-deliberately-divergent plans across sibling repositories for a shared objective, then execute every resulting plan to zero-findings completion and archival — one end-to-end orchestration from idea to delivered parity

**Termination**: Every plan passes double-zero, delivers its archival change, records a passing delivered-head terminal audit, and reaches pass. Each exact identity-recorded worktree is then removed after safety proof; failure retains evidence, reopens execution, and escalates.

## Inputs

- **`objective`** (string, required) — The shared topic to standardize or align across repos (e.g., 'standardize markdown gates', 'align agent catalogs')
- **`repos`** (string, optional, default `ose-public, ose-private`) — Comma-separated target repository names or absolute paths in the parity set
- **`mode`** (enum: worktree-to-pr, optional, default `worktree-to-pr`) — Planning-phase delivery mode. Public OSE parity planning uses worktree-to-pr; each gated plan-document PR must pass exact-head gates and merge under default [AI] authority before execution.
- **`max-iterations`** (number, optional, default `10`) — Maximum execute-check cycles per plan during the execution phase (passed to plan-execution)
- **`max-concurrency`** (number, optional, default `3`) — Background agents run concurrently — the N in the N+1 model (1 main thread + N background agents = N+1 total). Raise only when independent work, machine capacity, and budget headroom all allow; lower under budget, runner, or disk pressure. Never self-promoted beyond the declared value.
- **`execution-order`** (string, optional, default `as listed in repos`) — Repo execution order for the execution phase; confirmed in the pre-execution grill

## Outputs

- **`plans-created`** (file-list) — One plan folder path per target repo (archived to plans/done/ on success)
- **`gate-results`** (string) — plan-quality-gate verdict per plan (PASS/BLOCKED\_\*)
- **`execution-results`** (string) — plan-execution final status per repo (pass/partial/fail) with iterations-completed
- **`delivery-refs`** (string) — Merged planning and execution PR references for each repository

## Contents

- [Purpose & Scope](./plan-multi-repo-parity-planning-and-execution/purpose-scope-and-when-to-use.md) — why this exists.
- [Execution Mode & Tasks](./plan-multi-repo-parity-planning-and-execution/execution-mode-and-task-list-contract.md) — orchestration, Task list.
- [Step 1 — Planning](./plan-multi-repo-parity-planning-and-execution/step-1-planning-phase.md) — nested workflow.
- [Steps 2-3 — Gate & Grill](./plan-multi-repo-parity-planning-and-execution/step-2-and-3-phase-gate-and-pre-execution-grill.md) — readiness, third grill.
- [Step 4 — Execution](./plan-multi-repo-parity-planning-and-execution/step-4-execution-phase.md) — plan-execution per repo.
- [Step 4 — Execution (cont.)](./plan-multi-repo-parity-planning-and-execution/step-4-execution-phase-propagation-and-delivery.md) — propagation, manifest gate.
- [Step 5 — Finalization](./plan-multi-repo-parity-planning-and-execution/step-5-cross-repo-finalization.md) — sibling links, report.
- [Termination & Grilling](./plan-multi-repo-parity-planning-and-execution/termination-criteria-and-grilling-contract.md) — outcomes, three grills.
- [Example Usage](./plan-multi-repo-parity-planning-and-execution/example-usage.md) — two worked examples.
- [Safety & Related](./plan-multi-repo-parity-planning-and-execution/safety-features-and-related-workflows.md) — guarantees, links.
- [Principles & Conventions](./plan-multi-repo-parity-planning-and-execution/principles-conventions-and-agents.md) — governance, agents.
