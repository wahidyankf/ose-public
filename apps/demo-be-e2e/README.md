# demo-be-e2e

End-to-end tests for the demo-be REST API backends (default: [demo-be-golang-gin](../demo-be-golang-gin)),
using [playwright-bdd](https://github.com/vitalets/playwright-bdd) to drive tests from Gherkin
feature files.

Tests use Playwright's `APIRequestContext` to validate HTTP endpoints — no browser needed.

## What This Tests

Feature files in `specs/apps/demo/be/gherkin/` are the source of truth:

- `health/health-check.feature, authentication/_, user-lifecycle/_, security/_, token-management/_, admin/_, expenses/_, expenses/\*
- `
- `
- `
- `health/health-check.feature` — `GET /health` reports service status

## Architecture

```
specs/apps/demo/be/gherkin/**/*.feature    ← source of truth (read-only)
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

The backend must be running on `http://localhost:8201` before executing tests. Auth tests also
require a live PostgreSQL database (the E2E `Before` hook deletes all users before each scenario).

**Recommended — Docker Compose** (no local Java/Maven required):

```bash
cd infra/dev/demo-be-golang-gin
cp .env.example .env  # set POSTGRES_USER, POSTGRES_PASSWORD, APP_JWT_SECRET
docker compose up -d
```

**Alternative — local Maven** (requires Maven installed):

```bash
nx dev demo-be-golang-gin
```

See [demo-be-golang-gin README](../demo-be-golang-gin/README.md) for full startup options.

## Setup

Install Playwright and its dependencies (one-time setup):

```bash
nx install demo-be-e2e
cd apps/demo-be-e2e && npx playwright install --with-deps && cd ../..
```

## Running Tests

```bash
# Run all BDD E2E tests headlessly (generates specs then runs)
nx run demo-be-e2e:test:e2e

# Run with interactive Playwright UI
nx run demo-be-e2e:test:e2e:ui

# View HTML report from last run
nx run demo-be-e2e:test:e2e:report

# Generate spec files only (without running tests)
cd apps/demo-be-e2e && npx bddgen

# Lint TypeScript source files (oxlint)
nx run demo-be-e2e:lint

# Pre-push quality gate (same as lint for E2E projects)
nx run demo-be-e2e:test:quick
```

**See**: [Nx Target Standards](../../governance/development/infra/nx-targets.md) for canonical E2E target names. `test:e2e` runs on a scheduled cron (twice daily at 6 AM and 6 PM WIB via GitHub Actions), not on pre-push.

## Environment Variables

| Variable       | Default                                                         | Description                              |
| -------------- | --------------------------------------------------------------- | ---------------------------------------- |
| `BASE_URL`     | `http://localhost:8201`                                         | Backend base URL                         |
| `DATABASE_URL` | `postgresql://organiclever:organiclever@localhost:5432/demo_be` | PostgreSQL connection string for cleanup |
| `CI`           | unset                                                           | Enables CI mode                          |

The `DATABASE_URL` is used by `tests/fixtures/db-cleanup.ts` to delete all rows from `users`
before each scenario. This requires the `pg` package (installed as a devDependency).

Override the base URL to test against a different environment:

```bash
BASE_URL=http://staging.example.com nx run demo-be-e2e:test:e2e
```

## Project Structure

```
apps/demo-be-e2e/
├── playwright.config.ts           # Playwright + playwright-bdd configuration
├── package.json                   # Dependencies (playwright, playwright-bdd, pg)
├── tsconfig.json                  # TypeScript config
├── .gitignore                     # Ignores .features-gen/, test-results/, playwright-report/
├── tests/
│   ├── fixtures/
│   │   └── db-cleanup.ts          # Deletes all users via pg before each scenario
│   ├── hooks/
│   │   └── db.hooks.ts            # Before hook calling cleanupDatabase + clearToken
│   ├── steps/                     # BDD step definitions
│   │   ├── auth/
│   │   │   └── auth.steps.ts      # Given/When/Then for register, login, JWT scenarios
│   │   ├── common.steps.ts        # Shared: Given API running, Then status code
│   │   ├── hello/
│   │   │   └── hello.steps.ts     # When/Then for GET /api/v1/hello
│   │   └── health/
│   │       └── health.steps.ts    # When/Then for GET /health
│   └── utils/
│       ├── response-store.ts      # Shared APIResponse state between steps
│       └── token-store.ts         # Stored JWT token for JWT-protected scenarios
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

- [demo-be-java-springboot](../demo-be-java-springboot/README.md) — The backend being tested
- [specs/apps/demo/be/gherkin](../../specs/apps/demo/be/gherkin/) — Gherkin feature files (source of truth)
- [Playwright docs](../../docs/explanation/software-engineering/automation-testing/tools/playwright/README.md) — Playwright standards for this project
