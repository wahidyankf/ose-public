# Delivery

> **Note**: All `npm install` commands run from `apps/ayokoding-web-v2/` (project root),
> not the workspace root. This ensures packages are added to the app's own `package.json`.

## Phase 0: Visual Design Capture

- [ ] Start the current Hugo site locally (`nx dev ayokoding-web` on port 3100)
- [ ] Capture screenshots at 4 breakpoints using Playwright:
  - [ ] **Desktop (1280px)**: Homepage, section index (`/en/learn/`), content page
        with code blocks, content page with callouts + math + mermaid, search dialog,
        rants page
  - [ ] **Laptop (1024px)**: Same pages — verify TOC hidden, sidebar still visible
  - [ ] **Tablet (768px)**: Same pages — verify sidebar behavior
  - [ ] **Mobile (375px)**: Same pages — verify hamburger menu, collapsed layout
- [ ] Save screenshots to `plans/in-progress/2026-03-23__ayokoding-web-v2/screenshots/`
- [ ] Analyze Hextra theme source (from Hugo module cache or GitHub):
  - [ ] Extract layout grid structure (sidebar width, content max-width, TOC width)
  - [ ] Extract color tokens (light + dark mode palettes)
  - [ ] Extract typography scale (font family, heading sizes, body size, line height)
  - [ ] Extract responsive breakpoints (sm, md, lg, xl)
  - [ ] Extract spacing system (padding, margins, gaps)
- [ ] Create component mapping document (`plans/in-progress/2026-03-23__ayokoding-web-v2/design-mapping.md`):
  - [ ] Map each Hextra element to shadcn/ui + Tailwind equivalent
  - [ ] Document responsive behavior per breakpoint:
    - Desktop (≥1280px): sidebar (250px) + content (max-w-3xl) + TOC (200px)
    - Laptop (≥1024px): sidebar (250px) + content + TOC hidden
    - Tablet (≥768px): sidebar collapsed to icons + content
    - Mobile (<768px): hamburger drawer + full-width content
  - [ ] Document dark/light mode color mapping
  - [ ] Document component-specific responsive rules:
    - Code blocks: horizontal scroll on mobile, full-width
    - Tables: horizontal scroll wrapper on mobile
    - Images: max-width 100%, centered
    - Search dialog: full-screen on mobile, centered modal on desktop
    - Sidebar: persistent on desktop, Sheet overlay on mobile
    - TOC: right column on desktop, collapsed/hidden on tablet+mobile
    - Breadcrumb: truncated with ellipsis on mobile
    - Prev/Next nav: stacked vertically on mobile, side-by-side on desktop
- [ ] Review `apps/ayokoding-web/assets/css/custom.css` for site-specific overrides
      to replicate in Tailwind

## Phase 1: Project Scaffolding

- [ ] Create `apps/ayokoding-web-v2/` directory
- [ ] Initialize Next.js 16 project with TypeScript, App Router, src/ directory
- [ ] Configure `next.config.ts`:
  - [ ] `output: 'standalone'` for Docker builds (Vercel ignores this)
  - [ ] `outputFileTracingRoot: path.join(__dirname, '../../')` for monorepo
- [ ] Install and configure Tailwind CSS v4 + PostCSS (v4 uses CSS-based config
      via `@theme` directive in `globals.css` — no `tailwind.config.ts` file)
- [ ] Initialize shadcn/ui (`npx shadcn@latest init`) with `components.json`
- [ ] Install core shadcn/ui components: Button, Input, Dialog, Alert, Separator,
      ScrollArea, Sheet, DropdownMenu, Tooltip, Badge, Command
- [ ] Install tRPC: `@trpc/server`, `@trpc/client`, `@trpc/tanstack-react-query`,
      `@tanstack/react-query@^5.62.8`
- [ ] Install Zod: `zod@^3` (tRPC v11 validated with Zod v3; v4 has breaking changes,
      migrate later once tRPC confirms v4 support)
- [ ] Install markdown tooling: `unified`, `remark-parse`, `remark-gfm`, `remark-math`,
      `remark-rehype` (MDAST→HAST bridge — required), `rehype-pretty-code`,
      `shiki@^1` (pin to 1.x — 2.x incompatible with rehype-pretty-code),
      `rehype-katex`, `rehype-slug`, `rehype-autolink-headings`,
      `rehype-stringify`, `gray-matter`
