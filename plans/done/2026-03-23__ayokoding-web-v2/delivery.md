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

- [x] Start the current Hugo site locally (`nx dev ayokoding-web` on port 3100)
- [x] Use **Playwright MCP** to browse the Hugo site and capture reference state
- [x] `browser_navigate` to Homepage (`http://localhost:3100/en`)
  - [x] `browser_take_screenshot` — visual reference at current viewport
  - [x] `browser_snapshot` — DOM/accessibility tree (layout hierarchy, ARIA roles, heading levels, navigation structure)
- [x] `browser_navigate` to section index (`/en/learn/`)
  - [x] `browser_take_screenshot` — visual reference at current viewport
  - [x] `browser_snapshot` — DOM/accessibility tree
- [x] `browser_navigate` to content page with code blocks
  - [x] `browser_take_screenshot` — visual reference at current viewport
  - [x] `browser_snapshot` — DOM/accessibility tree
- [x] `browser_navigate` to by-example page with tabs (e.g., golang by-example beginner)
  - [x] `browser_take_screenshot` — visual reference at current viewport
  - [x] `browser_snapshot` — DOM/accessibility tree
- [x] `browser_navigate` to content page with callouts + math + mermaid
  - [x] `browser_take_screenshot` — visual reference at current viewport
  - [x] `browser_snapshot` — DOM/accessibility tree
- [x] `browser_navigate` to search dialog page
  - [x] `browser_take_screenshot` — visual reference at current viewport
  - [x] `browser_snapshot` — DOM/accessibility tree
- [x] `browser_navigate` to rants page
  - [x] `browser_take_screenshot` — visual reference at current viewport
  - [x] `browser_snapshot` — DOM/accessibility tree
- [x] **Desktop (1280px)**: `browser_resize` to 1280×800 — note sidebar width, TOC position, content area layout
  - [x] `browser_take_screenshot` — visual reference at 1280px viewport
  - [x] `browser_snapshot` — DOM/accessibility tree at 1280px
- [x] **Laptop (1024px)**: `browser_resize` to 1024×768 — verify TOC hidden, sidebar still visible
  - [x] `browser_take_screenshot` — visual reference at 1024px viewport
  - [x] `browser_snapshot` — DOM/accessibility tree at 1024px
- [x] **Tablet (768px)**: `browser_resize` to 768×1024 — verify sidebar behavior
  - [x] `browser_take_screenshot` — visual reference at 768px viewport
  - [x] `browser_snapshot` — DOM/accessibility tree at 768px
- [x] **Mobile (375px)**: `browser_resize` to 375×812 — verify hamburger menu,
      use `browser_click` on hamburger to verify drawer opens
  - [x] `browser_take_screenshot` — visual reference at 375px viewport
  - [x] `browser_snapshot` — DOM/accessibility tree at 375px
- [x] Create directory `plans/in-progress/2026-03-23__ayokoding-web-v2/screenshots/`
      (`mkdir -p plans/in-progress/2026-03-23__ayokoding-web-v2/screenshots/`)
- [x] Save screenshots to `plans/in-progress/2026-03-23__ayokoding-web-v2/screenshots/`
- [x] Capture interactive behavior references via Playwright MCP:
  - [x] Search dialog: `browser_press_key` Cmd+K, verify dialog opens via
        `browser_snapshot`, type a query, verify results appear
  - [x] Sidebar collapse: click collapsible sections, verify expand/collapse
  - [x] Theme toggle: click dark/light toggle, take screenshot of both modes
  - [x] Language switcher: click switcher, verify URL change to `/id/`
