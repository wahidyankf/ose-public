# Requirements

## Objectives

- Build `apps/ayokoding-web-v2` as a fullstack Next.js 16 application (App Router)
  that replaces the Hugo-based `ayokoding-web` site, with architecture designed for
  future fullstack features (auth, dashboard, database) without restructuring
- Serve all content via tRPC API with type-safe procedures for content retrieval,
  navigation tree, and full-text search
- Use the same markdown content source (`apps/ayokoding-web/content/`) — no content
  migration or duplication
- Implement bilingual routing (English + Indonesian) with `[locale]` URL segments
- Use shadcn/ui (Radix + Tailwind CSS) for all UI components, replacing Hugo Hextra theme
- Use Zod for all schema validation (frontmatter, API inputs, search queries)
- Render all content pages as **React Server Components (RSC)** — server-side HTML
  for SEO (no client-side rendering for content). React Query (via
  `@trpc/tanstack-react-query`) used only for interactive features like search
- Create Gherkin specs at `specs/apps/ayokoding-web/` (both `be/` and `fe/`)
- Create E2E test apps: `apps/ayokoding-web-v2-be-e2e` and `apps/ayokoding-web-v2-fe-e2e`
- Enforce 80%+ line coverage via `rhino-cli test-coverage validate`
- Serve on port **3101**
- Add Docker Compose at `infra/dev/ayokoding-web-v2/` (local dev + CI E2E)
- Add CI workflow `.github/workflows/test-ayokoding-web-v2.yml`
- Deploy to Vercel via production branch `prod-ayokoding-web-v2` (same pattern as
  `ayokoding-web` and `organiclever-fe`)
- Create `vercel.json` with install command, ignore command, and security headers

## User Stories

**Content Browsing:**

```gherkin
Feature: User browses educational content

Scenario: View a learning page
  Given the app is running on port 3101
  When a user navigates to /en/learn/software-engineering/programming-languages/golang/overview
  Then the page should render the markdown content with syntax highlighting
  And the sidebar should show the navigation tree for the current section
  And the breadcrumb should show the path hierarchy

Scenario: Browse section index
  Given the app is running
  When a user navigates to /en/learn/software-engineering/programming-languages
  Then the page should list all available programming languages
  And each item should link to its overview page
```

**Search:**

```gherkin
Feature: User searches content

Scenario: Full-text search
  Given the app is running
  When a user types "goroutine" in the search dialog
  Then search results should include Golang content
  And results should show title, section path, and excerpt

Scenario: Search across languages
  Given the app is running
  When a user searches for "variabel" while on Indonesian locale
  Then results should come from Indonesian content
```

**Bilingual Navigation:**

```gherkin
Feature: User switches language

Scenario: Switch from English to Indonesian
  Given the user is on /en/learn/overview
  When the user clicks the language switcher and selects Indonesian
  Then the user should be redirected to /id/belajar/ikhtisar
  And the sidebar and UI labels should be in Indonesian

Scenario: Default language redirect
  Given the app is running
  When a user navigates to /
  Then the user should be redirected to /en
```

**tRPC API:**

```gherkin
Feature: Content API serves structured data

Scenario: Get page content by slug
  Given the API is available
  When a client calls content.getBySlug with locale "en" and slug "learn/overview"
  Then the response should contain the parsed HTML content
  And the response should contain frontmatter metadata (title, weight, description)
  And the response should contain headings for table of contents (H2-H4)
  And the response should contain prev and next page metadata (or null)

Scenario: Get navigation tree
  Given the API is available
  When a client calls content.getTree with locale "en"
  Then the response should contain a hierarchical tree of all sections
  And each node should have title, slug, weight, and children

Scenario: Search content
  Given the API is available
  When a client calls search.query with query "spring boot" and locale "en"
  Then the response should return matching content items
  And each result should include title, slug, and excerpt
```

**Responsive Design:**

```gherkin
Feature: Site is responsive

Scenario: Desktop layout shows sidebar and TOC
  Given the viewport width is 1280px
  When the user navigates to a content page
  Then the sidebar should be visible on the left
  And the table of contents should be visible on the right
  And the content should fill the center

Scenario: Mobile layout uses hamburger menu
  Given the viewport width is 375px
  When the user navigates to a content page
  Then the sidebar should be hidden
  And a hamburger menu button should be visible

Scenario: Mobile hamburger opens sidebar overlay
  Given the viewport width is 375px
  And the user is on a content page
  When the user taps the hamburger button
  Then the sidebar should slide in as an overlay
```

## Functional Requirements

### Content Rendering

1. **Markdown parsing**: Parse all markdown files using unified (remark + rehype) pipeline
2. **Frontmatter**: Extract and validate YAML frontmatter with Zod schema (title, date,
   draft, weight, description, tags)
3. **Code blocks**: Syntax highlighting via shiki (server-side, all languages)
4. **Math**: KaTeX rendering for `$...$` (inline), `$$...$$` (block) delimiters.
   Set `singleDollarTextMath: true` explicitly in the remark-math configuration
   to ensure `$...$` is treated as inline math regardless of default behavior
   changes between versions. The Hugo config also lists `\(...\)` and `\[...\]`
   but content only uses `$`/`$$` forms