- [ ] Install FlexSearch for search indexing
- [ ] Install test dependencies: `vitest`, `@vitest/coverage-v8`,
      `@amiceli/vitest-cucumber`, `@testing-library/react`, `jsdom`
- [ ] Create `project.json` with 7 mandatory Nx targets (codegen, typecheck, lint, build,
      test:unit, test:quick, test:integration) + `dev` + `start`:
  - [ ] Add `implicitDependencies: ["rhino-cli", "ayokoding-cli"]`
  - [ ] Add link validation to `test:quick` target:
        `./apps/ayokoding-cli/dist/ayokoding-cli links check --content apps/ayokoding-web/content`
- [ ] Set up `tsconfig.json` with strict mode
- [ ] Set up `vitest.config.ts` with v8 coverage (80% threshold)
- [ ] Copy static assets to `public/`: `favicon.ico`, `favicon.png`, `robots.txt`
- [ ] Configure oxlint for linting
- [ ] Verify `nx run ayokoding-web-v2:lint` passes
- [ ] Verify `nx run ayokoding-web-v2:typecheck` passes

## Phase 2: Specs (Gherkin Feature Files)

- [ ] Create `specs/apps/ayokoding-web/README.md` with overview
- [ ] Create `specs/apps/ayokoding-web/be/gherkin/` directory
- [ ] Write `content-api.feature` — content retrieval scenarios:
  - [ ] Get page by slug (existing page, non-existent page, draft page)
  - [ ] List children of a section (with weight ordering)
  - [ ] Get navigation tree (full hierarchy)
  - [ ] Content includes rendered HTML with code blocks
- [ ] Write `search-api.feature` — search scenarios:
  - [ ] Search returns matching results
  - [ ] Search is scoped to locale
  - [ ] Empty query returns error
  - [ ] Search results include title, slug, excerpt
- [ ] Write `navigation-api.feature` — navigation scenarios:
  - [ ] Tree structure matches filesystem hierarchy
  - [ ] Nodes are ordered by weight
  - [ ] Section nodes have children
- [ ] Write `i18n-api.feature` — locale scenarios:
  - [ ] English content served for locale "en"
  - [ ] Indonesian content served for locale "id"
  - [ ] Invalid locale returns error
- [ ] Write `health-check.feature` — health endpoint scenario
- [ ] Create `specs/apps/ayokoding-web/fe/gherkin/` directory
- [ ] Write `content-rendering.feature` — page rendering scenarios:
  - [ ] Markdown renders with proper formatting
  - [ ] Code blocks have syntax highlighting
  - [ ] Callout shortcodes render as admonitions
  - [ ] Math expressions render via KaTeX
  - [ ] Mermaid diagrams render
- [ ] Write `navigation.feature` — UI navigation scenarios:
  - [ ] Sidebar shows section tree
  - [ ] Breadcrumb shows path hierarchy
  - [ ] Table of contents shows heading links
  - [ ] Prev/Next links navigate between siblings
- [ ] Write `search.feature` — search UI scenarios:
  - [ ] Cmd+K opens search dialog
  - [ ] Typing shows results
  - [ ] Clicking result navigates to page
  - [ ] Escape closes search
- [ ] Write `responsive.feature` — responsive layout scenarios:
  - [ ] Desktop: sidebar + TOC visible
  - [ ] Mobile: hamburger menu, hidden sidebar
- [ ] Write `i18n.feature` — language switching scenarios:
  - [ ] Language switcher changes locale
  - [ ] URL updates to locale-specific path
  - [ ] UI labels change language
- [ ] Write `accessibility.feature` — WCAG scenarios:
  - [ ] Keyboard navigation works
  - [ ] ARIA labels present on interactive elements
  - [ ] Color contrast meets AA standard
  - [ ] Skip to content link present

## Phase 3: Content Layer

