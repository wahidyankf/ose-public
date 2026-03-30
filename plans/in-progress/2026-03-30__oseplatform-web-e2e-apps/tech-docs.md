# Technical Documentation: oseplatform-web E2E Test Apps

## Architecture

The E2E test apps follow the same two-app split already established for `ayokoding-web`:

```
apps/
├── oseplatform-web-be-e2e/          # Backend E2E — API over HTTP (no browser rendering)
│   ├── project.json
│   ├── package.json
│   ├── playwright.config.ts
│   ├── tsconfig.json
│   ├── oxlint.json
│   └── src/steps/
│       ├── helpers.ts               # buildTrpcUrl, extractTrpcData, shared state
│       ├── common.steps.ts          # Given "the API is running"
│       ├── health-check.steps.ts    # meta.health
│       ├── content-api.steps.ts     # content.getBySlug, content.listUpdates
│       ├── search-api.steps.ts      # search.query
│       ├── rss-feed.steps.ts        # /feed.xml
│       └── seo.steps.ts             # /sitemap.xml, /robots.txt
│
└── oseplatform-web-fe-e2e/          # Frontend E2E — browser-based UI
    ├── project.json
    ├── package.json
    ├── playwright.config.ts
    ├── tsconfig.json
    ├── oxlint.json
    └── src/steps/
        ├── common.steps.ts          # Given "the app is running"
        ├── landing-page.steps.ts    # landing-page.feature
        ├── navigation.steps.ts      # navigation.feature
        ├── theme.steps.ts           # theme.feature
        └── responsive.steps.ts      # responsive.feature

infra/dev/oseplatform-web/
└── docker-compose.yml               # Builds + runs oseplatform-web for E2E

specs/apps/oseplatform/
├── README.md              # Updated with c4/, E2E refs, testing table
├── c4/                    # NEW: C4 architecture diagrams
│   ├── README.md          # Diagram index, tech stack, testing summary
│   ├── context.md         # Level 1: System context
│   ├── container.md       # Level 2: Containers
│   ├── component-be.md    # Level 3: tRPC API components
│   └── component-fe.md    # Level 3: UI components
├── be/gherkin/            # Existing backend Gherkin specs (unchanged)
└── fe/gherkin/            # Existing frontend Gherkin specs (unchanged)
```

The Gherkin specs remain in `specs/apps/oseplatform/` — the E2E apps only add step
implementations. The C4 diagrams provide architectural context for the specs.

## Design Decisions

### Decision 1: Two-app split (BE and FE)

The same rationale as ayokoding-web applies: BE E2E tests make HTTP requests and do not need a
browser; FE E2E tests need a browser and take longer to execute. Keeping them separate allows
running BE tests quickly and FE tests in a separate CI step, and gives each its own Playwright
report.

### Decision 2: playwright-bdd with workspace Gherkin specs

`playwright-bdd` is used so the same Gherkin feature files at `specs/apps/oseplatform/` serve all
three test levels (unit, integration, E2E). The E2E step implementations call real HTTP endpoints
rather than service functions directly, satisfying the three-level testing standard. The
`featuresRoot` in the Playwright config is set to the monorepo root so that workspace-relative
feature paths resolve correctly.

### Decision 3: No i18n step file

`ayokoding-web-be-e2e` includes `i18n-api.steps.ts` for the `meta.languages` endpoint and locale
parameter. `oseplatform-web` has no i18n — the single locale is English. There is no i18n feature
file in `specs/apps/oseplatform/`. No i18n step file is created.

### Decision 4: RSS feed and SEO via HTTP GET (not tRPC)

`/feed.xml`, `/sitemap.xml`, and `/robots.txt` are plain HTTP routes, not tRPC procedures. The BE
E2E step implementations call these routes directly with `request.get()` and assert on the
response body content (XML structure, text patterns). They do not use `buildTrpcUrl`.

### Decision 5: Existing visual E2E tests deleted

