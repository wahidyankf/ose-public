# ayokoding-web

Fullstack Next.js 16 application that serves the AyoKoding educational content platform. TypeScript stack: tRPC for type-safe API, Zod for validation, shadcn/ui for components, and FlexSearch for full-text search.

## Architecture

- **Framework**: Next.js 16 (App Router, React Server Components)
- **API**: tRPC with server caller (RSC) and HTTP endpoint (search)
- **Content**: Reads markdown from `content/` (co-located in the app)
- **Rendering**: Full SSG via `generateStaticParams` for SEO, client-side only for search/theme/tabs
- **Styling**: Tailwind CSS v4 + shadcn/ui + @tailwindcss/typography
- **Search**: FlexSearch with per-locale indexing
- **i18n**: English (`/en`) and Indonesian (`/id`) with segment mapping
- **Analytics**: Google Analytics GA4 via @next/third-parties

## Quick Start

```bash
# Development server (port 3101)
nx dev ayokoding-web

# Build
nx build ayokoding-web

# Run tests
nx run ayokoding-web:test:quick

# Typecheck
nx run ayokoding-web:typecheck

# Lint
nx run ayokoding-web:lint
```

## Docker

```bash
# Build and run with Docker Compose
cd infra/dev/ayokoding-web
docker compose up --build

# Health check
curl http://localhost:3101/api/trpc/meta.health
```

## Deployment

Deployed to Vercel via production branch `prod-ayokoding-web`.

```bash
# Vercel auto-builds when code is pushed to prod branch
git push origin main:prod-ayokoding-web
```

## Related

- [ayokoding-web-be-e2e](../ayokoding-web-be-e2e/) - Backend E2E tests
- [ayokoding-web-fe-e2e](../ayokoding-web-fe-e2e/) - Frontend E2E tests
- [specs/apps/ayokoding-web/](../../specs/apps/ayokoding-web/) - Gherkin specifications
