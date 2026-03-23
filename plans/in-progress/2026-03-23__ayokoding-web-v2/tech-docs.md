# Technical Documentation

## Architecture

The app is a single Next.js 16 server that reads markdown content from the filesystem,
serves it via tRPC API, and renders it through React components. No database is needed —
all content lives in flat markdown files.

```mermaid
flowchart TD
    Browser["Browser\n(React + React Query)"]
    NextJS["Next.js 16\nApp Router + tRPC\nport 3101"]
    FS["Filesystem\napps/ayokoding-web/content/\n(933 markdown files)"]
    Index["In-Memory Index\n(FlexSearch + content map)"]

    Browser -- "tRPC calls\n+ page navigation" --> NextJS
    NextJS -- "read markdown\n(startup + on-demand)" --> FS
    NextJS -- "search + lookup" --> Index
    FS -- "build index\n(startup)" --> Index

    style Browser fill:#0173B2,color:#ffffff
    style NextJS fill:#029E73,color:#ffffff
    style FS fill:#DE8F05,color:#ffffff
    style Index fill:#CC78BC,color:#ffffff
```

## Content Pipeline

```
Markdown File (apps/ayokoding-web/content/en/learn/...)
  │
  ├─ gray-matter ──→ YAML frontmatter ──→ Zod validation ──→ ContentMeta
  │
  └─ unified pipeline:
       remark-parse (markdown → AST)
       → remark-gfm (tables, strikethrough)
       → remark-math (LaTeX delimiters)
       → custom remark plugin (Hugo shortcodes → custom nodes)
       → rehype-stringify (AST → HTML)
       → rehype-pretty-code + shiki (syntax highlighting)
       → rehype-katex (math rendering)
       → rehype-slug (heading IDs)
       → rehype-autolink-headings (heading anchors)
       → HTML string
```

### Hugo Shortcode Handling

Hugo shortcodes like `{{< callout type="warning" >}}...{{< /callout >}}` are converted
to custom HTML during the remark pass. A custom remark plugin matches the shortcode
pattern and transforms it to a structured HTML node that maps to a React component:

| Hugo Shortcode                   | React Component                              |
| -------------------------------- | -------------------------------------------- |
| `{{< callout type="warning" >}}` | `<Callout variant="warning">` (shadcn Alert) |
| `{{< callout type="info" >}}`    | `<Callout variant="info">`                   |
| `{{< callout type="tip" >}}`     | `<Callout variant="tip">`                    |

### Content Index

At startup, the app scans all markdown files and builds two in-memory structures:

1. **Content Map** (`Map<string, ContentMeta>`): slug → metadata (title, weight,
   description, date, tags, children, locale). Used for navigation tree and page lookups.
2. **Search Index** (FlexSearch): Full-text index of title + content per locale.
   Rebuilt on startup. ~933 documents indexed.

## Project Structure

