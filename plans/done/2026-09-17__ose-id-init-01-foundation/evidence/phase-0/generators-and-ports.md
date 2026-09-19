# Phase 0 — Generator, Sibling, and Port Inventory

## Nx projects (`npm exec nx -- show projects`)

No `ose-id-*` project exists yet. 31 existing projects confirmed, none colliding with the four
planned names (`ose-id-be`, `ose-id-be-e2e`, `ose-id-web`, `ose-id-web-e2e`).

## Nearest siblings

- **Backend language**: no existing C#/ASP.NET Core application exists in `apps/`. `ose-be` is F#
  (Giraffe), `roots-be`/`ose-lms-be` are Java (Spring Boot), `organiclever-be`/`beavernest-be` are
  Rust. `ose-id-be` is the repository's first ASP.NET Core / C# 14 application; conventions come from
  `docs/explanation/software-engineering/programming-languages/c-sharp/` and the `swe-csharp-dev`
  agent, not from a structurally identical sibling. `dotnet --list-sdks` confirms `10.0.300` present
  (repository doctor requires `>=10.0.204`).
- **Frontend framework**: `ose-www`, `ose-app-web`, `organiclever-www`, `organiclever-app-web`,
  `ayokoding-www` are all Next.js 16 + React 19 (TypeScript) — `ose-app-web` is the nearest sibling
  (same `ose-*-app-web` product-app naming shape as `ose-id-web`).
- **`test:e2e` / `test:integration` / `test:quick` targets**: present across
  `repo-governance/development/infra/nx-targets.md` and every sibling `*-e2e` project; `ose-id-be-e2e`
  and `ose-id-web-e2e` will follow the same target shapes (Playwright-based `*-web-e2e`,
  stack-runner-based `*-be-e2e`).

## Reserved local ports — collision check

Searched `docs/reference/web-sites.md`, `repo-config.yml`, every `apps/*/.env.example`, and every
`apps/*/docker-compose*.yml` for `3500`, `8501`, and `5438`.

- `OSE_ID_WEB_PORT=3500` — unclaimed (siblings use 3100/3101/3200/3202/3300).
- `OSE_ID_BE_PORT=8501` — unclaimed (siblings use 8202/8302/8402).
- `OSE_ID_POSTGRES_PORT=5438` — unclaimed (siblings' owned Postgres containers use 5432/5433/5434/5435/5436).
- No `ose-id` reference exists yet in `docs/reference/web-sites.md` or `repo-config.yml`
  (expected — these are populated in Phase 5 rules propagation).

**Acceptance**: no collision; ports remain reserved as declared in the plan's Scope section.