- [ ] Create `src/server/content/types.ts` — ContentMeta, ContentPage, TreeNode types
- [ ] Create `src/lib/schemas/content.ts` — Zod frontmatter schema
- [ ] Create `src/lib/schemas/search.ts` — Zod search query/result schemas
- [ ] Create `src/lib/schemas/navigation.ts` — Zod tree node schema
- [ ] Create `src/server/content/reader.ts`:
  - [ ] Glob all `*.md` files from content directory
  - [ ] Parse frontmatter with gray-matter + Zod validation
  - [ ] Detect `_index.md` as section pages
  - [ ] Build slug from file path (relative to content/locale/)
  - [ ] Handle both `en/` and `id/` content directories
- [ ] Create `src/server/content/shortcodes.ts`:
  - [ ] Custom remark plugin to transform Hugo `{{< callout >}}` to HTML nodes
  - [ ] Map callout types (warning, info, tip) to data attributes
- [ ] Create `src/server/content/parser.ts`:
  - [ ] unified pipeline: remark-parse → remark-gfm → remark-math → shortcodes →
        remark-rehype → rehype-pretty-code → rehype-katex → rehype-slug →
        rehype-autolink-headings → rehype-stringify
  - [ ] Extract headings (H2-H4) for table of contents
  - [ ] Return { html, headings }
- [ ] Create `src/server/content/index.ts`:
  - [ ] Scan all markdown files at startup
  - [ ] Build content map (slug → ContentMeta)
  - [ ] Build navigation tree (hierarchical, weight-sorted)
  - [ ] Compute prev/next for each page within its section
  - [ ] Lazy initialization (singleton, built once)
- [ ] Create `src/server/content/search-index.ts`:
  - [ ] Initialize FlexSearch document index per locale
  - [ ] Index title + raw content (stripped markdown) for each page
  - [ ] Provide search function returning ranked results with excerpts

## Phase 4: tRPC API

- [ ] Create `src/server/trpc/init.ts` — tRPC initialization, context factory
- [ ] Create `src/server/trpc/procedures/content.ts`:
  - [ ] `content.getBySlug` — read + parse markdown, return HTML + metadata + headings
  - [ ] `content.listChildren` — list child pages with metadata, sorted by weight
  - [ ] `content.getTree` — return navigation tree for a locale (optionally scoped
        to a root slug)
- [ ] Create `src/server/trpc/procedures/search.ts`:
  - [ ] `search.query` — search FlexSearch index, return results with excerpts
- [ ] Create `src/server/trpc/procedures/meta.ts`:
  - [ ] `meta.health` — return `{ status: "ok" }`
  - [ ] `meta.languages` — return available locales with labels
- [ ] Create `src/server/trpc/router.ts` — merge all sub-routers
- [ ] Create `src/app/api/trpc/[trpc]/route.ts` — tRPC HTTP adapter for App Router
- [ ] Create `src/lib/trpc/client.ts` — tRPC TanStack React Query hooks (search only)
- [ ] Create `src/lib/trpc/server.ts` — tRPC server-side caller (for RSC)
- [ ] Create `src/lib/trpc/provider.tsx` — TRPCProvider + QueryClientProvider wrapper
- [ ] Verify tRPC API responds at `/api/trpc/meta.health`

## Phase 5: Frontend Core (Layout & Navigation)

- [ ] Create `src/lib/i18n/config.ts` — locale config, path mappings (en↔id)
- [ ] Create `src/lib/i18n/translations.ts` — UI string translations (9 keys from Hugo i18n files)
- [ ] Create `src/lib/i18n/middleware.ts` — locale detection + redirect
- [ ] Create `src/middleware.ts` — Next.js middleware for locale routing
- [ ] Create `src/app/layout.tsx` — root layout (fonts, providers, metadata)
- [ ] Create `src/app/page.tsx` — redirect `/` → `/en`
- [ ] Create `src/app/[locale]/layout.tsx` — shared locale layout:
  - [ ] Header component (site title, search trigger, language switcher, theme toggle)
  - [ ] Footer component (copyright, links)
  - [ ] Mobile navigation drawer (Sheet component)
- [ ] Create `src/app/[locale]/(content)/layout.tsx` — content-specific layout:
  - [ ] Sidebar component (collapsible navigation tree)
  - [ ] Table of contents (right column)
  - [ ] Note: `(content)` route group isolates content layout from future `(app)` routes
