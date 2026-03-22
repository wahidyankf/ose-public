---
title: How to Add a New Demo Backend
description: Step-by-step guide for creating a new demo-be backend implementation in a new language/framework
category: how-to
tags:
  - demo-be
  - backend
  - nx
  - codegen
  - testing
  - bdd
created: 2026-03-22
updated: 2026-03-22
---

# How to Add a New Demo Backend

This guide walks you through creating a new `demo-be-{lang}-{framework}` backend that implements
the shared demo API contract. The new backend will consume the same OpenAPI spec and Gherkin
scenarios as all other demo backends.

## Prerequisites

- The language runtime installed locally
- Familiarity with the [Three-Level Testing Standard](../../governance/development/quality/three-level-testing-standard.md)
- Understanding of the [OpenAPI contract](../../specs/apps/demo/contracts/README.md)

## Steps

### 1. Create the App Directory

```bash
mkdir -p apps/demo-be-{lang}-{framework}
```

Follow the naming convention: `demo-be-{language}-{framework}` (e.g., `demo-be-rust-axum`,
`demo-be-python-fastapi`).

### 2. Create `project.json`

Create `apps/demo-be-{lang}-{framework}/project.json` with these mandatory elements:

**Tags** (required):

```json
"tags": ["type:app", "platform:{framework}", "lang:{language}", "domain:demo-be"]
```

**Implicit dependencies** (required):

```json
"implicitDependencies": ["demo-contracts", "rhino-cli"]
```

**7 mandatory targets** (see [Nx Target Standards](../../governance/development/infra/nx-targets.md)):

| Target             | Purpose                                  | Cacheable |
| ------------------ | ---------------------------------------- | --------- |
| `codegen`          | Generate types from OpenAPI spec         | Yes       |
| `typecheck`        | Static type analysis                     | Yes       |
| `lint`             | Code linting                             | Yes       |
| `build`            | Production build                         | Yes       |
| `test:unit`        | Unit tests with mocked dependencies      | Yes       |
| `test:quick`       | Unit tests + coverage validation (>=90%) | Yes       |
| `test:integration` | Docker + real PostgreSQL tests           | No        |

**`codegen` target** must depend on `demo-contracts:bundle`:

```json
"codegen": {
  "dependsOn": ["demo-contracts:bundle"],
  "cache": true,
  "inputs": ["{workspaceRoot}/specs/apps/demo/contracts/generated/openapi-bundled.yaml"],
  "outputs": ["{projectRoot}/generated-contracts"]
}
```

**`test:unit` and `test:quick` inputs** must include Gherkin specs for cache invalidation:

```json
"inputs": [
  "{projectRoot}/src/**/*",
  "{projectRoot}/generated-contracts/**/*",
  "{workspaceRoot}/specs/apps/demo/be/gherkin/**/*.feature"
]
```

### 3. Set Up Codegen

Implement the `codegen` target command to generate types from the bundled OpenAPI spec at
`specs/apps/demo/contracts/generated/openapi-bundled.yaml` into a `generated-contracts/`
directory. The exact tool depends on your language:

| Language   | Tool                       | Output                           |
| ---------- | -------------------------- | -------------------------------- |
| Go         | oapi-codegen               | `generated-contracts/types.go`   |
| Java       | openapi-generator-maven    | `generated-contracts/` (models)  |
| Python     | datamodel-code-generator   | `generated_contracts/models.py`  |
| TypeScript | openapi-typescript-codegen | `generated-contracts/` (types)   |
| Rust       | Custom build.rs            | `generated-contracts/` (structs) |

Add `generated-contracts/` to `.gitignore` — generated code is not committed.

### 4. Implement the API

Implement the REST API endpoints defined in the
[OpenAPI contract](../../specs/apps/demo/contracts/README.md). All demo backends expose the
same endpoints with identical request/response shapes.

### 5. Set Up Three-Level Tests