`apps/oseplatform-web/test/visual/pages.spec.ts` is a basic page-load smoke test. Its coverage
(landing, about, updates, update-detail page load without error) is superseded by the new FE E2E
tests. Keeping both would create confusion about which E2E setup is authoritative. The embedded
`playwright.config.ts` also references a separate Playwright installation inside the main app,
which conflicts with the monorepo E2E pattern.

### Decision 6: C4 architecture diagrams in specs

`specs/apps/ayokoding/c4/` already provides C4 diagrams for ayokoding-web. Adding the same for
oseplatform-web ensures architectural parity and gives developers a visual onboarding path.
The diagrams are tailored to oseplatform-web's simpler architecture (no i18n, different tRPC
procedures, RSS/SEO routes). The accessible color palette is mandatory per
`governance/conventions/formatting/diagrams.md`.

### Decision 7: Docker CONTENT_DIR uses `/workspace/` (not `/app/`)

The ayokoding-web Dockerfile uses `WORKDIR /app` in its runner stage, so its docker-compose sets
`CONTENT_DIR=/app/apps/ayokoding-web/content`. The oseplatform-web Dockerfile uses
`WORKDIR /workspace` in its runner stage, so the docker-compose must set
`CONTENT_DIR=/workspace/apps/oseplatform-web/content`. This is an important difference — copying
the ayokoding pattern verbatim would break content loading.

### Decision 8: Docker health check uses tRPC meta.health

The health check endpoint `/api/trpc/meta.health` is the canonical liveness signal for
oseplatform-web (same as ayokoding-web). The Docker health check uses `wget --spider` against this
URL, matching the ayokoding-web pattern exactly.

## File Specifications

### `apps/oseplatform-web-be-e2e/project.json`

```json
{
  "name": "oseplatform-web-be-e2e",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "application",
  "sourceRoot": "apps/oseplatform-web-be-e2e/src",
  "targets": {
    "install": {
      "executor": "nx:run-commands",
      "options": { "command": "npm install", "cwd": "apps/oseplatform-web-be-e2e" }
    },
    "lint": {
      "executor": "nx:run-commands",
      "options": { "command": "npx oxlint@latest .", "cwd": "apps/oseplatform-web-be-e2e" }
    },
    "typecheck": {
      "executor": "nx:run-commands",
      "options": { "command": "npx tsc --noEmit", "cwd": "apps/oseplatform-web-be-e2e" }
    },
    "test:quick": {
      "executor": "nx:run-commands",
      "options": {
        "commands": ["npx oxlint@latest .", "npx tsc --noEmit"],
        "parallel": true,
        "cwd": "apps/oseplatform-web-be-e2e"
      }
    },
    "test:e2e": {
      "executor": "nx:run-commands",
      "inputs": ["default", "{workspaceRoot}/specs/apps/oseplatform/be/gherkin/**/*.feature"],
      "options": { "command": "npx bddgen && npx playwright test", "cwd": "apps/oseplatform-web-be-e2e" }
    },
    "test:e2e:ui": {
      "executor": "nx:run-commands",
      "options": { "command": "npx bddgen && npx playwright test --ui", "cwd": "apps/oseplatform-web-be-e2e" }
    },
    "test:e2e:report": {
      "executor": "nx:run-commands",
      "options": { "command": "npx playwright show-report", "cwd": "apps/oseplatform-web-be-e2e" }
    }
  },
  "tags": ["type:e2e", "platform:playwright", "lang:ts", "domain:oseplatform"]
}
```

### `apps/oseplatform-web-fe-e2e/project.json`

Same structure as BE, but:

- `name`: `oseplatform-web-fe-e2e`
- `sourceRoot`: `apps/oseplatform-web-fe-e2e/src`
- `test:e2e` inputs reference `specs/apps/oseplatform/fe/gherkin/**/*.feature`
- `cwd` paths reference `apps/oseplatform-web-fe-e2e`
- Adds `"implicitDependencies": ["oseplatform-web"]`

### `apps/oseplatform-web-be-e2e/playwright.config.ts`