```
apps/ayokoding-web-v2/
├── src/
│   ├── app/                              # Next.js App Router
│   │   ├── [locale]/                     # i18n dynamic segment
│   │   │   ├── layout.tsx                # Locale layout (sidebar, header, footer)
│   │   │   ├── page.tsx                  # Homepage (locale root)
│   │   │   ├── search/
│   │   │   │   └── page.tsx              # Search results page
│   │   │   └── [...slug]/                # Catch-all content pages
│   │   │       └── page.tsx              # Renders markdown content
│   │   ├── api/
│   │   │   └── trpc/
│   │   │       └── [trpc]/
│   │   │           └── route.ts          # tRPC HTTP adapter
│   │   ├── layout.tsx                    # Root layout (providers, fonts)
│   │   └── page.tsx                      # / → redirect to /en
│   ├── server/                           # Server-side code
│   │   ├── trpc/
│   │   │   ├── init.ts                   # tRPC initialization (context, middleware)
│   │   │   ├── router.ts                 # Root router (merges sub-routers)
│   │   │   └── procedures/
│   │   │       ├── content.ts            # content.getBySlug, content.listChildren, content.getTree
│   │   │       ├── search.ts             # search.query
│   │   │       └── meta.ts               # meta.health, meta.languages
│   │   └── content/
│   │       ├── reader.ts                 # Filesystem reader (glob, readFile, gray-matter)
│   │       ├── parser.ts                 # Markdown → HTML (unified pipeline)
│   │       ├── index.ts                  # Content index builder (scans all files at startup)
│   │       ├── search-index.ts           # FlexSearch index management
│   │       ├── shortcodes.ts             # Hugo shortcode → custom node transformer
│   │       └── types.ts                  # ContentMeta, ContentPage, TreeNode types
│   ├── components/                       # UI components
│   │   ├── ui/                           # shadcn/ui generated components
│   │   ├── layout/
│   │   │   ├── header.tsx                # Site header (title, search, lang, theme)
│   │   │   ├── sidebar.tsx               # Collapsible navigation sidebar
│   │   │   ├── breadcrumb.tsx            # Path breadcrumb
│   │   │   ├── toc.tsx                   # Table of contents (from headings)
│   │   │   ├── footer.tsx                # Site footer
│   │   │   ├── mobile-nav.tsx            # Mobile hamburger drawer
│   │   │   └── prev-next.tsx             # Bottom prev/next navigation
│   │   ├── content/
│   │   │   ├── markdown-renderer.tsx     # Renders parsed HTML with components
│   │   │   ├── callout.tsx               # Admonition/callout component
│   │   │   ├── code-block.tsx            # Syntax highlighted code block
│   │   │   └── mermaid.tsx               # Client-side Mermaid diagram
│   │   └── search/
│   │       ├── search-dialog.tsx         # Cmd+K search modal
│   │       └── search-results.tsx        # Search result list items
│   ├── lib/
│   │   ├── trpc/
│   │   │   ├── client.ts                 # tRPC React Query hooks (client-side)
│   │   │   ├── server.ts                 # tRPC server caller (RSC usage)
│   │   │   └── provider.tsx              # TRPCProvider + QueryClientProvider
│   │   ├── schemas/                      # Zod schemas
│   │   │   ├── content.ts                # Frontmatter schema, content input/output
│   │   │   ├── search.ts                 # Search query/result schemas
│   │   │   └── navigation.ts             # Tree node, breadcrumb schemas
│   │   ├── i18n/
│   │   │   ├── config.ts                 # Locale config (en, id), path mappings
│   │   │   ├── translations.ts           # UI string translations
│   │   │   └── middleware.ts             # Locale detection + redirect logic
│   │   ├── hooks/
│   │   │   ├── use-search.ts             # Search dialog state
│   │   │   └── use-locale.ts             # Current locale hook
│   │   └── utils.ts                      # Shared utilities
│   └── styles/
│       └── globals.css                   # Tailwind imports + custom styles
├── test/
│   ├── unit/
│   │   ├── be-steps/                     # BE Gherkin step definitions
│   │   │   ├── content-api.steps.ts      # content.* procedure tests
│   │   │   ├── search-api.steps.ts       # search.* procedure tests
│   │   │   ├── navigation-api.steps.ts   # Navigation tree tests
│   │   │   ├── i18n-api.steps.ts         # Locale-specific content tests
│   │   │   └── health-check.steps.ts     # meta.health tests
│   │   └── fe-steps/                     # FE Gherkin step definitions
│   │       ├── content-rendering.steps.ts
│   │       ├── navigation.steps.ts
│   │       ├── search.steps.ts
│   │       ├── responsive.steps.ts
│   │       ├── i18n.steps.ts
│   │       └── accessibility.steps.ts
│   └── integration/
│       └── be-steps/                     # Integration (real filesystem)
│           ├── content-api.steps.ts
│           ├── search-api.steps.ts
│           └── navigation-api.steps.ts
├── public/                               # Static assets
│   ├── favicon.ico
│   ├── favicon.png
│   └── robots.txt
├── next.config.ts                        # Next.js config (standalone output)
├── vitest.config.ts                      # Vitest with v8 coverage
├── tsconfig.json                         # Strict TypeScript
├── tailwind.config.ts                    # Tailwind CSS config
├── postcss.config.ts                     # PostCSS for Tailwind
├── components.json                       # shadcn/ui config
├── project.json                          # Nx targets
├── package.json                          # Dependencies
├── Dockerfile                            # Production container
└── cucumber.integration.js               # Integration test config
```

