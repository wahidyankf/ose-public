# Testing Standardization

## Overview

Standardize testing across **all apps and libs** in the monorepo with three simple rules, consistent target naming (`test:unit`, `test:integration`, `test:e2e`), and a uniform `test:quick` quality gate.

**Status**: In Progress

## Goals

- Every project in `apps/` and `libs/` follows a standardized testing strategy derived from three rules
- Consistent Nx targets (`test:unit`, `test:integration`, `test:e2e`, `test:quick`) across all projects
- Demo-be backends consume shared Gherkin specs at all three test levels (unit, integration, e2e) with different step implementations
- Integration tests for demo-be backends use real PostgreSQL via docker-compose (no HTTP layer, direct code calls)
- Coverage (>=90%) measured from `test:unit` alone
- CI schedules: integration 4x daily, E2E 2x daily, test:quick on every push/PR

## Three Rules

1. **All apps and libs must have unit tests** (`test:unit`) — except Hugo/static site generator-based projects
2. **All apps must also have integration tests** (`test:integration`) — libs are exempt; Hugo/static sites are exempt
3. **All web apps (APIs and web UIs) must have E2E tests** (`test:e2e`) — CLIs and libs are exempt; Hugo/static sites are exempt

These rules determine the mandatory test levels for each project. Integration tests for demo-be backends run in Docker (docker-compose with PostgreSQL). For demo-be backends specifically, the same Gherkin specs (`specs/apps/demo-be/gherkin/`) serve as the contract at every level — only the step implementations change.

## Project Inventory

### Project Types and Applicable Test Levels

| Project                     | Type              | Rule  | Unit | Integration | E2E | Notes                                       |
| --------------------------- | ----------------- | ----- | ---- | ----------- | --- | ------------------------------------------- |
| `demo-be-java-springboot`   | App — API Backend | 1+2+3 | Yes  | Yes (PG)    | Yes | Gherkin at all 3 levels                     |
| `demo-be-elixir-phoenix`    | App — API Backend | 1+2+3 | Yes  | Yes (PG)    | Yes | Gherkin at all 3 levels                     |
| `demo-be-fsharp-giraffe`    | App — API Backend | 1+2+3 | Yes  | Yes (PG)    | Yes | Gherkin at all 3 levels                     |
| `demo-be-golang-gin`        | App — API Backend | 1+2+3 | Yes  | Yes (PG)    | Yes | Gherkin at all 3 levels                     |
| `demo-be-python-fastapi`    | App — API Backend | 1+2+3 | Yes  | Yes (PG)    | Yes | Gherkin at all 3 levels                     |
| `demo-be-rust-axum`         | App — API Backend | 1+2+3 | Yes  | Yes (PG)    | Yes | Gherkin at all 3 levels                     |
| `demo-be-kotlin-ktor`       | App — API Backend | 1+2+3 | Yes  | Yes (PG)    | Yes | Gherkin at all 3 levels                     |
| `demo-be-java-vertx`        | App — API Backend | 1+2+3 | Yes  | Yes (PG)    | Yes | Gherkin at all 3 levels                     |
| `demo-be-ts-effect`         | App — API Backend | 1+2+3 | Yes  | Yes (PG)    | Yes | Gherkin at all 3 levels                     |
| `demo-be-csharp-aspnetcore` | App — API Backend | 1+2+3 | Yes  | Yes (PG)    | Yes | Gherkin at all 3 levels                     |
| `demo-be-clojure-pedestal`  | App — API Backend | 1+2+3 | Yes  | Yes (PG)    | Yes | Gherkin at all 3 levels                     |
| `demo-be-e2e`               | App — E2E Runner  | —     | —    | —           | Yes | Shared Playwright suite for all backends    |
| `organiclever-web`          | App — Web UI      | 1+2+3 | Yes  | Yes (MSW)   | Yes | E2E via `organiclever-web-e2e`              |
| `organiclever-web-e2e`      | App — E2E Runner  | —     | —    | —           | Yes | Playwright E2E for organiclever-web         |
| `oseplatform-web`           | App — Hugo Site   | —     | —    | —           | —   | Build + link validation only (`test:quick`) |
| `ayokoding-web`             | App — Hugo Site   | —     | —    | —           | —   | Build + link validation only (`test:quick`) |
| `ayokoding-cli`             | App — CLI         | 1+2   | Yes  | Yes (BDD)   | —   | Godog BDD integration tests                 |
| `oseplatform-cli`           | App — CLI         | 1+2   | Yes  | Yes (BDD)   | —   | Godog BDD integration tests                 |
| `rhino-cli`                 | App — CLI         | 1+2   | Yes  | Yes (BDD)   | —   | Godog BDD integration tests                 |
| `golang-commons`            | Library (Go)      | 1     | Yes  | Optional    | —   | Has Godog BDD (not required by rules)       |
| `hugo-commons`              | Library (Go)      | 1     | Yes  | Optional    | —   | Has Godog BDD (not required by rules)       |
| `elixir-cabbage`            | Library (Elixir)  | 1     | Yes  | —           | —   | Unit tests only                             |
| `elixir-gherkin`            | Library (Elixir)  | 1     | Yes  | —           | —   | Unit tests only                             |

**Legend**: PG = PostgreSQL via docker-compose, MSW = Mock Service Worker (in-process), BDD = Godog/feature file integration tests (no database). **Rule** column shows which of the three rules apply.

## Plan Documents

- [Requirements](./requirements.md) — Acceptance criteria (Gherkin scenarios)
- [Technical Design](./tech-docs.md) — Testing standard definitions, current state, gap analysis, implementation strategy, CI schedules
- [Delivery Checklist](./delivery.md) — Phase-by-phase implementation checklist with commit/push strategy
