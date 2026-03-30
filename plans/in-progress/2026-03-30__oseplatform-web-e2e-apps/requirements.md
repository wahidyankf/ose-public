# Requirements: oseplatform-web E2E Test Apps

## Objectives

1. Provide dedicated, properly structured Playwright + playwright-bdd E2E test applications for
   `oseplatform-web` following the monorepo's established pattern.
2. Replace the ad-hoc visual E2E tests embedded in `apps/oseplatform-web/` with proper E2E apps
   that consume the existing Gherkin feature files.
3. Add Docker-based E2E infrastructure (`infra/dev/oseplatform-web/`) so the CI can build and
   test oseplatform-web in isolation.
4. Upgrade the CI `e2e` job from a fragile build-and-start pattern to the Docker-based BE+FE
   pattern already used for ayokoding-web.
5. Ensure all existing Gherkin specs at `specs/apps/oseplatform/be/gherkin/` and
   `specs/apps/oseplatform/fe/gherkin/` are consumed by real E2E step implementations.
6. Add C4 architecture diagrams (`specs/apps/oseplatform/c4/`) following the same pattern as
   `specs/apps/ayokoding/c4/`, and update the specs README to reference E2E apps and C4 diagrams.

## User Stories

### Story 1: Backend API E2E coverage

As a developer maintaining oseplatform-web,
I want BE E2E tests that call the real tRPC API over HTTP,
So that I can detect regressions in health, content retrieval, search, RSS feed, and SEO endpoints
before they reach production.

### Story 2: Frontend UI E2E coverage

As a developer maintaining oseplatform-web,
I want FE E2E tests that drive a real browser against the running app,
So that I can detect regressions in the landing page, navigation, theme toggle, and responsive
layout before they reach production.

### Story 3: Removal of embedded visual E2E tests

As a developer maintaining the monorepo,
I want the ad-hoc `test/visual/pages.spec.ts` and `playwright.config.ts` inside
`apps/oseplatform-web/` removed,
So that E2E testing follows a single consistent pattern across all apps and the main app directory
no longer contains E2E infrastructure.

### Story 4: Docker-based E2E in CI

As a CI engineer,
I want the oseplatform-web CI workflow to build the app in Docker and run both BE and FE E2E suites
against it,
So that E2E tests run against a production-like artifact rather than a development server.

### Story 5: C4 architecture diagrams for oseplatform-web

As a developer onboarding to the project,
I want C4 architecture diagrams (context, container, component-be, component-fe) in
`specs/apps/oseplatform/c4/`,
So that I can visually understand the system's actors, runtime containers, and internal components
without reading all source code.

### Story 6: Specs README reflects full testing picture

As a developer maintaining oseplatform-web,
I want the specs README at `specs/apps/oseplatform/README.md` to reference the c4 diagrams and
the E2E test apps,
So that the specification directory is a complete navigation hub for all oseplatform-web architecture
and testing documentation.

### Story 7: CLAUDE.md up to date

As a developer onboarding to the project,
I want CLAUDE.md to list `oseplatform-web-be-e2e` and `oseplatform-web-fe-e2e` in the app
inventory,
So that the documentation accurately reflects what exists in the repository.

## Functional Requirements

### BE E2E app (`oseplatform-web-be-e2e`)

- Must have Nx targets: `install`, `lint`, `typecheck`, `test:quick`, `test:e2e`, `test:e2e:ui`,
  `test:e2e:report`
- `test:quick` runs lint and typecheck in parallel; does NOT run Playwright tests
- `test:e2e` runs `bddgen` followed by `playwright test`
- Must consume all feature files under `specs/apps/oseplatform/be/gherkin/`
- Must include step implementations for: health check, content retrieval, search, RSS feed, SEO
- Must NOT include i18n steps (oseplatform-web is English only)
- `baseURL` defaults to `http://localhost:3100`; overridable via `BASE_URL` env var
- Tags: `type:e2e`, `platform:playwright`, `lang:ts`, `domain:oseplatform`
- No `implicitDependencies` (API-only, no compiled app required)

### FE E2E app (`oseplatform-web-fe-e2e`)

- Same Nx target structure as BE E2E app
- Must consume all feature files under `specs/apps/oseplatform/fe/gherkin/`
- Must include step implementations for: landing page, navigation, theme, responsive design
- Multi-browser: chromium only in CI; chromium + firefox + webkit locally
- `baseURL` defaults to `http://localhost:3100`; overridable via `BASE_URL` env var
- Tags: `type:e2e`, `platform:playwright`, `lang:ts`, `domain:oseplatform`
- `implicitDependencies: ["oseplatform-web"]`

### Docker infrastructure (`infra/dev/oseplatform-web/`)

