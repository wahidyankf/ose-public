# Delivery Plan: oseplatform-web E2E Test Apps

## Overview

**Delivery Type**: Direct commits to `main` (Trunk Based Development)

**Git Workflow**: Each phase is one commit. Phases 1–5 build incrementally; Phase 6 (cleanup) can
be merged into Phase 5's commit or kept separate.

**Phase Independence**: Phases 1 and 2 can be developed in parallel but must both complete before
Phase 3 (CI) can be finalized. Phase 4 (specs/C4) is independent of Phases 1–3 and can be done at
any point. Phase 6 (cleanup) is independent and can be done at any point after Phase 1.

## Implementation Phases

### Phase 1: BE E2E app (`oseplatform-web-be-e2e`)

**Goal**: Create a complete, passing BE E2E app following the ayokoding-web-be-e2e pattern.

- [ ] Create `apps/oseplatform-web-be-e2e/project.json` with all 7 Nx targets
      (`install`, `lint`, `typecheck`, `test:quick`, `test:e2e`, `test:e2e:ui`,
      `test:e2e:report`), tags `type:e2e`, `platform:playwright`, `lang:ts`, `domain:oseplatform`,
      and no `implicitDependencies`
- [ ] Create `apps/oseplatform-web-be-e2e/package.json` with `@playwright/test@^1.58.2` and
      `playwright-bdd@^8.5.0` devDeps and `volta.extends` pointing to root
- [ ] Create `apps/oseplatform-web-be-e2e/tsconfig.json` extending `../../tsconfig.base.json`
      with `CommonJS` module, includes `src/**/*.ts` and `playwright.config.ts`
- [ ] Create `apps/oseplatform-web-be-e2e/oxlint.json` matching
      `apps/ayokoding-web-be-e2e/oxlint.json`
- [ ] Create `apps/oseplatform-web-be-e2e/playwright.config.ts`:
  - `defineBddConfig` with `featuresRoot` = workspace root, `features` pointing to
    `specs/apps/oseplatform/be/gherkin/**/*.feature`, `steps` = `./src/steps/**/*.steps.ts`
  - `baseURL = process.env.BASE_URL || "http://localhost:3100"`
  - CI retries: 2, workers: 1; local: default
  - Reporters: list, html, junit
- [ ] Create `apps/oseplatform-web-be-e2e/src/steps/helpers.ts` (identical to ayokoding pattern):
      `buildTrpcUrl`, `extractTrpcData`, shared `state` object
- [ ] Create `apps/oseplatform-web-be-e2e/src/steps/common.steps.ts`:
      `Given("the API is running")` no-op only (no parameterized locale/slug Given steps from
      ayokoding pattern — oseplatform has simpler fixtures)
- [ ] Create `apps/oseplatform-web-be-e2e/src/steps/health-check.steps.ts`:
  - `When("the health endpoint is called")` — calls `meta.health` via `buildTrpcUrl`
  - `Then('the response contains status "ok"')` — asserts `state.healthResult.status`
- [ ] Create `apps/oseplatform-web-be-e2e/src/steps/content-api.steps.ts`:
  - Given no-op fixtures for content repo setup (slug exists, multiple posts, draft post)
  - `When("the content service retrieves the page by slug {string}")` — calls `content.getBySlug`
  - `When("the content service lists all updates")` — calls `content.listUpdates`
  - Then steps: title present, HTML content present, headings array present, sorted by date
    descending, title/date/summary/tags fields on each item, draft excluded, null for nonexistent
- [ ] Create `apps/oseplatform-web-be-e2e/src/steps/search-api.steps.ts`:
  - Given no-op fixtures for search index state
  - `When("a search query {string} is executed")` — calls `search.query` with the given term
  - `When("a search query {string} is executed with limit {int}")` — calls `search.query` with
    limit
  - Then steps: results non-empty, title/slug/excerpt fields, empty results, at most N results
- [ ] Create `apps/oseplatform-web-be-e2e/src/steps/rss-feed.steps.ts`:
  - Given no-op fixture for content repo with update posts
  - `When("the RSS feed is generated")` — `request.get("/feed.xml")`, assert 200
  - Then steps: XML body contains `OSE Platform Updates` channel title, channel link, `<item>`
    elements, specific entry title "Phase 0 End", publication date, link, description
