# organiclever-be-e2e

End-to-end tests for the [organiclever-be](../organiclever-be) Spring Boot REST API backend,
using [playwright-bdd](https://github.com/vitalets/playwright-bdd) to drive tests from Gherkin
feature files.

Tests use Playwright's `APIRequestContext` to validate HTTP endpoints — no browser needed.

## What This Tests

Feature files in `specs/organiclever-be/` are the source of truth:

- `hello/hello-endpoint.feature` — `GET /api/v1/hello` returns greeting and respects CORS
- `actuator/health-check.feature` — `GET /actuator/health` reports service status

## Architecture

```
specs/organiclever-be/**/*.feature    ← source of truth (read-only)
        │
        ▼  (defineBddConfig reads features)
playwright.config.ts
        │
        ▼  (bddgen generates)
.features-gen/**/*.spec.ts            ← auto-generated, gitignored
        │
        ▼  (playwright test runs)
tests/steps/**/*.ts                   ← step implementations
tests/utils/response-store.ts         ← shared APIResponse state between steps
```

## Prerequisites

The backend must be running on `http://localhost:8201` before executing tests.

**Recommended — Docker Compose** (no local Java/Maven required):

```bash
cd infra/dev/organiclever && docker compose up -d
```

**Alternative — local Maven** (requires Maven installed):

```bash
nx dev organiclever-be
```

See [organiclever-be README](../organiclever-be/README.md) for full startup options.

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

# Pre-push quality gate (same as lint for E2E projects)
nx run organiclever-be-e2e:test:quick
```

**See**: [Nx Target Standards](../../governance/development/infra/nx-targets.md) for canonical E2E target names. `test:e2e` runs on a scheduled cron (twice daily at 6 AM and 6 PM WIB via GitHub Actions), not on pre-push.

## Environment Variables

| Variable   | Default                 | Description      |
| ---------- | ----------------------- | ---------------- |
| `BASE_URL` | `http://localhost:8201` | Backend base URL |
| `CI`       | unset                   | Enables CI mode  |

Override the base URL to test against a different environment:

```bash
BASE_URL=http://staging.example.com nx run organiclever-be-e2e:test:e2e
```

## Project Structure

```
apps/organiclever-be-e2e/
├── playwright.config.ts           # Playwright + playwright-bdd configuration
├── package.json                   # Dependencies (playwright, playwright-bdd)
├── tsconfig.json                  # TypeScript config
├── .gitignore                     # Ignores .features-gen/, test-results/, playwright-report/
├── tests/
│   ├── steps/                     # BDD step definitions
│   │   ├── common.steps.ts        # Shared: Given API running, Then status code
│   │   ├── hello/
│   │   │   └── hello.steps.ts     # When/Then for GET /api/v1/hello
│   │   └── actuator/
│   │       └── health.steps.ts    # When/Then for GET /actuator/health
│   └── utils/
│       └── response-store.ts      # Shared APIResponse state between steps
└── .features-gen/                 # Auto-generated spec files (gitignored)
```

## Step Implementation Notes

### Shared response state

`tests/utils/response-store.ts` holds the last `APIResponse` across When and Then steps within
a scenario. Module-level state is safe because scenarios run sequentially within a worker, and
`workers: 1` is set in CI. All requests are read-only GETs with no state mutation.

### Health details suppression

The scenario "Anonymous health check does not expose component details" validates that no
`components` key appears in the health response. This reflects `show-details: when-authorized`
in the base Spring config. If the backend runs with the dev profile (`show-details: always`),
this scenario will fail — which is expected, as E2E tests validate production-like behavior.

## Related

- [organiclever-be](../organiclever-be/README.md) — The backend being tested
- [specs/organiclever-be](../../specs/organiclever-be/) — Gherkin feature files (source of truth)
- [Playwright docs](../../docs/explanation/software-engineering/automation-testing/tools/playwright/README.md) — Playwright standards for this project