- [x] Locate and analyze Hextra theme source
      (GitHub: https://github.com/imfing/hextra or Hugo module cache at `~/.cache/hugo_cache/`):
  - [x] Extract layout grid structure (sidebar width, content max-width, TOC width)
  - [x] Extract color tokens (light + dark mode palettes)
  - [x] Extract typography scale (font family, heading sizes, body size, line height)
  - [x] Extract responsive breakpoints (sm, md, lg, xl)
  - [x] Extract spacing system (padding, margins, gaps)
- [x] Create component mapping document (`plans/in-progress/2026-03-23__ayokoding-web-v2/design-mapping.md`):
  - [x] Map each Hextra element to shadcn/ui + Tailwind equivalent
  - [x] Document responsive behavior — Desktop (≥1280px): sidebar (250px) + content (max-w-3xl) + TOC (200px)
  - [x] Document responsive behavior — Laptop (≥1024px): sidebar (250px) + content + TOC hidden
  - [x] Document responsive behavior — Tablet (≥768px): sidebar collapsed to icons + content
  - [x] Document responsive behavior — Mobile (<768px): hamburger drawer + full-width content
  - [x] Document dark/light mode color mapping
  - [x] Document component-specific responsive rules: code blocks (horizontal scroll on mobile)
  - [x] Document component-specific responsive rules: tables (horizontal scroll wrapper)
  - [x] Document component-specific responsive rules: images (max-width 100%)
  - [x] Document component-specific responsive rules: search dialog (full-screen mobile / centered modal desktop)
  - [x] Document component-specific responsive rules: sidebar (persistent desktop / Sheet overlay mobile)
  - [x] Document component-specific responsive rules: TOC (right column desktop / hidden tablet+mobile)
  - [x] Document component-specific responsive rules: breadcrumb (truncated mobile)
  - [x] Document component-specific responsive rules: prev/next nav (stacked mobile / side-by-side desktop)
- [x] Review `apps/ayokoding-web/assets/css/custom.css` for site-specific overrides
      to replicate in Tailwind

## Phase 1: Project Scaffolding

- [x] Verify `apps/ayokoding-web/content/` exists and is non-empty
      (pre-condition for content layer — must contain 933+ markdown files)
- [x] Create `apps/ayokoding-web-v2/` directory
- [x] Initialize Next.js 16 project with TypeScript, App Router, src/ directory
- [x] Configure `next.config.ts`:
  - [x] `output: 'standalone'` for Docker builds (Vercel ignores this)
  - [x] `outputFileTracingRoot: path.join(__dirname, '../../')` for monorepo
  - [x] `outputFileTracingIncludes: { '/**': ['../../apps/ayokoding-web/content/**/*'] }`
        (required — `@vercel/nft` cannot trace dynamic `fs.readFile` paths; without
        this, standalone builds contain zero content files and every page 404s)
- [x] Install and configure Tailwind CSS v4 + PostCSS (v4 uses CSS-based config
      via `@theme` directive in `globals.css` — no `tailwind.config.ts` file)
- [x] Install `@tailwindcss/typography` and add `@plugin "@tailwindcss/typography"`
      to `globals.css` (provides `prose` classes for styling rendered markdown —
      headings, paragraphs, lists, blockquotes, tables, code, `<hr>` etc.
      Without this, markdown content renders as unstyled plain text)
- [x] Initialize shadcn/ui (`npx shadcn@latest init`) with `components.json`
- [x] Install core shadcn/ui components: Button, Input, Dialog, Alert, Tabs,
      Separator, ScrollArea, Sheet, DropdownMenu, Tooltip, Badge, Command
- [x] Install tRPC: `@trpc/server`, `@trpc/client`, `@trpc/tanstack-react-query`,
      `@tanstack/react-query@^5.62.8` (minimum version required by
      `@trpc/tanstack-react-query`; `^` allows compatible updates above this floor)
- [x] Install Zod: `zod@^3` (conservative pin — Zod v4 is compatible with tRPC v11
      as of early 2026, migrate to v4 when ready)
- [x] Install markdown tooling: `unified`, `remark-parse`, `remark-gfm`, `remark-math`,
      `remark-rehype` (MDAST→HAST bridge — required), `rehype-raw` (required for
      inline HTML — 1,343 occurrences in content; must come after `remark-rehype`
      with `allowDangerousHtml: true`), `rehype-pretty-code`,
      `shiki@^1` (rehype-pretty-code v0.x requires `shiki ^1.0.0` per its peer
      dependency; verify upgrade path to shiki v2/v3 before pinning — shiki v3
      removes deprecated v1 APIs, providing a smooth migration from v1→v2→v3),
      `rehype-katex`, `rehype-slug`, `rehype-autolink-headings`,
      `rehype-stringify`, `gray-matter`
- [x] Install `html-react-parser` (renders HTML string as React elements with
      component replacement — required for mapping shortcode HTML nodes like
      `data-callout`, `data-tabs`, `data-youtube`, `data-steps` to interactive
      React components, and for replacing internal `<a>` tags with `next/link`
      `<Link>` for SPA navigation)
- [x] Install FlexSearch for search indexing
- [x] Install `mermaid` (client-side diagram rendering in mermaid.tsx component)
- [x] Install `next-themes` (dark/light/system theme toggle)
- [x] Install `@next/third-parties` (Google Analytics GA4)
- [x] Install test dependencies: `vitest`, `@vitest/coverage-v8`,
      `@amiceli/vitest-cucumber@^6.3.0` (matches demo-fs-ts-nextjs pattern),
      `@cucumber/cucumber` (for integration tests
      in Phase 11), `@testing-library/react`, `jsdom`
- [x] Create `project.json` with 7 mandatory Nx targets (codegen, typecheck, lint, build,
      test:unit, test:quick, test:integration) + `dev` + `start`:
  - [x] Add `implicitDependencies: ["rhino-cli", "ayokoding-cli"]`
        (rhino-cli: link + coverage validation; ayokoding-cli: link checker used in test:quick target)
  - [x] Add link validation to `test:quick` target:
        `./apps/ayokoding-cli/dist/ayokoding-cli links check --content apps/ayokoding-web/content`
- [x] Set up `tsconfig.json` with strict mode
- [x] Set up `vitest.config.ts` with v8 coverage (80% threshold)
- [x] Copy static assets to `public/`: `favicon.ico`, `favicon.png`
- [x] Create `src/app/robots.ts` — generate `robots.txt` with correct sitemap URL
      (do NOT copy Hugo's `robots.txt` — it hardcodes `https://ayokoding.com/sitemap.xml`)
- [x] Create `postcss.config.mjs` for Tailwind v4 (uses `@tailwindcss/postcss` plugin;
      `.mjs` matches organiclever-fe pattern — not `.ts`)
- [x] Configure oxlint for linting
- [x] Verify `nx run ayokoding-web-v2:lint` passes
- [x] Verify `nx run ayokoding-web-v2:typecheck` passes

## Phase 2: Specs (Gherkin Feature Files)

- [x] Create `specs/apps/ayokoding-web/README.md` with overview
- [x] Create `specs/apps/ayokoding-web/be/gherkin/` directory
- [x] Write `content-api.feature` — content retrieval scenarios:
  - [x] Get page by slug (existing page, non-existent page, draft page)
  - [x] List children of a section (with weight ordering)
  - [x] Get navigation tree (full hierarchy)
  - [x] Content includes rendered HTML with code blocks
- [x] Write `search-api.feature` — search scenarios:
  - [x] Search returns matching results
  - [x] Search is scoped to locale
  - [x] Empty query returns error
  - [x] Search results include title, slug, excerpt
- [x] Write `navigation-api.feature` — navigation scenarios:
  - [x] Tree structure matches filesystem hierarchy
  - [x] Nodes are ordered by weight
  - [x] Section nodes have children
- [x] Write `i18n-api.feature` — locale scenarios:
  - [x] English content served for locale "en"
  - [x] Indonesian content served for locale "id"
  - [x] Invalid locale returns 404
- [x] Write `health-check.feature` — health endpoint scenario
- [x] Create `specs/apps/ayokoding-web/fe/gherkin/` directory
- [x] Write `content-rendering.feature` — page rendering scenarios:
  - [x] Markdown renders with proper formatting
  - [x] Code blocks have syntax highlighting
  - [x] Callout shortcodes render as admonitions
  - [x] Tabs shortcodes render as tabbed panels
  - [x] YouTube shortcodes render as responsive embeds
  - [x] Steps shortcodes render as numbered step lists
  - [x] Math expressions render via KaTeX
  - [x] Mermaid diagrams render
  - [x] Raw HTML (inline `<div>`, `<table>`, etc.) renders correctly
- [x] Write `navigation.feature` — UI navigation scenarios:
  - [x] Sidebar shows section tree
  - [x] Breadcrumb shows path hierarchy
  - [x] Table of contents shows heading links
  - [x] Prev/Next links navigate between siblings
- [x] Write `search.feature` — search UI scenarios:
  - [x] Cmd+K opens search dialog
  - [x] Typing shows results
  - [x] Clicking result navigates to page
  - [x] Escape closes search
- [x] Write `responsive.feature` — responsive layout scenarios:
  - [x] Desktop: sidebar + TOC visible
  - [x] Mobile: hamburger menu, hidden sidebar
- [x] Write `i18n.feature` — language switching scenarios:
  - [x] Language switcher changes locale
  - [x] URL updates to locale-specific path
  - [x] UI labels change language
- [x] Write `accessibility.feature` — WCAG scenarios:
  - [x] Keyboard navigation works
  - [x] ARIA labels present on interactive elements
  - [x] Color contrast meets AA standard
  - [x] Skip to content link present
- [x] Verify all feature files parse without error:
      run `npx cucumber-js --dry-run` (BE) and check Vitest picks up all FE specs

## Phase 3: Content Layer

- [x] Create `src/server/content/types.ts` — ContentMeta, ContentPage, TreeNode types
- [x] Create `src/lib/schemas/content.ts` — Zod frontmatter schema
- [x] Create `src/lib/schemas/search.ts` — Zod search query/result schemas
- [x] Create `src/lib/schemas/navigation.ts` — Zod tree node schema
- [x] Create `src/server/content/reader.ts`:
  - [x] Glob all `*.md` files from content directory
  - [x] Parse frontmatter with gray-matter + Zod validation
  - [x] Handle Zod validation failures gracefully: log `console.warn` with file path
        and error details, skip the file, continue indexing remaining files
        (one bad frontmatter must not crash the app or block 932 other pages)
  - [x] Detect `_index.md` as section pages
  - [x] Build slug from file path (relative to content/locale/)
  - [x] Handle both `en/` and `id/` content directories
- [x] Create `src/server/content/shortcodes.ts` with custom remark plugin for Hugo shortcodes
  - [x] Transform callout shortcodes (19 occurrences):
        `{{< callout type="warning|info|tip" >}}...{{< /callout >}}`
        → `<div data-callout="warning|info|tip">` → maps to Callout component
  - [x] Transform tabs shortcodes (169 blocks, 508 tab instances):
        `{{< tabs items="..." >}}...{{< /tabs >}}`
        → `<div data-tabs="...">` with `<div data-tab="...">` children → maps to Tabs component (shadcn Tabs)
  - [x] Transform youtube shortcodes (45 files, Indonesian content):
        `{{< youtube ID >}}`
        → `<div data-youtube="ID">` → maps to YouTube component
  - [x] Transform steps shortcodes (1 file):
        `{{% steps %}}...{{% /steps %}}`
        → `<div data-steps>` with numbered children → maps to Steps component
  - [x] Handle both `{{< >}}` and `{{% %}}` delimiter styles
- [x] Create `src/server/content/parser.ts`:
  - [x] unified pipeline: remark-parse → remark-gfm → remark-math → shortcodes →
        remark-rehype (with `allowDangerousHtml: true`) → rehype-raw (parses
        raw HTML strings into proper HAST nodes) → rehype-pretty-code →
        rehype-katex → rehype-slug → rehype-autolink-headings → rehype-stringify
  - [x] Extract headings (H2-H4) for table of contents
  - [x] Return { html, headings }
- [x] Create `src/server/content/index.ts`:
  - [x] Scan all markdown files at startup
  - [x] Build content map (slug → ContentMeta)
  - [x] Build navigation tree (hierarchical, weight-sorted)
  - [x] Compute prev/next for each page within its section
  - [x] Lazy initialization (singleton, built once)
- [x] Create `src/server/content/search-index.ts`:
  - [x] Initialize FlexSearch document index per locale
  - [x] Index title + raw content (stripped markdown) for each page
  - [x] Provide search function returning ranked results with excerpts

## Phase 4: tRPC API

- [x] Create `src/server/trpc/init.ts` — tRPC initialization, context factory
- [x] Create `src/server/trpc/procedures/content.ts`:
  - [x] `content.getBySlug` — read + parse markdown, return HTML + metadata + headings
  - [x] `content.listChildren` — list child pages with metadata, sorted by weight
  - [x] `content.getTree` — return navigation tree for a locale (optionally scoped
        to a root slug)
- [x] Create `src/server/trpc/procedures/search.ts`:
  - [x] `search.query` — search FlexSearch index, return results with excerpts
- [x] Create `src/server/trpc/procedures/meta.ts`:
  - [x] `meta.health` — return `{ status: "ok" }`
  - [x] `meta.languages` — return available locales with labels
- [x] Create `src/server/trpc/router.ts` — merge all sub-routers
- [x] Create `src/app/api/trpc/[trpc]/route.ts` — tRPC HTTP adapter for App Router
- [x] Create `src/lib/trpc/client.ts` — tRPC TanStack React Query hooks (search only)
- [x] Create `src/lib/trpc/server.ts` — tRPC server-side caller (for RSC)
- [x] Create `src/lib/trpc/provider.tsx` — TRPCProvider + QueryClientProvider wrapper
- [x] Verify tRPC API responds at `/api/trpc/meta.health`

## Phase 5a: i18n & Routing Foundation

- [x] Create `src/lib/i18n/config.ts` — locale enum (`en`, `id`), segment mappings
- [x] Create `src/lib/i18n/translations.ts` — 9 UI string translations from Hugo i18n files
- [x] Create `src/lib/i18n/middleware.ts` — locale detection + redirect logic
      (contains locale detection logic; imported by `src/middleware.ts`)
- [x] Create `src/middleware.ts` — Next.js middleware entry point (detect locale, redirect `/` → `/en`)
- [x] Create `src/lib/hooks/use-locale.ts` — current locale hook from route params
- [x] Verify: navigating to `/` redirects to `/en`

## Phase 5b: Root & Locale Layouts

- [x] Create `src/app/layout.tsx` — root layout:
  - [x] Import fonts (Inter or system)
  - [x] Import `katex/dist/katex.min.css` (required for KaTeX equation styling —
        `rehype-katex` generates HTML but CSS must be loaded separately)
  - [x] Wrap with TRPCProvider + QueryClientProvider
  - [x] Add `suppressHydrationWarning` to `<html>` element
  - [x] Add global metadata (site title, description) with
        `metadataBase: new URL('https://ayokoding.com')` (required for
        `alternates.canonical` to resolve to absolute URLs)
  - [x] Add `<GoogleAnalytics gaId="G-1NHDR7S3GV" />` from `@next/third-parties/google`
- [x] Create `src/app/page.tsx` — redirect `/` → `/en` (server component)
- [x] Create `src/app/[locale]/layout.tsx` — shared locale layout:
  - [x] Validate locale parameter: call `notFound()` if locale is not `"en"` or
        `"id"` (the `[locale]` segment accepts any string — without this check,
        `/fr/learn/overview` or `/xyz/anything` would reach the content layer
        and fail silently). Use custom locale check (no extra dependency):
        `if (!SUPPORTED_LOCALES.includes(locale)) notFound()` where
        `SUPPORTED_LOCALES = ['en', 'id']` is defined in `src/lib/i18n/config.ts`
  - [x] Import Header and Footer components
  - [x] Wrap children with ThemeProvider (`"use client"` boundary)
  - [x] Pass locale to context
- [x] Create `src/app/[locale]/(content)/layout.tsx` — content layout:
  - [x] Import Sidebar (left) and TOC (right) components
  - [x] Three-column grid: sidebar | content | TOC
  - [x] Note: `(content)` route group isolates from future `(app)` routes
- [x] Create `src/app/[locale]/(app)/.gitkeep` — placeholder for future fullstack routes

## Phase 5c: Layout Components

> Consult `plans/in-progress/2026-03-23__ayokoding-web-v2/design-mapping.md` from
> Phase 0 for component mapping and breakpoint specifications.

- [x] Create `src/components/layout/header.tsx`:
  - [x] Site title/logo link
  - [x] Search trigger button (opens Cmd+K dialog)
  - [x] Language switcher dropdown (EN/ID)
  - [x] Theme toggle (light/dark/system via next-themes)
  - [x] Mobile hamburger button (visible <768px only)
- [x] Create `src/components/layout/footer.tsx`:
  - [x] Copyright notice
  - [x] Open Source Project link (matching current Hugo site)
- [x] Create `src/components/layout/sidebar.tsx`:
  - [x] Fetch navigation tree via tRPC server caller
  - [x] Render collapsible tree sections (weight-ordered)
  - [x] Highlight currently active page
  - [x] Desktop: persistent 250px left column
- [x] Create `src/components/layout/mobile-nav.tsx`:
  - [x] shadcn Sheet component (slide-in from left)
  - [x] Reuses sidebar tree component inside sheet
  - [x] Opens on hamburger button click
  - [x] Closes on navigation or escape
- [x] Create `src/components/layout/breadcrumb.tsx`:
  - [x] Build breadcrumb from slug segments
  - [x] Locale-aware labels (using content index titles)
  - [x] Truncate with ellipsis on mobile
- [x] Create `src/components/layout/toc.tsx`:
  - [x] Accept headings array (H2-H4)
  - [x] Render as right-side sticky list
  - [x] Highlight active heading on scroll (Intersection Observer)
  - [x] Hidden on tablet and mobile
- [x] Create `src/components/layout/prev-next.tsx`:
  - [x] Accept prev/next ContentMeta objects
  - [x] Side-by-side on desktop, stacked on mobile
  - [x] Show title and section path
- [x] **Playwright MCP verification** (dev server on port 3101):
  - [x] `browser_navigate` to `http://localhost:3101/en` — verify header renders
        (site title, search button, language switcher, theme toggle)
  - [x] `browser_snapshot` — verify layout structure matches Phase 0 reference
        (sidebar present on desktop, three-column grid)
  - [x] `browser_navigate` to a content page — verify sidebar tree, breadcrumb,
        TOC, and footer all render
  - [x] `browser_resize` to 375×812 — verify hamburger button appears, sidebar
        hidden; `browser_click` hamburger — verify Sheet overlay opens
  - [x] Compare snapshots against Phase 0 Hugo reference — flag layout
        discrepancies before proceeding
- [x] Verify responsive behavior at all 4 breakpoints:
  - [x] Desktop (≥1280px): sidebar + content + TOC
  - [x] Laptop (≥1024px): sidebar + content (TOC hidden)
  - [x] Tablet (≥768px): collapsed sidebar + content
  - [x] Mobile (<768px): hamburger + full-width content

## Phase 6: Content Pages (Server-Rendered for SEO)

All content pages are **React Server Components (RSC)** with **on-demand ISR** — fully
server-rendered HTML on first request, then cached. No client-side fetching for content.
Search engines receive complete HTML without JavaScript execution. No
`generateStaticParams` — pages are rendered on-demand so builds stay fast as content
grows (933+ files and counting).

- [x] Create `src/app/[locale]/page.tsx` — locale homepage (RSC, server-rendered)
- [x] Create `src/app/[locale]/(content)/[...slug]/page.tsx` (RSC + ISR):
  - [x] Set `export const dynamicParams = true` (allow any slug)
  - [x] Set `export const revalidate = 3600` (cache 1 hour, then re-render)
  - [x] **No `generateStaticParams`** — on-demand rendering, not build-time
  - [x] Fetch content via **tRPC server caller** (direct function call, no HTTP)
  - [x] Render parsed HTML with custom components
  - [x] Show breadcrumb, TOC, prev/next — all server-rendered
  - [x] Handle section pages (`_index.md`) — show child listing
  - [x] Handle 404 (slug not found → `notFound()`)
  - [x] Verify: `curl` to any content URL returns full HTML with content visible
        (no loading spinners, no "loading..." placeholders)
- [x] Create `src/components/content/markdown-renderer.tsx`:
  - [x] Use `html-react-parser` with `replace` callbacks to convert HTML string
        into React elements with component mapping (server component for static
        content; client sub-components for interactive elements)
  - [x] Wrap content in `<div className="prose dark:prose-invert max-w-none">`
        for Tailwind Typography styling of rendered markdown
  - [x] Replace `<div data-callout="...">` → Callout React component
  - [x] Replace `<div data-tabs="...">` + `<div data-tab="...">` → Tabs component
  - [x] Replace `<div data-youtube="...">` → YouTube embed component
  - [x] Replace `<div data-steps>` → Steps component
  - [x] Replace `<pre>` code blocks → CodeBlock component (server-rendered with shiki)
  - [x] Replace mermaid code blocks → Mermaid component (client-side exception —
        Mermaid requires DOM)
  - [x] Replace internal `<a href="/en/...">` and `<a href="/id/...">` tags →
        Next.js `<Link>` components for SPA client-side navigation (prevents
        full page reloads on internal link clicks)
- [x] Create `src/components/content/callout.tsx` — admonition component (shadcn Alert)
- [x] Create `src/components/content/tabs.tsx` — tabbed content component (`"use client"`,
      shadcn Tabs); parses `data-tabs` items attribute to create tab labels,
      renders `data-tab` children as tab panels
- [x] Create `src/components/content/youtube.tsx` — responsive YouTube iframe embed
      (`"use client"`); accepts video ID from `data-youtube` attribute, renders
      16:9 aspect ratio iframe with lazy loading
- [x] Create `src/components/content/steps.tsx` — numbered step list with visual
      connectors; renders `data-steps` children as ordered steps with headings
- [x] Create `src/components/content/code-block.tsx` — server-rendered syntax highlighting
- [x] Create `src/components/content/mermaid.tsx` — client-side Mermaid renderer
      (uses `"use client"`)
- [x] Create `src/app/[locale]/(content)/error.tsx` — error boundary for content
      rendering failures (`"use client"`, shows friendly error message)
- [x] Create `src/app/[locale]/(content)/not-found.tsx` — custom 404 for invalid slugs
- [x] Add `generateMetadata` for SEO (Open Graph, Twitter Cards, hreflang, canonical):
  - [x] Set `alternates.canonical` in content page metadata (Next.js does NOT
        auto-set canonical URLs — missing canonical causes duplicate content
        issues in search engines). `metadataBase` is already set in root layout
        (Phase 5b) so relative canonical paths resolve to absolute URLs
- [x] Add JSON-LD structured data (Article/WebSite schema)
- [x] Add sitemap generation (`app/sitemap.ts`) — reads content index, no full build
- [x] Add RSS feed generation (`app/feed.xml/route.ts`) — RSS 2.0 feed matching
      Hugo's output format (home + section pages). Reads content index for latest
      pages, returns XML with `Content-Type: application/rss+xml`
- [x] **SEO verification**: `curl -s http://localhost:3101/en/learn/overview | grep -c '<pre'`
      returns >0 (code blocks rendered in HTML, not loading placeholders)
- [x] **RSS verification**: `curl -s http://localhost:3101/feed.xml` returns valid RSS XML
- [x] **robots.txt verification**: `curl -s http://localhost:3101/robots.txt` contains
      correct sitemap URL (not the Hugo `ayokoding.com` URL)
- [x] **Playwright MCP visual verification** (compare against Phase 0 Hugo references):
  - [x] `browser_navigate` to content page with code blocks — `browser_snapshot`
        to verify `<pre>` elements with syntax highlighting classes present
  - [x] Navigate to by-example page with tabs — `browser_click` each tab label,
        verify tab panels switch content (compare against Hugo tab behavior)
  - [x] Navigate to page with callouts — verify admonition styling via snapshot
  - [x] Navigate to page with math (KaTeX) — `browser_take_screenshot` to verify
        equations render visually (DOM snapshot alone cannot verify math rendering)
  - [x] Navigate to page with Mermaid diagrams — `browser_take_screenshot` to
        verify diagram renders (client-side, needs visual confirmation)
  - [x] Navigate to Indonesian YouTube content — verify iframe embed present
  - [x] Navigate to page with raw HTML (`<details>`, `<table>`) — verify not stripped
  - [x] `browser_resize` through all 4 breakpoints on a content page — compare
        layout against Phase 0 reference screenshots
  - [x] Start Hugo site on 3100 simultaneously — `browser_navigate` between
        `localhost:3100/en/learn/overview` and `localhost:3101/en/learn/overview`,
        take side-by-side screenshots for visual parity check

## Phase 7: Search UI (Client-Side — Only Interactive Feature)

Search is the **only feature using client-side tRPC + React Query** (`"use client"`).
All other content is server-rendered.

- [x] Create `src/components/search/search-dialog.tsx` (`"use client"`):
  - [x] shadcn Command component for search
  - [x] Cmd+K / Ctrl+K keyboard shortcut
  - [x] Debounced input → tRPC search.query (React Query client-side call)
  - [x] Result list with title, section path, excerpt
  - [x] Click result → navigate to page
  - [x] Escape to close
- [x] Create `src/components/search/search-results.tsx` — result item component
- [x] Create `src/lib/hooks/use-search.ts` — search dialog open/close state
- [x] Create `src/app/[locale]/(content)/search/page.tsx` — dedicated search results page
      (for direct URL access, inside `(content)` for sidebar layout)
- [x] Verify search works for both locales
- [x] **Playwright MCP search verification**:
  - [x] `browser_navigate` to `http://localhost:3101/en`
  - [x] `browser_press_key` `Meta+k` — verify search dialog opens via
        `browser_snapshot` (Command component visible)
  - [x] `browser_fill_form` the search input with "golang" — verify results
        appear via `browser_snapshot` (result items with titles and excerpts)
  - [x] `browser_click` on a search result — verify navigation to content page
  - [x] `browser_press_key` `Escape` — verify dialog closes
  - [x] Navigate to `/id/`, repeat with Indonesian query "variabel" — verify
        results scoped to Indonesian content

## Phase 8: Backend Unit Tests (BE Gherkin)

- [x] Create `test/unit/be-steps/` directory
- [x] Create `test/unit/be-steps/helpers/` directory
- [x] Create `test/unit/be-steps/helpers/mock-content.ts`:
  - [x] In-memory content map with 5-10 test pages (mix of sections + content)
  - [x] Both `en` and `id` locales represented
  - [x] Pages with varying weights for ordering tests
  - [x] At least one page with code blocks, callouts, math
- [x] Create `test/unit/be-steps/helpers/mock-search-index.ts`:
  - [x] In-memory FlexSearch index seeded with mock content
- [x] Create `test/unit/be-steps/helpers/test-caller.ts`:
  - [x] tRPC caller factory using mock content (no filesystem)
- [x] Implement step definitions (all under `test/unit/be-steps/`):
  - [x] `test/unit/be-steps/content-api.steps.ts` — getBySlug (found, not found, draft),
        listChildren (weight ordering), getTree (hierarchy)
  - [x] `test/unit/be-steps/search-api.steps.ts` — query match, locale scope,
        empty query error, result shape
  - [x] `test/unit/be-steps/navigation-api.steps.ts` — tree structure, weight ordering,
        section children
  - [x] `test/unit/be-steps/i18n-api.steps.ts` — en content, id content, invalid locale
  - [x] `test/unit/be-steps/health-check.steps.ts` — meta.health returns `{ status: "ok" }`
- [x] Verify all BE unit tests pass: `nx run ayokoding-web-v2:test:unit`

## Phase 9: Frontend Unit Tests (FE Gherkin)

- [x] Create `test/unit/fe-steps/` directory
- [x] Create `test/unit/fe-steps/helpers/` directory
- [x] Create `test/unit/fe-steps/helpers/mock-trpc.ts`:
  - [x] Mock tRPC client returning predefined responses
  - [x] Mock content.getBySlug → returns test page HTML
  - [x] Mock content.getTree → returns test navigation tree
  - [x] Mock search.query → returns test search results
- [x] Create `test/unit/fe-steps/helpers/render-with-providers.tsx`:
  - [x] Test wrapper with TRPCProvider + QueryClientProvider + ThemeProvider
  - [x] Configurable locale parameter
- [x] Implement step definitions:
  - [x] `content-rendering.steps.ts` — markdown HTML rendered, code blocks present,
        callouts rendered as Alert, math rendered
  - [x] `navigation.steps.ts` — sidebar renders tree, breadcrumb shows path,
        TOC renders headings, prev/next links present
  - [x] `search.steps.ts` — dialog opens on Cmd+K, results appear on input,
        navigation on click, escape closes
  - [x] `responsive.steps.ts` — sidebar visible/hidden at breakpoints,
        hamburger visible/hidden
  - [x] `i18n.steps.ts` — language switcher renders, locale changes on click
  - [x] `accessibility.steps.ts` — ARIA labels on buttons, keyboard tab order,
        skip-to-content link
- [x] Verify all FE unit tests pass: `nx run ayokoding-web-v2:test:unit`

## Phase 10: Coverage Gate

- [x] Run `nx run ayokoding-web-v2:test:quick`:
  - [x] Unit tests pass (BE + FE Gherkin scenarios)
  - [x] Coverage validation passes (rhino-cli 80%+)
  - [x] Link validation passes (`ayokoding-cli links check`)
- [x] Add coverage exclusions if needed (tRPC HTTP adapter, middleware,
      static params — tested at integration/E2E level)
- [x] Ensure `typecheck` and `lint` pass cleanly

## Phase 11: Integration Tests

- [x] Create `cucumber.integration.js` config
- [x] Create integration test hooks (startup content index with real filesystem)
- [x] Create integration test world (tRPC caller with real content)
- [x] Create integration step definitions:
  - [x] content-api.steps.ts — test against real markdown files
  - [x] search-api.steps.ts — test FlexSearch with real content
  - [x] navigation-api.steps.ts — test tree with real hierarchy
- [x] Configure `test:integration` Nx target: `npx cucumber-js --config cucumber.integration.js`
- [x] Verify all integration tests pass: `nx run ayokoding-web-v2:test:integration`

## Phase 12a: Docker Infrastructure

- [x] Build standalone output locally and inspect structure:
  - [x] Run `nx build ayokoding-web-v2` (triggers `next build` with standalone)
  - [x] Inspect `.next/standalone/` — find exact `server.js` path
        (in Nx monorepos typically at `.next/standalone/apps/ayokoding-web-v2/server.js` — verify)
  - [x] Inspect `.next/static/` — confirm static assets location
  - [x] Inspect `public/` — confirm public assets location
- [x] Create `apps/ayokoding-web-v2/Dockerfile`:
  - [x] Stage 1 (deps): copy workspace + app `package.json`, `npm ci`
  - [x] Stage 2 (builder): copy app source + content, `next build`
  - [x] Stage 3 (runner): copy standalone + static + public + content
  - [x] Set `HOSTNAME=0.0.0.0`, `NEXT_TELEMETRY_DISABLED=1`
  - [x] Set `--chown=nextjs:nodejs` on all COPY commands
  - [x] Adjust CMD path based on standalone inspection above
- [x] Create `infra/dev/ayokoding-web-v2/docker-compose.yml`:
  - [x] Set `CONTENT_DIR=/app/content`
  - [x] Set `PORT=3101`
  - [x] Health check: `curl -f http://localhost:3101/api/trpc/meta.health`
- [x] Run `docker compose up` from `infra/dev/ayokoding-web-v2/`
- [x] Verify health check passes: `curl http://localhost:3101/api/trpc/meta.health`
- [x] Verify content page renders: `curl -s http://localhost:3101/en/learn/overview`
- [x] Verify no JS-only content: compare Docker output with dev server output
- [x] **Playwright MCP Docker verification** (verify full rendering, not just API):
  - [x] `browser_navigate` to `http://localhost:3101/en/learn/overview` — verify
        full page renders (not blank or error page)
  - [x] `browser_snapshot` — verify content, sidebar, breadcrumb, TOC all present
        (catches standalone output issues where content files are missing)
  - [x] Navigate to a by-example page with tabs — `browser_click` tabs to verify
        client-side interactivity works in Docker build
  - [x] `browser_press_key` `Meta+k` — verify search works in Docker
  - [x] `browser_take_screenshot` — compare against dev server screenshot from
        Phase 6 to catch any Docker-specific rendering differences

## Phase 12b: Vercel Configuration

- [x] Configure `next.config.ts` content path resolution:
  - [x] `CONTENT_DIR` env var for Docker
  - [x] Fallback `../../apps/ayokoding-web/content` for dev + Vercel
- [x] Create `apps/ayokoding-web-v2/vercel.json`:
  - [x] Set `installCommand`: `npm install --prefix=../.. --ignore-scripts`
  - [x] Set `ignoreCommand`: `[ "$VERCEL_GIT_COMMIT_REF" != "prod-ayokoding-web-v2" ]`
        (mirrors organiclever-fe pattern — only builds on the production branch)
  - [x] Add security headers: X-Content-Type-Options, X-Frame-Options,
        X-XSS-Protection, Referrer-Policy

## Phase 13a: Backend E2E Test App

- [x] Create `apps/ayokoding-web-v2-be-e2e/` directory
- [x] Create `apps/ayokoding-web-v2-be-e2e/package.json` with Playwright dependency
- [x] Create `apps/ayokoding-web-v2-be-e2e/project.json`:
  - [x] Tags: `["type:e2e", "platform:playwright", "lang:ts", "domain:ayokoding"]`
  - [x] Targets: `install`, `test:e2e`, `test:e2e:ui`, `test:e2e:report`
        (E2E-only apps follow the 4-target pattern; the mandatory 7-target rule
        applies to content/backend apps, not pure Playwright runner apps —
        consistent with `demo-be-e2e`, `demo-fe-e2e`, `organiclever-fe-e2e`)
- [x] Create `apps/ayokoding-web-v2-be-e2e/playwright.config.ts`:
  - [x] `baseURL` from `BASE_URL` env var (default `http://localhost:3101`)
- [x] Create `apps/ayokoding-web-v2-be-e2e/tsconfig.json`
- [x] Create test specs consuming `specs/apps/ayokoding-web/be/gherkin/`:
  - [x] `src/tests/content-api.spec.ts` — tRPC content procedures via HTTP
  - [x] `src/tests/search-api.spec.ts` — tRPC search procedures via HTTP
  - [x] `src/tests/navigation-api.spec.ts` — tRPC navigation via HTTP
  - [x] `src/tests/i18n-api.spec.ts` — locale-specific content, invalid locale 404
  - [x] `src/tests/health.spec.ts` — health endpoint
- [x] Start app via Docker, run BE E2E: `nx run ayokoding-web-v2-be-e2e:test:e2e`
- [x] Verify all BE E2E scenarios pass

## Phase 13b: Frontend E2E Test App

- [x] Create `apps/ayokoding-web-v2-fe-e2e/` directory
- [x] Create `apps/ayokoding-web-v2-fe-e2e/package.json` with Playwright dependency
- [x] Create `apps/ayokoding-web-v2-fe-e2e/project.json`:
  - [x] Tags: `["type:e2e", "platform:playwright", "lang:ts", "domain:ayokoding"]`
  - [x] Targets: `install`, `test:e2e`, `test:e2e:ui`, `test:e2e:report`
        (E2E-only apps follow the 4-target pattern; same as `demo-be-e2e`,
        `demo-fe-e2e`, `organiclever-fe-e2e`)
- [x] Create `apps/ayokoding-web-v2-fe-e2e/playwright.config.ts`:
  - [x] `baseURL` from `BASE_URL` env var (default `http://localhost:3101`)
- [x] Create `apps/ayokoding-web-v2-fe-e2e/tsconfig.json`
- [x] Create test specs consuming `specs/apps/ayokoding-web/fe/gherkin/`:
  - [x] `src/tests/content-rendering.spec.ts` — page rendering, code blocks, callouts,
        tabs, YouTube embeds, steps, raw HTML
  - [x] `src/tests/navigation.spec.ts` — sidebar, breadcrumb, TOC, prev/next
  - [x] `src/tests/search.spec.ts` — search dialog flow
  - [x] `src/tests/responsive.spec.ts` — breakpoint layout verification
  - [x] `src/tests/i18n.spec.ts` — language switching
  - [x] `src/tests/accessibility.spec.ts` — ARIA, keyboard nav
- [x] Start app via Docker, run FE E2E: `nx run ayokoding-web-v2-fe-e2e:test:e2e`
- [x] Verify all FE E2E scenarios pass

## Phase 14a: CI Workflow

- [x] Create `.github/workflows/test-ayokoding-web-v2.yml`:
  - [x] Trigger: 2x daily cron (23:00, 11:00 UTC = WIB 06, 18) + manual dispatch
  - [x] Job 1 (`unit`): checkout → npm ci → `nx run ayokoding-web-v2:test:quick`
  - [x] Job 1: upload coverage to Codecov
  - [x] Job 2 (`e2e`): checkout → Docker build → start → wait for health check
  - [x] Job 2: install Playwright browsers in BE + FE E2E apps
  - [x] Job 2: run `nx run ayokoding-web-v2-be-e2e:test:e2e`
  - [x] Job 2: run `nx run ayokoding-web-v2-fe-e2e:test:e2e`
  - [x] Job 2: upload Playwright reports as artifacts
  - [x] Job 2: docker compose down (cleanup)
- [x] Trigger workflow manually and verify all jobs pass

## Phase 14b: Vercel Deployment

- [x] Create `prod-ayokoding-web-v2` branch from `main`
- [x] Configure Vercel project:
  - [x] Root directory: `apps/ayokoding-web-v2`
  - [x] Framework: Next.js (auto-detected)
  - [x] Production branch: `prod-ayokoding-web-v2`
  - [x] (See `apps/organiclever-fe/vercel.json` and its Vercel project for reference
        configuration pattern)
- [x] Push to `prod-ayokoding-web-v2` branch
- [x] Verify Vercel build succeeds (check build logs)
- [x] Verify deployed site serves content correctly
- [x] Verify SEO: `curl` deployed URL returns full HTML with meta tags

## Phase 14c: Documentation

- [x] Create `apps/ayokoding-web-v2/README.md`:
  - [x] Project overview and architecture
  - [x] Quick start commands (`nx dev`, `nx build`, `nx run test:quick`)
  - [x] Docker setup instructions
  - [x] Vercel deployment docs
  - [x] Related documentation links
- [x] Update `specs/apps/ayokoding-web/README.md` — reference v2 test apps
- [x] Update CLAUDE.md:
  - [x] Add `ayokoding-web-v2` to Current Apps list with description
  - [x] Add `ayokoding-web-v2-be-e2e` to Current Apps list with description
  - [x] Add `ayokoding-web-v2-fe-e2e` to Current Apps list with description
  - [x] Add `prod-ayokoding-web-v2` to environment branches list

## Validation Checklist

- [x] `nx run ayokoding-web-v2:codegen` succeeds (no-op: ayokoding-web-v2 has no
      OpenAPI contract; target exists to satisfy mandatory 7-target requirement
      per nx-targets convention)
- [x] `nx run ayokoding-web-v2:typecheck` succeeds
- [x] `nx run ayokoding-web-v2:lint` succeeds
- [x] `nx run ayokoding-web-v2:build` succeeds
- [x] `nx run ayokoding-web-v2:test:unit` — all BE + FE Gherkin scenarios pass
- [x] `nx run ayokoding-web-v2:test:quick` — 80%+ coverage threshold met
- [x] `nx run ayokoding-web-v2:test:integration` — all scenarios pass with real filesystem
- [x] `ayokoding-web-v2-be-e2e` passes — all BE E2E scenarios pass
- [x] `ayokoding-web-v2-fe-e2e` passes — all FE E2E scenarios pass
- [x] Docker build and run works
- [x] All content pages render correctly (spot check: overview, by-example with tabs, rants)
- [x] **Hugo shortcodes render correctly**:
  - [x] Tabs render as tabbed panels (spot check a by-example page with multi-language tabs)
  - [x] Callouts render as styled admonitions
  - [x] YouTube embeds render as responsive iframes (spot check Indonesian video content)
  - [x] Steps render as numbered step list
- [x] **Raw HTML renders** — inline `<div>`, `<table>`, `<details>`, etc. not stripped
- [x] **SEO: `curl` returns full HTML** — content visible without JS execution:
  - [x] `curl -s http://localhost:3101/en/learn/overview` contains page content
  - [x] `curl -s http://localhost:3101/en/learn/overview` contains `<meta property="og:title"`
  - [x] `curl -s http://localhost:3101/en/learn/overview` contains `<link rel="canonical"`
  - [x] `curl -s http://localhost:3101/en/learn/overview` contains `<script type="application/ld+json"`
  - [x] `curl -s http://localhost:3101/sitemap.xml` lists all content URLs
  - [x] `curl -s http://localhost:3101/feed.xml` returns valid RSS 2.0 XML
  - [x] `curl -s http://localhost:3101/robots.txt` contains correct sitemap URL
- [x] **Google Analytics**: page source contains GA4 tracking script (`G-1NHDR7S3GV`)
- [x] Search returns relevant results for both locales
- [x] Language switching works correctly
- [x] Responsive layout works (desktop, tablet, mobile)
- [x] **Playwright MCP visual parity** (final agent verification):
  - [x] Start both Hugo (`localhost:3100`) and Next.js (`localhost:3101`)
  - [x] `browser_navigate` + `browser_take_screenshot` on 5 key pages at desktop
        breakpoint — compare side by side: homepage, section index, content page
        with code, by-example with tabs, page with callouts + math
  - [x] `browser_resize` to 375×812 on same pages — compare mobile layouts
  - [x] `browser_snapshot` on content page — verify heading hierarchy, link
        structure, and ARIA landmarks match Hugo reference from Phase 0
  - [x] Interactive flows: search (Cmd+K → type → click result), theme toggle,
        language switch, sidebar collapse — all verified via MCP interaction
- [x] **Locale validation**: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3101/fr/learn/overview`
      returns 404 (invalid locales rejected)
- [x] **ayokoding-cli backward compatibility** — Hugo v1 still works:
  - [x] `ayokoding-cli nav regen` still generates correct nav for Hugo site
  - [x] `ayokoding-cli titles update` still updates titles correctly
  - [x] `ayokoding-cli links check` still validates links correctly
  - [x] `nx run ayokoding-web:test:quick` still passes (Hugo v1 quality gate)
  - [x] `nx run ayokoding-web:build` still succeeds (Hugo build)
- [x] CI workflow passes
- [x] Vercel deployment succeeds from `prod-ayokoding-web-v2` branch
- [x] README.md is complete
- [x] `specs/apps/ayokoding-web/README.md` updated with v2 test app references
- [x] CLAUDE.md updated: `ayokoding-web-v2` in Current Apps list,
      `prod-ayokoding-web-v2` in environment branches list