- [ ] Create `apps/oseplatform-web-be-e2e/src/steps/seo.steps.ts`:
  - `When("the sitemap is generated")` — `request.get("/sitemap.xml")`, assert 200
  - Then steps: body contains landing page URL, about URL, update page URLs
  - `When("the robots.txt is generated")` — `request.get("/robots.txt")`, assert 200
  - Then steps: body contains `User-agent: *` (or equivalent allow-all), sitemap URL reference
- [ ] Run `cd apps/oseplatform-web-be-e2e && npm install` to install dependencies
- [ ] Run `nx run oseplatform-web-be-e2e:test:quick` — verify lint and typecheck pass
- [ ] Commit: `feat(oseplatform-web-be-e2e): add BE E2E app with Playwright BDD step implementations`

### Phase 2: FE E2E app (`oseplatform-web-fe-e2e`)

**Goal**: Create a complete, passing FE E2E app following the ayokoding-web-fe-e2e pattern.

- [ ] Create `apps/oseplatform-web-fe-e2e/project.json` with same 7 Nx targets as BE E2E, tags
      `type:e2e`, `platform:playwright`, `lang:ts`, `domain:oseplatform`, and
      `"implicitDependencies": ["oseplatform-web"]`
- [ ] Verify `test:e2e` inputs reference `specs/apps/oseplatform/fe/gherkin/**/*.feature`
- [ ] Create `apps/oseplatform-web-fe-e2e/package.json` matching BE package.json (different name)
- [ ] Create `apps/oseplatform-web-fe-e2e/tsconfig.json` (same as BE variant but adds
      `"lib": ["ES2022", "DOM"]` for Playwright browser-side DOM types)
- [ ] Create `apps/oseplatform-web-fe-e2e/oxlint.json` (identical to BE variant)
- [ ] Create `apps/oseplatform-web-fe-e2e/playwright.config.ts`:
  - `defineBddConfig` with `features` pointing to
    `specs/apps/oseplatform/fe/gherkin/**/*.feature`
  - `baseURL = process.env.BASE_URL || "http://localhost:3100"`
  - `projects`: chromium only in CI; chromium + firefox + webkit locally
- [ ] Create `apps/oseplatform-web-fe-e2e/src/steps/common.steps.ts`:
      `Given("the app is running")` no-op
- [ ] Create `apps/oseplatform-web-fe-e2e/src/steps/landing-page.steps.ts`:
  - `Given("the landing page is rendered")` — `page.goto("/")`
  - Then: hero title "Open Sharia Enterprise Platform" visible, mission description visible,
    "Learn More" link href `/about/`, GitHub link present
  - Then: GitHub icon link visible, RSS icon link visible
- [ ] Create `apps/oseplatform-web-fe-e2e/src/steps/navigation.steps.ts`:
  - `Given("the header component is rendered")` — `page.goto("/")`
  - Then: "Updates" link href `/updates/`, "About" link href `/about/`, external Documentation
    link, external GitHub link
  - `Given("the about page is rendered with breadcrumbs")` — `page.goto("/about/")`
  - Then: breadcrumb "Home" link href `/`, "About" as current page indicator
  - `Given("an update detail page is rendered with adjacent updates")` — navigate to known update
    detail URL (e.g., `/updates/2026-02-08-phase-0-end-of-phase-0/`)
  - Then: Previous link visible, Next link visible
- [ ] Create `apps/oseplatform-web-fe-e2e/src/steps/theme.steps.ts`:
  - `Given("the site loads without a stored theme preference")` — `page.goto("/")`
  - `Then("the theme is set to light mode")` — assert light mode on `<html>` element
  - `Given("the site is in light mode")` — `page.goto("/")`
  - `When("the user clicks the theme toggle and selects dark mode")` — click theme toggle
  - `Then("the site switches to dark mode")` — assert dark mode on `<html>` element
- [ ] Create `apps/oseplatform-web-fe-e2e/src/steps/responsive.steps.ts`:
  - `Given("the viewport width is less than 640 pixels")` — `setViewportSize({width: 375, height: 667})`
  - `When("the header is rendered")` — `page.goto("/")`
  - `Then("the hamburger menu button is visible")` — assert button visible
  - `Then("the desktop navigation links are hidden")` — assert nav links hidden
  - `Given("the viewport width is greater than 1024 pixels")` — `setViewportSize({width: 1280, height: 800})`
  - `Then("the desktop navigation links are visible")` — assert nav links visible
  - `Then("the hamburger menu button is hidden")` — assert button hidden
