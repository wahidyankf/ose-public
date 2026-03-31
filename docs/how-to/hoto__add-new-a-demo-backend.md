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
updated: 2026-03-31
---

# How to Add a New Demo Backend

This guide walks you through creating a new `a-demo-be-{lang}-{framework}` backend that implements
the shared demo API contract. The new backend will consume the same OpenAPI spec and Gherkin
scenarios as all other demo backends.

## Prerequisites

- The language runtime installed locally
- Familiarity with the [Three-Level Testing Standard](../../governance/development/quality/three-level-testing-standard.md)
- Understanding of the [OpenAPI contract](../../specs/apps/a-demo/contracts/README.md)

## Steps

### 1. Create the App Directory

```bash
mkdir -p apps/a-demo-be-{lang}-{framework}
```

Follow the naming convention: `a-demo-be-{language}-{framework}` (e.g., `a-demo-be-rust-axum`,
`a-demo-be-python-fastapi`).

### 2. Create `project.json`

Create `apps/a-demo-be-{lang}-{framework}/project.json` with these mandatory elements.

#### Nx tags

Use the four-dimension tag scheme. Every dimension is required:

| Dimension   | Value                     | Example            |
| ----------- | ------------------------- | ------------------ |
| `type:`     | `app`                     | `type:app`         |
| `platform:` | Framework name            | `platform:gin`     |
| `lang:`     | Language name             | `lang:golang`      |
| `domain:`   | Fixed for all BE variants | `domain:a-demo-be` |

```json
"tags": ["type:app", "platform:{framework}", "lang:{language}", "domain:a-demo-be"]
```

Tags enable `nx affected` filtering and enforce dependency rules via Nx module boundary lint rules.

#### Implicit dependencies

```json
"implicitDependencies": ["a-demo-contracts", "rhino-cli"]
```

#### 7 mandatory targets

All `a-demo-be-*` backends must declare exactly these 7 targets (see [Nx Target Standards](../../governance/development/infra/nx-targets.md)):

| Target             | Purpose                                  | Cacheable |
| ------------------ | ---------------------------------------- | --------- |
| `codegen`          | Generate types from OpenAPI spec         | Yes       |
| `typecheck`        | Static type analysis                     | Yes       |
| `lint`             | Code linting                             | Yes       |
| `build`            | Production build                         | Yes       |
| `test:unit`        | Unit tests with mocked dependencies      | Yes       |
| `test:quick`       | Unit tests + coverage validation (>=90%) | Yes       |
| `test:integration` | Docker + real PostgreSQL tests           | No        |

#### Dependency chain

The dependency chain ensures codegen runs before any target that consumes generated types:

```
a-demo-contracts:bundle
        │
        ▼
    codegen
    ┌──────┴──────┐
    ▼             ▼
typecheck       build
```

`test:unit` and `test:quick` do not declare `codegen` as a `dependsOn` — generated contracts
must be present at `test:unit` time because the source code imports them at compile time, but this
dependency is satisfied by running `codegen` before the test targets (or via the CI setup step).
For languages like Rust and Dart where generated code is required at compile time for tests, declare
`codegen` as a `dependsOn` of `test:unit` explicitly.

#### `codegen` target

```json
"codegen": {
  "dependsOn": ["a-demo-contracts:bundle"],
  "cache": true,
  "inputs": ["{workspaceRoot}/specs/apps/a-demo/contracts/generated/openapi-bundled.yaml"],
  "outputs": ["{projectRoot}/generated-contracts"]
}
```

#### `typecheck` and `build` targets

Both must declare `codegen` as a dependency:

```json
"typecheck": {
  "dependsOn": ["codegen"],
  "cache": true
},
"build": {
  "dependsOn": ["codegen"],
  "outputs": ["{projectRoot}/dist"]
}
```

#### `test:unit` and `test:quick` inputs

Both targets must include the Gherkin specs in their `inputs` so that changing a feature file
invalidates the Nx cache and forces a re-run:

