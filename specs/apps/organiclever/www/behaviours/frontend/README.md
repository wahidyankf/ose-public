# OrganicLever Marketing Gherkin Specs

Gherkin feature files for the OrganicLever public marketing site
(`apps/organiclever-www`), served at the domain root. These cover the
greenfield-simple marketing surface carried over from the former
`organiclever-app-web` landing context (decision #20: `-www` = public website).

## Structure

```
specs/apps/organiclever/www/behaviours/frontend/
├── home/                  # Marketing landing page (hero, features, principles)
│   └── home.feature
└── accessibility/         # WCAG AA compliance for the marketing surface
    └── accessibility.feature
```

## Conventions

- **File naming**: `[domain-capability].feature` (kebab-case)
- **Step language**: UI-semantic only — clicks, types, sees, navigates (no HTTP verbs or
  status codes)
- **User story block**: Feature blocks open with a short description or
  `As a … / I want … / So that …`
- **Term discipline**: Step text uses plain marketing-content terms

## Consumed by

- **Unit**: `apps/organiclever-www/test/unit/steps/` via `@amiceli/vitest-cucumber`
- **E2E**: `apps/organiclever-www-fe-e2e/src/steps/` via `playwright-bdd`

## Related

- **Marketing component specs**: [web component specs](../../architecture.md)
- **App-client counterpart**: [organiclever-app-web behaviour specs](../../../app-web/behaviours/README.md)
- **Parent**: [behaviour specs](../../README.md)

- [accessibility — organiclever-www Gherkin Domain](./accessibility/README.md) — WCAG accessibility compliance scenarios for the marketing site
- [home — organiclever-www Gherkin Domain](./home/README.md) — Marketing landing page scenarios (hero, features, principles)