- [ ] Run `cd apps/oseplatform-web-fe-e2e && npm install` to install dependencies
- [ ] Run `nx run oseplatform-web-fe-e2e:test:quick` — verify lint and typecheck pass
- [ ] Commit: `feat(oseplatform-web-fe-e2e): add FE E2E app with Playwright BDD step implementations`

### Phase 3: Docker infrastructure and CI update

**Goal**: Add Docker compose and update the CI workflow to use the Docker-based E2E pattern.

- [ ] Create `infra/dev/oseplatform-web/` directory
- [ ] Create `infra/dev/oseplatform-web/docker-compose.yml`:
  - Service `oseplatform-web`
  - `build.context: ../../../` (monorepo root)
  - `build.dockerfile: apps/oseplatform-web/Dockerfile`
  - `ports: ["3100:3100"]`
  - Environment: `CONTENT_DIR=/workspace/apps/oseplatform-web/content`, `PORT=3100`,
    `HOSTNAME=0.0.0.0`
  - Healthcheck: `wget --no-verbose --tries=1 --spider http://localhost:3100/api/trpc/meta.health`
    with `interval: 10s`, `timeout: 5s`, `retries: 5`, `start_period: 30s`
- [ ] Update `.github/workflows/test-and-deploy-oseplatform-web.yml` — replace `e2e` job:
  - Job name: "E2E tests (Docker)"
  - Step: Checkout code
  - Step: Setup Node.js (node-version: "24", cache: "npm")
  - Step: "Build and start Docker" — `cd infra/dev/oseplatform-web && docker compose up -d --build`
    then health check wait loop using `curl -sf` (30 attempts × 5s = 150s max, matching
    ayokoding-web CI pattern)
  - Step: "Install dependencies" — `npm ci`
  - Step: "Install Playwright browsers (BE E2E)" — `cd apps/oseplatform-web-be-e2e && npx playwright install --with-deps chromium`
  - Step: "Install Playwright browsers (FE E2E)" — `cd apps/oseplatform-web-fe-e2e && npx playwright install --with-deps chromium`
  - Step: "Run BE E2E tests" — `npx nx run oseplatform-web-be-e2e:test:e2e` with
    `env: BASE_URL: http://localhost:3100`
  - Step: "Run FE E2E tests" — `npx nx run oseplatform-web-fe-e2e:test:e2e` with
    `env: BASE_URL: http://localhost:3100`
  - Step: "Upload Playwright reports" — artifact `playwright-reports-oseplatform-web`, paths
    `apps/oseplatform-web-be-e2e/playwright-report/` and
    `apps/oseplatform-web-fe-e2e/playwright-report/`, retention 7 days, `if: always()`
  - Step: "Stop Docker" — `cd infra/dev/oseplatform-web && docker compose down`, `if: always()`
- [ ] Verify `deploy` job still has `needs: [unit, integration, e2e, detect-changes]`
- [ ] Commit: `feat(ci): update oseplatform-web e2e job to Docker-based BE+FE pattern`

### Phase 4: Specs update (C4 diagrams + README)

**Goal**: Add C4 architecture diagrams and update the specs README to reflect the full testing
picture.

- [ ] Create `specs/apps/oseplatform/c4/README.md`:
  - Diagram index table (context, container, component-be, component-fe)
  - Technology stack table (Next.js 16, tRPC v11, FlexSearch, etc.)
  - Testing table (unit, BE E2E, FE E2E, link validation)
  - Related links to parent specs, gherkin dirs, app source
- [ ] Create `specs/apps/oseplatform/c4/context.md`:
  - Mermaid graph with accessible color palette
  - Actors: Visitor, Content Author, CI Pipeline, oseplatform-cli, Vercel, Google Analytics
  - System: OSE Platform Web (Next.js 16, marketing + updates, search, English only)
  - Actor table describing each role
  - Related links to other C4 diagrams
- [ ] Create `specs/apps/oseplatform/c4/container.md`:
  - Mermaid graph showing: Next.js Server, Next.js Client, Content Directory, Search Index,
    CI Pipelines (Main CI, BE E2E CI, FE E2E CI), Vercel CDN
  - Container details sections for server, client, content
  - No language switcher / i18n in client container (English only)
  - Related links
- [ ] Create `specs/apps/oseplatform/c4/component-be.md`:
  - Mermaid graph showing: tRPC Router, procedures (content.getBySlug, content.listUpdates,
    search.query, meta.health), route handlers (RSS, Sitemap, Robots), services (ContentService,
    ContentReader, MarkdownParser), search (SearchIndex, stripMarkdown), schemas
  - Gherkin coverage table mapping each component to its feature file
  - Testing table (test:unit >= 80%, test:e2e via Playwright)
  - Related links
