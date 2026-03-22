---
title: How to Run Demo Integration and E2E Tests
description: Step-by-step guide for running integration tests (Docker + PostgreSQL) and E2E tests (Playwright) for demo apps
category: how-to
tags:
  - testing
  - docker
  - playwright
  - integration
  - e2e
  - demo-be
  - demo-fe
created: 2026-03-22
updated: 2026-03-22
---

# How to Run Demo Integration and E2E Tests

This guide explains how to run integration and E2E tests for demo backends and frontends
locally. Unit tests run without any external dependencies; integration and E2E tests require
Docker and/or Playwright.

## Prerequisites

- Docker and Docker Compose installed
- Node.js 24 (managed by Volta)
- `npm install` completed at the workspace root
- Playwright browsers installed: `npx playwright install`

## Unit Tests (No Docker Required)

Unit tests use mocked dependencies and run fast. They are the default for local development.

```bash
# Run unit tests for a specific backend
nx run demo-be-golang-gin:test:unit

# Run unit + coverage validation (pre-push gate)
nx run demo-be-golang-gin:test:quick

# Run for all affected projects
nx affected -t test:quick
```

## Integration Tests (Docker + PostgreSQL)

Integration tests call service functions directly against a real PostgreSQL database.
No HTTP layer is involved.

### How It Works

Each backend has:

- `docker-compose.integration.yml` — Defines `postgres` (PostgreSQL 17) and `test-runner` services
- `Dockerfile.integration` — Language runtime + test execution container

The test runner:

1. Waits for PostgreSQL to be healthy
2. Runs database migrations
3. Executes all shared Gherkin scenarios against real SQL
4. Tears down containers on completion

### Running

```bash
# Run integration tests for a specific backend
nx run demo-be-golang-gin:test:integration

# This is equivalent to:
cd apps/demo-be-golang-gin
docker compose -f docker-compose.integration.yml down -v
docker compose -f docker-compose.integration.yml up --abort-on-container-exit --build
```

### Troubleshooting

**Port conflicts**: If PostgreSQL port 5432 is already in use, the docker-compose file
uses internal networking — the host port is not exposed. Conflicts only occur if another
docker-compose stack is running with the same service names.

**Stale containers**: If tests fail with connection errors, tear down and rebuild:

```bash
cd apps/demo-be-{lang}-{framework}
docker compose -f docker-compose.integration.yml down -v
docker compose -f docker-compose.integration.yml up --abort-on-container-exit --build
```

**Database URL format**: All demo backends use:

```
postgresql://{user}:{password}@postgres:5432/{dbname}
```

The `postgres` hostname refers to the Docker Compose service, not `localhost`.

## E2E Tests (Playwright)

E2E tests send real HTTP requests via Playwright to a running backend with a real database.

### Backend E2E (`demo-be-e2e`)

Tests live in `apps/demo-be-e2e/` and test any of the 11 backends.

**Start the backend first**, then run E2E:

```bash
# Terminal 1: Start the backend
nx run demo-be-golang-gin:dev

# Terminal 2: Run E2E tests
nx run demo-be-e2e:test:e2e
```

The `BASE_URL` defaults to `http://localhost:8080`. Override with an environment variable
if your backend runs on a different port.

### Frontend E2E (`demo-fe-e2e`)

Tests live in `apps/demo-fe-e2e/` and test any of the 3 frontends.

**Start both the backend and frontend**, then run E2E:

```bash
# Terminal 1: Start the backend
nx run demo-be-golang-gin:dev

# Terminal 2: Start the frontend
nx run demo-fe-ts-nextjs:dev

# Terminal 3: Run E2E tests
nx run demo-fe-e2e:test:e2e
```

### Running in UI Mode

Playwright UI mode provides a visual debugger:

```bash
nx run demo-be-e2e:test:e2e:ui
nx run demo-fe-e2e:test:e2e:ui
```

### CI Integration

In CI, integration and E2E tests run together in per-service GitHub Actions workflows:

1. PostgreSQL starts via docker-compose
2. Integration tests run (direct service calls + real DB)
3. Application server starts
4. E2E tests run via Playwright

See [CI/CD Reference](../reference/system-architecture/re-syar__ci-cd.md) for workflow details.

## Summary

| Level       | Command                             | Requires        | Cached |
| ----------- | ----------------------------------- | --------------- | ------ |
| Unit        | `nx run {project}:test:unit`        | Nothing         | Yes    |
| Quick       | `nx run {project}:test:quick`       | Nothing         | Yes    |
| Integration | `nx run {project}:test:integration` | Docker          | No     |
| E2E (BE)    | `nx run demo-be-e2e:test:e2e`       | Running backend | No     |
| E2E (FE)    | `nx run demo-fe-e2e:test:e2e`       | Running stack   | No     |

## Related Documentation

- [Three-Level Testing Standard](../../governance/development/quality/three-level-testing-standard.md)
- [Nx Target Standards](../../governance/development/infra/nx-targets.md)
- [Backend Gherkin Specs](../../specs/apps/demo/be/gherkin/README.md)
- [Frontend Gherkin Specs](../../specs/apps/demo/fe/gherkin/README.md)
- [Playwright Standards](../explanation/software-engineering/automation-testing/tools/playwright/README.md)