## Specs Structure

```
specs/apps/ayokoding-web/
├── README.md
├── be/
│   └── gherkin/
│       ├── content-api.feature           # Content retrieval via tRPC
│       ├── search-api.feature            # Search functionality
│       ├── navigation-api.feature        # Navigation tree, breadcrumbs
│       ├── i18n-api.feature              # Locale-specific content serving
│       └── health-check.feature          # Health endpoint
└── fe/
    └── gherkin/
        ├── content-rendering.feature     # Page rendering, markdown, code blocks
        ├── navigation.feature            # Sidebar, breadcrumb, TOC, prev/next
        ├── search.feature                # Search UI, results, Cmd+K
        ├── responsive.feature            # Desktop/tablet/mobile layouts
        ├── i18n.feature                  # Language switching, URL structure
        └── accessibility.feature         # WCAG AA compliance
```

## E2E Test Apps

```
apps/ayokoding-web-v2-be-e2e/            # Backend E2E (tRPC API via HTTP)
├── src/
│   └── tests/
│       ├── content-api.spec.ts           # tRPC content procedures
│       ├── search-api.spec.ts            # tRPC search procedures
│       ├── navigation-api.spec.ts        # tRPC navigation procedures
│       └── health.spec.ts                # Health endpoint
├── playwright.config.ts
└── project.json

apps/ayokoding-web-v2-fe-e2e/            # Frontend E2E (Playwright browser)
├── src/
│   └── tests/
│       ├── content-rendering.spec.ts     # Page rendering
│       ├── navigation.spec.ts            # Sidebar, breadcrumb, TOC
│       ├── search.spec.ts                # Search flow
│       ├── responsive.spec.ts            # Responsive breakpoints
│       ├── i18n.spec.ts                  # Language switching
│       └── accessibility.spec.ts         # ARIA, keyboard nav
├── playwright.config.ts
└── project.json
```

## Design Decisions

| Decision            | Choice                            | Reason                                                     |
| ------------------- | --------------------------------- | ---------------------------------------------------------- |
| App type            | Fullstack (fs)                    | Content API + UI in one app                                |
| Framework           | Next.js 16 (App Router)           | Proven fullstack, existing team experience                 |
| API layer           | tRPC v11                          | Type-safe end-to-end, native Zod + React Query integration |
| Validation          | Zod                               | tRPC native, frontmatter validation, input/output schemas  |
| Data fetching       | React Query via @trpc/react-query | Automatic caching, deduplication, refetch                  |
| UI components       | shadcn/ui (Radix + Tailwind)      | Accessible, customizable, no vendor lock-in                |
| Content source      | Flat markdown files               | Same as Hugo, no migration needed, no database             |
| Markdown parser     | unified (remark + rehype)         | Extensible, server-side, plugin ecosystem                  |
| Syntax highlighting | shiki (via rehype-pretty-code)    | Server-side, all languages, VS Code themes                 |
| Math                | KaTeX (via rehype-katex)          | Same as Hugo site, fast client-side rendering              |
| Diagrams            | Mermaid (client-side)             | Same as Hugo site, dynamic rendering                       |
| Search              | FlexSearch                        | Same as Hugo Hextra, proven, in-memory                     |
| i18n                | [locale] route segment            | Next.js native, no extra library                           |
| CSS                 | Tailwind CSS v4                   | shadcn/ui requirement, utility-first                       |
| Port                | 3101                              | Adjacent to current Hugo site (3100)                       |
| Coverage            | Vitest v8 + rhino-cli 80%         | Same blend threshold as demo-fs-ts-nextjs                  |
| Linter              | oxlint                            | Same as other TypeScript apps                              |
| BDD (unit)          | @amiceli/vitest-cucumber          | Same as demo-fs-ts-nextjs                                  |
| BDD (integration)   | @cucumber/cucumber                | Proven pattern                                             |
| Docker              | Multi-stage, no DB                | Local dev + CI E2E (standalone output)                     |
| Deployment          | Vercel                            | Same as ayokoding-web + organiclever-web                   |
| Prod branch         | `prod-ayokoding-web-v2`           | Vercel listens for pushes (never commit directly)          |

