# organiclever-web-e2e

End-to-end tests for the [OrganicLever frontend](../organiclever-web/README.md),
using [playwright-bdd](https://github.com/vitalets/playwright-bdd) to drive tests from Gherkin
feature files.

Tests use Playwright to drive a real browser against a running frontend and backend stack.

## What This Tests

Feature files in [`specs/apps/organiclever/fe/gherkin/`](../../specs/apps/organiclever/fe/gherkin/)
are the source of truth:

- `landing/landing` — Landing page renders hero, principles, weekly-rhythm demo, CTAs
- `system/system-status-be` — System-status page polls the BE health endpoint and renders the result
- `routing/disabled-routes` — `/login` and `/profile` return 404 (no v0 auth surface)
- `layout/accessibility` — WCAG AA heading hierarchy, keyboard navigation, color contrast, ARIA landmarks

## Architecture

```
specs/apps/organiclever/fe/gherkin/**/*.feature    <- source of truth (read-only)
        |
        v  (defineBddConfig reads features)
playwright.config.ts
        |
        v  (bddgen generates)
.features-gen/**/*.spec.ts            <- auto-generated, gitignored
        |
        v  (playwright test runs)
steps/**/*.steps.ts                   <- step implementations
```

## Prerequisites

The frontend must be running on `http://localhost:3200` (or the URL set via `BASE_URL`) and the
OrganicLever backend must be running before executing tests.

**Start the backend**:

```bash
nx dev organiclever-be
```

**Start the frontend**:

```bash
nx dev organiclever-web
```

## Setup

Install Playwright and its browser dependencies (one-time setup):

```bash
nx run organiclever-web-e2e:install
```

## Running Tests

```bash
# Run all BDD E2E tests headlessly (generates specs then runs)
nx run organiclever-web-e2e:test:e2e

# Run with interactive Playwright UI
nx run organiclever-web-e2e:test:e2e:ui

# View HTML report from last run
nx run organiclever-web-e2e:test:e2e:report

# Generate spec files only (without running tests)
cd apps/organiclever-web-e2e && npx bddgen

# Lint TypeScript source files (oxlint)
nx run organiclever-web-e2e:lint

# Type check
nx run organiclever-web-e2e:typecheck

# Pre-push quality gate (typecheck + lint)
nx run organiclever-web-e2e:test:quick
```

**See**: [Nx Target Standards](../../governance/development/infra/nx-targets.md) for canonical E2E
target names. `test:e2e` runs on a scheduled cron (not on pre-push).

## Environment Variables

| Variable   | Default                 | Description                     |
| ---------- | ----------------------- | ------------------------------- |
| `BASE_URL` | `http://localhost:3200` | Frontend base URL               |
| `CI`       | unset                   | Enables CI mode (single worker) |

Override the base URL to test a different deployment:

```bash
BASE_URL=http://localhost:3200 nx run organiclever-web-e2e:test:e2e
```

## Project Structure

```
apps/organiclever-web-e2e/
├── playwright.config.ts           # Playwright + playwright-bdd configuration
├── package.json                   # Dependencies (playwright, playwright-bdd, axe-core)
├── tsconfig.json                  # TypeScript config
├── steps/                         # BDD step definitions
│   ├── landing.steps.ts           # Landing-page steps
│   ├── system-status-be.steps.ts  # System-status page steps
│   ├── disabled-routes.steps.ts   # /login + /profile 404 guards
│   └── accessibility.steps.ts     # Accessibility compliance steps
└── .features-gen/                 # Auto-generated spec files (gitignored)
```

## Related Documentation

- [Three-Level Testing Standard](../../governance/development/quality/three-level-testing-standard.md) — Unit, integration, and E2E testing boundaries
- [Playwright docs](../../docs/explanation/software-engineering/automation-testing/tools/playwright/README.md) — Playwright standards
- [OrganicLever Gherkin Specs](../../specs/apps/organiclever/fe/gherkin/) — Shared feature files (source of truth)