- `docker-compose.yml` builds from monorepo root using `apps/oseplatform-web/Dockerfile`
- Exposes port 3100
- Sets environment variables: `PORT=3100`, `HOSTNAME=0.0.0.0`, `CONTENT_DIR=/workspace/apps/oseplatform-web/content`
- Health check using `wget --spider http://localhost:3100/api/trpc/meta.health`

### CI workflow update

- The `e2e` job is renamed to "E2E tests (Docker)"
- Docker compose builds the app, waits for health check
- Installs Playwright browsers separately for BE and FE apps
- Runs BE E2E then FE E2E with `BASE_URL=http://localhost:3100`
- Uploads both Playwright reports as artifacts (retained 7 days)
- Always runs `docker compose down` in cleanup step

### C4 architecture diagrams (`specs/apps/oseplatform/c4/`)

- Must follow the same 4-file structure as `specs/apps/ayokoding/c4/`
- `README.md` — index listing all 4 diagrams with technology stack and testing summary
- `context.md` — Level 1: system context with actors (visitor, content author, CI pipeline,
  oseplatform-cli, Vercel, Google Analytics)
- `container.md` — Level 2: runtime containers (Next.js server, Next.js client, content directory,
  search index, Vercel CDN, CI pipelines including BE E2E and FE E2E)
- `component-be.md` — Level 3: tRPC API components (router, procedures: `content.getBySlug`,
  `content.listUpdates`, `search.query`, `meta.health`; services: ContentService, ContentReader,
  MarkdownParser, SearchIndex; schemas: Frontmatter, Search)
- `component-fe.md` — Level 3: UI components (pages: Home, About, Updates, Update Detail; layout:
  Header, Footer, Breadcrumb, TOC, PrevNext, MobileNav; content renderers: MarkdownRenderer,
  Mermaid; search: SearchDialog, SearchProvider; theme: ThemeToggle)
- All Mermaid diagrams must use the accessible color palette:
  Blue `#0173B2`, Orange `#DE8F05`, Teal `#029E73`, Purple `#CC78BC`, Brown `#CA9161`,
  Gray `#808080`
- No i18n components (English only — unlike ayokoding-web diagrams)
- Gherkin coverage tables must map components to feature files
- Must NOT mention `content.listChildren` or `content.getTree` (those are ayokoding-web only)
- Must include RSS feed route (`/feed.xml`) and SEO routes (`/sitemap.xml`, `/robots.txt`) in
  both container and component-be diagrams

### Specs README update (`specs/apps/oseplatform/README.md`)

- Add `c4/` directory to the structure listing
- Add a "Related" section referencing C4 diagrams, three-level testing standard, BDD standards,
  and the main app
- Add testing table listing unit tests, BE E2E, FE E2E, and link validation apps
- Structure should mirror `specs/apps/ayokoding/README.md`

### Cleanup of embedded visual E2E

- `apps/oseplatform-web/test/visual/pages.spec.ts` is deleted
- `apps/oseplatform-web/playwright.config.ts` is deleted
- Any `e2e` target referencing `playwright.config.ts` in `apps/oseplatform-web/project.json`
  is removed

## Non-Functional Requirements

- Same `@playwright/test` version as `ayokoding-web-be-e2e` (`^1.58.2`)
- Same `playwright-bdd` version as `ayokoding-web-be-e2e` (`^8.5.0`)
- Same `oxlint.json` configuration as `ayokoding-web-be-e2e`
- Same `tsconfig.json` structure as `ayokoding-web-be-e2e`
- Both new apps must pass `test:quick` (lint + typecheck) without errors
- The `test:e2e` target requires a running oseplatform-web instance; it is not cacheable and not
  part of the pre-push hook
- All Gherkin feature files are reused as-is (three-level testing standard); no spec duplication

## Acceptance Criteria

