# organiclever-be-e2e

End-to-end tests for the OrganicLever backend API (`organiclever-be`), using
[playwright-bdd](https://github.com/vitalets/playwright-bdd) to drive tests from Gherkin feature
files.

Tests use Playwright's `APIRequestContext` to validate HTTP endpoints — no browser needed.

## What This Tests

Feature files in `specs/apps/organiclever/be/gherkin/` are the source of truth:

- `health/health-check.feature` — `GET /health` reports service status

## Architecture

```
specs/apps/organiclever/be/gherkin/**/*.feature  ← source of truth (read-only)
        │
        ▼  (defineBddConfig reads features)
playwright.config.ts
        │
        ▼  (bddgen generates)
.features-gen/**/*.spec.ts                        ← auto-generated, gitignored
        │
        ▼  (playwright test runs)
steps/**/*.ts                                     ← step implementations
utils/response-store.ts                           ← shared APIResponse state between steps
```

## Prerequisites

The backend must be running on `http://localhost:8202` before executing tests.

**Start the backend with Docker Compose**:

```bash
cd apps/organiclever-be
docker compose -f docker-compose.integration.yml up -d
```

**Or run locally**:

```bash
nx dev organiclever-be
```

## Setup

Install Playwright and its dependencies (one-time setup):

```bash
nx install organiclever-be-e2e
cd apps/organiclever-be-e2e && npx playwright install --with-deps && cd ../..
```

## Running Tests

```bash
# Run all BDD E2E tests headlessly (generates specs then runs)
nx run organiclever-be-e2e:test:e2e

# Run with interactive Playwright UI
nx run organiclever-be-e2e:test:e2e:ui

# View HTML report from last run
nx run organiclever-be-e2e:test:e2e:report

# Generate spec files only (without running tests)
cd apps/organiclever-be-e2e && npx bddgen

# Lint TypeScript source files (oxlint)
nx run organiclever-be-e2e:lint

# Pre-push quality gate (lint + typecheck in parallel)
nx run organiclever-be-e2e:test:quick
```

**See**: [Nx Target Standards](../../governance/development/infra/nx-targets.md) for canonical E2E
target names. `test:e2e` runs on a scheduled cron (twice daily via GitHub Actions), not on
pre-push.

## Environment Variables

| Variable   | Default                 | Description                  |
| ---------- | ----------------------- | ---------------------------- |
| `BASE_URL` | `http://localhost:8202` | Backend base URL             |
| `CI`       | unset                   | Enables CI mode (no retries) |

Override the base URL to test against a different environment:

```bash
BASE_URL=http://staging.example.com nx run organiclever-be-e2e:test:e2e
```

## Project Structure

```
apps/organiclever-be-e2e/
├── playwright.config.ts         # Playwright + playwright-bdd configuration
├── package.json                 # Dependencies (playwright, playwright-bdd)
├── tsconfig.json                # TypeScript config
├── .gitignore                   # Ignores .features-gen/, test-results/, playwright-report/
├── steps/
│   ├── common.steps.ts          # Given API running, Before hook, Then status code, shared body assertions
│   └── health.steps.ts          # When/Then for GET /health
└── utils/
    └── response-store.ts        # Shared APIResponse state between steps
```

## Step Implementation Notes

### Shared response state

`utils/response-store.ts` holds the last `APIResponse` across When and Then steps within a
scenario. Module-level state is safe because scenarios run sequentially within a worker, and
`workers: 1` is configured.

### Before hook

The `Before` hook in `steps/common.steps.ts` runs before each scenario and clears the stored
`APIResponse` in `response-store.ts` to ensure test isolation.

## Related Documentation

- [Three-Level Testing Standard](../../governance/development/quality/three-level-testing-standard.md) — Unit, integration, and E2E testing boundaries
- [OrganicLever Backend](../organiclever-be/README.md) — The backend under test
- [Backend Gherkin Specs](../../specs/apps/organiclever/be/gherkin/) — Shared feature files (source of truth)
- [Playwright docs](../../docs/explanation/software-engineering/automation-testing/tools/playwright/README.md) — Playwright standards
