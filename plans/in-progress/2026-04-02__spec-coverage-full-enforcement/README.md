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

## Prerequisites

Before implementing step definitions, the spec-coverage tool itself must be validated for
correctness. The following tool issues were identified and fixed:

- **Background steps parsed** — The parser now includes Background steps as a synthetic
  "(Background)" scenario. Previously 33 BE steps and 37 FE steps were silently skipped.
- **CI enforcement** — All pushes, PRs, and `Test*` CI workflows must reject when spec-coverage
  fails. The pre-push hook enforces locally; CI workflows and PR quality gates must also enforce.

## The Gap at a Glance

Counts include Background steps (corrected after parser fix):

| Tier | Projects                                                                                                                        | Missing Steps      | Effort  |
| ---- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------ | ------- |
| 1    | `a-demo-be-ts-effect`, `a-demo-be-python-fastapi`                                                                               | 3, 8               | Quick   |
| 2    | `a-demo-fe-e2e`, `organiclever-fe-e2e`, `a-demo-be-clojure-pedestal`                                                            | 10, 15, 22         | Medium  |
| 3    | `a-demo-be-java-springboot`, `a-demo-be-rust-axum`, `a-demo-be-elixir-phoenix`, `a-demo-be-java-vertx`, `a-demo-be-kotlin-ktor` | 49, 59, 76, 80, 97 | Large   |
| 4    | `a-demo-fe-dart-flutterweb`                                                                                                     | 241                | Largest |

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
- **No shortcuts** — Every missing step definition must be implemented earnestly with correct
  assertions matching the reference implementations. No stubs, no `pending()`, no empty bodies,
  no `assert(true)`. If a step is hard to implement, invest the time to do it correctly.
- **Granular task tracking** — Each project's work must use granular TaskCreate/TaskUpdate tracking
  with one task per logical unit of work (e.g., per feature area within a project, not one task
  per entire project).
- **Parser recheck across ALL projects** — Before implementing any step definitions, rerun
  `rhino-cli spec-coverage validate` on ALL projects in `apps/` and `libs/` (not just the 11
  failing ones) to confirm the parser reports correct coverage after the Background step fix.
  Any newly discovered gaps must be added to this plan.
