# Delivery

> **Note**: All `npm install` commands run from `apps/ayokoding-web-v2/` (project root),
> not the workspace root. This ensures packages are added to the app's own `package.json`.
>
> **Playwright MCP**: This plan is designed for execution by AI agents with access to
> Playwright MCP. Throughout the delivery phases, the agent uses Playwright MCP
> (`browser_navigate`, `browser_snapshot`, `browser_take_screenshot`, `browser_click`,
> `browser_press_key`, `browser_fill_form`) to interactively verify UI work against the
> reference Hugo site. This is **complementary** to the automated Playwright E2E tests
> in Phase 13 — MCP is for interactive agent verification during development, E2E tests
> are for CI regression.

## Phase 0: Visual Design Capture (via Playwright MCP)

- [ ] Start the current Hugo site locally (`nx dev ayokoding-web` on port 3100)
- [ ] Use **Playwright MCP** to browse the Hugo site and capture reference state
- [ ] `browser_navigate` to Homepage (`http://localhost:3100/en`)
  - [ ] `browser_take_screenshot` — visual reference at current viewport
  - [ ] `browser_snapshot` — DOM/accessibility tree (layout hierarchy, ARIA roles, heading levels, navigation structure)
- [ ] `browser_navigate` to section index (`/en/learn/`)
  - [ ] `browser_take_screenshot` — visual reference at current viewport
  - [ ] `browser_snapshot` — DOM/accessibility tree
- [ ] `browser_navigate` to content page with code blocks
  - [ ] `browser_take_screenshot` — visual reference at current viewport
  - [ ] `browser_snapshot` — DOM/accessibility tree
- [ ] `browser_navigate` to by-example page with tabs (e.g., golang by-example beginner)
  - [ ] `browser_take_screenshot` — visual reference at current viewport
  - [ ] `browser_snapshot` — DOM/accessibility tree
- [ ] `browser_navigate` to content page with callouts + math + mermaid
  - [ ] `browser_take_screenshot` — visual reference at current viewport
  - [ ] `browser_snapshot` — DOM/accessibility tree
- [ ] `browser_navigate` to search dialog page
  - [ ] `browser_take_screenshot` — visual reference at current viewport
  - [ ] `browser_snapshot` — DOM/accessibility tree
- [ ] `browser_navigate` to rants page
  - [ ] `browser_take_screenshot` — visual reference at current viewport
  - [ ] `browser_snapshot` — DOM/accessibility tree
- [ ] **Desktop (1280px)**: `browser_resize` to 1280×800 — note sidebar width, TOC position, content area layout
  - [ ] `browser_take_screenshot` — visual reference at 1280px viewport
  - [ ] `browser_snapshot` — DOM/accessibility tree at 1280px
- [ ] **Laptop (1024px)**: `browser_resize` to 1024×768 — verify TOC hidden, sidebar still visible
  - [ ] `browser_take_screenshot` — visual reference at 1024px viewport
  - [ ] `browser_snapshot` — DOM/accessibility tree at 1024px
- [ ] **Tablet (768px)**: `browser_resize` to 768×1024 — verify sidebar behavior
  - [ ] `browser_take_screenshot` — visual reference at 768px viewport
  - [ ] `browser_snapshot` — DOM/accessibility tree at 768px
- [ ] **Mobile (375px)**: `browser_resize` to 375×812 — verify hamburger menu,
      use `browser_click` on hamburger to verify drawer opens
  - [ ] `browser_take_screenshot` — visual reference at 375px viewport
  - [ ] `browser_snapshot` — DOM/accessibility tree at 375px
- [ ] Create directory `plans/in-progress/2026-03-23__ayokoding-web-v2/screenshots/`
      (`mkdir -p plans/in-progress/2026-03-23__ayokoding-web-v2/screenshots/`)
- [ ] Save screenshots to `plans/in-progress/2026-03-23__ayokoding-web-v2/screenshots/`
- [ ] Capture interactive behavior references via Playwright MCP:
  - [ ] Search dialog: `browser_press_key` Cmd+K, verify dialog opens via
        `browser_snapshot`, type a query, verify results appear
  - [ ] Sidebar collapse: click collapsible sections, verify expand/collapse
  - [ ] Theme toggle: click dark/light toggle, take screenshot of both modes
  - [ ] Language switcher: click switcher, verify URL change to `/id/`