```gherkin
Feature: oseplatform-web-be-e2e app exists and is functional

  Scenario: BE E2E app scaffolding passes test:quick
    Given the oseplatform-web-be-e2e app is created
    When "nx run oseplatform-web-be-e2e:test:quick" is executed
    Then oxlint reports no errors
    And TypeScript reports no type errors

  Scenario: BE E2E app consumes all backend Gherkin specs
    Given the oseplatform-web-be-e2e app is created
    When bddgen is run
    Then test files are generated for all feature files in
      "specs/apps/oseplatform/be/gherkin/"
    And step implementations exist for health, content retrieval, search,
      rss-feed, and seo features

  Scenario: BE E2E tests execute against a running instance
    Given oseplatform-web is running at http://localhost:3100
    When "nx run oseplatform-web-be-e2e:test:e2e" is executed
    Then all Playwright BDD tests pass
    And a Playwright HTML report is generated

Feature: oseplatform-web-fe-e2e app exists and is functional

  Scenario: FE E2E app scaffolding passes test:quick
    Given the oseplatform-web-fe-e2e app is created
    When "nx run oseplatform-web-fe-e2e:test:quick" is executed
    Then oxlint reports no errors
    And TypeScript reports no type errors

  Scenario: FE E2E app consumes all frontend Gherkin specs
    Given the oseplatform-web-fe-e2e app is created
    When bddgen is run
    Then test files are generated for all feature files in
      "specs/apps/oseplatform/fe/gherkin/"
    And step implementations exist for landing-page, navigation, theme,
      and responsive features

  Scenario: FE E2E tests execute against a running instance
    Given oseplatform-web is running at http://localhost:3100
    When "nx run oseplatform-web-fe-e2e:test:e2e" is executed
    Then all Playwright BDD browser tests pass
    And a Playwright HTML report is generated

Feature: Docker infrastructure for oseplatform-web E2E

  Scenario: Docker compose builds and starts successfully
    Given "infra/dev/oseplatform-web/docker-compose.yml" exists
    When "docker compose up -d --build" is executed from that directory
    Then the oseplatform-web container starts and becomes healthy
    And http://localhost:3100/api/trpc/meta.health returns status "ok"

  Scenario: Health check URL matches the tRPC pattern
    Given the docker-compose.yml healthcheck is configured
    Then the health check command uses
      "wget --spider http://localhost:3100/api/trpc/meta.health"

Feature: CI workflow uses Docker-based E2E pattern

  Scenario: CI e2e job runs both BE and FE suites
    Given the updated test-and-deploy-oseplatform-web.yml workflow
    When the e2e job executes
    Then it builds Docker and waits for the health check
    And it installs Playwright browsers for both apps
    And it runs oseplatform-web-be-e2e:test:e2e
    And it runs oseplatform-web-fe-e2e:test:e2e
    And it uploads both playwright-report directories as artifacts
    And it runs "docker compose down" in the always() cleanup step

Feature: Visual E2E tests removed from oseplatform-web

  Scenario: Embedded visual E2E files are gone
    Given the cleanup is complete
    Then "apps/oseplatform-web/test/visual/pages.spec.ts" does not exist
    And "apps/oseplatform-web/playwright.config.ts" does not exist
    And "apps/oseplatform-web/project.json" contains no reference to
      the deleted playwright.config.ts

Feature: C4 architecture diagrams exist and are accurate

  Scenario: C4 directory contains all required diagrams
    Given "specs/apps/oseplatform/c4/" exists
    Then it contains README.md, context.md, container.md,
      component-be.md, and component-fe.md

  Scenario: Context diagram shows correct actors
    Given "specs/apps/oseplatform/c4/context.md" exists
    Then the Mermaid diagram includes: Visitor, Content Author,
      CI Pipeline, oseplatform-cli, Vercel Platform, and
      Google Analytics
    And the diagram uses the accessible color palette

  Scenario: Container diagram includes E2E test apps
    Given "specs/apps/oseplatform/c4/container.md" exists
    Then the Mermaid diagram includes BE E2E CI and FE E2E CI
      containers
    And it shows the Next.js server, client, content directory,
      search index, and Vercel CDN

  Scenario: Component-be diagram maps to tRPC procedures
    Given "specs/apps/oseplatform/c4/component-be.md" exists
    Then the Mermaid diagram includes content.getBySlug,
      content.listUpdates, search.query, and meta.health
    And it includes RSS feed and SEO route handlers
    And the Gherkin coverage table maps each component to its
      feature file

  Scenario: Component-fe diagram maps to UI components
    Given "specs/apps/oseplatform/c4/component-fe.md" exists
    Then the Mermaid diagram includes pages (Home, About, Updates,
      Update Detail), layout components, search, and theme toggle
    And no i18n components are present

Feature: Specs README updated

  Scenario: README includes c4 directory and E2E references
    Given "specs/apps/oseplatform/README.md" is updated
    Then the structure listing includes the "c4/" directory
    And the Related section links to C4 diagrams, three-level
      testing standard, and BDD standards
    And a testing table lists unit tests, BE E2E, FE E2E, and
      link validation apps

Feature: CLAUDE.md updated

  Scenario: New apps appear in CLAUDE.md app listing
    Given CLAUDE.md is updated
    Then it lists "oseplatform-web-be-e2e" with description
      "Playwright BE E2E tests for oseplatform-web tRPC API"
    And it lists "oseplatform-web-fe-e2e" with description
      "Playwright FE E2E tests for oseplatform-web UI"
```