- [ ] Create `specs/apps/oseplatform/c4/component-fe.md`:
  - Mermaid graph showing: pages (Home, About, Updates, Update Detail, Sitemap, RSS Feed),
    layout components (Header, Footer, Breadcrumb, TOC, PrevNext, MobileNav), content renderers
    (MarkdownRenderer, Mermaid), search (SearchDialog, SearchProvider), theme (ThemeToggle)
  - No i18n layer (English only)
  - Gherkin coverage table mapping components to frontend feature files
  - Testing table
  - Related links
- [ ] Update `specs/apps/oseplatform/README.md`:
  - Add `c4/` directory to the structure tree
  - Add tRPC procedures table
  - Add "Related" section with links to C4 diagrams, three-level testing standard, BDD standards,
    app source
- [ ] Verify all Mermaid diagrams use the accessible color palette
      (`#0173B2`, `#DE8F05`, `#029E73`, `#CC78BC`, `#CA9161`, `#808080`)
- [ ] Commit: `docs(specs): add C4 architecture diagrams for oseplatform-web`

### Phase 5: CLAUDE.md update

**Goal**: Add the two new apps to the CLAUDE.md app listing.

- [ ] Add `oseplatform-web-be-e2e` to the **Current Apps** bullet list in CLAUDE.md:
  - Description: "Playwright BE E2E tests for oseplatform-web tRPC API"
- [ ] Add `oseplatform-web-fe-e2e` to the **Current Apps** bullet list in CLAUDE.md:
  - Description: "Playwright FE E2E tests for oseplatform-web UI"
- [ ] Add both apps to the **Project Structure** tree under `apps/`
- [ ] Add both apps to the **oseplatform-web** section under "E2E tests" (matching ayokoding-web
      section pattern)
- [ ] Commit: `docs(claude): add oseplatform-web-be-e2e and oseplatform-web-fe-e2e to app listing`

### Phase 6: Remove embedded visual E2E from oseplatform-web

**Goal**: Delete the ad-hoc visual E2E tests and config that are now superseded.

- [ ] Delete `apps/oseplatform-web/test/visual/pages.spec.ts`
- [ ] Delete `apps/oseplatform-web/playwright.config.ts`
- [ ] Inspect `apps/oseplatform-web/project.json` — confirm no target references
      `playwright.config.ts` (note: the current project.json has no `e2e` or `test:visual` target,
      so no change should be needed — this is a defensive check)
- [ ] Remove the `apps/oseplatform-web/test/visual/` directory (now empty)
- [ ] Note: `apps/oseplatform-web/test/` still contains `unit/` and `integration/` — do NOT
      remove the `test/` directory
- [ ] Run `nx run oseplatform-web:test:quick` — verify the main app still passes
- [ ] Run `nx run oseplatform-web-be-e2e:test:quick` — verify BE E2E app still passes
- [ ] Run `nx run oseplatform-web-fe-e2e:test:quick` — verify FE E2E app still passes
- [ ] Commit: `chore(oseplatform-web): remove embedded visual E2E tests superseded by dedicated E2E apps`

## Validation Checklist

After all phases are complete, validate:

### BE E2E app

- [ ] `nx run oseplatform-web-be-e2e:test:quick` passes (lint + typecheck)
- [ ] `apps/oseplatform-web-be-e2e/src/steps/` contains: `helpers.ts`, `common.steps.ts`,
      `health-check.steps.ts`, `content-api.steps.ts`, `search-api.steps.ts`,
      `rss-feed.steps.ts`, `seo.steps.ts`
- [ ] `project.json` has 7 targets and tags `type:e2e`, `platform:playwright`, `lang:ts`,
      `domain:oseplatform`
- [ ] No `implicitDependencies` on BE E2E app

### FE E2E app

- [ ] `nx run oseplatform-web-fe-e2e:test:quick` passes (lint + typecheck)
- [ ] `apps/oseplatform-web-fe-e2e/src/steps/` contains: `common.steps.ts`,
      `landing-page.steps.ts`, `navigation.steps.ts`, `theme.steps.ts`, `responsive.steps.ts`
- [ ] `project.json` has 7 targets and `implicitDependencies: ["oseplatform-web"]`
- [ ] No `i18n` step file exists (oseplatform-web is English-only)

### Docker infrastructure