## Visual Design Capture Strategy

The current ayokoding-web uses the Hextra documentation theme. To faithfully replicate
the visual design, we reverse-engineer it before writing any UI code.

### Capture Process

1. **Screenshots**: Playwright captures the live Hugo site at 4 breakpoints (1280px,
   1024px, 768px, 375px) across representative page types
2. **Theme analysis**: Extract Hextra's design tokens (colors, typography, spacing,
   breakpoints) from the theme source
3. **Component mapping**: Map each Hextra element to shadcn/ui + Tailwind equivalents

### Responsive Layout Grid

```
Desktop (≥1280px):
┌──────────┬──────────────────────────────┬──────────┐
│ Sidebar  │         Content              │   TOC    │
│  250px   │        max-w-3xl             │  200px   │
│          │                              │          │
└──────────┴──────────────────────────────┴──────────┘

Laptop (≥1024px):
┌──────────┬─────────────────────────────────────────┐
│ Sidebar  │              Content                    │
│  250px   │             (TOC hidden)                │
└──────────┴─────────────────────────────────────────┘

Tablet (≥768px):
┌────┬───────────────────────────────────────────────┐
│ ≡  │                  Content                      │
│icon│               (full width)                    │
└────┴───────────────────────────────────────────────┘

Mobile (<768px):
┌───────────────────────────────────────────────────┐
│ ☰  Site Title              🔍  🌙                  │
├───────────────────────────────────────────────────┤
│                   Content                         │
│                (full width)                       │
└───────────────────────────────────────────────────┘
```

### Component Responsive Behavior

| Component   | Desktop                | Tablet            | Mobile                    |
| ----------- | ---------------------- | ----------------- | ------------------------- |
| Sidebar     | Persistent, 250px      | Collapsed icons   | Sheet overlay (hamburger) |
| TOC         | Right column, 200px    | Hidden            | Hidden                    |
| Search      | Centered modal (Cmd+K) | Centered modal    | Full-screen overlay       |
| Breadcrumb  | Full path              | Full path         | Truncated with ellipsis   |
| Code blocks | Fixed width            | Full width        | Horizontal scroll         |
| Tables      | Normal                 | Horizontal scroll | Horizontal scroll         |
| Prev/Next   | Side-by-side           | Side-by-side      | Stacked vertically        |
| Images      | Centered, max-width    | Full width        | Full width                |

### Hextra → shadcn/ui Component Mapping

| Hextra Element      | shadcn/ui Equivalent         | Notes                                |
| ------------------- | ---------------------------- | ------------------------------------ |
| Sidebar nav tree    | ScrollArea + custom tree     | Collapsible sections, weight-ordered |
| Search (FlexSearch) | Command (cmdk)               | Cmd+K trigger, same search engine    |
| Callout admonitions | Alert (warning/info/default) | Match type→variant mapping           |
| Breadcrumb          | Breadcrumb                   | Path-based, locale-aware             |
| Theme toggle        | DropdownMenu + next-themes   | System/light/dark options            |
| Language switcher   | DropdownMenu                 | EN/ID with flag icons                |
| TOC                 | Custom component             | Extracted from heading hierarchy     |
| Code block          | Pre + custom styling         | shiki server-side highlighting       |
| Mobile menu         | Sheet                        | Slide-in from left                   |

## Key Architectural Differences from Current Hugo Site

**What changes:**

- Theme: Hextra → shadcn/ui custom components
- Build: Hugo static generation → Next.js SSG/ISR
- Search: Hugo FlexSearch plugin → custom FlexSearch integration via tRPC
- Routing: Hugo content paths → Next.js `[locale]/[...slug]` catch-all
- Shortcodes: Hugo template shortcodes → remark plugin + React components
- Navigation: Hugo auto-sidebar → tRPC `content.getTree` + React sidebar
- SEO: Hugo partials → Next.js Metadata API
- i18n: Hugo multilingual config → `[locale]` route segment

**What stays the same:**

- Content files: Same markdown files in `apps/ayokoding-web/content/`
- URL structure: `/en/learn/...` and `/id/belajar/...`
- Search engine: FlexSearch (same library)
- Content types: by-example, in-the-field, overview, rants, video content
- Frontmatter schema: title, date, weight, description, tags, draft
- Weight-based ordering: Same weight values control navigation order

