# Plan: OSE Platform Web - Next.js Rewrite

**Status**: Done
**Created**: 2026-03-28
**Completed**: 2026-03-28
**Delivery Type**: Multi-phase rollout
**Git Workflow**: Trunk Based Development

## Overview

Rewrite `apps/oseplatform-web` from Hugo (PaperMod theme) to Next.js 16, following the same architectural patterns established by `apps/ayokoding-web`. The current Hugo site is a small marketing/landing site with approximately 6 pages (landing, about, 4 update posts). The new Next.js version will provide a modern, extensible platform for future growth while maintaining the same content, SEO characteristics, and deployment workflow.

This plan follows the proven approach from the [ayokoding-web v2 rewrite](../../done/2026-03-23__ayokoding-web-v2/README.md) and [v1-to-v2 migration](../../done/2026-03-24__ayokoding-web-v1-to-v2-migration/README.md), adapted for the significantly simpler scope of oseplatform-web.

## Problem Statement

The current Hugo site is functional but:

1. **Technology island** -- Hugo/Go templates are disconnected from the TypeScript/Next.js ecosystem the rest of the monorepo uses
2. **Limited extensibility** -- Adding interactive features (dashboards, auth, API endpoints) requires a fundamentally different stack
3. **Inconsistent patterns** -- Every other web app in the monorepo uses Next.js 16; Hugo is the sole outlier after the ayokoding-web migration
4. **Maintenance burden** -- Hugo module system, Go templating, and PaperMod theme require distinct knowledge from the primary stack

## Current State

| Aspect             | Details                                                                  |
| ------------------ | ------------------------------------------------------------------------ |
| **Framework**      | Hugo v0.156.0 (Extended) with PaperMod theme                             |
| **Content**        | 1 landing page, 1 about page, 4 update posts, 1 updates index            |
| **i18n**           | English only                                                             |
| **Features**       | Reading time, breadcrumbs, code highlighting, Mermaid diagrams, RSS, TOC |
| **Dev port**       | 3000                                                                     |
| **Deployment**     | Vercel via `prod-oseplatform-web` branch, 2x daily cron                  |
| **Nx targets**     | dev, build, clean, links:check, test:quick, lint                         |
| **Tags**           | type:app, platform:hugo, domain:oseplatform                              |
| **CLI dependency** | `oseplatform-cli` (link validation)                                      |

## Target State

| Aspect         | Details                                                              |
| -------------- | -------------------------------------------------------------------- |
| **Framework**  | Next.js 16 (App Router, RSC, TypeScript)                             |
| **Content**    | Same markdown files, rendered by unified/remark/rehype pipeline      |
| **i18n**       | English only (no locale routing)                                     |
| **Features**   | Same as current + dark mode, search, flat extensible structure       |
| **Dev port**   | 3100                                                                 |
| **Deployment** | Vercel via `prod-oseplatform-web` branch (unchanged)                 |
| **Nx targets** | dev, build, typecheck, lint, test:unit, test:quick, test:integration |
| **Tags**       | type:app, platform:nextjs, lang:ts, domain:oseplatform               |
| **UI**         | shadcn/ui + Tailwind CSS v4 + ts-ui shared lib + ts-ui-tokens        |
| **API**        | tRPC (content retrieval, search, health)                             |
| **Testing**    | Vitest + Gherkin specs, 80% line coverage                            |

## Scope

### In Scope

- New Next.js 16 app at `apps/oseplatform-web` (in-place replacement)
- Content layer with markdown parsing (reuse ayokoding-web patterns)
- tRPC API for content and search
- Landing page design matching current PaperMod look/feel
- About page, updates listing, update detail pages
- RSS feed, sitemap, robots.txt
- Mermaid diagram support
- Dark/light theme toggle
- Basic search (FlexSearch)
- Unit + integration tests with Gherkin specs
- Docker configuration
- Vercel deployment configuration
- Hugo version archival
- Agent and skill updates
- CI/CD workflow updates

### Out of Scope

- Bilingual/i18n support (English only, can be added later)
- E2E test apps (dedicated `oseplatform-web-be-e2e`/`oseplatform-web-fe-e2e` -- can be added later)
- New content creation (existing content migrated as-is)
- Complex shortcode migration (only Mermaid exists)
- Authentication or interactive features (future phases)

## Key Decisions

| Decision      | Choice                           | Rationale                                                          |
| ------------- | -------------------------------- | ------------------------------------------------------------------ |
| **Rendering** | SSG via `generateStaticParams`   | Only ~6 pages; full pre-build is fast and SEO-optimal              |
| **API**       | tRPC                             | Type-safe, consistent with ayokoding-web, supports future features |
| **Search**    | FlexSearch                       | Consistent with ayokoding-web; lightweight for small content set   |
| **i18n**      | None (single locale)             | Site is English-only; no Indonesian content exists                 |
| **Port**      | 3100                             | Distinct from Hugo (3000), close to ayokoding-web (3101)           |
| **Coverage**  | 80%                              | Matches ayokoding-web threshold                                    |
| **Dark mode** | Enabled (default: light)         | Content-first site per conventions; trivial with next-themes       |
| **Archival**  | `archived/oseplatform-web-hugo/` | Preserves git history; same pattern as ayokoding-web v1            |

## Differences from ayokoding-web

| Aspect                | ayokoding-web                                          | oseplatform-web       |
| --------------------- | ------------------------------------------------------ | --------------------- |
| **Content volume**    | 933+ files                                             | ~6 files              |
| **i18n**              | English + Indonesian                                   | English only          |
| **Rendering**         | SSG (`generateStaticParams` + `dynamicParams = false`) | SSG (same pattern)    |
| **Shortcodes**        | callout, tabs, youtube, steps, mermaid                 | Mermaid only          |
| **Route groups**      | `(content)` + `(app)`                                  | None (flat structure) |
| **Navigation**        | Deep 5-level tree sidebar                              | Flat header nav       |
| **Search complexity** | Heavy (933+ docs)                                      | Light (~6 pages)      |
| **CLI dependency**    | ayokoding-cli                                          | oseplatform-cli       |

## Quick Links

- [Requirements](./requirements.md)
- [Technical Documentation](./tech-docs.md)
- [Delivery Plan](./delivery.md)

## Related Plans

- [ayokoding-web v2 (Next.js rewrite)](../../done/2026-03-23__ayokoding-web-v2/README.md) -- Reference architecture
- [ayokoding-web v1-to-v2 migration](../../done/2026-03-24__ayokoding-web-v1-to-v2-migration/README.md) -- Migration strategy reference
- [demo-fs-ts-nextjs](../../done/2026-03-22__demo-fs-ts-nextjs/README.md) -- Fullstack Next.js patterns

## Related Files

- Current app: [`apps/oseplatform-web/`](../../../apps/oseplatform-web/)
- Reference app: [`apps/ayokoding-web/`](../../../apps/ayokoding-web/)
- CLI tool: [`apps/oseplatform-cli/`](../../../apps/oseplatform-cli/)
- Deployer agent: [`.claude/agents/apps-oseplatform-web-deployer.md`](../../../.claude/agents/apps-oseplatform-web-deployer.md)
- Content skill: [`.claude/skills/apps-oseplatform-web-developing-content/`](../../../.claude/skills/apps-oseplatform-web-developing-content/)