- [ ] `infra/dev/oseplatform-web/docker-compose.yml` exists
- [ ] Healthcheck URL is `http://localhost:3100/api/trpc/meta.health`
- [ ] `context: ../../../` is relative to the docker-compose.yml location (resolves to monorepo
      root)

### CI workflow

- [ ] `e2e` job name is "E2E tests (Docker)"
- [ ] Docker build step references `infra/dev/oseplatform-web`
- [ ] Health check curl loop uses port 3100
- [ ] Two separate Playwright install steps (one per E2E app)
- [ ] BE E2E test step runs before FE E2E test step
- [ ] Artifact upload includes both report directories
- [ ] `docker compose down` runs in `if: always()` cleanup step
- [ ] `deploy` job `needs` still includes `e2e`

### C4 diagrams and specs

- [ ] `specs/apps/oseplatform/c4/` contains: `README.md`, `context.md`, `container.md`,
      `component-be.md`, `component-fe.md`
- [ ] All Mermaid diagrams use the accessible color palette
- [ ] `context.md` includes all 6 actors (Visitor, Content Author, CI Pipeline, oseplatform-cli,
      Vercel, Google Analytics)
- [ ] `container.md` includes BE E2E CI and FE E2E CI in the CI Pipelines subgraph
- [ ] `component-be.md` includes RSS feed and SEO route handlers (not just tRPC procedures)
- [ ] `component-be.md` Gherkin coverage table maps to all 5 backend feature files
- [ ] `component-fe.md` has no i18n components
- [ ] `component-fe.md` Gherkin coverage table maps to all 4 frontend feature files
- [ ] `specs/apps/oseplatform/README.md` includes `c4/` in structure tree
- [ ] `specs/apps/oseplatform/README.md` has "Related" section with C4 link
- [ ] `specs/apps/oseplatform/README.md` has tRPC procedures table

### Cleanup

- [ ] `apps/oseplatform-web/test/visual/pages.spec.ts` does not exist
- [ ] `apps/oseplatform-web/playwright.config.ts` does not exist
- [ ] `apps/oseplatform-web/project.json` contains no reference to the deleted config
- [ ] `nx run oseplatform-web:test:quick` still passes
- [ ] `nx run oseplatform-web-be-e2e:test:quick` still passes
- [ ] `nx run oseplatform-web-fe-e2e:test:quick` still passes

### CLAUDE.md

- [ ] `oseplatform-web-be-e2e` listed with correct description
- [ ] `oseplatform-web-fe-e2e` listed with correct description
- [ ] Both apps appear in the project structure listing under `apps/`
- [ ] Both apps listed under the **oseplatform-web** section in CLAUDE.md

## Acceptance Criteria Verification

See [requirements.md](./requirements.md) for the full Gherkin acceptance criteria. Verification
mapping:

| Scenario                                        | Verified by                                           |
| ----------------------------------------------- | ----------------------------------------------------- |
| BE E2E app scaffolding passes test:quick        | `nx run oseplatform-web-be-e2e:test:quick` output     |
| BE E2E app consumes all backend Gherkin specs   | `bddgen` output lists all 5 feature areas             |
| BE E2E tests execute against a running instance | Manual run with oseplatform-web running locally       |
| FE E2E app scaffolding passes test:quick        | `nx run oseplatform-web-fe-e2e:test:quick` output     |
| FE E2E app consumes all frontend Gherkin specs  | `bddgen` output lists all 4 feature files             |
| FE E2E tests execute against a running instance | Manual run with oseplatform-web running locally       |
| Docker compose builds and starts successfully   | `docker compose up -d --build` then health check      |
| Health check URL matches tRPC pattern           | Inspect `docker-compose.yml` healthcheck config       |
| CI e2e job runs both BE and FE suites           | Inspect updated workflow YAML                         |
| Visual E2E tests removed                        | File system check                                     |
| C4 directory contains all required diagrams     | `ls specs/apps/oseplatform/c4/`                       |
| Context diagram shows correct actors            | Inspect Mermaid in `context.md`                       |
| Container diagram includes E2E test apps        | Inspect Mermaid in `container.md`                     |
| Component-be diagram maps to tRPC procedures    | Inspect Mermaid + coverage table in `component-be.md` |
| Component-fe diagram maps to UI components      | Inspect Mermaid + coverage table in `component-fe.md` |
| Specs README includes c4 and E2E references     | Inspect `specs/apps/oseplatform/README.md`            |
| CLAUDE.md updated                               | Inspect CLAUDE.md app listing                         |