- [ ] Create `src/app/[locale]/(app)/.gitkeep` — placeholder for future fullstack routes
- [ ] Create `src/components/layout/header.tsx`
- [ ] Create `src/components/layout/sidebar.tsx`:
  - [ ] Fetch navigation tree via tRPC
  - [ ] Collapsible sections with weight-based ordering
  - [ ] Highlight active page
  - [ ] Responsive: visible on desktop, drawer on mobile
- [ ] Create `src/components/layout/breadcrumb.tsx`
- [ ] Create `src/components/layout/toc.tsx` — table of contents from headings
- [ ] Create `src/components/layout/footer.tsx`
- [ ] Create `src/components/layout/mobile-nav.tsx` — hamburger drawer
- [ ] Create `src/components/layout/prev-next.tsx` — bottom prev/next navigation
- [ ] Create `src/lib/hooks/use-locale.ts` — current locale hook
- [ ] Add dark/light mode toggle (next-themes):
  - [ ] Add `suppressHydrationWarning` to `<html>` element in root layout
  - [ ] `ThemeProvider` is a client component — wrap in `"use client"` boundary
- [ ] Add responsive breakpoints: desktop (sidebar + TOC), tablet (sidebar),
      mobile (hamburger)

## Phase 6: Content Pages (Server-Rendered for SEO)

All content pages are **React Server Components (RSC)** with **on-demand ISR** — fully
server-rendered HTML on first request, then cached. No client-side fetching for content.
Search engines receive complete HTML without JavaScript execution. No
`generateStaticParams` — pages are rendered on-demand so builds stay fast as content
grows (933+ files and counting).

- [ ] Create `src/app/[locale]/page.tsx` — locale homepage (RSC, server-rendered)
- [ ] Create `src/app/[locale]/(content)/[...slug]/page.tsx` (RSC + ISR):
  - [ ] Set `export const dynamicParams = true` (allow any slug)
  - [ ] Set `export const revalidate = 3600` (cache 1 hour, then re-render)
  - [ ] **No `generateStaticParams`** — on-demand rendering, not build-time
  - [ ] Fetch content via **tRPC server caller** (direct function call, no HTTP)
  - [ ] Render parsed HTML with custom components
  - [ ] Show breadcrumb, TOC, prev/next — all server-rendered
  - [ ] Handle section pages (`_index.md`) — show child listing
  - [ ] Handle 404 (slug not found → `notFound()`)
  - [ ] Verify: `curl` to any content URL returns full HTML with content visible
        (no loading spinners, no "loading..." placeholders)
- [ ] Create `src/components/content/markdown-renderer.tsx`:
  - [ ] Render HTML string with component mapping (server component)
  - [ ] Map callout HTML nodes to Callout React component
  - [ ] Map code blocks to CodeBlock component (server-rendered with shiki)
  - [ ] Map mermaid code blocks to Mermaid component (client-side exception —
        Mermaid requires DOM)
- [ ] Create `src/components/content/callout.tsx` — admonition component (shadcn Alert)
- [ ] Create `src/components/content/code-block.tsx` — server-rendered syntax highlighting
- [ ] Create `src/components/content/mermaid.tsx` — client-side Mermaid renderer
      (only interactive component on content pages, uses `"use client"`)
- [ ] Create `src/app/[locale]/(content)/error.tsx` — error boundary for content
      rendering failures (`"use client"`, shows friendly error message)
- [ ] Create `src/app/[locale]/(content)/not-found.tsx` — custom 404 for invalid slugs
- [ ] Add `generateMetadata` for SEO (Open Graph, Twitter Cards, hreflang, canonical)
- [ ] Add JSON-LD structured data (Article/WebSite schema)
- [ ] Add sitemap generation (`app/sitemap.ts`) — reads content index, no full build
- [ ] **SEO verification**: `curl -s http://localhost:3101/en/learn/overview | grep -c '<pre'`
      returns >0 (code blocks rendered in HTML, not loading placeholders)

## Phase 7: Search UI (Client-Side — Only Interactive Feature)

Search is the **only feature using client-side tRPC + React Query** (`"use client"`).
All other content is server-rendered.

