# Requirements: OSE Platform Web - Next.js Rewrite

## Objectives

1. Replace Hugo static site generator with Next.js 16 App Router
2. Preserve all existing content (landing page, about, update posts) with identical URLs
3. Maintain SEO parity (same page titles, descriptions, Open Graph tags, sitemap, RSS)
4. Establish tRPC-based content API for type-safe content delivery
5. Add dark/light theme toggle (default: light)
6. Add basic search capability across all pages
7. Achieve 80% line coverage with Gherkin-driven tests
8. Archive Hugo version for historical reference
9. Update all monorepo references (agents, skills, CI, docs)
10. Maintain existing deployment workflow (`prod-oseplatform-web` branch, Vercel)

## User Stories

### US-1: Landing Page

```gherkin
Scenario: Visitor views the landing page
  Given a visitor navigates to the root URL "/"
  When the page loads
  Then they see the platform title "Open Sharia Enterprise Platform"
  And they see a description of the platform mission
  And they see navigation links to Updates, About, Documentation, and GitHub
  And they see social icons for GitHub and RSS
```

### US-2: About Page

```gherkin
Scenario: Visitor reads the about page
  Given a visitor navigates to "/about/"
  When the page loads
  Then they see the page title "About OSE Platform"
  And they see rendered markdown content including headings, lists, and Mermaid diagrams
  And they see a table of contents generated from page headings
  And they see breadcrumb navigation
```

### US-3: Updates Listing

```gherkin
Scenario: Visitor browses update posts
  Given a visitor navigates to "/updates/"
  When the page loads
  Then they see a list of update posts sorted by date (newest first)
  And each post shows its title, date, summary, and tags
  And each post links to its detail page
```

### US-4: Update Detail Page

```gherkin
Scenario: Visitor reads a specific update
  Given a visitor navigates to "/updates/2026-02-08-phase-0-end-of-phase-0"
  When the page loads
  Then they see the full rendered markdown content
  And they see the publication date and reading time
  And they see tags displayed as badges
  And they see navigation links to previous and next updates
  And they see a table of contents
```

### US-5: Mermaid Diagrams

```gherkin
Scenario: Page with Mermaid diagram renders correctly
  Given a page contains a mermaid code block
  When the page loads
  Then the mermaid code block is rendered as an SVG diagram
  And the diagram is responsive to the container width
```

### US-6: RSS Feed

```gherkin
Scenario: RSS feed is available
  Given a visitor or feed reader requests "/feed.xml"
  When the response is returned
  Then the content type is "application/xml"
  And the feed contains all published update posts
  And each entry has title, link, date, and summary
```

### US-7: Search

```gherkin
Scenario: Visitor searches for content
  Given a visitor opens the search dialog via Cmd/Ctrl+K or the search button
  When they type a search query
  Then matching results appear with title and excerpt
  And clicking a result navigates to that page
```

### US-8: Theme Toggle

```gherkin
Scenario: Visitor toggles dark mode
  Given the site loads in light mode by default
  When the visitor clicks the theme toggle
  Then the site switches to dark mode
  And the preference persists across page navigations
```

### US-9: SEO

```gherkin
Scenario: Robots.txt is valid
  Given the Next.js app is running
  When a search engine requests "/robots.txt"
  Then the response contains valid robots.txt with sitemap reference

Scenario: Sitemap is valid
  Given the Next.js app is running
  When a search engine requests "/sitemap.xml"
  Then the response contains a valid sitemap with all public page URLs
  And each page has proper meta title, description, and Open Graph tags
```

### US-10: Health Check

```gherkin
Scenario: Health check endpoint responds
  Given an external monitor requests "/api/trpc/meta.health"
  When the request is processed
  Then the response status is 200
  And the body contains {"status": "ok"}
```

## Functional Requirements

### Content Rendering

- **FR-1**: Parse markdown files from `content/` directory with YAML frontmatter
- **FR-2**: Render markdown to HTML using unified pipeline (remark-parse, remark-gfm, rehype-pretty-code, rehype-slug, rehype-autolink-headings)
- **FR-3**: Support Mermaid code blocks rendered as interactive diagrams
- **FR-4**: Generate table of contents from H2-H4 headings
- **FR-5**: Calculate and display reading time for each page
- **FR-6**: Support raw HTML in markdown content (rehype-raw)

### Navigation

- **FR-7**: Header with links: Updates, About, Documentation (external), GitHub (external)
- **FR-8**: Breadcrumb navigation on all content pages
- **FR-9**: Previous/next navigation links on update posts
- **FR-10**: Footer with MIT License link and attribution