## tRPC Router Design

```typescript
// Root router
const appRouter = router({
  content: contentRouter,
  search: searchRouter,
  meta: metaRouter,
});

// Content router
const contentRouter = router({
  getBySlug: publicProcedure
    .input(z.object({ locale: localeSchema, slug: z.string() }))
    .output(contentPageSchema)
    .query(({ input }) => /* read + parse markdown */),

  listChildren: publicProcedure
    .input(z.object({ locale: localeSchema, slug: z.string() }))
    .output(z.array(contentMetaSchema))
    .query(({ input }) => /* list child pages */),

  getTree: publicProcedure
    .input(z.object({ locale: localeSchema, rootSlug: z.string().optional() }))
    .output(z.array(treeNodeSchema))
    .query(({ input }) => /* build navigation tree */),
});

// Search router
const searchRouter = router({
  query: publicProcedure
    .input(z.object({
      locale: localeSchema,
      query: z.string().min(1).max(200),
      limit: z.number().min(1).max(50).default(20),
    }))
    .output(z.array(searchResultSchema))
    .query(({ input }) => /* FlexSearch query */),
});

// Meta router
const metaRouter = router({
  health: publicProcedure
    .query(() => ({ status: "ok" as const })),

  languages: publicProcedure
    .query(() => [
      { code: "en", label: "English" },
      { code: "id", label: "Indonesian" },
    ]),
});
```

## Zod Schemas

```typescript
// Locale
const localeSchema = z.enum(["en", "id"]);

// Content frontmatter (validated from YAML)
const frontmatterSchema = z.object({
  title: z.string(),
  date: z.coerce.date().optional(),
  draft: z.boolean().default(false),
  weight: z.number().default(0),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  layout: z.string().optional(),
  type: z.string().optional(),
});

// Content metadata (used in listings and navigation)
const contentMetaSchema = z.object({
  slug: z.string(),
  locale: localeSchema,
  title: z.string(),
  weight: z.number(),
  description: z.string().optional(),
  date: z.coerce.date().optional(),
  tags: z.array(z.string()),
  isSection: z.boolean(),
  hasChildren: z.boolean(),
});

// Full content page (metadata + rendered HTML)
const contentPageSchema = contentMetaSchema.extend({
  html: z.string(),
  headings: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      level: z.number(),
    }),
  ),
  prev: contentMetaSchema.nullable(),
  next: contentMetaSchema.nullable(),
});

// Navigation tree node
const treeNodeSchema: z.ZodType<TreeNode> = z.lazy(() =>
  z.object({
    slug: z.string(),
    title: z.string(),
    weight: z.number(),
    children: z.array(treeNodeSchema),
  }),
);

// Search result
const searchResultSchema = z.object({
  slug: z.string(),
  title: z.string(),
  sectionPath: z.string(),
  excerpt: z.string(),
  score: z.number(),
});
```

## i18n Content Path Mapping

The English and Indonesian content directories have different path structures.
The i18n config maps between them:

```typescript
const pathMappings: Record<string, Record<string, string>> = {
  en: {
    learn: "learn",
    rants: "rants",
    "about-ayokoding": "about-ayokoding",
    "terms-and-conditions": "terms-and-conditions",
  },
  id: {
    learn: "belajar",
    rants: "celoteh",
    "about-ayokoding": "tentang-ayokoding",
    "terms-and-conditions": "syarat-dan-ketentuan",
    "konten-video": "konten-video",
  },
};
```

Content slugs in tRPC use the **filesystem path** (e.g., `learn/software-engineering/...`)
which is locale-independent. The URL uses locale-specific paths via the mapping above.

## Nx Configuration

**Tags:**

```json
"tags": ["type:app", "platform:nextjs", "lang:ts", "domain:ayokoding"]
```

**Implicit dependencies:**

```json
"implicitDependencies": ["rhino-cli"]
```

**7 mandatory targets + dev:**