```typescript
import path from "node:path";
import { defineConfig } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";

const workspaceRoot = path.resolve(__dirname, "../..");

const testDir = defineBddConfig({
  featuresRoot: workspaceRoot,
  features: path.join(workspaceRoot, "specs/apps/oseplatform/be/gherkin/**/*.feature"),
  steps: "./src/steps/**/*.steps.ts",
});

export default defineConfig({
  testDir,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html"], ["junit", { outputFile: "test-results/junit.xml" }]],
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3100",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
});
```

### `apps/oseplatform-web-fe-e2e/playwright.config.ts`

Same as BE config, but:

- `features` path points to `specs/apps/oseplatform/fe/gherkin/**/*.feature`
- Adds `projects` block with chromium only in CI; chromium + firefox + webkit locally
- `baseURL` defaults to `http://localhost:3100`

### `apps/oseplatform-web-be-e2e/package.json` and `apps/oseplatform-web-fe-e2e/package.json`

```json
{
  "name": "oseplatform-web-be-e2e",
  "private": true,
  "scripts": {
    "test": "playwright test",
    "test:ui": "playwright test --ui",
    "test:report": "playwright show-report"
  },
  "devDependencies": {
    "@playwright/test": "^1.58.2",
    "playwright-bdd": "^8.5.0"
  },
  "volta": {
    "extends": "../../package.json"
  }
}
```

### `apps/oseplatform-web-be-e2e/tsconfig.json`

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "module": "CommonJS",
    "moduleResolution": "node"
  },
  "include": ["src/**/*.ts", "playwright.config.ts"],
  "exclude": ["node_modules", "dist", "test-results", "playwright-report"]
}
```

### `apps/oseplatform-web-fe-e2e/tsconfig.json`

Same as BE variant but adds `"lib": ["ES2022", "DOM"]` — required for Playwright browser-side DOM
type definitions used in FE step implementations:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "module": "CommonJS",
    "moduleResolution": "node",
    "lib": ["ES2022", "DOM"]
  },
  "include": ["src/**/*.ts", "playwright.config.ts"],
  "exclude": ["node_modules", "dist", "test-results", "playwright-report"]
}
```

### `apps/oseplatform-web-be-e2e/oxlint.json` (and FE variant)

Identical to `apps/ayokoding-web-be-e2e/oxlint.json`.

### `infra/dev/oseplatform-web/docker-compose.yml`

```yaml
services:
  oseplatform-web:
    build:
      context: ../../../
      dockerfile: apps/oseplatform-web/Dockerfile
    ports:
      - "3100:3100"
    environment:
      - CONTENT_DIR=/workspace/apps/oseplatform-web/content
      - PORT=3100
      - HOSTNAME=0.0.0.0
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3100/api/trpc/meta.health"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s
```

### CI `e2e` job replacement

The existing `e2e` job in `.github/workflows/test-and-deploy-oseplatform-web.yml` currently:

1. Checks out code and installs Node
2. Builds the Next.js app (`nx build oseplatform-web`)
3. Installs Playwright globally
4. Starts the Next.js server in background, sleeps 5 seconds
5. Runs `playwright test --config=apps/oseplatform-web/playwright.config.ts`
6. Uploads the report from `apps/oseplatform-web/playwright-report/`

The replacement job:

1. Checks out code and installs Node
2. Builds Docker and waits for health check using `curl -sf` (up to 150 seconds, 30 attempts × 5
   seconds, matching ayokoding-web CI pattern)
3. Installs dependencies (`npm ci`)
4. Installs Playwright browsers for BE E2E (`cd apps/oseplatform-web-be-e2e && npx playwright install --with-deps chromium`)
5. Installs Playwright browsers for FE E2E (`cd apps/oseplatform-web-fe-e2e && npx playwright install --with-deps chromium`)
6. Runs `nx run oseplatform-web-be-e2e:test:e2e` with `BASE_URL=http://localhost:3100`
7. Runs `nx run oseplatform-web-fe-e2e:test:e2e` with `BASE_URL=http://localhost:3100`
8. Uploads artifact containing both `apps/oseplatform-web-be-e2e/playwright-report/` and `apps/oseplatform-web-fe-e2e/playwright-report/`
9. Always runs `docker compose down` from `infra/dev/oseplatform-web`