- [ ] Create `src/components/search/search-dialog.tsx` (`"use client"`):
  - [ ] shadcn Command component for search
  - [ ] Cmd+K / Ctrl+K keyboard shortcut
  - [ ] Debounced input → tRPC search.query (React Query client-side call)
  - [ ] Result list with title, section path, excerpt
  - [ ] Click result → navigate to page
  - [ ] Escape to close
- [ ] Create `src/components/search/search-results.tsx` — result item component
- [ ] Create `src/lib/hooks/use-search.ts` — search dialog open/close state
- [ ] Create `src/app/[locale]/(content)/search/page.tsx` — dedicated search results page
      (for direct URL access, inside `(content)` for sidebar layout)
- [ ] Verify search works for both locales

## Phase 8: Backend Unit Tests (BE Gherkin)

- [ ] Create `test/unit/be-steps/` directory
- [ ] Create mock content reader (in-memory content map) for unit testing
- [ ] Implement step definitions for all BE Gherkin domains:
  - [ ] content-api.steps.ts — test content.getBySlug, listChildren, getTree
  - [ ] search-api.steps.ts — test search.query with mock index
  - [ ] navigation-api.steps.ts — test tree structure and ordering
  - [ ] i18n-api.steps.ts — test locale-specific content
  - [ ] health-check.steps.ts — test meta.health
- [ ] Verify all BE unit tests pass: `nx run ayokoding-web-v2:test:unit`

## Phase 9: Frontend Unit Tests (FE Gherkin)

- [ ] Create `test/unit/fe-steps/` directory
- [ ] Create mock tRPC client for frontend unit tests
- [ ] Implement step definitions for all FE Gherkin domains:
  - [ ] content-rendering.steps.ts — test markdown rendering components
  - [ ] navigation.steps.ts — test sidebar, breadcrumb, TOC, prev/next
  - [ ] search.steps.ts — test search dialog behavior
  - [ ] responsive.steps.ts — test responsive layout states
  - [ ] i18n.steps.ts — test language switcher
  - [ ] accessibility.steps.ts — test ARIA attributes, keyboard nav
- [ ] Verify all FE unit tests pass: `nx run ayokoding-web-v2:test:unit`

## Phase 10: Coverage Gate

- [ ] Run `nx run ayokoding-web-v2:test:quick`:
  - [ ] Unit tests pass (BE + FE Gherkin scenarios)
  - [ ] Coverage validation passes (rhino-cli 80%+)
  - [ ] Link validation passes (`ayokoding-cli links check`)
- [ ] Add coverage exclusions if needed (tRPC HTTP adapter, middleware,
      static params — tested at integration/E2E level)
- [ ] Ensure `typecheck` and `lint` pass cleanly

## Phase 11: Integration Tests

- [ ] Create `cucumber.integration.js` config
- [ ] Create integration test hooks (startup content index with real filesystem)
- [ ] Create integration test world (tRPC caller with real content)
- [ ] Create integration step definitions:
  - [ ] content-api.steps.ts — test against real markdown files
  - [ ] search-api.steps.ts — test FlexSearch with real content
  - [ ] navigation-api.steps.ts — test tree with real hierarchy
- [ ] Configure `test:integration` Nx target: `npx cucumber-js --config cucumber.integration.js`
- [ ] Verify all integration tests pass: `nx run ayokoding-web-v2:test:integration`

## Phase 12: Docker, Vercel & Infrastructure

- [ ] Create `Dockerfile` (multi-stage: deps → build → runtime)
  - [ ] Copy content files (`apps/ayokoding-web/content/`) into image
  - [ ] No database needed
- [ ] Create `infra/dev/ayokoding-web-v2/docker-compose.yml`
- [ ] Verify app starts correctly via Docker Compose
- [ ] Verify health check at `http://localhost:3101/api/trpc/meta.health`
- [ ] Verify content pages render correctly in Docker
- [ ] Create `apps/ayokoding-web-v2/vercel.json`:
  - [ ] `installCommand`: `npm install --prefix=../.. --ignore-scripts`
  - [ ] `ignoreCommand`: only build on `prod-ayokoding-web-v2` branch
  - [ ] Security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection,
        Referrer-Policy)
- [ ] Configure `next.config.ts` content path to work in both Docker (`CONTENT_DIR` env)
      and Vercel (workspace-relative fallback) environments

