# Plan: Rewrite `ayokoding-web` as Fullstack Next.js (`ayokoding-web-v2`)

**Status**: In Progress
**Created**: 2026-03-23
**Git Workflow**: Work on `main` (Trunk Based Development)

## Goal

Rewrite the ayokoding-web Hugo site as a fullstack Next.js 16 application
(`apps/ayokoding-web-v2`) using modern TypeScript tooling: tRPC for type-safe API,
Zod for validation, React Query for data fetching, and shadcn/ui for components.
The new app reads the same markdown content from `apps/ayokoding-web/content/` and
serves it through a tRPC API with full-text search, bilingual routing (EN/ID),
syntax highlighting, and all features of the current Hugo site.

## What Makes This Different

This is the first **content platform** rewrite in the monorepo. Unlike demo apps
(CRUD + auth) or marketing sites (static pages), ayokoding-web-v2 must:

- Parse and render 933+ markdown files with frontmatter, code blocks, math, diagrams
- Support bilingual content (809 EN + 124 ID files) with language-prefixed URLs
- Provide full-text search across all content via FlexSearch
- Replicate Hugo Hextra features: sidebar navigation, table of contents, breadcrumbs,
  callout admonitions, tabbed code comparisons, YouTube embeds, Mermaid diagrams,
  KaTeX math, inline HTML, RSS feeds, Google Analytics
- Handle 5-level deep content hierarchy (domain > subdomain > tool > type > level)
- Serve everything via tRPC (type-safe end-to-end from API to UI)
- Use **on-demand ISR** (not full SSG) so builds stay fast as content grows
- Be **extensible for future fullstack features** (auth, dashboard, database) via
  route groups — adding new features requires zero restructuring of content routes

## Deployment

- **Platform**: Vercel (same as current ayokoding-web and organiclever-web)
- **Production branch**: `prod-ayokoding-web-v2` (Vercel listens for pushes)
- **Local dev / CI E2E**: Docker Compose (no Vercel dependency)

## New Artifacts

| Artifact                                      | Purpose                              |
| --------------------------------------------- | ------------------------------------ |
| `apps/ayokoding-web-v2`                       | Fullstack Next.js 16 app (port 3101) |
| `apps/ayokoding-web-v2-fe-e2e`                | Playwright FE E2E tests              |
| `apps/ayokoding-web-v2-be-e2e`                | Playwright BE E2E tests (tRPC API)   |
| `specs/apps/ayokoding-web/`                   | Gherkin specs (be/ + fe/)            |
| `infra/dev/ayokoding-web-v2/`                 | Docker Compose for local dev / CI    |
| `.github/workflows/test-ayokoding-web-v2.yml` | CI workflow                          |
| `prod-ayokoding-web-v2` branch                | Vercel production deployment trigger |

## Plan Documents

- [Requirements](./requirements.md) — Objectives, user stories, functional/non-functional
  requirements, acceptance criteria
- [Technical Documentation](./tech-docs.md) — Architecture, project structure, design
  decisions, tRPC router, content pipeline, Nx configuration
- [Delivery](./delivery.md) — Multi-phase implementation checklist (Phase 0 through 14c)
  with validation gate
