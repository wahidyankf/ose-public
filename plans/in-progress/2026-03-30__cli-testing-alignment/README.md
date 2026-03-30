# Plan: Align CLI App Testing with Three-Level Testing Standard

**Status**: In Progress
**Created**: 2026-03-30

## Overview

Align rhino-cli (and all Go CLI apps) testing architecture with the demo-be three-level testing
standard: **both unit and integration tests consume Gherkin specs**. Currently, only integration
tests consume Gherkin — unit tests are standalone Go `testing.T` tests with no spec consumption.

This change makes CLI apps follow the same principle as demo-be backends: the Gherkin specs are
the shared contract, and both test levels implement step definitions against them with different
isolation boundaries.

**Git Workflow**: Commit to `main` (Trunk Based Development)

## Quick Links

- [Requirements](./requirements.md) — Current vs target state, isolation rules, and acceptance
  criteria
- [Technical Documentation](./tech-docs.md) — Architecture, refactoring patterns, and mocking
  strategy
- [Delivery Plan](./delivery.md) — Phased checklist and validation steps

## What Changes

| Aspect                  | Current (CLI apps)             | Target (aligned with demo-be)                      |
| ----------------------- | ------------------------------ | -------------------------------------------------- |
| Unit: Gherkin           | No — standalone Go tests       | Yes — all specs via godog                          |
| Unit: Mocking           | Partial — some use real fs     | All mocked exclusively                             |
| Unit: Extra tests       | All tests are non-BDD          | BDD specs + additional non-BDD for uncovered logic |
| Integration: Gherkin    | Yes — godog + feature files    | Yes — unchanged                                    |
| Integration: Mocking    | Partial — some mock, some real | Limited — only external APIs (HTTP) mocked         |
| Integration: Filesystem | Mixed                          | Real — `/tmp` fixtures                             |

## Why This Matters

1. **Consistency**: Demo-be backends already consume Gherkin at all levels. CLI apps are the
   exception. Unifying eliminates cognitive overhead when switching between project types.
2. **Spec as contract**: When unit tests consume Gherkin, a spec change immediately surfaces in
   fast unit tests (pre-push gate) — not just in slower integration tests.
3. **Isolation clarity**: Currently unit tests for some commands touch real filesystem, blurring
   the unit/integration boundary. This plan enforces: unit = all mocked, integration = real I/O.
4. **Coverage accuracy**: Coverage is measured at unit level. If unit tests don't run Gherkin
   scenarios, the coverage number doesn't reflect whether the spec contract is satisfied.

## Scope

All three Go CLI apps in the monorepo:

| App                     | Commands          | Feature Files | Unit Tests                          | Integration Tests |
| ----------------------- | ----------------- | ------------- | ----------------------------------- | ----------------- |
| `apps/rhino-cli/`       | 14                | 13            | 14                                  | 13                |
| `apps/ayokoding-cli/`   | 1 (`links check`) | 1             | 2 (`root_test`, `links_check_test`) | 1                 |
| `apps/oseplatform-cli/` | 1 (`links check`) | 1             | 2 (`root_test`, `links_check_test`) | 1                 |

- **Specs**: `specs/apps/rhino-cli/README.md`, `specs/apps/ayokoding-cli/README.md`, and
  `specs/apps/oseplatform-cli/README.md` all updated to reflect dual consumption
- **Documentation**: 6+ governance/docs files that define CLI testing patterns
