---
name: ci-standards
description: CI/CD standards knowledge for validating project compliance with CI conventions
context: inline
---

# CI Standards

Inline skill providing CI/CD standards knowledge from the governance documentation. Used by `swe-*-dev` agents to set up new projects correctly and by `ci-checker`/`ci-fixer` agents to validate compliance.

## Reference Documents

- [CI/CD Conventions](../../../governance/development/infra/ci-conventions.md) — Central CI conventions reference
- [Three-Level Testing Standard](../../../governance/development/quality/three-level-testing-standard.md) — Test level definitions
- [Nx Target Standards](../../../governance/development/infra/nx-targets.md) — Mandatory targets per project type
- [Specs Directory Structure Convention](../../../governance/conventions/structure/specs-directory-structure.md) — Canonical path patterns for specs/ directory

## Mandatory Nx Targets Per App Type

| App Type         | Required Targets                                                                        |
| ---------------- | --------------------------------------------------------------------------------------- |
| Demo-be backend  | codegen, typecheck, lint, build, test:unit, test:quick, test:integration, spec-coverage |
| Demo-fe frontend | codegen, typecheck, lint, build, test:unit, test:quick, spec-coverage                   |
| Fullstack app    | codegen, typecheck, lint, build, test:unit, test:quick, test:integration, spec-coverage |
| CLI app (Go)     | typecheck, lint, build, test:unit, test:quick, test:integration, spec-coverage          |
| Content platform | typecheck, lint, build, test:unit, test:quick, test:integration, spec-coverage          |
| Library          | lint, build, test:unit, test:quick                                                      |
| E2E runner       | lint, test:e2e, test:e2e:ui, spec-coverage                                              |

## Coverage Thresholds

| Threshold | Projects                                           |
| --------- | -------------------------------------------------- |
| 90%       | organiclever-be, CLI apps, Go libs                 |
| 80%       | Content platforms (ayokoding-web, oseplatform-web) |
| 70%       | organiclever-fe                                    |

## Docker Setup Requirements

Every app with a `dev` or `test:integration` target must have:

- `infra/dev/{app}/docker-compose.yml` — Dev environment
- `infra/dev/{app}/docker-compose.ci.yml` — CI overlay (backends only)
- `infra/dev/{app}/.env.example` — Environment variable template
- `apps/{app}/docker-compose.integration.yml` — Integration tests (backends only)

## E2E Pairing Rules

| Variant Type | Pairs With                      |
| ------------ | ------------------------------- |
| Backend      | Corresponding frontend via E2E  |
| Frontend     | Corresponding backend via E2E   |
| Fullstack    | Self-contained (own API routes) |

## Gherkin Consumption Mandate

All testable projects must consume Gherkin specs at ALL test levels. Unit tests are a superset of Gherkin — they MUST implement ALL Gherkin scenarios plus additional non-Gherkin tests.

## Workflow Requirements

Each demo backend/frontend must have a per-variant test workflow (`test-{app-name}.yml`) calling reusable workflows with CRON schedule (2x daily at WIB 06:00 and 18:00).
