---
description: Central reference for CI/CD conventions in the multi-language Nx monorepo.
when_to_use: Use when writing or reviewing a git hook, CI workflow, Dockerfile, or test setup.
---

# CI/CD Conventions

Central CI/CD reference for the multi-language Nx monorepo: hooks, testing, coverage, Docker,
GitHub Actions, and naming.

## Hooks and Testing

- [Principles and Conventions Implemented/Respected](./ci-conventions/principles-and-conventions.md) — Principles and conventions this CI/CD series implements. Use when tracing a rule's source principle or convention.
- [Git Hooks Standard — Pre-Commit and Commit-msg](./ci-conventions/git-hooks-standard-pre-commit-and-commit-msg.md) — Pre-commit gate steps and the commit-msg format. Use when debugging the pre-commit hook or commit format.
- [Git Hooks Standard — Pre-Push](./ci-conventions/git-hooks-standard-pre-push.md) — The registry-driven pre-push hook and its live gate set. Use when debugging or speeding up the pre-push hook.
- [Nx Testing Targets and Boundaries](./ci-conventions/nx-target-naming-and-three-level-testing-definitions.md) — Runtime, static coverage, and three-layer boundaries. Use when classifying a test.
- [Project-Role Testing and Gherkin Matrix](./ci-conventions/test-manifestations-and-gherkin-consumption-matrix.md) — Applicable adapters by role. Use when implementing project tests.
- [Runtime and Static Coverage Responsibilities](./ci-conventions/coverage-threshold-rationale.md) — Separates runtime measurement from static coverage validation.

## Docker and GitHub Actions

- [Docker Conventions](./ci-conventions/docker-conventions.md) — The Dockerfile template, compose file roles, and .dockerignore pattern. Use when writing a Dockerfile, compose file, or .dockerignore.
- [GitHub Actions Conventions — File Organisation and Composite Actions](./ci-conventions/github-actions-file-organisation-and-composite-actions.md) — The path pattern for workflow and action files. Use when creating or locating a workflow file or action.
- [Expression Safety](./ci-conventions/github-actions-expression-safety.md) — Two GitHub Actions expression-injection and falsy-value antipatterns. Use when a run step references a `${{ ... }}` expression.
- [GitHub Actions Storage](./ci-conventions/github-actions-storage.md) — Storage limits for artifacts, Packages, and caches. Use when a workflow creates or retains GitHub-hosted data.
- [GitHub Actions Conventions — Reusable Workflows and CRON Scheduling](./ci-conventions/github-actions-reusable-workflows-and-cron-scheduling.md) — Reusable workflow structure and the staggered CRON tracks. Use when writing a reusable workflow or scheduling a CRON job.

## Naming and Onboarding

- [Naming Conventions and Adding a New App to CI](./ci-conventions/naming-conventions-and-adding-a-new-app-to-ci.md) — App/workflow filename grammar and the new-app checklist. Use when naming or onboarding a new app.
- [E2E Test Pairing Rule and Environment Variable Standard](./ci-conventions/e2e-test-pairing-rule-and-environment-variable-standard.md) — E2E runner pairing and required env-variable rules. Use when wiring an E2E runner or env variable.

## CI/Toolchain Checklist

- [Toolchain Checklist — Invariants A and B](./ci-conventions/ci-toolchain-checklist-invariants-a-and-b.md) — Requirement tables for CI Workflow Shape and Git Hook Lifecycle. Use when auditing a workflow's shape or a hook's steps.
- [Toolchain Checklist — Test Execution Boundaries and Command Surfaces](./ci-conventions/ci-toolchain-checklist-invariants-b2-c-and-d.md) — Fast-gate, coverage, architecture, and command invariants.
- [Toolchain Checklist — Invariants E, F, and G](./ci-conventions/ci-toolchain-checklist-invariants-e-f-and-g.md) — Nx naming scheme, governance-currency checklist, Mermaid rules. Use when naming a target or writing a state diagram.
- [Toolchain Checklist — Affected-First PR-Gate Principle](./ci-conventions/ci-toolchain-checklist-affected-first-pr-gate-principle.md) — Why PR checks scope to `nx affected`, and the exceptions. Use when adding a PR-gate check and deciding its scope.