5. **Diagrams**: Client-side Mermaid rendering with color-blind-friendly palette
6. **Hugo shortcodes**: Convert all shortcodes actually used in content:
   - `{{< callout type="warning|info|tip" >}}` (19 occurrences) → shadcn Alert
   - `{{< tabs items="..." >}}` / `{{< tab >}}` (508 occurrences) → shadcn Tabs
   - `{{< youtube ID >}}` (45 files, Indonesian only) → responsive iframe embed
   - `{{% steps %}}` (1 file) → ordered step list with visual connectors
7. **Tables**: Standard markdown tables with proper styling
8. **Images**: Responsive images with lazy loading
9. **Internal links**: Resolve Hugo-style absolute paths (`/en/learn/...`) to Next.js
   `<Link>` components for SPA client-side navigation (via `html-react-parser`
   `replace` — plain `<a>` tags cause full page reloads losing SPA behavior)
10. **Raw HTML**: Support inline HTML in markdown (same as Hugo `unsafe: true`) via
    `rehype-raw` with `allowDangerousHtml: true` on `remark-rehype`
    (1,343 raw HTML occurrences across 30 content files)
11. **Component mapping**: HTML string from unified pipeline rendered via
    `html-react-parser` with `replace` callbacks — maps shortcode HTML nodes
    (`data-callout`, `data-tabs`, `data-youtube`, `data-steps`) to interactive
    React components (tabs need state, Mermaid needs DOM, YouTube needs iframe).
    `dangerouslySetInnerHTML` cannot provide this interactivity.
12. **Typography**: Rendered markdown styled via `@tailwindcss/typography` `prose`
    classes (headings, paragraphs, lists, blockquotes, tables, code — without
    this plugin, all HTML renders as unstyled plain text)

### Navigation

1. **Sidebar**: Hierarchical collapsible sidebar showing content tree for current section
2. **Breadcrumb**: Path-based breadcrumb navigation
3. **Table of contents**: Right-side TOC extracted from heading hierarchy (H2-H4)
4. **Prev/Next**: Bottom navigation between sibling pages (ordered by weight)
5. **Section index**: Auto-generated listing of child pages for `_index.md` pages

### Search

1. **FlexSearch**: Full-text search with content indexing at startup/build time
2. **Search dialog**: `Cmd+K` / `Ctrl+K` keyboard shortcut to open search
3. **Results**: Title, section path, and content excerpt with highlighted match
4. **Per-locale**: Search scoped to current language

### Internationalization

1. **URL structure**: `/en/...` for English, `/id/...` for Indonesian
2. **Language switcher**: UI component to switch between locales
3. **UI translations**: All UI strings translated (9 translation keys from i18n files)
4. **Content mapping**: EN `learn/` maps to ID `belajar/`, EN `rants/` maps to ID `celoteh/`
5. **Default redirect**: `/` redirects to `/en`
6. **Locale validation**: Invalid locales (e.g., `/fr/...`, `/xyz/...`) return 404
   (the `[locale]` segment accepts any string — must validate against supported
   locales `en` and `id`)

### API (tRPC)

1. **content.getBySlug**: Returns parsed HTML + frontmatter for a given locale + slug
2. **content.listChildren**: Returns immediate child pages of a section (with metadata)
3. **content.getTree**: Returns full navigation tree for a locale (optionally scoped
   to a root slug for sidebar context)
4. **search.query**: Full-text search with locale, query string (min 1 char), optional
   limit. Returns error for empty query.
5. **meta.health**: Health check endpoint (returns `{ status: "ok" }`)
6. **meta.languages**: Returns available languages with their labels

### Theme & Layout

1. **Dark/Light mode**: Theme toggle with system preference detection (via `next-themes`)
2. **Header**: Site title, search trigger, language switcher, theme toggle
3. **Footer**: Copyright, Open Source Project link (matching current site)
4. **Responsive**: Desktop (sidebar + TOC), tablet (sidebar only), mobile (hamburger drawer)
5. **Typography**: Clean documentation typography (similar to Hextra)

### Analytics & Feeds

1. **Google Analytics**: GA4 tracking with measurement ID `G-1NHDR7S3GV`
   (same as current Hugo site) via `@next/third-parties/google`