```json
"inputs": [
  "{projectRoot}/src/**/*",
  "{projectRoot}/generated-contracts/**/*",
  "{workspaceRoot}/specs/apps/a-demo/be/gherkin/**/*.feature"
]
```

#### `test:integration` target

Always set `cache: false` — this target starts Docker containers with a real PostgreSQL instance,
which is non-deterministic and must never be cached:

```json
"test:integration": {
  "executor": "nx:run-commands",
  "options": {
    "command": "docker compose -f docker-compose.integration.yml down -v && docker compose -f docker-compose.integration.yml up --abort-on-container-exit --build",
    "cwd": "apps/a-demo-be-{lang}-{framework}"
  },
  "cache": false
}
```

### 3. Set Up Codegen

Implement the `codegen` target command to generate types from the bundled OpenAPI spec at
`specs/apps/a-demo/contracts/generated/openapi-bundled.yaml` into a `generated-contracts/`
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
[OpenAPI contract](../../specs/apps/a-demo/contracts/README.md). All demo backends expose the
same endpoints with identical request/response shapes.

### 5. Set Up Gherkin Specs

The Gherkin feature files in `specs/apps/a-demo/be/gherkin/` are **shared across all demo backends**.
Do not create a new specs directory for the new backend — it must consume the existing specs.

#### Verify the specs directory exists

```bash
ls specs/apps/a-demo/be/gherkin/
```

The directory is pre-populated with feature files covering all endpoints in the OpenAPI contract.
If the directory does not exist yet (e.g., first backend ever), create it and add at least one
feature file per domain area:

```
specs/apps/a-demo/be/gherkin/
├── authentication/
│   ├── password-login.feature
│   └── token-lifecycle.feature
├── expenses/
│   └── expense-management.feature
├── health/
│   └── health-check.feature
└── README.md
```

See the [Gherkin specs README](../../specs/apps/a-demo/be/gherkin/README.md) for the full list of
feature files and scenario coverage.

#### Wire Gherkin consumption in tests

Both the unit and integration test suites must consume these feature files using the BDD runner
appropriate for the language:

| Language | BDD runner           | Spec import mechanism                          |
| -------- | -------------------- | ---------------------------------------------- |
| Go       | godog                | `godog.RunSuite()` reading `*.feature` by path |
| Java     | Cucumber-JVM         | `@CucumberOptions(features = "...")`           |
| Python   | pytest-bdd           | `@scenario` decorators or `scenarios()`        |
| Kotlin   | Cucumber-JVM         | `@CucumberOptions(features = "...")`           |
| F#       | SpecFlow or Reqnroll | `[<Binding>]` attributes                       |
| C#       | SpecFlow or Reqnroll | `[<Binding>]` attributes                       |
| Rust     | cucumber crate       | `World` derive + `main()` integration test     |
| Elixir   | Cabbage              | `use Cabbage.Feature, file: "..."`             |
| Clojure  | kaocha-cucumber      | `cucumber` test suite in `tests.edn`           |

The `test:unit` step implementations use mocked repositories. The `test:integration` step
implementations use the same feature files but connect to real PostgreSQL via `DATABASE_URL`.

### 6. Set Up Three-Level Tests

#### Unit Tests (`tests/unit/` or equivalent)

- Consume shared Gherkin feature files from `specs/apps/a-demo/be/gherkin/`
- Call service/handler functions directly with **mocked repositories**
- No HTTP framework, no database, no Docker
- Coverage measured here (>=90% via `rhino-cli test-coverage validate`)

#### Integration Tests (`tests/integration/` or equivalent)

