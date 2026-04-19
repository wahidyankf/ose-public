# wahidyankf-web-fe-e2e

End-to-end tests for [`apps/wahidyankf-web`](../wahidyankf-web/) using
Playwright and `playwright-bdd`. Consumes the Gherkin feature files at
`specs/apps/wahidyankf/fe/gherkin/` shared with the FE unit tests.

## Commands

```bash
# Install Chromium for Playwright
nx run wahidyankf-web-e2e:install

# Start the app first in another shell
nx dev wahidyankf-web

# Run all E2E scenarios headlessly
nx run wahidyankf-web-e2e:test:e2e

# Run with Playwright UI
nx run wahidyankf-web-e2e:test:e2e:ui

# View last run report
nx run wahidyankf-web-e2e:test:e2e:report

# Pre-push quick gate (typecheck + lint; e2e runs nightly / on demand)
nx run wahidyankf-web-e2e:test:quick
```

## Features consumed

- `home.feature`
- `search.feature`
- `cv.feature`
- `theme.feature`
- `personal-projects.feature`
- `responsive.feature`
- `accessibility.feature` — E2E-only, axe-core-driven

## Default base URL

`http://localhost:3201` — override with `BASE_URL` env var for staging /
production smoke runs.
