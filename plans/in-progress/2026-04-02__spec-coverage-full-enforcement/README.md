# Plan: Spec-Coverage Full Enforcement Across All 30 Projects

**Status**: In Progress
**Created**: 2026-04-02

## Overview

The `rhino-cli spec-coverage validate --shared-steps --exclude-dir test-support` tool verifies
that every Gherkin step in a project's feature files has a matching step definition in its test
code. Currently 19 out of 30 projects pass this gate; 11 projects had their `spec-coverage` Nx
target temporarily removed because they have genuine missing step definitions.

This plan restores `spec-coverage` enforcement to all 11 removed projects by implementing the
missing BDD step definition glue code in each project's language. No exceptions. No deferrals.

**Git Workflow**: Commit to `main` (Trunk Based Development)

## Quick Links

- [Requirements](./requirements.md) — Goals, user stories, acceptance criteria
- [Technical Documentation](./tech-docs.md) — Reference patterns, spec-coverage tool details,
  per-project analysis
- [Delivery Plan](./delivery.md) — Phased implementation checklist

## The Gap at a Glance

| Tier | Projects                                                                                                                        | Missing Steps | Effort  |
| ---- | ------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------- |
| 1    | `a-demo-be-ts-effect`, `a-demo-be-python-fastapi`                                                                               | 3, 8          | Quick   |
| 2    | `a-demo-fe-e2e`, `organiclever-fe-e2e`, `a-demo-be-clojure-pedestal`                                                            | 10, 15, 22    | Medium  |
| 3    | `a-demo-be-java-springboot`, `a-demo-be-rust-axum`, `a-demo-be-elixir-phoenix`, `a-demo-be-java-vertx`, `a-demo-be-kotlin-ktor` | 49–96         | Large   |
| 4    | `a-demo-fe-dart-flutterweb`                                                                                                     | 220           | Largest |

## Key Constraints

- **Step definitions only** — API functionality is already implemented. Only BDD glue code is
  missing.
- **Same Gherkin specs** — All backends consume identical `.feature` files from
  `specs/apps/a-demo/be/gherkin/`. All FE apps consume `specs/apps/a-demo/fe/gherkin/`. Only
  the step implementations differ by language.
- **Three-level testing standard** — Step definitions call service functions with mocked
  repositories (unit level). No real DB, no HTTP.
- **Coverage thresholds maintained** — Adding steps must not drop any project below its threshold
  (backends ≥90%, frontends ≥70%).
- **Reference implementations exist** — Go/Gin, F#/Giraffe, C#/ASP.NET Core pass 100% and show
  the expected behavior for each step. Step text is identical across languages.
- **Pre-push enforcement restored** — After each project passes, its `spec-coverage` target is
  added back to `project.json`.
- **Each project is independently committable** — Work can be shipped per project without waiting
  for the full plan to complete.