2. **RSS feed**: RSS 2.0 feed at `/feed.xml` for home + section content
   (matching Hugo's RSS output for home and section pages)
3. **robots.txt**: Generated with correct sitemap URL (not copied from Hugo)

## Non-Functional Requirements

- **Coverage**: 80% or higher line coverage (Codecov algorithm) on unit tests via Vitest
  v8 + `rhino-cli test-coverage validate`. Rationale: fullstack blend — backends enforce
  90%, frontends enforce 70%, 80% is the midpoint for a combined BE+FE codebase. Note:
  `organiclever-fe` (pure marketing site, Next.js) enforces 90%; this plan uses 80%
  because ayokoding-web-v2 is a full-stack content platform with both BE pipeline code
  (content parsing, tRPC, search) and FE components, making the 80% midpoint appropriate
- **TypeScript**: Strict mode, no `any` escapes in production code
- **Port**: 3101 (next to current ayokoding-web at 3100)
- **CI**: 2x daily cron (WIB 06, 18) + manual dispatch (same schedule as other apps)
- **Docker**: Multi-stage build for local dev + CI E2E, no database required
- **Deployment**: Vercel (production branch `prod-ayokoding-web-v2`), same as
  `ayokoding-web` (`prod-ayokoding-web`) and `organiclever-fe` (`prod-organiclever-fe`)
- **Linting**: oxlint (same as demo-fe-ts-nextjs and demo-fs-ts-nextjs)
- **Performance**: All content pages should return Time to First Byte (TTFB) under
  2s on cached requests in Vercel production (aspirational; monitor post-launch).
  On-demand ISR (no `generateStaticParams`) — pages server-rendered on first request,
  then cached. Builds stay fast as content grows (no build-time generation of 933+ pages)
- **SEO**: All content must be server-rendered (RSC) — no client-side rendering for
  content pages. Full HTML available to crawlers without JavaScript execution.
  Equivalent meta tags to current Hugo site (Open Graph, Twitter Cards, JSON-LD,
  hreflang, sitemap). Explicit `alternates.canonical` on every content page (Next.js
  does NOT auto-set canonical URLs — requires `metadataBase` + `alternates.canonical`
  in `generateMetadata`). RSS feed at `/feed.xml`
- **Analytics**: Google Analytics GA4 (`G-1NHDR7S3GV`) via `@next/third-parties/google`
  (same tracking ID as current Hugo site — no data gap during migration)
- **Accessibility**: WCAG AA compliance, keyboard navigation, ARIA labels, color contrast
- **Resilience**: Malformed frontmatter in individual markdown files must not crash the
  app. Invalid files are skipped with a console warning during content index build

## Acceptance Criteria

```gherkin
Scenario: All BE E2E scenarios pass
  Given ayokoding-web-v2 is running on port 3101
  When nx run ayokoding-web-v2-be-e2e:test:e2e is executed with BASE_URL=http://localhost:3101
  Then all tRPC API Gherkin scenarios should pass

Scenario: All FE E2E scenarios pass
  Given ayokoding-web-v2 is running on port 3101
  When nx run ayokoding-web-v2-fe-e2e:test:e2e is executed with BASE_URL=http://localhost:3101
  Then all frontend Gherkin scenarios should pass

Scenario: Unit test coverage meets threshold
  Given ayokoding-web-v2 unit tests are run with coverage
  When rhino-cli test-coverage validate apps/ayokoding-web-v2/coverage/lcov.info 80 is executed
  Then the validation should pass with 80%+ line coverage

Scenario: Content renders correctly
  Given ayokoding-web-v2 is running
  When a user navigates to any content page that exists in the Hugo site
  Then the content should render with proper formatting
  And code blocks should have syntax highlighting
  And navigation should match the Hugo site structure

Scenario: Search works across all content
  Given ayokoding-web-v2 is running
  When a user searches for "python" in English locale
  Then results should include Python programming language content
  And results should not include Indonesian-only content

Scenario: English page renders in English
  Given ayokoding-web-v2 is running
  When a user visits /en/learn/overview
  Then the page should render in English

Scenario: Language switch redirects to Indonesian URL
  Given the user is on /en/learn/overview
  When the user switches to Indonesian
  Then the URL should change to /id/belajar/ikhtisar
  And the UI should be in Indonesian

Scenario: Math expressions render correctly
  Given ayokoding-web-v2 is running
  When a user navigates to a page with KaTeX math expressions
  Then inline math expressions ($...$) should be rendered as formatted equations
  And block math expressions ($$...$$) should be rendered as centered display equations

Scenario: Docker build works
  Given docker compose up for infra/dev/ayokoding-web-v2/ is run
  When the health check hits http://localhost:3101/api/trpc/meta.health
  Then the response should contain status "ok"

Scenario: CI workflow passes end-to-end
  Given the GitHub Actions workflow test-ayokoding-web-v2.yml is triggered
  When the workflow completes
  Then all jobs should report success

Scenario: Vercel deployment succeeds
  Given code is pushed to the prod-ayokoding-web-v2 branch
  When Vercel builds the Next.js app
  Then the deployment should succeed
  And the site should be accessible at the Vercel URL
  And all content pages should render correctly

Scenario: Visual parity with Hugo site (Playwright MCP)
  Given the Hugo site is running on port 3100
  And ayokoding-web-v2 is running on port 3101
  When the agent navigates to 5 key pages on both sites via Playwright MCP
  Then the layout structure (sidebar, content, TOC) should match
  And content rendering (code blocks, tabs, callouts, math) should be equivalent
  And responsive behavior at mobile (375px) and desktop (1280px) should match
  And interactive flows (search, theme toggle, language switch) should work
```