## Step Implementation Guide

### BE E2E steps

**`src/steps/helpers.ts`**

Identical to `ayokoding-web-be-e2e/src/steps/helpers.ts`:

- `buildTrpcUrl(procedure, input)` — encodes batch tRPC GET URL
- `extractTrpcData(body)` — unwraps the batch tRPC response envelope
- `state` — shared mutable record for cross-step communication

**`src/steps/common.steps.ts`**

Single step: `Given("the API is running", async () => {})` — no-op, confirms the background
context. No parameterized Given steps needed (no locale, no i18n).

**`src/steps/health-check.steps.ts`**

Covers `health/health.feature`:

- `When("the health endpoint is called")` — calls `meta.health` via `buildTrpcUrl`
- `Then('the response contains status "ok"')` — asserts `state.healthResult.status === "ok"`

**`src/steps/content-api.steps.ts`**

Covers `content-retrieval/content-retrieval.feature`:

- Given steps for content repo setup (no-op fixtures)
- `When("the content service retrieves the page by slug {string}")` — calls `content.getBySlug`
- `When("the content service lists all updates")` — calls `content.listUpdates`
- Then steps asserting: title, HTML, headings, date-sorted order, title/date/summary/tags fields,
  draft exclusion, null response for nonexistent slug

**`src/steps/search-api.steps.ts`**

Covers `search/search.feature`:

- Given steps for search index setup (no-op fixtures)
- `When("a search query {string} is executed")` — calls `search.query`
- `When("a search query {string} is executed with limit {int}")` — calls `search.query` with limit
- Then steps asserting: matching results, title/slug/excerpt fields, empty results, result count

**`src/steps/rss-feed.steps.ts`**

Covers `rss-feed/rss-feed.feature`. Uses `request.get("/feed.xml")` (plain HTTP, not tRPC):

- Given steps (no-op fixtures)
- `When("the RSS feed is generated")` — GET `/feed.xml`, assert 200
- Then steps asserting: XML contains `<title>OSE Platform Updates</title>`, `<link>` element,
  `<item>` elements, specific entry title/date/link/description

**`src/steps/seo.steps.ts`**

Covers `seo/seo.feature`. Uses plain HTTP GET:

- `When("the sitemap is generated")` — GET `/sitemap.xml`, assert 200
- Then steps asserting: sitemap contains landing page URL, about URL, update page URLs
- `When("the robots.txt is generated")` — GET `/robots.txt`, assert 200
- Then steps asserting: `User-agent: *` present, sitemap URL present

### FE E2E steps

**`src/steps/common.steps.ts`**

- `Given("the app is running", async () => {})` — no-op background

**`src/steps/landing-page.steps.ts`**

Covers `landing-page.feature`:

- `Given("the landing page is rendered")` — `page.goto("/")`
- Then steps asserting: hero title text "Open Sharia Enterprise Platform", mission description
  visible, "Learn More" link to `/about/`, GitHub link present
- Then steps asserting: GitHub icon link visible, RSS feed icon link visible

**`src/steps/navigation.steps.ts`**

Covers `navigation.feature`:

- `Given("the header component is rendered")` — `page.goto("/")`
- Then steps asserting: "Updates" link to `/updates/`, "About" link to `/about/`, external
  Documentation link, external GitHub link
- `Given("the about page is rendered with breadcrumbs")` — `page.goto("/about/")`
- Then steps asserting: breadcrumb "Home" → `/`, breadcrumb "About" as current
- `Given("an update detail page is rendered with adjacent updates")` — navigate to an update detail
- Then steps asserting: Previous link present, Next link present

**`src/steps/theme.steps.ts`**

