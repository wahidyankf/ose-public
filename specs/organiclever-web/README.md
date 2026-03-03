# organiclever-web Specs

Gherkin acceptance specifications for the
[OrganicLever web landing page](../../apps/organiclever-web/README.md).

## What This Covers

These specs define user-facing behavior for the OrganicLever web application — landing page
interactions, authentication flows, dashboard navigation, and member management.

## BDD Framework

| Concern                   | Choice                                               |
| ------------------------- | ---------------------------------------------------- |
| Language                  | TypeScript                                           |
| BDD framework             | playwright-bdd                                       |
| Step definitions location | `apps/organiclever-web-e2e/tests/steps/`             |
| Test runner               | Playwright (via `npx bddgen && npx playwright test`) |

Feature files here are the source of truth. The `bddgen` CLI reads them and generates Playwright
spec files in `apps/organiclever-web-e2e/.features-gen/` before each test run.

## Feature File Organization

```
specs/organiclever-web/
├── landing/
│   └── landing-page.feature
├── auth/
│   ├── user-login.feature
│   ├── user-logout.feature
│   └── route-protection.feature
├── dashboard/
│   └── dashboard-overview.feature
└── members/
    ├── member-list.feature
    ├── member-detail.feature
    ├── member-editing.feature
    └── member-deletion.feature
```

**File naming**: `[user-journey-or-domain].feature` (kebab-case)

## Running Specs

```bash
# From repository root (via Nx)
nx run organiclever-web-e2e:test:e2e

# From the e2e project directory
cd apps/organiclever-web-e2e
npx bddgen && npx playwright test
```

## Adding a Feature File

1. Identify the user journey or domain area (e.g., `auth`, `members`)
2. Create the folder if it does not exist: `specs/organiclever-web/[area]/`
3. Create the `.feature` file: `[user-journey].feature`
4. Write scenarios following
   [Gherkin Standards](../../docs/explanation/software-engineering/development/behavior-driven-development-bdd/ex-soen-de-bedrdebd__gherkin-standards.md)
5. Implement step definitions in `apps/organiclever-web-e2e/tests/steps/`

## Related

- **Step Definitions**: [apps/organiclever-web-e2e/tests/steps/](../../apps/organiclever-web-e2e/README.md) — playwright-bdd step implementations
- **App**: [apps/organiclever-web/](../../apps/organiclever-web/README.md) — Next.js implementation
- **BDD Standards**: [behavior-driven-development-bdd/](../../docs/explanation/software-engineering/development/behavior-driven-development-bdd/README.md)