- Consume the same Gherkin feature files
- Call service/handler functions directly with **real PostgreSQL**
- **No HTTP calls** — see [anti-patterns](../../governance/development/quality/three-level-testing-standard.md#anti-patterns)
- Run via Docker Compose

#### E2E Tests

E2E tests are shared via `apps/a-demo-be-e2e/` — no per-backend E2E code needed.

### 7. Create Docker Infrastructure

Docker infrastructure consists of four files. All four are required before the first commit.

#### Production `Dockerfile`

Create `apps/a-demo-be-{lang}-{framework}/Dockerfile` following the multi-stage template from the
[CI/CD Conventions](../../governance/development/infra/ci-conventions.md). All production
Dockerfiles must satisfy these requirements:

- **Multi-stage build**: Separate dependency installation, build, and runtime stages.
- **Dependency-manifest-first ordering**: Copy the language manifest file (e.g., `go.mod go.sum`,
  `pom.xml`, `requirements.txt`) before source code so the dependency layer is cached across
  code-only changes.
- **Non-root user**: Create a system group and user; run the final stage as that user.
- **HEALTHCHECK with `wget`**: Use `wget`, not `curl` — many minimal base images (Alpine,
  distroless) include `wget` but not `curl`.
- **OCI labels**: Include both `org.opencontainers.image.source` and
  `org.opencontainers.image.description` labels on the final stage.

Example skeleton (adapt language-specific commands):

```dockerfile
# syntax=docker/dockerfile:1

# Stage 1: dependency manifest layer
FROM {base-image} AS deps
WORKDIR /app
COPY {manifest-files} ./
RUN {install-deps-command}

# Stage 2: build
FROM deps AS builder
COPY . .
RUN {build-command}

# Stage 3: production runtime
FROM {runtime-image} AS runner
WORKDIR /app

LABEL org.opencontainers.image.source="https://github.com/open-sharia-enterprise/open-sharia-enterprise"
LABEL org.opencontainers.image.description="a-demo-be-{lang}-{framework} REST API"

RUN addgroup --system --gid 1001 appgroup \
  && adduser --system --uid 1001 appuser
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
USER appuser

EXPOSE {port}
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:{port}/health || exit 1

CMD ["{start-command}"]
```

#### `infra/dev/{app}/docker-compose.yml`

The dev compose file provides hot-reload development with source mounts and named volumes for data
persistence across restarts:

```yaml
# Local development environment for a-demo-be-{lang}-{framework}
# Mutually exclusive with other demo-be backends — all bind port 8201.
# Do not run multiple backend stacks simultaneously.

services:
  a-demo-be-{lang}-{framework}-db:
    image: postgres:17-alpine
    container_name: a-demo-be-{lang}-{framework}-db
    environment:
      POSTGRES_DB: a_demo_be_{abbrev}
      POSTGRES_USER: ${POSTGRES_USER:-a_demo_be_{abbrev}}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-a_demo_be_{abbrev}}
    ports:
      - "5432:5432"
    volumes:
      - a-demo-be-{lang}-{framework}-db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-a_demo_be_{abbrev}} -d a_demo_be_{abbrev}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
    restart: unless-stopped
    networks:
      - a-demo-be-{lang}-{framework}-network

  a-demo-be-{lang}-{framework}:
    build:
      context: .
      dockerfile: Dockerfile.be.dev
    container_name: a-demo-be-{lang}-{framework}
    working_dir: /workspace
    volumes:
      - ../../../apps/a-demo-be-{lang}-{framework}:/workspace:rw
      - ../../../specs/apps/a-demo/be/gherkin:/specs/apps/a-demo/be/gherkin:ro
    ports:
      - "8201:8201"
    depends_on:
      a-demo-be-{lang}-{framework}-db:
        condition: service_healthy
    environment:
      - PORT=8201
      - DATABASE_URL=postgresql://a_demo_be_{abbrev}:a_demo_be_{abbrev}@a-demo-be-{lang}-{framework}-db:5432/a_demo_be_{abbrev}
      - APP_JWT_SECRET=${APP_JWT_SECRET:-change-me-in-dev-only-not-for-production}
    command: { hot-reload-command }
    restart: unless-stopped
    networks:
      - a-demo-be-{lang}-{framework}-network

networks:
  a-demo-be-{lang}-{framework}-network:
    driver: bridge
    name: a-demo-be-{lang}-{framework}-network

volumes:
  a-demo-be-{lang}-{framework}-db-data:
```

All demo backends expose port 8201 — run only one at a time locally.

#### `apps/{app}/docker-compose.integration.yml`

The integration compose file runs in CI and locally for `test:integration`. It uses `tmpfs` for the
PostgreSQL data directory (ephemeral, faster), and `--abort-on-container-exit` ensures the compose
command exits with the test-runner's exit code:

```yaml
services:
  postgres:
    image: postgres:17-alpine
    environment:
      POSTGRES_DB: a_demo_be_{abbrev}_test
      POSTGRES_USER: a_demo_be_{abbrev}
      POSTGRES_PASSWORD: a_demo_be_{abbrev}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U a_demo_be_{abbrev} -d a_demo_be_{abbrev}_test"]
      interval: 2s
      timeout: 5s
      retries: 10
    ports:
      - "5432"
    tmpfs:
      - /var/lib/postgresql/data

  test-runner:
    build:
      context: ../..
      dockerfile: apps/a-demo-be-{lang}-{framework}/Dockerfile.integration
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      DATABASE_URL: "postgresql://a_demo_be_{abbrev}:a_demo_be_{abbrev}@postgres:5432/a_demo_be_{abbrev}_test"
    volumes:
      - ../../specs:/specs:ro
```

The `test:integration` Nx target runs this file with `--abort-on-container-exit --build` so that
the exit code propagates correctly to Nx.

#### `infra/dev/{app}/docker-compose.ci.yml`

The CI overlay is applied on top of the dev compose file for E2E test runs in GitHub Actions. It
overrides the backend service to run in production mode, enables the test-only API, and adds the
default frontend service:

```yaml
# CI overlay — production-equivalent mode + test-only API + Next.js frontend
# Usage:
#   BE E2E: docker compose -f docker-compose.yml -f docker-compose.ci.yml up --build -d a-demo-be-{lang}-{framework}
#   FE E2E: docker compose -f docker-compose.yml -f docker-compose.ci.yml up --build -d

services:
  a-demo-be-{lang}-{framework}:
    environment:
      - {FRAMEWORK_MODE_VAR}=production
      - ENABLE_TEST_API=true

  demo-fe:
    build:
      context: ../../..
      dockerfile: apps/a-demo-fe-ts-nextjs/Dockerfile
      args:
        BACKEND_URL: http://a-demo-be-{lang}-{framework}:8201
    container_name: a-demo-be-{abbrev}-ci-fe
    ports:
      - "3301:3301"
    depends_on:
      a-demo-be-{lang}-{framework}:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - a-demo-be-{lang}-{framework}-network
```

The CI overlay follows the E2E pairing rule: every backend variant pairs with the default frontend
`a-demo-fe-ts-nextjs` for E2E tests.

#### `apps/{app}/Dockerfile.integration`

The integration test container installs only the language runtime and test dependencies — no
production server is built. The specs directory is mounted read-only at `/specs` by the compose
file. Exit code handling is critical: the CMD must exit with the test process's exact exit code so
`--abort-on-container-exit` can propagate it:

```dockerfile
# Integration test runner
# Runs integration tests against the postgres service from docker-compose.integration.yml.
FROM {lang-runtime-image}

RUN {install-build-tools}

WORKDIR /build

# Copy manifest first for layer caching.
COPY {manifest-files} ./
RUN {install-deps-command}

# Copy source code.
COPY . .
COPY generated-contracts/ generated-contracts/

# /specs is mounted read-only by docker-compose.integration.yml.
# DATABASE_URL is injected by docker-compose as an environment variable.
CMD ["sh", "-c", "{integration-test-command}; exit $?"]
```

**Note**: The `sh -c "...; exit $?"` wrapper ensures the shell exits with the test command's exit
code rather than always 0.

### 8. Create `.env.example`

Create `infra/dev/a-demo-be-{lang}-{framework}/.env.example`. This file documents all environment
variables that the app and its dev compose stack require. Every variable must have a comment
explaining its purpose. The file is committed to the repository; the actual `.env` is gitignored.

```bash
# Demo Backend ({Language}/{Framework}) Environment Variables
# Copy this file to .env and configure as needed.

# Database credentials for local dev PostgreSQL container
POSTGRES_USER=a_demo_be_{abbrev}
POSTGRES_PASSWORD=a_demo_be_{abbrev}

# JWT signing secret — minimum 32 characters for HS256 security.
# Must be changed to a cryptographically random value in production.
APP_JWT_SECRET=change-me-in-dev-only-not-for-production

# Database URL for the app service (used at runtime)
DATABASE_URL=postgresql://a_demo_be_{abbrev}:a_demo_be_{abbrev}@a-demo-be-{lang}-{framework}-db:5432/a_demo_be_{abbrev}

# {Language/framework-specific variables go here}
# Example for a framework mode variable:
# GIN_MODE=debug
```

Requirements from [CI/CD Conventions](../../governance/development/infra/ci-conventions.md):

- The compose service must load variables via `env_file: .env`, not hardcoded `environment:` values
  (except for non-secret defaults that use `${VAR:-default}` syntax).
- `.env*.local` files must be listed in `.gitignore` and must never be committed.
- When adding a new variable to the app, update `.env.example` in the same commit.

### 9. Set Up Coverage

Add coverage validation to `test:quick`:

```bash
# Pattern: run tests → generate coverage file → validate with rhino-cli
{test-command-with-coverage} && \
  rhino-cli test-coverage validate {coverage-file} 90
```

See [Code Coverage Reference](../reference/re__code-coverage.md) for per-language coverage
tools and file formats.

### 10. Create the per-variant CI workflow

Create `.github/workflows/test-a-demo-be-{lang}-{framework}.yml`. Keep it to approximately 40
lines by inlining the job steps directly rather than duplicating setup logic across jobs. The file
follows the 5-track parallel structure (lint, typecheck, test:quick, spec-coverage,
integration → E2E), though integration and E2E are sequenced within a single job:

```yaml
name: Test - Demo BE ({Language}/{Framework})

on:
  schedule:
    - cron: "0 23 * * *" # 6 AM WIB (UTC+7)
    - cron: "0 11 * * *" # 6 PM WIB (UTC+7)
  workflow_dispatch:

permissions:
  contents: read

jobs:
  integration-tests:
    name: Run integration tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "24"
      - name: Setup {Language}
        uses: ./.github/actions/setup-{lang}
      - name: Generate contract types for backend
        run: |
          npm ci --ignore-scripts
          npx nx run a-demo-contracts:bundle
          npx nx run a-demo-be-{lang}-{framework}:codegen
      - name: Run integration tests
        run: |
          docker compose -f apps/a-demo-be-{lang}-{framework}/docker-compose.integration.yml down -v 2>/dev/null || true
          docker compose -f apps/a-demo-be-{lang}-{framework}/docker-compose.integration.yml up --abort-on-container-exit --build
      - name: Teardown integration
        if: always()
        run: docker compose -f apps/a-demo-be-{lang}-{framework}/docker-compose.integration.yml down -v

  e2e:
    name: Run E2E tests
    needs: integration-tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: volta-cli/action@v4
      - name: Setup {Language}
        uses: ./.github/actions/setup-{lang}
      - name: Generate contract types
        run: |
          npm ci --ignore-scripts
          npx nx run a-demo-contracts:bundle
          npx nx run a-demo-be-{lang}-{framework}:codegen
          npx nx run a-demo-fe-ts-nextjs:codegen
          npx nx run a-demo-fe-ts-tanstack-start:codegen
      - name: Install dependencies
        run: npm ci
      - name: Start full stack (DB + backend + frontend)
        run: docker compose -f infra/dev/a-demo-be-{lang}-{framework}/docker-compose.yml -f infra/dev/a-demo-be-{lang}-{framework}/docker-compose.ci.yml up --build -d
      - name: Wait for backend to be healthy
        run: |
          for i in $(seq 1 24); do
            STATUS=$(docker inspect --format='{{.State.Health.Status}}' 'a-demo-be-{lang}-{framework}' 2>/dev/null || echo "unknown")
            if [ "$STATUS" = "healthy" ]; then echo "Backend is healthy"; break; fi
            sleep 10
          done
          [ "$STATUS" = "healthy" ] || { docker logs a-demo-be-{lang}-{framework}; exit 1; }
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium
        working-directory: apps/a-demo-fe-e2e
      - name: Run BE E2E tests
        run: npx nx run a-demo-be-e2e:test:e2e
        env:
          BASE_URL: http://localhost:8201
      - name: Upload BE E2E report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-a-demo-be-{lang}-{framework}
          path: apps/a-demo-be-e2e/playwright-report/
          retention-days: 7
      - name: Stop full stack
        if: always()
        run: docker compose -f infra/dev/a-demo-be-{lang}-{framework}/docker-compose.yml -f infra/dev/a-demo-be-{lang}-{framework}/docker-compose.ci.yml down -v
```

CRON schedules run twice daily aligned to WIB (UTC+7) business hours: 06:00 WIB (23:00 UTC previous
day) and 18:00 WIB (11:00 UTC). See
[CI/CD Conventions](../../governance/development/infra/ci-conventions.md) for the rationale.

### 11. Add composite action if using a new language

If the language does not already have a composite action under `.github/actions/`, create one before
wiring it into any workflow. Composite actions centralise tool version pinning and dependency
caching so every workflow that uses the language picks up changes in one place.

Create `.github/actions/setup-{lang}/action.yml`:

```yaml
name: Setup {Language}
description: Install {Language} runtime and configure dependency caching

runs:
  using: composite
  steps:
    - name: Install {Language}
      uses: {appropriate-setup-action}
      with:
        {lang}-version: "{version}"

    - name: Cache dependencies
      uses: actions/cache@v4
      with:
        path: {cache-path}
        key: ${{ runner.os }}-{lang}-${{ hashFiles('{lockfile-glob}') }}
        restore-keys: |
          ${{ runner.os }}-{lang}-

    - name: Install {lang}-specific tools
      shell: bash
      run: |
        {tool-install-commands}
```

Existing composite actions to reference:

```
.github/actions/setup-golang/action.yml
.github/actions/setup-java/action.yml
.github/actions/setup-node/action.yml
.github/actions/setup-python/action.yml
```

### 12. Add to the PR quality gate

The PR quality gate (`pr-quality-gate.yml`) already sets up all current languages in its setup
steps. If your backend uses a language not yet present in that workflow, add the corresponding
setup step alongside the existing language setup steps. The `nx affected` calls at the end of the
workflow automatically pick up the new project — no per-project job is needed.

Add any language-specific tool installation (linters, codegen tools) to the existing setup block,
following the pattern of existing language entries:

```yaml
- name: Setup {Language}
  uses: ./.github/actions/setup-{lang}

- name: Install {Language}-specific tools
  run: { tool-install-command }

- name: Install {Language} dependencies
  run: (cd apps/a-demo-be-{lang}-{framework} && {install-command})
```

If the new language requires a `codegen` step before `typecheck` can run (because generated types
are imported at compile time), add the app to the existing `Generate contract types` step:

```yaml
- name: Generate contract types (required before typecheck/test:quick)
  run: |
    npx nx run a-demo-contracts:bundle
    npx nx run-many -t codegen --projects=demo-*,organiclever-*
    # The run-many above covers all demo-* projects including the new backend
    # if the project.json declares the codegen target correctly.
```

If `run-many --projects=demo-*` does not pick up the new backend (e.g., due to a naming
mismatch), add an explicit call:

```yaml
npx nx run a-demo-be-{lang}-{framework}:codegen
```

### 13. Add to `codecov-upload.yml`

**`codecov.yml`** — Add a coverage flag:

```yaml
flags:
  a-demo-be-{lang}-{framework}:
    paths:
      - apps/a-demo-be-{lang}-{framework}/
    carryforward: true
```

**`.github/workflows/codecov-upload.yml`** — Add a coverage upload step after the existing backend
upload steps. The step name follows the pattern `Upload coverage — {app-name}`. The `files` path
depends on the coverage tool used by the language:

```yaml
- name: Upload coverage — a-demo-be-{lang}-{framework}
  uses: codecov/codecov-action@v5
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
    files: apps/a-demo-be-{lang}-{framework}/{coverage-file}
    flags: a-demo-be-{lang}-{framework}
    disable_search: true
    fail_ci_if_error: false
```

Common coverage file paths by language:

| Language   | Coverage format  | Path example                                                   |
| ---------- | ---------------- | -------------------------------------------------------------- |
| Go         | go cover.out     | `apps/a-demo-be-golang-gin/cover.out`                          |
| Java/Maven | JaCoCo XML       | `apps/a-demo-be-java-springboot/target/site/jacoco/jacoco.xml` |
| Python     | LCOV             | `apps/a-demo-be-python-fastapi/coverage/lcov.info`             |
| Rust       | LCOV             | `apps/a-demo-be-rust-axum/coverage/lcov.info`                  |
| F#         | AltCover LCOV    | `apps/a-demo-be-fsharp-giraffe/coverage/altcov.info`           |
| C#         | Coverlet LCOV    | `apps/a-demo-be-csharp-aspnetcore/coverage/**/coverage.info`   |
| Kotlin     | Kover XML        | `apps/a-demo-be-kotlin-ktor/build/reports/kover/report.xml`    |
| Clojure    | cloverage LCOV   | `apps/a-demo-be-clojure-pedestal/coverage/lcov.info`           |
| Elixir     | excoveralls LCOV | `apps/a-demo-be-elixir-phoenix/cover/lcov.info`                |

If the language emits relative `SF:` paths in the LCOV file (relative to the project root rather
than the workspace root), add a path-fix step to the `codecov-upload.yml` alongside the existing
fixes:

```bash
lcov="apps/a-demo-be-{lang}-{framework}/coverage/lcov.info"
if [ -f "$lcov" ]; then
  sed -i "s|^SF:|SF:apps/a-demo-be-{lang}-{framework}/|" "$lcov"
fi
```

Also add the language runtime setup step to `codecov-upload.yml` if it is not already present,
following the pattern of existing setup steps in that file.

### 14. Create README.md

Follow the pattern of existing backend READMEs (e.g., `apps/a-demo-be-golang-gin/README.md`).
Include:

- Tech stack overview
- Local development instructions
- Nx targets table
- Test architecture (three levels)
- Related Documentation section linking to shared docs

Do **not** hardcode scenario or feature counts — reference the
[gherkin README](../../specs/apps/a-demo/be/gherkin/README.md) instead.

### 15. Verify

```bash
# Codegen works
nx run a-demo-be-{lang}-{framework}:codegen

# All quality gates pass
nx run a-demo-be-{lang}-{framework}:test:quick

# Dependency graph is correct
nx graph
```

## Related Documentation

- [Three-Level Testing Standard](../../governance/development/quality/three-level-testing-standard.md)
- [CI/CD Conventions](../../governance/development/infra/ci-conventions.md)
- [Nx Target Standards](../../governance/development/infra/nx-targets.md)
- [Code Coverage Reference](../reference/re__code-coverage.md)
- [Project Dependency Graph](../reference/re__project-dependency-graph.md)
- [BDD Spec-Test Mapping](../../governance/development/infra/bdd-spec-test-mapping.md)
- [Backend Gherkin Specs](../../specs/apps/a-demo/be/gherkin/README.md)
- [OpenAPI Contract](../../specs/apps/a-demo/contracts/README.md)