Covers `theme.feature`:

- `Given("the site loads without a stored theme preference")` — `page.goto("/")`
- `Then("the theme is set to light mode")` — assert light mode attribute on `<html>`
- `Given("the site is in light mode")` — `page.goto("/")`
- `When("the user clicks the theme toggle and selects dark mode")` — click theme toggle button
- `Then("the site switches to dark mode")` — assert dark mode attribute on `<html>`

**`src/steps/responsive.steps.ts`**

Covers `responsive.feature`:

- `Given("the viewport width is less than 640 pixels")` — `page.setViewportSize({width: 375, height: 667})`
- `When("the header is rendered")` — `page.goto("/")`
- `Then("the hamburger menu button is visible")` — assert hamburger button visible
- `Then("the desktop navigation links are hidden")` — assert nav links not visible
- `Given("the viewport width is greater than 1024 pixels")` — `page.setViewportSize({width: 1280, height: 800})`
- `Then("the desktop navigation links are visible")` — assert nav links visible
- `Then("the hamburger menu button is hidden")` — assert hamburger button not visible

## Dependencies

All E2E apps have standalone `package.json` files with their own `node_modules`. They are not part
of the root npm workspace (no entry in root `package.json` `workspaces`). The `volta.extends`
field pins Node/npm versions from the root `package.json`.

| Dependency         | Version   | Purpose                            |
| ------------------ | --------- | ---------------------------------- |
| `@playwright/test` | `^1.58.2` | Test runner and browser automation |
| `playwright-bdd`   | `^8.5.0`  | Gherkin BDD adapter for Playwright |

These versions match the existing `ayokoding-web-be-e2e` and `ayokoding-web-fe-e2e` apps.

## Testing Strategy

### What the BE E2E tests verify

- tRPC endpoints return correct HTTP 200 responses
- Response bodies match the expected structure defined in Gherkin
- `/feed.xml` is valid XML with expected RSS channel structure
- `/sitemap.xml` contains expected URL entries
- `/robots.txt` allows all crawlers and references the sitemap

### What the FE E2E tests verify

- Pages render visible content in a real browser
- Navigation links are present and point to correct paths
- Theme toggle changes the visual mode
- Hamburger menu appears on mobile viewport; full nav appears on desktop viewport

### What is NOT in scope for these E2E tests

- Coverage measurement (E2E tests are not part of `test:quick`)
- Performance benchmarks
- Visual regression screenshots (the deleted `pages.spec.ts` did basic smoke testing only)
- Accessibility audits (deferred to dedicated tooling)

## C4 Diagram Specifications

### `specs/apps/oseplatform/c4/README.md`

Index file listing all 4 diagrams. Follows the exact structure of
`specs/apps/ayokoding/c4/README.md` but adapted for oseplatform-web:

- Technology stack table: Next.js 16, tRPC v11, FlexSearch, gray-matter + unified, Tailwind CSS +
  shadcn/ui, Vercel, Markdown with YAML frontmatter, English only
- Testing table: unit tests (oseplatform-web, >= 80%), BE E2E (oseplatform-web-be-e2e), FE E2E
  (oseplatform-web-fe-e2e), link validation (oseplatform-cli)
- Related links to parent specs, gherkin dirs, and app source

### `specs/apps/oseplatform/c4/context.md`

Level 1 Mermaid diagram showing:

- **Actors**: Visitor (browse updates, search content), Content Author (write markdown), CI Pipeline
  (typecheck, lint, test), oseplatform-cli (link validation), Vercel Platform (CDN + deployment),
  Google Analytics (page views via `@next/third-parties`)
- **System**: OSE Platform Web — Next.js 16 content platform, marketing site, update posts,
  full-text search, English only, ISR caching
- Accessible color palette classes matching ayokoding pattern

### `specs/apps/oseplatform/c4/container.md`

Level 2 Mermaid diagram showing containers inside the system boundary:

