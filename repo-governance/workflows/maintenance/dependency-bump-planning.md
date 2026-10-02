---
description: "Surveys monorepo dependency manifests, classifies bumps per the Dependency Bump Policy, and produces a validated backlog plan — never edits a manifest itself."
when_to_use: "Use for a dependency-hygiene sweep, a pre-release bump snapshot, or an LTS-line upgrade."
---

# Repository Dependency Bump Planning Workflow

**Purpose**: Turn the [Dependency Bump Stability & Safety Policy](../../development/workflow/dependency-bump-policy.md)
into a validated **backlog plan** for updating dependencies across the whole monorepo — survey,
classify, and hand off to `plan-planning` to author the plan.

**The outcome is the plan, not the implementation** — this single-pass `planning`-type workflow
never edits a manifest, updates a lockfile, or runs a bump. The
[Plan Execution workflow](../plan/plan-execution.md)'s own Step 0 promotes the plan to
`plans/in-progress/` later; the policy's Application Workflow steps 8–12 become that plan's
delivery checklist.

## Goal and Termination

**Goal**: Survey every dependency manifest across the monorepo — apps/, libs/, workspace-root pins, infra/, and CI toolchain pins under .github/ — classify each candidate bump per the Dependency Bump Stability & Safety Policy, and produce a validated backlog plan. The deliverable is the plan, never the dependency edits.

**Termination**: A grill-validated plan exists at plans/backlog/<identifier>/, passes plan-quality-gate at strict mode, and a dependency clearance report is written to local-tmp/dependency-bump-planning/. No manifest or lockfile is modified by this workflow.

## Inputs

- **`scope-filter`** (string, optional) — Optional comma-separated glob filter limiting which manifests are inventoried. Default: every dependency-bearing manifest in the monorepo (see Phase 1: Inventory).
- **`ecosystems`** (string, optional) — Optional comma-separated filter of ecosystems (npm, cargo, dotnet, go, docker, github-actions). Default: all ecosystems present in the inventory.
- **`as-of-date`** (string, optional) — The "today" used for the Path B 60-day cutoff computation (YYYY-MM-DD). Defaults to the current date; recorded verbatim in the clearance report.
- **`plan-identifier`** (string, optional, default `dependency-bump`) — Slug for the backlog plan folder. Default: dependency-bump.
- **`push-target`** (string, optional, default `origin main`) — Git push destination for the backlog plan. Forwarded to plan-planning.

## Outputs

- **`clearance-report`** (file, pattern `local-tmp/dependency-bump-planning/dependency-bump-planning__*__report.md`) — Inventory + Security & Functional Clearance Status table + cutoff computation. Always written.
- **`plan-path`** (string) — Path to the created backlog plan in plans/backlog/<identifier>/
- **`final-status`** (enum: pass, partial, fail) — Final status after the backlog plan's quality gate

## Contents

- [Execution Mode](./dependency-bump-planning/001-execution-mode.md) — Direct Orchestration.
- [When to Use](./dependency-bump-planning/002-when-to-use.md) — the three trigger scenarios.
- [Phase 0: Pre-flight](./dependency-bump-planning/003-phase-0-pre-flight.md) — clean tree, cutoff, scope.
- [Phase 1: Inventory](./dependency-bump-planning/004-phase-1-inventory.md) — enumerate every manifest.
- [Phase 2: Candidate Discovery](./dependency-bump-planning/005-phase-2-candidate-discovery-and-classification.md) — path/CVE/KEV/EPSS research.
- [Phase 3: Clearance Table](./dependency-bump-planning/006-phase-3-clearance-table-and-decisions.md) — assemble and write the report.
- [Phase 4: Human Checkpoint](./dependency-bump-planning/007-phase-4-human-checkpoint.md) — the hard approval gate.
- [Phase 5: Backlog Plan Establishment](./dependency-bump-planning/008-phase-5-backlog-plan-establishment.md) — invoke plan-planning.
- [Phase 6: Hand-back](./dependency-bump-planning/009-phase-6-hand-back.md) — final summary, re-run reminder.
- [Gherkin Success Criteria](./dependency-bump-planning/010-gherkin-success-criteria.md) — the three scenarios.
- [Related Documents](./dependency-bump-planning/011-related-documents.md) — policy, workflows, agents, registers.
- [Principles Implemented/Respected](./dependency-bump-planning/012-principles-implemented-respected.md) — traceability.
- [Conventions Implemented/Respected](./dependency-bump-planning/013-conventions-implemented-respected.md) — traceability.
