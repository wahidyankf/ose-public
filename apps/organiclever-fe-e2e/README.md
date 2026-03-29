# organiclever-fe-e2e

End-to-end tests for the [OrganicLever frontend](../organiclever-fe/README.md),
using [playwright-bdd](https://github.com/vitalets/playwright-bdd) to drive tests from Gherkin
feature files.

Tests use Playwright to drive a real browser against a running frontend and backend stack.

## What This Tests

Feature files in [`specs/apps/organiclever/fe/gherkin/`](../../specs/apps/organiclever/fe/gherkin/)
are the source of truth:

- `authentication/google-login` — Login page renders Google sign-in button, no email/password form
- `authentication/profile` — Profile page displays Google account name, email, and avatar
- `authentication/route-protection` — Unauthenticated redirects to /login; authenticated access to /profile
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
nx dev organiclever-fe
```

## Setup

Install Playwright and its browser dependencies (one-time setup):

```bash
nx run organiclever-fe-e2e:install
```

## Running Tests

```bash
# Run all BDD E2E tests headlessly (generates specs then runs)
nx run organiclever-fe-e2e:test:e2e

# Run with interactive Playwright UI
nx run organiclever-fe-e2e:test:e2e:ui

# View HTML report from last run
nx run organiclever-fe-e2e:test:e2e:report

# Generate spec files only (without running tests)
cd apps/organiclever-fe-e2e && npx bddgen

# Lint TypeScript source files (oxlint)
nx run organiclever-fe-e2e:lint

# Type check
nx run organiclever-fe-e2e:typecheck

# Pre-push quality gate (typecheck + lint)
nx run organiclever-fe-e2e:test:quick
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
BASE_URL=http://localhost:3200 nx run organiclever-fe-e2e:test:e2e
```

## Google OAuth Testing Strategy

The Google OAuth flow cannot be driven end-to-end in a headless browser without real Google
credentials. The step implementations use a simulation strategy:

- Login page steps validate the presence of the "Sign in with Google" button and the absence of
  email/password fields.
- Post-OAuth steps navigate directly to the post-authentication destination, simulating what a
  successful OAuth callback produces.
- Full OAuth token exchange is validated in the backend E2E suite.

## Project Structure

```
apps/organiclever-fe-e2e/
├── playwright.config.ts           # Playwright + playwright-bdd configuration
├── package.json                   # Dependencies (playwright, playwright-bdd, axe-core)
├── tsconfig.json                  # TypeScript config
├── steps/                         # BDD step definitions
│   ├── google-login.steps.ts      # Google login page steps
│   ├── profile.steps.ts           # Profile page steps
│   ├── route-protection.steps.ts  # Route protection steps
│   └── accessibility.steps.ts     # Accessibility compliance steps
└── .features-gen/                 # Auto-generated spec files (gitignored)
```

## Related Documentation

- [Three-Level Testing Standard](../../governance/development/quality/three-level-testing-standard.md) — Unit, integration, and E2E testing boundaries
- [Playwright docs](../../docs/explanation/software-engineering/automation-testing/tools/playwright/README.md) — Playwright standards
- [OrganicLever Gherkin Specs](../../specs/apps/organiclever/fe/gherkin/) — Shared feature files (source of truth)
