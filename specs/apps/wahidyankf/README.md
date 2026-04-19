# wahidyankf specs

Gherkin acceptance specifications for the `wahidyankf-web` personal
portfolio application (adopted from `wahidyankf/oss` in 2026-04).

## Layout

```
specs/apps/wahidyankf/
└── fe/
    └── gherkin/
        ├── home.feature                # Home page rendering + search + quick links
        ├── search.feature              # Search filtering + highlight behaviour
        ├── cv.feature                  # CV page rendering + search
        ├── theme.feature               # Light/dark theme toggle
        ├── personal-projects.feature   # Personal projects page rendering
        ├── responsive.feature          # Viewport-based layout (sidebar vs tab bar)
        └── accessibility.feature       # WCAG 2.1 AA (E2E / axe-core only)
```

## BDD framework

- **Unit level** — runs inside `apps/wahidyankf-web/test/unit/` using
  `@amiceli/vitest-cucumber` (`describeFeature(...)`). Step
  implementations drive rendered component trees via
  `@testing-library/react`.
- **E2E level** — runs inside `apps/wahidyankf-web-fe-e2e/steps/` using
  `playwright-bdd`. Steps drive a real browser via Playwright. The
  `accessibility.feature` file is E2E-only (uses
  `@axe-core/playwright`).

Both layers consume the same feature files — this mirrors
`apps/organiclever-fe` / `specs/apps/organiclever/fe/gherkin/` /
`apps/organiclever-fe-e2e/` pattern.

## Spec-coverage enforcement

`nx run wahidyankf-web:spec-coverage` and
`nx run wahidyankf-web-fe-e2e:spec-coverage` run
`rhino-cli spec-coverage validate --shared-steps
specs/apps/wahidyankf/fe/gherkin apps/wahidyankf-web` against these
features. Both are wired into the repo's pre-push quality gate.