- **Next.js Server**: App Router + tRPC, Server Components, SSG, tRPC API routes, markdown parsing,
  syntax highlighting, RSS feed generation, sitemap/robots generation
- **Next.js Client**: Browser SPA — Client Components, search dialog, theme toggle, mobile nav
  (no language switcher — English only)
- **Content Directory**: Markdown + YAML, `content/` directory, ~10 files (about + updates)
- **Search Index**: FlexSearch, in-memory, title + body
- **CI Pipelines**: Main CI (test:quick), BE E2E CI (Playwright tRPC tests), FE E2E CI (Playwright
  browser tests)
- **Vercel CDN**: Edge network, static pages, standalone output
- Arrows showing data flow between containers

### `specs/apps/oseplatform/c4/component-be.md`

Level 3 Mermaid diagram showing tRPC API internals:

- **tRPC Router**: `/api/trpc/[trpc]` route handler
- **tRPC Procedures**: `content.getBySlug` (page by slug, HTML + meta), `content.listUpdates`
  (all updates sorted by date), `search.query` (full-text search), `meta.health` (liveness)
- **Route Handlers**: RSS feed (`/feed.xml`), Sitemap (`/sitemap.xml`), Robots (`/robots.txt`)
- **Content Services**: ContentService (readAllContent, in-memory cache), ContentReader
  (readFileContent, gray-matter), MarkdownParser (unified pipeline, shiki)
- **Search**: SearchIndex (FlexSearch), stripMarkdown (plain text extraction)
- **Schemas**: Frontmatter (Zod), Search (Zod)
- Gherkin coverage table mapping components to feature files from
  `specs/apps/oseplatform/be/gherkin/`
- Testing table: test:unit >= 80%, test:e2e via Playwright

### `specs/apps/oseplatform/c4/component-fe.md`

Level 3 Mermaid diagram showing UI internals:

- **Pages (Server Components)**: Home (`/`), About (`/about/`), Updates listing (`/updates/`),
  Update Detail (`/updates/[slug]/`), Sitemap (`/sitemap.xml`), RSS Feed (`/feed.xml`)
- **Layout Components**: Header (logo, search trigger, theme toggle), Footer, Breadcrumb, TOC,
  PrevNext, MobileNav
- **Content Renderers**: MarkdownRenderer (HTML from tRPC), Mermaid (client-side)
- **Search (Client Component)**: SearchDialog (Cmd+K), SearchProvider (tRPC query hook)
- **Theme**: ThemeToggle (dark/light via next-themes)
- No i18n layer (English only — differs from ayokoding-web)
- Gherkin coverage table mapping components to feature files from
  `specs/apps/oseplatform/fe/gherkin/`

### `specs/apps/oseplatform/README.md` update

Add to the existing README:

- `c4/` directory in the structure tree listing
- C4 files in the structure (README.md, context.md, container.md, component-be.md, component-fe.md)
- "Related" section with links to: C4 diagrams, three-level testing standard, BDD standards, app
  source
- tRPC procedures table: `content.getBySlug`, `content.listUpdates`, `search.query`, `meta.health`

## References

- `apps/ayokoding-web-be-e2e/` — Reference implementation for BE E2E app structure
- `apps/ayokoding-web-fe-e2e/` — Reference implementation for FE E2E app structure
- `infra/dev/ayokoding-web/docker-compose.yml` — Reference Docker compose configuration
- `.github/workflows/test-and-deploy-ayokoding-web.yml` — Reference CI workflow with Docker E2E
- `specs/apps/ayokoding/c4/` — Reference C4 diagram structure (context, container, component)
- `specs/apps/oseplatform/be/gherkin/` — Backend Gherkin feature files consumed by BE E2E
- `specs/apps/oseplatform/fe/gherkin/` — Frontend Gherkin feature files consumed by FE E2E
- `apps/oseplatform-web/Dockerfile` — Uses `WORKDIR /workspace` (not `/app` like ayokoding-web)
- [CLAUDE.md](../../../CLAUDE.md) — Three-level testing standard and Nx targets requirements