- [ ] Locate and analyze Hextra theme source
      (GitHub: https://github.com/imfing/hextra or Hugo module cache at `~/.cache/hugo_cache/`):
  - [ ] Extract layout grid structure (sidebar width, content max-width, TOC width)
  - [ ] Extract color tokens (light + dark mode palettes)
  - [ ] Extract typography scale (font family, heading sizes, body size, line height)
  - [ ] Extract responsive breakpoints (sm, md, lg, xl)
  - [ ] Extract spacing system (padding, margins, gaps)
- [ ] Create component mapping document (`plans/in-progress/2026-03-23__ayokoding-web-v2/design-mapping.md`):
  - [ ] Map each Hextra element to shadcn/ui + Tailwind equivalent
  - [ ] Document responsive behavior — Desktop (≥1280px): sidebar (250px) + content (max-w-3xl) + TOC (200px)
  - [ ] Document responsive behavior — Laptop (≥1024px): sidebar (250px) + content + TOC hidden
  - [ ] Document responsive behavior — Tablet (≥768px): sidebar collapsed to icons + content
  - [ ] Document responsive behavior — Mobile (<768px): hamburger drawer + full-width content
  - [ ] Document dark/light mode color mapping
  - [ ] Document component-specific responsive rules: code blocks (horizontal scroll on mobile)
  - [ ] Document component-specific responsive rules: tables (horizontal scroll wrapper)
  - [ ] Document component-specific responsive rules: images (max-width 100%)
  - [ ] Document component-specific responsive rules: search dialog (full-screen mobile / centered modal desktop)
  - [ ] Document component-specific responsive rules: sidebar (persistent desktop / Sheet overlay mobile)
  - [ ] Document component-specific responsive rules: TOC (right column desktop / hidden tablet+mobile)
  - [ ] Document component-specific responsive rules: breadcrumb (truncated mobile)
  - [ ] Document component-specific responsive rules: prev/next nav (stacked mobile / side-by-side desktop)
- [ ] Review `apps/ayokoding-web/assets/css/custom.css` for site-specific overrides
      to replicate in Tailwind

## Phase 1: Project Scaffolding

- [ ] Verify `apps/ayokoding-web/content/` exists and is non-empty
      (pre-condition for content layer — must contain 933+ markdown files)
- [ ] Create `apps/ayokoding-web-v2/` directory
- [ ] Initialize Next.js 16 project with TypeScript, App Router, src/ directory
- [ ] Configure `next.config.ts`:
  - [ ] `output: 'standalone'` for Docker builds (Vercel ignores this)
  - [ ] `outputFileTracingRoot: path.join(__dirname, '../../')` for monorepo
  - [ ] `outputFileTracingIncludes: { '/**': ['../../apps/ayokoding-web/content/**/*'] }`
        (required — `@vercel/nft` cannot trace dynamic `fs.readFile` paths; without
        this, standalone builds contain zero content files and every page 404s)
- [ ] Install and configure Tailwind CSS v4 + PostCSS (v4 uses CSS-based config
      via `@theme` directive in `globals.css` — no `tailwind.config.ts` file)
- [ ] Install `@tailwindcss/typography` and add `@plugin "@tailwindcss/typography"`
      to `globals.css` (provides `prose` classes for styling rendered markdown —
      headings, paragraphs, lists, blockquotes, tables, code, `<hr>` etc.
      Without this, markdown content renders as unstyled plain text)
- [ ] Initialize shadcn/ui (`npx shadcn@latest init`) with `components.json`
- [ ] Install core shadcn/ui components: Button, Input, Dialog, Alert, Tabs,
      Separator, ScrollArea, Sheet, DropdownMenu, Tooltip, Badge, Command
- [ ] Install tRPC: `@trpc/server`, `@trpc/client`, `@trpc/tanstack-react-query`,
      `@tanstack/react-query@^5.62.8` (minimum version required by
      `@trpc/tanstack-react-query`; `^` allows compatible updates above this floor)
- [ ] Install Zod: `zod@^3` (conservative pin — Zod v4 is compatible with tRPC v11
      as of early 2026, migrate to v4 when ready)
- [ ] Install markdown tooling: `unified`, `remark-parse`, `remark-gfm`, `remark-math`,
      `remark-rehype` (MDAST→HAST bridge — required), `rehype-raw` (required for
      inline HTML — 1,343 occurrences in content; must come after `remark-rehype`
      with `allowDangerousHtml: true`), `rehype-pretty-code`,
      `shiki@^1` (rehype-pretty-code v0.x requires `shiki ^1.0.0` per its peer
      dependency; verify upgrade path to shiki v2/v3 before pinning — shiki v3
      removes deprecated v1 APIs, providing a smooth migration from v1→v2→v3),
      `rehype-katex`, `rehype-slug`, `rehype-autolink-headings`,
      `rehype-stringify`, `gray-matter`
- [ ] Install `html-react-parser` (renders HTML string as React elements with
      component replacement — required for mapping shortcode HTML nodes like
      `data-callout`, `data-tabs`, `data-youtube`, `data-steps` to interactive
      React components, and for replacing internal `<a>` tags with `next/link`
      `<Link>` for SPA navigation)
- [ ] Install FlexSearch for search indexing
- [ ] Install `mermaid` (client-side diagram rendering in mermaid.tsx component)
- [ ] Install `next-themes` (dark/light/system theme toggle)
- [ ] Install `@next/third-parties` (Google Analytics GA4)
- [ ] Install test dependencies: `vitest`, `@vitest/coverage-v8`,
      `@amiceli/vitest-cucumber@^6.3.0` (matches demo-fs-ts-nextjs pattern),
      `@cucumber/cucumber` (for integration tests
      in Phase 11), `@testing-library/react`, `jsdom`
- [ ] Create `project.json` with 7 mandatory Nx targets (codegen, typecheck, lint, build,
      test:unit, test:quick, test:integration) + `dev` + `start`:
  - [ ] Add `implicitDependencies: ["rhino-cli", "ayokoding-cli"]`
        (rhino-cli: link + coverage validation; ayokoding-cli: link checker used in test:quick target)
  - [ ] Add link validation to `test:quick` target:
        `./apps/ayokoding-cli/dist/ayokoding-cli links check --content apps/ayokoding-web/content`
- [ ] Set up `tsconfig.json` with strict mode
- [ ] Set up `vitest.config.ts` with v8 coverage (80% threshold)
- [ ] Copy static assets to `public/`: `favicon.ico`, `favicon.png`
- [ ] Create `src/app/robots.ts` — generate `robots.txt` with correct sitemap URL
      (do NOT copy Hugo's `robots.txt` — it hardcodes `https://ayokoding.com/sitemap.xml`)
- [ ] Create `postcss.config.mjs` for Tailwind v4 (uses `@tailwindcss/postcss` plugin;
      `.mjs` matches organiclever-web pattern — not `.ts`)
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
  - [ ] Invalid locale returns 404
- [ ] Write `health-check.feature` — health endpoint scenario
- [ ] Create `specs/apps/ayokoding-web/fe/gherkin/` directory
- [ ] Write `content-rendering.feature` — page rendering scenarios:
  - [ ] Markdown renders with proper formatting
  - [ ] Code blocks have syntax highlighting
  - [ ] Callout shortcodes render as admonitions
  - [ ] Tabs shortcodes render as tabbed panels
  - [ ] YouTube shortcodes render as responsive embeds
  - [ ] Steps shortcodes render as numbered step lists
  - [ ] Math expressions render via KaTeX
  - [ ] Mermaid diagrams render
  - [ ] Raw HTML (inline `<div>`, `<table>`, etc.) renders correctly
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
- [ ] Verify all feature files parse without error:
      run `npx cucumber-js --dry-run` (BE) and check Vitest picks up all FE specs

## Phase 3: Content Layer

- [ ] Create `src/server/content/types.ts` — ContentMeta, ContentPage, TreeNode types
- [ ] Create `src/lib/schemas/content.ts` — Zod frontmatter schema
- [ ] Create `src/lib/schemas/search.ts` — Zod search query/result schemas
- [ ] Create `src/lib/schemas/navigation.ts` — Zod tree node schema
- [ ] Create `src/server/content/reader.ts`:
  - [ ] Glob all `*.md` files from content directory
  - [ ] Parse frontmatter with gray-matter + Zod validation
  - [ ] Handle Zod validation failures gracefully: log `console.warn` with file path
        and error details, skip the file, continue indexing remaining files
        (one bad frontmatter must not crash the app or block 932 other pages)
  - [ ] Detect `_index.md` as section pages
  - [ ] Build slug from file path (relative to content/locale/)
  - [ ] Handle both `en/` and `id/` content directories
- [ ] Create `src/server/content/shortcodes.ts` with custom remark plugin for Hugo shortcodes
  - [ ] Transform callout shortcodes (19 occurrences):
        `{{< callout type="warning|info|tip" >}}...{{< /callout >}}`
        → `<div data-callout="warning|info|tip">` → maps to Callout component
  - [ ] Transform tabs shortcodes (169 blocks, 508 tab instances):
        `{{< tabs items="..." >}}...{{< /tabs >}}`
        → `<div data-tabs="...">` with `<div data-tab="...">` children → maps to Tabs component (shadcn Tabs)
  - [ ] Transform youtube shortcodes (45 files, Indonesian content):
        `{{< youtube ID >}}`
        → `<div data-youtube="ID">` → maps to YouTube component
  - [ ] Transform steps shortcodes (1 file):
        `{{% steps %}}...{{% /steps %}}`
        → `<div data-steps>` with numbered children → maps to Steps component
  - [ ] Handle both `{{< >}}` and `{{% %}}` delimiter styles
- [ ] Create `src/server/content/parser.ts`:
  - [ ] unified pipeline: remark-parse → remark-gfm → remark-math → shortcodes →
        remark-rehype (with `allowDangerousHtml: true`) → rehype-raw (parses
        raw HTML strings into proper HAST nodes) → rehype-pretty-code →
        rehype-katex → rehype-slug → rehype-autolink-headings → rehype-stringify
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

## Phase 5a: i18n & Routing Foundation

- [ ] Create `src/lib/i18n/config.ts` — locale enum (`en`, `id`), segment mappings
- [ ] Create `src/lib/i18n/translations.ts` — 9 UI string translations from Hugo i18n files
- [ ] Create `src/lib/i18n/middleware.ts` — locale detection + redirect logic
      (contains locale detection logic; imported by `src/middleware.ts`)
- [ ] Create `src/middleware.ts` — Next.js middleware entry point (detect locale, redirect `/` → `/en`)
- [ ] Create `src/lib/hooks/use-locale.ts` — current locale hook from route params
- [ ] Verify: navigating to `/` redirects to `/en`

## Phase 5b: Root & Locale Layouts

- [ ] Create `src/app/layout.tsx` — root layout:
  - [ ] Import fonts (Inter or system)
  - [ ] Import `katex/dist/katex.min.css` (required for KaTeX equation styling —
        `rehype-katex` generates HTML but CSS must be loaded separately)
  - [ ] Wrap with TRPCProvider + QueryClientProvider
  - [ ] Add `suppressHydrationWarning` to `<html>` element
  - [ ] Add global metadata (site title, description) with
        `metadataBase: new URL('https://ayokoding.com')` (required for
        `alternates.canonical` to resolve to absolute URLs)
  - [ ] Add `<GoogleAnalytics gaId="G-1NHDR7S3GV" />` from `@next/third-parties/google`
- [ ] Create `src/app/page.tsx` — redirect `/` → `/en` (server component)
- [ ] Create `src/app/[locale]/layout.tsx` — shared locale layout:
  - [ ] Validate locale parameter: call `notFound()` if locale is not `"en"` or
        `"id"` (the `[locale]` segment accepts any string — without this check,
        `/fr/learn/overview` or `/xyz/anything` would reach the content layer
        and fail silently). Use custom locale check (no extra dependency):
        `if (!SUPPORTED_LOCALES.includes(locale)) notFound()` where
        `SUPPORTED_LOCALES = ['en', 'id']` is defined in `src/lib/i18n/config.ts`
  - [ ] Import Header and Footer components
  - [ ] Wrap children with ThemeProvider (`"use client"` boundary)
  - [ ] Pass locale to context
- [ ] Create `src/app/[locale]/(content)/layout.tsx` — content layout:
  - [ ] Import Sidebar (left) and TOC (right) components
  - [ ] Three-column grid: sidebar | content | TOC
  - [ ] Note: `(content)` route group isolates from future `(app)` routes
- [ ] Create `src/app/[locale]/(app)/.gitkeep` — placeholder for future fullstack routes

## Phase 5c: Layout Components

> Consult `plans/in-progress/2026-03-23__ayokoding-web-v2/design-mapping.md` from
> Phase 0 for component mapping and breakpoint specifications.

- [ ] Create `src/components/layout/header.tsx`:
  - [ ] Site title/logo link
  - [ ] Search trigger button (opens Cmd+K dialog)
  - [ ] Language switcher dropdown (EN/ID)
  - [ ] Theme toggle (light/dark/system via next-themes)
  - [ ] Mobile hamburger button (visible <768px only)
- [ ] Create `src/components/layout/footer.tsx`:
  - [ ] Copyright notice
  - [ ] Open Source Project link (matching current Hugo site)
- [ ] Create `src/components/layout/sidebar.tsx`:
  - [ ] Fetch navigation tree via tRPC server caller
  - [ ] Render collapsible tree sections (weight-ordered)
  - [ ] Highlight currently active page
  - [ ] Desktop: persistent 250px left column
- [ ] Create `src/components/layout/mobile-nav.tsx`:
  - [ ] shadcn Sheet component (slide-in from left)
  - [ ] Reuses sidebar tree component inside sheet
  - [ ] Opens on hamburger button click
  - [ ] Closes on navigation or escape
- [ ] Create `src/components/layout/breadcrumb.tsx`:
  - [ ] Build breadcrumb from slug segments
  - [ ] Locale-aware labels (using content index titles)
  - [ ] Truncate with ellipsis on mobile
- [ ] Create `src/components/layout/toc.tsx`:
  - [ ] Accept headings array (H2-H4)
  - [ ] Render as right-side sticky list
  - [ ] Highlight active heading on scroll (Intersection Observer)
  - [ ] Hidden on tablet and mobile
- [ ] Create `src/components/layout/prev-next.tsx`:
  - [ ] Accept prev/next ContentMeta objects
  - [ ] Side-by-side on desktop, stacked on mobile
  - [ ] Show title and section path
- [ ] **Playwright MCP verification** (dev server on port 3101):
  - [ ] `browser_navigate` to `http://localhost:3101/en` — verify header renders
        (site title, search button, language switcher, theme toggle)
  - [ ] `browser_snapshot` — verify layout structure matches Phase 0 reference
        (sidebar present on desktop, three-column grid)
  - [ ] `browser_navigate` to a content page — verify sidebar tree, breadcrumb,
        TOC, and footer all render
  - [ ] `browser_resize` to 375×812 — verify hamburger button appears, sidebar
        hidden; `browser_click` hamburger — verify Sheet overlay opens
  - [ ] Compare snapshots against Phase 0 Hugo reference — flag layout
        discrepancies before proceeding
- [ ] Verify responsive behavior at all 4 breakpoints:
  - [ ] Desktop (≥1280px): sidebar + content + TOC
  - [ ] Laptop (≥1024px): sidebar + content (TOC hidden)
  - [ ] Tablet (≥768px): collapsed sidebar + content
  - [ ] Mobile (<768px): hamburger + full-width content

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
  - [ ] Use `html-react-parser` with `replace` callbacks to convert HTML string
        into React elements with component mapping (server component for static
        content; client sub-components for interactive elements)
  - [ ] Wrap content in `<div className="prose dark:prose-invert max-w-none">`
        for Tailwind Typography styling of rendered markdown
  - [ ] Replace `<div data-callout="...">` → Callout React component
  - [ ] Replace `<div data-tabs="...">` + `<div data-tab="...">` → Tabs component
  - [ ] Replace `<div data-youtube="...">` → YouTube embed component
  - [ ] Replace `<div data-steps>` → Steps component
  - [ ] Replace `<pre>` code blocks → CodeBlock component (server-rendered with shiki)
  - [ ] Replace mermaid code blocks → Mermaid component (client-side exception —
        Mermaid requires DOM)
  - [ ] Replace internal `<a href="/en/...">` and `<a href="/id/...">` tags →
        Next.js `<Link>` components for SPA client-side navigation (prevents
        full page reloads on internal link clicks)
- [ ] Create `src/components/content/callout.tsx` — admonition component (shadcn Alert)
- [ ] Create `src/components/content/tabs.tsx` — tabbed content component (`"use client"`,
      shadcn Tabs); parses `data-tabs` items attribute to create tab labels,
      renders `data-tab` children as tab panels
- [ ] Create `src/components/content/youtube.tsx` — responsive YouTube iframe embed
      (`"use client"`); accepts video ID from `data-youtube` attribute, renders
      16:9 aspect ratio iframe with lazy loading
- [ ] Create `src/components/content/steps.tsx` — numbered step list with visual
      connectors; renders `data-steps` children as ordered steps with headings
- [ ] Create `src/components/content/code-block.tsx` — server-rendered syntax highlighting
- [ ] Create `src/components/content/mermaid.tsx` — client-side Mermaid renderer
      (uses `"use client"`)
- [ ] Create `src/app/[locale]/(content)/error.tsx` — error boundary for content
      rendering failures (`"use client"`, shows friendly error message)
- [ ] Create `src/app/[locale]/(content)/not-found.tsx` — custom 404 for invalid slugs
- [ ] Add `generateMetadata` for SEO (Open Graph, Twitter Cards, hreflang, canonical):
  - [ ] Set `alternates.canonical` in content page metadata (Next.js does NOT
        auto-set canonical URLs — missing canonical causes duplicate content
        issues in search engines). `metadataBase` is already set in root layout
        (Phase 5b) so relative canonical paths resolve to absolute URLs
- [ ] Add JSON-LD structured data (Article/WebSite schema)
- [ ] Add sitemap generation (`app/sitemap.ts`) — reads content index, no full build
- [ ] Add RSS feed generation (`app/feed.xml/route.ts`) — RSS 2.0 feed matching
      Hugo's output format (home + section pages). Reads content index for latest
      pages, returns XML with `Content-Type: application/rss+xml`
- [ ] **SEO verification**: `curl -s http://localhost:3101/en/learn/overview | grep -c '<pre'`
      returns >0 (code blocks rendered in HTML, not loading placeholders)
- [ ] **RSS verification**: `curl -s http://localhost:3101/feed.xml` returns valid RSS XML
- [ ] **robots.txt verification**: `curl -s http://localhost:3101/robots.txt` contains
      correct sitemap URL (not the Hugo `ayokoding.com` URL)
- [ ] **Playwright MCP visual verification** (compare against Phase 0 Hugo references):
  - [ ] `browser_navigate` to content page with code blocks — `browser_snapshot`
        to verify `<pre>` elements with syntax highlighting classes present
  - [ ] Navigate to by-example page with tabs — `browser_click` each tab label,
        verify tab panels switch content (compare against Hugo tab behavior)
  - [ ] Navigate to page with callouts — verify admonition styling via snapshot
  - [ ] Navigate to page with math (KaTeX) — `browser_take_screenshot` to verify
        equations render visually (DOM snapshot alone cannot verify math rendering)
  - [ ] Navigate to page with Mermaid diagrams — `browser_take_screenshot` to
        verify diagram renders (client-side, needs visual confirmation)
  - [ ] Navigate to Indonesian YouTube content — verify iframe embed present
  - [ ] Navigate to page with raw HTML (`<details>`, `<table>`) — verify not stripped
  - [ ] `browser_resize` through all 4 breakpoints on a content page — compare
        layout against Phase 0 reference screenshots
  - [ ] Start Hugo site on 3100 simultaneously — `browser_navigate` between
        `localhost:3100/en/learn/overview` and `localhost:3101/en/learn/overview`,
        take side-by-side screenshots for visual parity check

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
- [ ] **Playwright MCP search verification**:
  - [ ] `browser_navigate` to `http://localhost:3101/en`
  - [ ] `browser_press_key` `Meta+k` — verify search dialog opens via
        `browser_snapshot` (Command component visible)
  - [ ] `browser_fill_form` the search input with "golang" — verify results
        appear via `browser_snapshot` (result items with titles and excerpts)
  - [ ] `browser_click` on a search result — verify navigation to content page
  - [ ] `browser_press_key` `Escape` — verify dialog closes
  - [ ] Navigate to `/id/`, repeat with Indonesian query "variabel" — verify
        results scoped to Indonesian content

## Phase 8: Backend Unit Tests (BE Gherkin)

- [ ] Create `test/unit/be-steps/` directory
- [ ] Create `test/unit/be-steps/helpers/` directory
- [ ] Create `test/unit/be-steps/helpers/mock-content.ts`:
  - [ ] In-memory content map with 5-10 test pages (mix of sections + content)
  - [ ] Both `en` and `id` locales represented
  - [ ] Pages with varying weights for ordering tests
  - [ ] At least one page with code blocks, callouts, math
- [ ] Create `test/unit/be-steps/helpers/mock-search-index.ts`:
  - [ ] In-memory FlexSearch index seeded with mock content
- [ ] Create `test/unit/be-steps/helpers/test-caller.ts`:
  - [ ] tRPC caller factory using mock content (no filesystem)
- [ ] Implement step definitions (all under `test/unit/be-steps/`):
  - [ ] `test/unit/be-steps/content-api.steps.ts` — getBySlug (found, not found, draft),
        listChildren (weight ordering), getTree (hierarchy)
  - [ ] `test/unit/be-steps/search-api.steps.ts` — query match, locale scope,
        empty query error, result shape
  - [ ] `test/unit/be-steps/navigation-api.steps.ts` — tree structure, weight ordering,
        section children
  - [ ] `test/unit/be-steps/i18n-api.steps.ts` — en content, id content, invalid locale
  - [ ] `test/unit/be-steps/health-check.steps.ts` — meta.health returns `{ status: "ok" }`
- [ ] Verify all BE unit tests pass: `nx run ayokoding-web-v2:test:unit`

## Phase 9: Frontend Unit Tests (FE Gherkin)

- [ ] Create `test/unit/fe-steps/` directory
- [ ] Create `test/unit/fe-steps/helpers/` directory
- [ ] Create `test/unit/fe-steps/helpers/mock-trpc.ts`:
  - [ ] Mock tRPC client returning predefined responses
  - [ ] Mock content.getBySlug → returns test page HTML
  - [ ] Mock content.getTree → returns test navigation tree
  - [ ] Mock search.query → returns test search results
- [ ] Create `test/unit/fe-steps/helpers/render-with-providers.tsx`:
  - [ ] Test wrapper with TRPCProvider + QueryClientProvider + ThemeProvider
  - [ ] Configurable locale parameter
- [ ] Implement step definitions:
  - [ ] `content-rendering.steps.ts` — markdown HTML rendered, code blocks present,
        callouts rendered as Alert, math rendered
  - [ ] `navigation.steps.ts` — sidebar renders tree, breadcrumb shows path,
        TOC renders headings, prev/next links present
  - [ ] `search.steps.ts` — dialog opens on Cmd+K, results appear on input,
        navigation on click, escape closes
  - [ ] `responsive.steps.ts` — sidebar visible/hidden at breakpoints,
        hamburger visible/hidden
  - [ ] `i18n.steps.ts` — language switcher renders, locale changes on click
  - [ ] `accessibility.steps.ts` — ARIA labels on buttons, keyboard tab order,
        skip-to-content link
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

## Phase 12a: Docker Infrastructure

- [ ] Build standalone output locally and inspect structure:
  - [ ] Run `nx build ayokoding-web-v2` (triggers `next build` with standalone)
  - [ ] Inspect `.next/standalone/` — find exact `server.js` path
        (in Nx monorepos typically at `.next/standalone/apps/ayokoding-web-v2/server.js` — verify)
  - [ ] Inspect `.next/static/` — confirm static assets location
  - [ ] Inspect `public/` — confirm public assets location
- [ ] Create `apps/ayokoding-web-v2/Dockerfile`:
  - [ ] Stage 1 (deps): copy workspace + app `package.json`, `npm ci`
  - [ ] Stage 2 (builder): copy app source + content, `next build`
  - [ ] Stage 3 (runner): copy standalone + static + public + content
  - [ ] Set `HOSTNAME=0.0.0.0`, `NEXT_TELEMETRY_DISABLED=1`
  - [ ] Set `--chown=nextjs:nodejs` on all COPY commands
  - [ ] Adjust CMD path based on standalone inspection above
- [ ] Create `infra/dev/ayokoding-web-v2/docker-compose.yml`:
  - [ ] Set `CONTENT_DIR=/app/content`
  - [ ] Set `PORT=3101`
  - [ ] Health check: `curl -f http://localhost:3101/api/trpc/meta.health`
- [ ] Run `docker compose up` from `infra/dev/ayokoding-web-v2/`
- [ ] Verify health check passes: `curl http://localhost:3101/api/trpc/meta.health`
- [ ] Verify content page renders: `curl -s http://localhost:3101/en/learn/overview`
- [ ] Verify no JS-only content: compare Docker output with dev server output
- [ ] **Playwright MCP Docker verification** (verify full rendering, not just API):
  - [ ] `browser_navigate` to `http://localhost:3101/en/learn/overview` — verify
        full page renders (not blank or error page)
  - [ ] `browser_snapshot` — verify content, sidebar, breadcrumb, TOC all present
        (catches standalone output issues where content files are missing)
  - [ ] Navigate to a by-example page with tabs — `browser_click` tabs to verify
        client-side interactivity works in Docker build
  - [ ] `browser_press_key` `Meta+k` — verify search works in Docker
  - [ ] `browser_take_screenshot` — compare against dev server screenshot from
        Phase 6 to catch any Docker-specific rendering differences

## Phase 12b: Vercel Configuration

- [ ] Configure `next.config.ts` content path resolution:
  - [ ] `CONTENT_DIR` env var for Docker
  - [ ] Fallback `../../apps/ayokoding-web/content` for dev + Vercel
- [ ] Create `apps/ayokoding-web-v2/vercel.json`:
  - [ ] Set `installCommand`: `npm install --prefix=../.. --ignore-scripts`
  - [ ] Set `ignoreCommand`: `[ "$VERCEL_GIT_COMMIT_REF" != "prod-ayokoding-web-v2" ]`
        (mirrors organiclever-web pattern — only builds on the production branch)
  - [ ] Add security headers: X-Content-Type-Options, X-Frame-Options,
        X-XSS-Protection, Referrer-Policy

## Phase 13a: Backend E2E Test App

- [ ] Create `apps/ayokoding-web-v2-be-e2e/` directory
- [ ] Create `apps/ayokoding-web-v2-be-e2e/package.json` with Playwright dependency
- [ ] Create `apps/ayokoding-web-v2-be-e2e/project.json`:
  - [ ] Tags: `["type:e2e", "platform:playwright", "lang:ts", "domain:ayokoding"]`
  - [ ] Targets: `install`, `test:e2e`, `test:e2e:ui`, `test:e2e:report`
        (E2E-only apps follow the 4-target pattern; the mandatory 7-target rule
        applies to content/backend apps, not pure Playwright runner apps —
        consistent with `demo-be-e2e`, `demo-fe-e2e`, `organiclever-web-e2e`)
- [ ] Create `apps/ayokoding-web-v2-be-e2e/playwright.config.ts`:
  - [ ] `baseURL` from `BASE_URL` env var (default `http://localhost:3101`)
- [ ] Create `apps/ayokoding-web-v2-be-e2e/tsconfig.json`
- [ ] Create test specs consuming `specs/apps/ayokoding-web/be/gherkin/`:
  - [ ] `src/tests/content-api.spec.ts` — tRPC content procedures via HTTP
  - [ ] `src/tests/search-api.spec.ts` — tRPC search procedures via HTTP
  - [ ] `src/tests/navigation-api.spec.ts` — tRPC navigation via HTTP
  - [ ] `src/tests/i18n-api.spec.ts` — locale-specific content, invalid locale 404
  - [ ] `src/tests/health.spec.ts` — health endpoint
- [ ] Start app via Docker, run BE E2E: `nx run ayokoding-web-v2-be-e2e:test:e2e`
- [ ] Verify all BE E2E scenarios pass

## Phase 13b: Frontend E2E Test App

- [ ] Create `apps/ayokoding-web-v2-fe-e2e/` directory
- [ ] Create `apps/ayokoding-web-v2-fe-e2e/package.json` with Playwright dependency
- [ ] Create `apps/ayokoding-web-v2-fe-e2e/project.json`:
  - [ ] Tags: `["type:e2e", "platform:playwright", "lang:ts", "domain:ayokoding"]`
  - [ ] Targets: `install`, `test:e2e`, `test:e2e:ui`, `test:e2e:report`
        (E2E-only apps follow the 4-target pattern; same as `demo-be-e2e`,
        `demo-fe-e2e`, `organiclever-web-e2e`)
- [ ] Create `apps/ayokoding-web-v2-fe-e2e/playwright.config.ts`:
  - [ ] `baseURL` from `BASE_URL` env var (default `http://localhost:3101`)
- [ ] Create `apps/ayokoding-web-v2-fe-e2e/tsconfig.json`
- [ ] Create test specs consuming `specs/apps/ayokoding-web/fe/gherkin/`:
  - [ ] `src/tests/content-rendering.spec.ts` — page rendering, code blocks, callouts,
        tabs, YouTube embeds, steps, raw HTML
  - [ ] `src/tests/navigation.spec.ts` — sidebar, breadcrumb, TOC, prev/next
  - [ ] `src/tests/search.spec.ts` — search dialog flow
  - [ ] `src/tests/responsive.spec.ts` — breakpoint layout verification
  - [ ] `src/tests/i18n.spec.ts` — language switching
  - [ ] `src/tests/accessibility.spec.ts` — ARIA, keyboard nav
- [ ] Start app via Docker, run FE E2E: `nx run ayokoding-web-v2-fe-e2e:test:e2e`
- [ ] Verify all FE E2E scenarios pass

## Phase 14a: CI Workflow

- [ ] Create `.github/workflows/test-ayokoding-web-v2.yml`:
  - [ ] Trigger: 2x daily cron (23:00, 11:00 UTC = WIB 06, 18) + manual dispatch
  - [ ] Job 1 (`unit`): checkout → npm ci → `nx run ayokoding-web-v2:test:quick`
  - [ ] Job 1: upload coverage to Codecov
  - [ ] Job 2 (`e2e`): checkout → Docker build → start → wait for health check
  - [ ] Job 2: install Playwright browsers in BE + FE E2E apps
  - [ ] Job 2: run `nx run ayokoding-web-v2-be-e2e:test:e2e`
  - [ ] Job 2: run `nx run ayokoding-web-v2-fe-e2e:test:e2e`
  - [ ] Job 2: upload Playwright reports as artifacts
  - [ ] Job 2: docker compose down (cleanup)
- [ ] Trigger workflow manually and verify all jobs pass

## Phase 14b: Vercel Deployment

- [ ] Create `prod-ayokoding-web-v2` branch from `main`
- [ ] Configure Vercel project:
  - [ ] Root directory: `apps/ayokoding-web-v2`
  - [ ] Framework: Next.js (auto-detected)
  - [ ] Production branch: `prod-ayokoding-web-v2`
  - [ ] (See `apps/organiclever-web/vercel.json` and its Vercel project for reference
        configuration pattern)
- [ ] Push to `prod-ayokoding-web-v2` branch
- [ ] Verify Vercel build succeeds (check build logs)
- [ ] Verify deployed site serves content correctly
- [ ] Verify SEO: `curl` deployed URL returns full HTML with meta tags

## Phase 14c: Documentation

- [ ] Create `apps/ayokoding-web-v2/README.md`:
  - [ ] Project overview and architecture
  - [ ] Quick start commands (`nx dev`, `nx build`, `nx run test:quick`)
  - [ ] Docker setup instructions
  - [ ] Vercel deployment docs
  - [ ] Related documentation links
- [ ] Update `specs/apps/ayokoding-web/README.md` — reference v2 test apps
- [ ] Update CLAUDE.md:
  - [ ] Add `ayokoding-web-v2` to Current Apps list with description
  - [ ] Add `ayokoding-web-v2-be-e2e` to Current Apps list with description
  - [ ] Add `ayokoding-web-v2-fe-e2e` to Current Apps list with description
  - [ ] Add `prod-ayokoding-web-v2` to environment branches list

## Validation Checklist

- [ ] `nx run ayokoding-web-v2:codegen` succeeds (no-op: ayokoding-web-v2 has no
      OpenAPI contract; target exists to satisfy mandatory 7-target requirement
      per nx-targets convention)
- [ ] `nx run ayokoding-web-v2:typecheck` succeeds
- [ ] `nx run ayokoding-web-v2:lint` succeeds
- [ ] `nx run ayokoding-web-v2:build` succeeds
- [ ] `nx run ayokoding-web-v2:test:unit` — all BE + FE Gherkin scenarios pass
- [ ] `nx run ayokoding-web-v2:test:quick` — 80%+ coverage threshold met
- [ ] `nx run ayokoding-web-v2:test:integration` — all scenarios pass with real filesystem
- [ ] `ayokoding-web-v2-be-e2e` passes — all BE E2E scenarios pass
- [ ] `ayokoding-web-v2-fe-e2e` passes — all FE E2E scenarios pass
- [ ] Docker build and run works
- [ ] All content pages render correctly (spot check: overview, by-example with tabs, rants)
- [ ] **Hugo shortcodes render correctly**:
  - [ ] Tabs render as tabbed panels (spot check a by-example page with multi-language tabs)
  - [ ] Callouts render as styled admonitions
  - [ ] YouTube embeds render as responsive iframes (spot check Indonesian video content)
  - [ ] Steps render as numbered step list
- [ ] **Raw HTML renders** — inline `<div>`, `<table>`, `<details>`, etc. not stripped
- [ ] **SEO: `curl` returns full HTML** — content visible without JS execution:
  - [ ] `curl -s http://localhost:3101/en/learn/overview` contains page content
  - [ ] `curl -s http://localhost:3101/en/learn/overview` contains `<meta property="og:title"`
  - [ ] `curl -s http://localhost:3101/en/learn/overview` contains `<link rel="canonical"`
  - [ ] `curl -s http://localhost:3101/en/learn/overview` contains `<script type="application/ld+json"`
  - [ ] `curl -s http://localhost:3101/sitemap.xml` lists all content URLs
  - [ ] `curl -s http://localhost:3101/feed.xml` returns valid RSS 2.0 XML
  - [ ] `curl -s http://localhost:3101/robots.txt` contains correct sitemap URL
- [ ] **Google Analytics**: page source contains GA4 tracking script (`G-1NHDR7S3GV`)
- [ ] Search returns relevant results for both locales
- [ ] Language switching works correctly
- [ ] Responsive layout works (desktop, tablet, mobile)
- [ ] **Playwright MCP visual parity** (final agent verification):
  - [ ] Start both Hugo (`localhost:3100`) and Next.js (`localhost:3101`)
  - [ ] `browser_navigate` + `browser_take_screenshot` on 5 key pages at desktop
        breakpoint — compare side by side: homepage, section index, content page
        with code, by-example with tabs, page with callouts + math
  - [ ] `browser_resize` to 375×812 on same pages — compare mobile layouts
  - [ ] `browser_snapshot` on content page — verify heading hierarchy, link
        structure, and ARIA landmarks match Hugo reference from Phase 0
  - [ ] Interactive flows: search (Cmd+K → type → click result), theme toggle,
        language switch, sidebar collapse — all verified via MCP interaction
- [ ] **Locale validation**: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3101/fr/learn/overview`
      returns 404 (invalid locales rejected)
- [ ] **ayokoding-cli backward compatibility** — Hugo v1 still works:
  - [ ] `ayokoding-cli nav regen` still generates correct nav for Hugo site
  - [ ] `ayokoding-cli titles update` still updates titles correctly
  - [ ] `ayokoding-cli links check` still validates links correctly
  - [ ] `nx run ayokoding-web:test:quick` still passes (Hugo v1 quality gate)
  - [ ] `nx run ayokoding-web:build` still succeeds (Hugo build)
- [ ] CI workflow passes
- [ ] Vercel deployment succeeds from `prod-ayokoding-web-v2` branch
- [ ] README.md is complete
- [ ] `specs/apps/ayokoding-web/README.md` updated with v2 test app references
- [ ] CLAUDE.md updated: `ayokoding-web-v2` in Current Apps list,
      `prod-ayokoding-web-v2` in environment branches list
