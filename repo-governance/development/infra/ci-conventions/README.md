---
description: "Central reference for CI/CD conventions in the multi-language Nx monorepo."
when_to_use: "Read this index to find the right CI/CD Conventions child document."
---

# CI/CD Conventions

- [Principles and Conventions Implemented/Respected](./principles-and-conventions.md) — Principles and conventions this CI/CD series implements. Use when tracing a rule's source principle or convention.
- [Git Hooks Standard — Pre-Commit and Commit-msg](./git-hooks-standard-pre-commit-and-commit-msg.md) — Pre-commit gate steps and the commit-msg format. Use when debugging the pre-commit hook or commit format.
- [Git Hooks Standard — Pre-Push](./git-hooks-standard-pre-push.md) — The registry-driven pre-push hook and its live gate set. Use when debugging or speeding up the pre-push hook.
- [Nx Target Naming and Three-Level Testing Definitions](./nx-target-naming-and-three-level-testing-definitions.md) — Key Nx target names and the three test-level isolation rules. Use when checking which target or isolation rule applies.
- [App-Type-Specific Test Manifestations and Gherkin Consumption Matrix](./test-manifestations-and-gherkin-consumption-matrix.md) — How each app type implements test levels and consumes Gherkin. Use when implementing tests for an app type.
- [Coverage Threshold Rationale](./coverage-threshold-rationale.md) — Why coverage thresholds differ by project type. Use when checking a project's required coverage threshold.
- [Docker Conventions](./docker-conventions.md) — The Dockerfile template, compose file roles, and .dockerignore pattern. Use when writing a Dockerfile, compose file, or .dockerignore.
- [GitHub Actions Conventions — File Organisation and Composite Actions](./github-actions-file-organisation-and-composite-actions.md) — The path pattern for workflow and action files. Use when creating or locating a workflow file or action.
- [Expression Safety](./github-actions-expression-safety.md) — Two GitHub Actions expression-injection and falsy-value antipatterns. Use when a run step references a ${{ ... }} expression.
- [GitHub Actions Storage](./github-actions-storage.md) — Storage limits for artifacts, Packages, and caches. Use when a workflow creates or retains GitHub-hosted data.
- [GitHub Actions Conventions — Reusable Workflows and CRON Scheduling](./github-actions-reusable-workflows-and-cron-scheduling.md) — Reusable workflow structure and the staggered CRON tracks. Use when writing a reusable workflow or scheduling a CRON job.
- [Naming Conventions and Adding a New App to CI](./naming-conventions-and-adding-a-new-app-to-ci.md) — App/workflow filename grammar and the new-app checklist. Use when naming or onboarding a new app.
- [E2E Test Pairing Rule and Environment Variable Standard](./e2e-test-pairing-rule-and-environment-variable-standard.md) — E2E runner pairing and required env-variable rules. Use when wiring an E2E runner or env variable.
- [Parity Checklist — Invariants A and B](./ci-toolchain-parity-checklist-invariants-a-and-b.md) — Requirement tables for CI Workflow Shape and Git Hook Lifecycle. Use when auditing a workflow's shape or a hook's steps.
- [Parity Checklist — Invariants B2, C, and D](./ci-toolchain-parity-checklist-invariants-b2-c-and-d.md) — No-heavy-tests, hexagonal layout, and command-surface rules. Use when checking a test target's gate or Rhino's layers.
- [Parity Checklist — Invariants E, F, and G](./ci-toolchain-parity-checklist-invariants-e-f-and-g.md) — Nx naming scheme, governance-currency checklist, Mermaid rules. Use when naming a target or writing a state diagram.
- [Parity Checklist — Affected-First PR-Gate Principle](./ci-toolchain-parity-checklist-affected-first-pr-gate-principle.md) — Why PR checks scope to nx affected, and the exceptions. Use when adding a PR-gate check and deciding its scope.
