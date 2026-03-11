# organiclever-web-e2e

End-to-end tests for the [organiclever-web](../organiclever-web) Next.js landing and promotional website.

Tests are driven by Gherkin feature files in [`specs/apps/organiclever-web/`](../../specs/apps/organiclever-web/) using [playwright-bdd](https://github.com/vitalets/playwright-bdd). The `bddgen` tool generates Playwright spec files from feature files before running tests.

## Architecture

```
specs/apps/organiclever-web/**/*.feature   ← source of truth (Gherkin scenarios)
        │
        ▼  (bddgen generates)
.features-gen/**/*.spec.ts            ← auto-generated, gitignored
        │
        ▼  (playwright test runs)
tests/steps/**/*.ts                   ← step implementations
tests/utils/auth.ts                   ← shared login helper
tests/utils/test-config.ts            ← shared configuration
```

## Prerequisites

The frontend must be running on `http://localhost:3200` before executing tests.

**Recommended — Docker Compose** (starts both backend and frontend):

```bash
npm run organiclever-web:dev
```

**Alternative — Nx dev server** (Next.js only):

```bash
nx dev organiclever-web
```

See [organiclever-web README](../organiclever-web/README.md) for full startup options.

## Setup

Install Playwright browsers and their dependencies (one-time setup):

```bash
nx install organiclever-web-e2e
cd apps/organiclever-web-e2e && npx playwright install --with-deps && cd ../..
```

## Running Tests

```bash
# Run all E2E tests headlessly (generates spec files then runs)
nx run organiclever-web-e2e:test:e2e

# Run with interactive Playwright UI
nx run organiclever-web-e2e:test:e2e:ui

# View HTML report from last run
nx run organiclever-web-e2e:test:e2e:report

# Lint TypeScript source files (oxlint)
nx run organiclever-web-e2e:lint

# Pre-push quality gate (same as lint for E2E projects)
nx run organiclever-web-e2e:test:quick
```

**See**: [Nx Target Standards](../../governance/development/infra/nx-targets.md) for canonical E2E target names. `test:e2e` runs on a scheduled cron (twice daily at 6 AM and 6 PM WIB via GitHub Actions), not on pre-push.

Override the base URL to test against a different environment:

```bash
BASE_URL=http://staging.example.com nx run organiclever-web-e2e:test:e2e
```

### Manual BDD workflow

```bash
cd apps/organiclever-web-e2e

# Generate spec files from feature files
npx bddgen

# Run generated tests (all browsers)
npx playwright test

# Run on Chromium only (faster)
npx playwright test --project=chromium
```

## Environment Variables

| Variable   | Default                 | Description       |
| ---------- | ----------------------- | ----------------- |
| `BASE_URL` | `http://localhost:3200` | Frontend base URL |
| `CI`       | unset                   | Enables CI mode   |

## Project Structure

```
apps/organiclever-web-e2e/
├── playwright.config.ts       # Playwright + BDD configuration
├── package.json               # playwright-bdd + @playwright/test dependencies
├── tsconfig.json              # TypeScript config (includes .features-gen/)
├── .gitignore                 # Excludes .features-gen/, test-results/, playwright-report/
├── tests/
│   ├── utils/
│   │   ├── auth.ts            # loginWithUI() and logoutViaAPI() helpers
│   │   └── test-config.ts     # Shared test configuration
│   └── steps/
│       ├── common.steps.ts            # Shared Given/Then across features
│       ├── landing/
│       │   └── landing.steps.ts       # Landing page steps
│       ├── auth/
│       │   ├── login.steps.ts         # Login form steps
│       │   ├── logout.steps.ts        # Logout steps
│       │   └── route-protection.steps.ts  # Protected route steps
│       ├── dashboard/
│       │   └── dashboard.steps.ts     # Dashboard overview steps
│       └── members/
│           ├── member-list.steps.ts   # Member list and search steps
│           ├── member-detail.steps.ts # Member detail page steps
│           ├── member-editing.steps.ts    # Edit dialog steps (restores data)
│           └── member-deletion.steps.ts   # Delete dialog steps (restores data)
└── .features-gen/             # Auto-generated spec files (gitignored)
```

## State Restoration for Destructive Tests

The member editing and deletion features mutate `apps/organiclever-web/src/data/members.json`. Both step files use `Before`/`After` hooks tagged with `@member-editing` and `@member-deletion` respectively to restore the original JSON before and after each scenario. The Next.js API routes read the file on every request with no caching, so disk writes take effect immediately.

## Related

- [specs/apps/organiclever-web/](../../specs/apps/organiclever-web/README.md) — Gherkin feature files (source of truth)
- [organiclever-web](../organiclever-web/README.md) — The frontend being tested
- [demo-be-e2e](../demo-be-e2e/README.md) — API-level E2E counterpart (tests the Spring Boot backend)
- [Playwright docs](../../docs/explanation/software-engineering/automation-testing/tools/playwright/README.md) — Playwright standards for this project
