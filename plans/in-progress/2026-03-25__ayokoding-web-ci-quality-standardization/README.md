# Standardize ayokoding-web CI and Quality Gate Practices

**Status**: In Progress
**Created**: 2026-03-25

## Overview

Align ayokoding-web's CI pipelines, quality gates, and Nx target configurations with the monorepo's canonical standards defined in [Nx Target Standards](../../../governance/development/infra/nx-targets.md) and [Three-Level Testing Standard](../../../governance/development/quality/three-level-testing-standard.md). The app is largely compliant today, but several inconsistencies and gaps need resolution.

**Git Workflow**: Commit to `main` (Trunk Based Development)

## Quick Links

- [Requirements](./requirements.md) - Gaps, inconsistencies, and acceptance criteria
- [Technical Documentation](./tech-docs.md) - Current vs target state and implementation approach
- [Delivery Plan](./delivery.md) - Implementation phases and checklist

## Goals

1. Fix the stale tag in `nx-targets.md` that still lists ayokoding-web as `platform:hugo` instead of `platform:nextjs`
2. Polish the PR quality gate CI workflow (`pr-quality-gate.yml`) step naming — the current three-step structure is already correct and matches the pre-push hook; this is a low-priority improvement to ensure step names are maximally clear for PR reviewers
3. Add `test:integration` to the scheduled CI workflow (`test-and-deploy-ayokoding-web.yml`) so all three test levels run in CI
4. Ensure `test:quick` Nx cache inputs include Gherkin specs correctly and consistently
5. Document ayokoding-web's testing architecture (unit projects, coverage exclusions, BDD integration) in relation to the three-level standard
6. Introduce a repository pattern for content access — extract a `ContentRepository` interface with `InMemoryContentRepository` (unit) and `FileSystemContentRepository` (integration) implementations, enabling clean separation of unit and integration tests that both consume the same Gherkin specs
7. Add oxlint project config to treat unused vars, imports, and dead code as errors in linting
8. Create FE unit step files consuming all FE Gherkin specs (`specs/apps/ayokoding-web/fe/gherkin/`) with mock-only dependencies
9. Enforce unit test purity — move `integration-content.unit.test.ts` (real filesystem reads) from unit to integration project
10. Convert `ayokoding-web-be-e2e` to consume all BE Gherkin specs via `playwright-bdd`
11. Convert `ayokoding-web-fe-e2e` to consume all FE Gherkin specs via `playwright-bdd`

## Delivery Notes

Goals 1–4 (documentation drift, CI gaps, cache inputs, step naming) map to Phases 1–3 in the delivery plan and are independently committable. Goals 5–6 (repository pattern, ContentService) map to Phases 4–7 and form a cohesive refactoring. Goals 7–11 (linting strictness, FE unit tests, unit test purity, E2E Gherkin consumption) map to Phases 8–12. Phase 13 is the final validation covering all goals. Each group can be delivered independently.

## Context

ayokoding-web is a Next.js 16 fullstack content platform with:

- **Two vitest projects**: `unit` (Node.js env, BE/tRPC steps) and `unit-fe` (jsdom env, FE component steps)
- **BDD specs**: Consumed from `specs/apps/ayokoding-web/**/*.feature`
- **Coverage threshold**: 80% line coverage (exceeds the 70% standard for web UIs)
- **Link validation**: Integrated into `test:quick` via ayokoding-cli
- **E2E tests**: Separate `ayokoding-web-be-e2e` and `ayokoding-web-fe-e2e` projects
- **Scheduled CI**: 2x daily (WIB 06:00, 18:00) with conditional deploy to `prod-ayokoding-web`

The app is substantially compliant but has documentation drift, a missing CI step, and an opportunity to align its backend architecture with the monorepo's repository pattern and three-level testing standard.

Currently, all server-side content code (`src/server/content/*`, `src/server/trpc/procedures/**`) is excluded from coverage. Unit tests use `vi.mock()` at the module level rather than injecting through an interface. This prevents clean separation between unit tests (mocked data access) and integration tests (real filesystem reads), unlike the established demo-be pattern.

Additional gaps: the `unit-fe` vitest project is completely empty (6 FE Gherkin specs unconsumed), both E2E projects use plain Playwright tests without consuming Gherkin specs, oxlint runs with bare defaults (no error-level rules for unused code), and one unit test file (`integration-content.unit.test.ts`) reads the real filesystem — violating mock-only unit test principles.