### API

- **FR-11**: tRPC procedure `content.getBySlug(slug)` -- returns single page by slug
- **FR-12**: tRPC procedure `content.listUpdates()` -- returns all updates sorted by date desc
- **FR-13**: tRPC procedure `search.query(query, limit)` -- returns matching pages
- **FR-14**: tRPC procedure `meta.health` -- returns health status

### SEO & Feeds

- **FR-15**: Generate `sitemap.xml` with all public page URLs
- **FR-16**: Generate `robots.txt` allowing all crawlers with sitemap reference
- **FR-17**: Generate RSS feed at `/feed.xml` with all update posts
- **FR-18**: Set Open Graph and Twitter Card meta tags on all pages
- **FR-19**: Generate `<title>` from page title + "OSE Platform" suffix

### Static Generation

- **FR-20**: Pre-build all pages at build time via `generateStaticParams()`
- **FR-21**: Set `dynamicParams: false` to return 404 for unknown slugs
- **FR-22**: Support `draft: true` frontmatter to exclude pages from production builds

## Non-Functional Requirements

- **NFR-1**: Build time under 30 seconds (only ~6 pages)
- **NFR-2**: Lighthouse Performance score >= 90 on all pages
- **NFR-3**: 80% line coverage enforced via `rhino-cli test-coverage validate`
- **NFR-4**: All content URLs must match existing Hugo URLs exactly (no broken links)
- **NFR-5**: WCAG AA compliance (color contrast, alt text, keyboard navigation)
- **NFR-6**: Responsive design (mobile-first, breakpoints at sm/md/lg/xl)
- **NFR-7**: Security headers matching current vercel.json (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy)
- **NFR-8**: Dev server starts in under 5 seconds
- **NFR-9**: Zero runtime JavaScript for content pages (server components only, except theme toggle, search, and Mermaid)

## Acceptance Criteria

### AC-1: URL Parity

```gherkin
Scenario Outline: All existing URLs resolve correctly
  Given the Next.js app is running
  When a visitor navigates to "<url>"
  Then the page loads with status 200
  And the content matches the Hugo version

  Examples:
    | url                                                         |
    | /                                                           |
    | /about/                                                     |
    | /updates/                                                   |
    | /updates/2025-12-14-phase-0-week-4-initial-commit/          |
    | /updates/2026-01-11-phase-0-week-8-agent-system-and-content-improvement/ |
    | /updates/2026-02-08-phase-0-end-of-phase-0/                 |
    | /updates/2026-03-08-phase-1-week-4-organiclever-takes-shape/ |
    | /feed.xml                                                   |
```

### AC-2: Content Fidelity

```gherkin
Scenario: Rendered content matches Hugo output
  Given a page with markdown content including headings, lists, code blocks, and a Mermaid diagram
  When rendered by the Next.js app
  Then all headings have auto-generated anchor IDs
  And code blocks have syntax highlighting with copy buttons
  And Mermaid diagrams render as SVG
  And the table of contents lists all H2-H4 headings
```

### AC-3: Build & Test

```gherkin
# Integration-level quality gate: intentionally tests the full pipeline in one scenario.
# Each When/Then pair tests a separate Nx target. Not split into separate scenarios
# because the quality gate must pass as a whole before deployment proceeds.
Scenario: Quality gate passes
  Given the Next.js app source code
  When "nx run oseplatform-web:test:quick" is executed
  Then unit tests pass
  And line coverage >= 80%
  And link validation passes
  When "nx run oseplatform-web:typecheck" is executed
  Then TypeScript compilation succeeds with no errors
  When "nx run oseplatform-web:lint" is executed
  Then no linting violations are reported
  When "nx run oseplatform-web:build" is executed
  Then the build completes successfully under 30 seconds
```

### AC-4: Deployment

```gherkin
Scenario: Vercel deployment succeeds
  Given the Next.js app is committed to main
  When the deployer pushes to prod-oseplatform-web branch
  Then Vercel detects Next.js framework and builds successfully
  And the site is accessible at oseplatform.com
  And security headers are present on all responses
  And static assets have 1-year cache headers
```

### AC-5: Hugo Archival

```gherkin
Scenario: Hugo version is properly archived
  Given the Next.js rewrite is complete and verified
  When the Hugo app is archived
  Then it exists at archived/oseplatform-web-hugo/
  And it is removed from the Nx workspace (no project.json)
  And the swe-hugo-developer agent is preserved (shared with other Hugo needs)
  And all monorepo references to "platform:hugo" for oseplatform-web are updated
```