## Phase 13: E2E Test Apps

- [ ] Create `apps/ayokoding-web-v2-be-e2e/`:
  - [ ] `project.json` with E2E targets (install, test:e2e, test:e2e:ui)
  - [ ] `playwright.config.ts` configured for `BASE_URL`
  - [ ] Test specs consuming `specs/apps/ayokoding-web/be/gherkin/` features
  - [ ] Tests hit tRPC HTTP endpoints directly
- [ ] Create `apps/ayokoding-web-v2-fe-e2e/`:
  - [ ] `project.json` with E2E targets
  - [ ] `playwright.config.ts` configured for `BASE_URL`
  - [ ] Test specs consuming `specs/apps/ayokoding-web/fe/gherkin/` features
  - [ ] Tests use Playwright browser automation
- [ ] Start app via Docker, run BE E2E — all scenarios pass
- [ ] Start app via Docker, run FE E2E — all scenarios pass

## Phase 14: CI, Deployment & Documentation

- [ ] Create `.github/workflows/test-ayokoding-web-v2.yml`:
  - [ ] Unit tests job with Codecov upload
  - [ ] E2E job: Docker build → start → health check → run BE + FE E2E
  - [ ] 2x daily cron (WIB 06, 18) + manual dispatch
- [ ] Create `prod-ayokoding-web-v2` branch from `main` for Vercel deployment
- [ ] Configure Vercel project pointing to `apps/ayokoding-web-v2` with root directory
- [ ] Verify Vercel deployment builds and serves content correctly
- [ ] Create `apps/ayokoding-web-v2/README.md` with project overview, commands,
      architecture, Vercel deployment docs, and related documentation links
- [ ] Update `specs/apps/ayokoding-web/README.md` if needed
- [ ] Update CLAUDE.md to include ayokoding-web-v2 in Current Apps listing
  - [ ] Add to Current Apps list
  - [ ] Add `prod-ayokoding-web-v2` to environment branches list
- [ ] Verify CI workflow passes

## Validation Checklist

- [ ] `nx run ayokoding-web-v2:codegen` succeeds (no-op)
- [ ] `nx run ayokoding-web-v2:typecheck` succeeds
- [ ] `nx run ayokoding-web-v2:lint` succeeds
- [ ] `nx run ayokoding-web-v2:build` succeeds
- [ ] `nx run ayokoding-web-v2:test:unit` — all BE + FE Gherkin scenarios pass
- [ ] `nx run ayokoding-web-v2:test:quick` — 80%+ coverage threshold met
- [ ] `nx run ayokoding-web-v2:test:integration` — all scenarios pass with real filesystem
- [ ] `ayokoding-web-v2-be-e2e` passes — all BE E2E scenarios pass
- [ ] `ayokoding-web-v2-fe-e2e` passes — all FE E2E scenarios pass
- [ ] Docker build and run works
- [ ] All content pages render correctly (spot check: overview, by-example, rants)
- [ ] **SEO: `curl` returns full HTML** — content visible without JS execution:
  - [ ] `curl -s http://localhost:3101/en/learn/overview` contains page content
  - [ ] `curl -s http://localhost:3101/en/learn/overview` contains `<meta property="og:title"`
  - [ ] `curl -s http://localhost:3101/en/learn/overview` contains `<script type="application/ld+json"`
  - [ ] `curl -s http://localhost:3101/sitemap.xml` lists all content URLs
- [ ] Search returns relevant results for both locales
- [ ] Language switching works correctly
- [ ] Responsive layout works (desktop, tablet, mobile)
- [ ] **ayokoding-cli backward compatibility** — Hugo v1 still works:
  - [ ] `ayokoding-cli nav regen` still generates correct nav for Hugo site
  - [ ] `ayokoding-cli titles update` still updates titles correctly
  - [ ] `ayokoding-cli links check` still validates links correctly
  - [ ] `nx run ayokoding-web:test:quick` still passes (Hugo v1 quality gate)
  - [ ] `nx run ayokoding-web:build` still succeeds (Hugo build)
- [ ] CI workflow passes
- [ ] Vercel deployment succeeds from `prod-ayokoding-web-v2` branch
- [ ] README.md is complete
