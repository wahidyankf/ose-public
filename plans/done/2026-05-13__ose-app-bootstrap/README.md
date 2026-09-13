# ose-app Bootstrap — Scaffold ose-app-web, ose-app-web-e2e, ose-app-be, ose-app-be-e2e

**Status**: Completed — 2026-05-13
**Scope**: `ose-public` — new product line `ose-app`
**Worktree**: `worktrees/ose-app-bootstrap/` (see [delivery.md §Worktree](./delivery.md#worktree))

## Context

OSE GRC is a new product in the Open Sharia Enterprise portfolio that performs **AI-assisted gap analysis** between regulator-published rule documents and a company's internal policies (SOPs, manuals, procedures). Given a corpus of regulatory documents and a corpus of internal policy documents, the system surfaces gaps — points where internal policy is silent, contradictory, or weaker than the regulation requires.

This plan **bootstraps the four projects**, supporting CI/CD workflows, BDD/DDD spec scaffolding, and contracts wiring. It does **not** implement gap analysis features, document ingestion pipelines, or AI prompt engineering — those land in follow-up plans.

## Four Projects

| Project           | Type                | Port | Tech                                                   | Notes                                                            |
| ----------------- | ------------------- | ---- | ------------------------------------------------------ | ---------------------------------------------------------------- |
| `ose-app-web`     | Next.js 16 frontend | 3300 | App Router, TS, tRPC, Tailwind v4                      | Mirrors `organiclever-web` minus PGlite (server-first data flow) |
| `ose-app-be`      | F#/Giraffe REST API | 8302 | .NET 10, Giraffe, Npgsql, DbUp, xUnit + TickSpec (BDD) | Mirrors ose-primer `crud-be-fsharp-giraffe` pattern              |
| `ose-app-web-e2e` | Playwright FE E2E   | —    | Playwright-BDD, oxlint, TS                             | Mirrors `organiclever-web-e2e`                                   |
| `ose-app-be-e2e`  | Playwright BE E2E   | —    | Playwright-BDD, oxlint, TS                             | Mirrors `organiclever-be-e2e`                                    |

The user originally listed the BE e2e as `ose-app-e2e`. This plan uses `ose-app-be-e2e` for consistency with the `organiclever-be-e2e` naming pattern [Judgment call]. Renaming to `ose-app-e2e` is mechanical if user prefers — see [prd.md §Naming Decision](./prd.md#naming-decision-be-e2e-project) for the cost of either choice.

## What This Plan Delivers

1. **Four Nx projects** scaffolded with `project.json`, source layout, README, language toolchain config.
2. **Contracts project** at `specs/apps/ose-app/containers/contracts/` — OpenAPI 3.1 spec with health endpoint as bootstrap, `.spectral.yaml` ruleset, `ose-app-contracts` Nx project for `lint`, `bundle`, `docs` targets.
3. **DDD specs** — `bounded-contexts.yaml` with four initial contexts (`regulatory-source`, `internal-policy`, `gap-analysis`, `ai-orchestration`) plus stub `ubiquitous-language/*.md` per context.
4. **BDD specs** — `specs/apps/ose-app/behavior/{be,web}/gherkin/` with one smoke `.feature` (health check) per side.
5. **infra/dev/ose-app/** — docker-compose for full-stack dev (BE + FE + PostgreSQL + DbUp migrations).
6. **CI workflows** — PR quality gate auto-detects via `lang:*` tags (`lang:fsharp` routes through the existing `dotnet` job). Per-product dev/staging/prod deploy workflows mirror `organiclever-*` patterns.
7. **Doctor + toolchain** — `apps/ose-app-be/global.json` (.NET 10) registered so `npm run doctor` provisions the dotnet SDK + fantomas + fsharplint toolchain on a clean worktree.
8. **OpenAPI codegen wired** — `ose-app-be:codegen` runs `openapi-generator-cli -g fsharp-giraffe-server`; `ose-app-web:codegen` runs `@hey-api/openapi-ts`. Both consume `specs/apps/ose-app/containers/contracts/generated/openapi-bundled.yaml`.
9. **OpenRouter scaffolding** — env var contract (`OPENROUTER_API_KEY`, `OPENROUTER_MODEL`) wired through `.env.example`, F# `appsettings.json` schema, Dockerfile, `infra/dev/ose-app/.env.example`. No actual LLM calls in bootstrap.
10. **AGENTS.md + repo-governance updates** — register the four apps in the apps catalog and add to the project structure tree.

## What This Plan Does NOT Deliver

- Document upload UI or storage logic
- LLM prompting, vector storage, retrieval, or gap-analysis algorithm
- Authentication or multi-tenant isolation
- Production-grade Postgres provisioning beyond local docker-compose
- Vercel project linking (deferred until first staging deploy plan)

## Documents

- [brd.md](./brd.md) — Business rationale, affected roles, success metrics
- [prd.md](./prd.md) — Product requirements + Gherkin acceptance criteria for bootstrap completeness
- [tech-docs.md](./tech-docs.md) — Architecture, design decisions, file impact map
- [delivery.md](./delivery.md) — Phased checklist with verification commands

## Quick Links

- Reference BE pattern: `ose-primer/apps/crud-be-fsharp-giraffe/` (read-only template; copy patterns, not files — see <https://github.com/wahidyankf/ose-primer>)
- Reference FE pattern: [`apps/organiclever-web/`](../../../apps/organiclever-web/)
- Reference E2E pattern: [`apps/organiclever-web-e2e/`](../../../apps/organiclever-web-e2e/), [`apps/organiclever-be-e2e/`](../../../apps/organiclever-be-e2e/)
- Reference contracts: [`specs/apps/organiclever/containers/contracts/`](../../../specs/apps/organiclever/containers/contracts/)
- Reference CI workflow: [`.github/workflows/test-and-deploy-organiclever-web-development.yml`](../../../.github/workflows/test-and-deploy-organiclever-web-development.yml)

> Home prefix normalised: absolute home-directory paths in this plan's files were rewritten to a portable form (such as `~/`, `$HOME/`, or a `<placeholder>`), so captured output here is not byte-verbatim.