| Target             | Purpose                                             | Cacheable |
| ------------------ | --------------------------------------------------- | --------- |
| `codegen`          | No-op (no OpenAPI contract)                         | Yes       |
| `dev`              | Start dev server (port 3101)                        | No        |
| `typecheck`        | `tsc --noEmit`                                      | Yes       |
| `lint`             | oxlint                                              | Yes       |
| `build`            | `next build`                                        | Yes       |
| `test:unit`        | Unit tests — BE (tRPC procedures) + FE (components) | Yes       |
| `test:quick`       | Unit tests + coverage validation (80%+)             | Yes       |
| `test:integration` | tRPC procedures with real filesystem                | No        |

**Cache inputs for `test:unit` and `test:quick`:**

```json
"inputs": [
  "default",
  "{workspaceRoot}/specs/apps/ayokoding-web/be/gherkin/**/*.feature",
  "{workspaceRoot}/specs/apps/ayokoding-web/fe/gherkin/**/*.feature",
  "{workspaceRoot}/apps/ayokoding-web/content/**/*.md"
]
```

Note: Content markdown files are included as cache inputs since content changes
could affect test results.

## Vercel Deployment

**Production branch**: `prod-ayokoding-web-v2` (never commit directly — merge from `main`)

**Vercel config** (`apps/ayokoding-web-v2/vercel.json`):

```json
{
  "version": 2,
  "installCommand": "npm install --prefix=../.. --ignore-scripts",
  "ignoreCommand": "[ \"$VERCEL_GIT_COMMIT_REF\" != \"prod-ayokoding-web-v2\" ]",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

**Key Vercel considerations:**

- Vercel's Next.js builder handles the build natively (no `output: 'standalone'` needed
  for Vercel — that's only for Docker)
- Content files are at `apps/ayokoding-web/content/` relative to workspace root. The
  `next.config.ts` must configure the content path to resolve correctly in both Vercel
  (workspace root build) and Docker (standalone build) environments via `CONTENT_DIR`
  env var with a fallback
- `installCommand` uses `--prefix=../..` to install from workspace root (same as
  organiclever-web pattern)
- `ignoreCommand` ensures Vercel only builds when the production branch is pushed

**Deployment workflow** (same pattern as `apps-ayokoding-web-deployer`):

1. Validate content on `main` (CI passes)
2. Push `main` → `prod-ayokoding-web-v2` branch
3. Vercel auto-builds and deploys

## Docker Compose (Local Dev + CI E2E)

**Local development** (`infra/dev/ayokoding-web-v2/docker-compose.yml`):

```yaml
services:
  ayokoding-web-v2:
    build:
      context: ../../../
      dockerfile: apps/ayokoding-web-v2/Dockerfile
    container_name: ayokoding-web-v2
    ports:
      - "3101:3101"
    environment:
      - PORT=3101
      - CONTENT_DIR=/app/content
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3101/api/trpc/meta.health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    restart: unless-stopped
```

No database service needed — content is baked into the Docker image from the
markdown files.

## Dockerfile

```dockerfile
# Stage 1: Dependencies
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Stage 2: Build
FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Copy content files into the build context
COPY apps/ayokoding-web/content ./content
RUN npx next build

# Stage 3: Production
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/content ./content
USER nextjs
EXPOSE 3101
ENV PORT=3101
CMD ["node", "server.js"]
```

## CI Workflow

`.github/workflows/test-ayokoding-web-v2.yml`:

- **Triggers**: 2x daily cron (WIB 06, 18) + manual dispatch
- **Jobs**:
  - `unit`: `nx run ayokoding-web-v2:test:quick` + Codecov upload
  - `e2e`: Start app via Docker, run both BE and FE E2E tests
- **Codecov**: Upload coverage from unit tests

## SEO Implementation

Next.js Metadata API replaces Hugo's custom `head-end.html` partial:

```typescript
// app/[locale]/[...slug]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const page = await getContentBySlug(params.locale, params.slug.join("/"));
  return {
    title: page.title,
    description: page.description,
    openGraph: { title: page.title, description: page.description, type: "article" },
    alternates: {
      languages: { en: `/en/${slug}`, id: `/id/${mappedSlug}` },
    },
  };
}
```

JSON-LD structured data via `<script type="application/ld+json">` in layout.
