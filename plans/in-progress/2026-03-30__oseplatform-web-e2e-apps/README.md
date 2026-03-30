# Plan: Add Dedicated E2E Test Apps for oseplatform-web

**Status**: Complete
**Created**: 2026-03-30

## Overview

Add `oseplatform-web-be-e2e` and `oseplatform-web-fe-e2e` as dedicated Playwright + playwright-bdd
E2E test applications, following the exact same pattern as the existing `ayokoding-web-be-e2e` and
`ayokoding-web-fe-e2e` apps. The existing ad-hoc visual E2E tests embedded inside
`apps/oseplatform-web/` are removed and replaced by these proper E2E apps. The CI workflow is
updated from the current build-and-start pattern to the Docker-based pattern used for ayokoding-web.

**Git Workflow**: Commit to `main` (Trunk Based Development)

## Quick Links

- [Requirements](./requirements.md) — Objectives, user stories, and acceptance criteria
- [Technical Documentation](./tech-docs.md) — Architecture, design decisions, and implementation
  approach
- [Delivery Plan](./delivery.md) — Phased implementation checklist and validation

## Scope Summary

### New apps

| App                            | Purpose                          | Gherkin specs                        |
| ------------------------------ | -------------------------------- | ------------------------------------ |
| `apps/oseplatform-web-be-e2e/` | Backend API E2E (tRPC over HTTP) | `specs/apps/oseplatform/be/gherkin/` |
| `apps/oseplatform-web-fe-e2e/` | Frontend UI E2E (browser)        | `specs/apps/oseplatform/fe/gherkin/` |

### New infrastructure

| Path                                           | Purpose                             |
| ---------------------------------------------- | ----------------------------------- |
| `infra/dev/oseplatform-web/docker-compose.yml` | Build + run oseplatform-web for E2E |

### New specs

| Path                                        | Purpose                                      |
| ------------------------------------------- | -------------------------------------------- |
| `specs/apps/oseplatform/c4/README.md`       | C4 diagram index for oseplatform-web         |
| `specs/apps/oseplatform/c4/context.md`      | Level 1: System context (actors + system)    |
| `specs/apps/oseplatform/c4/container.md`    | Level 2: Containers (server, client, stores) |
| `specs/apps/oseplatform/c4/component-be.md` | Level 3: tRPC API components                 |
| `specs/apps/oseplatform/c4/component-fe.md` | Level 3: UI components                       |

### Modified files

| File                                                    | Change                                            |
| ------------------------------------------------------- | ------------------------------------------------- |
| `.github/workflows/test-and-deploy-oseplatform-web.yml` | Replace `e2e` job with Docker-based BE+FE pattern |
| `apps/oseplatform-web/project.json`                     | Remove `e2e` target if present                    |
| `specs/apps/oseplatform/README.md`                      | Add c4/ to structure, add E2E testing references  |
| `CLAUDE.md`                                             | Add new E2E apps to app listing                   |

### Deleted files

| File                                             | Reason                               |
| ------------------------------------------------ | ------------------------------------ |
| `apps/oseplatform-web/test/visual/pages.spec.ts` | Migrated to `oseplatform-web-fe-e2e` |
| `apps/oseplatform-web/playwright.config.ts`      | No longer needed in main app         |

## Key Differences from ayokoding-web Pattern

| Dimension           | ayokoding-web                                                                                                   | oseplatform-web                                                           |
| ------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Port                | 3101                                                                                                            | 3100                                                                      |
| i18n                | English + Indonesian (`en`, `id`)                                                                               | English only                                                              |
| tRPC procedures     | `meta.health`, `meta.languages`, `content.getBySlug`, `content.getTree`, `content.listChildren`, `search.query` | `meta.health`, `content.getBySlug`, `content.listUpdates`, `search.query` |
| Special BE features | None                                                                                                            | RSS feed (`/feed.xml`), sitemap (`/sitemap.xml`), robots.txt              |
| i18n steps          | Yes                                                                                                             | No                                                                        |
| Existing visual E2E | No                                                                                                              | Yes — must be removed                                                     |
| Dockerfile WORKDIR  | `/app` (runner stage)                                                                                           | `/workspace` (runner stage) — affects `CONTENT_DIR` in docker-compose     |