#### Unit Tests (`tests/unit/` or equivalent)

- Consume shared Gherkin feature files from `specs/apps/demo/be/gherkin/`
- Call service/handler functions directly with **mocked repositories**
- No HTTP framework, no database, no Docker
- Coverage measured here (>=90% via `rhino-cli test-coverage validate`)

#### Integration Tests (`tests/integration/` or equivalent)

- Consume the same Gherkin feature files
- Call service/handler functions directly with **real PostgreSQL**
- **No HTTP calls** — see [anti-patterns](../../governance/development/quality/three-level-testing-standard.md#anti-patterns)
- Run via Docker Compose

#### E2E Tests

E2E tests are shared via `apps/demo-be-e2e/` — no per-backend E2E code needed.

### 6. Create Docker Infrastructure

**`docker-compose.integration.yml`**:

```yaml
services:
  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: demo_be_{abbrev}
      POSTGRES_PASSWORD: demo_be_{abbrev}
      POSTGRES_DB: demo_be_{abbrev}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U demo_be_{abbrev}"]
      interval: 2s
      timeout: 5s
      retries: 10

  test-runner:
    build:
      context: ../..
      dockerfile: apps/demo-be-{lang}-{framework}/Dockerfile.integration
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DATABASE_URL: postgresql://demo_be_{abbrev}:demo_be_{abbrev}@postgres:5432/demo_be_{abbrev}
    volumes:
      - ../../specs:/specs:ro
```

**`Dockerfile.integration`**: Language runtime + test execution. Mount specs read-only
and run integration test suite.

### 7. Set Up Coverage

Add coverage validation to `test:quick`:

```bash
# Pattern: run tests → generate coverage file → validate with rhino-cli
{test-command-with-coverage} && \
  rhino-cli test-coverage validate {coverage-file} 90
```

See [Code Coverage Reference](../reference/re__code-coverage.md) for per-language coverage
tools and file formats.

### 8. Update Repository Configuration

**`codecov.yml`** — Add a flag for your project:

```yaml
flags:
  demo-be-{lang}-{framework}:
    paths:
      - apps/demo-be-{lang}-{framework}/
    carryforward: true
```

**`.github/workflows/main-ci.yml`** — Add a coverage upload step:

```yaml
- name: Upload coverage — demo-be-{lang}-{framework}
  uses: codecov/codecov-action@v5
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
    files: apps/demo-be-{lang}-{framework}/{coverage-file}
    flags: demo-be-{lang}-{framework}
    fail_ci_if_error: false
```

**CI test workflow** — Create `.github/workflows/test-demo-be-{lang}-{framework}.yml` for
scheduled integration + E2E tests.

### 9. Create README.md

Follow the pattern of existing backend READMEs (e.g., `apps/demo-be-golang-gin/README.md`).
Include:

- Tech stack overview
- Local development instructions
- Nx targets table
- Test architecture (three levels)
- Related Documentation section linking to shared docs

Do **not** hardcode scenario or feature counts — reference the
[gherkin README](../../specs/apps/demo/be/gherkin/README.md) instead.

### 10. Verify

```bash
# Codegen works
nx run demo-be-{lang}-{framework}:codegen

# All quality gates pass
nx run demo-be-{lang}-{framework}:test:quick

# Dependency graph is correct
nx graph
```

## Related Documentation

- [Three-Level Testing Standard](../../governance/development/quality/three-level-testing-standard.md)
- [Nx Target Standards](../../governance/development/infra/nx-targets.md)
- [Code Coverage Reference](../reference/re__code-coverage.md)
- [Project Dependency Graph](../reference/re__project-dependency-graph.md)
- [BDD Spec-Test Mapping](../../governance/development/infra/bdd-spec-test-mapping.md)
- [Backend Gherkin Specs](../../specs/apps/demo/be/gherkin/README.md)
- [OpenAPI Contract](../../specs/apps/demo/contracts/README.md)
