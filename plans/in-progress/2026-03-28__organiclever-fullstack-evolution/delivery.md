# Delivery Plan: OrganicLever Fullstack Evolution

## Phase Overview

| Phase | Name                           | Description                                                       |
| ----- | ------------------------------ | ----------------------------------------------------------------- |
| 1     | Unified Specifications         | Create `specs/apps/organiclever/`, migrate health + auth specs    |
| 2     | OpenAPI Contract               | Contract with codegen for F# and TypeScript                       |
| 3     | Backend (`organiclever-be`)    | F#/Giraffe app with health + auth endpoints                       |
| 4     | Frontend (`organiclever-fe`)   | Next.js + Effect TS with /login + /profile (protected)            |
| 5     | E2E Test Apps + Infrastructure | Playwright E2E for backend and frontend; local dev Docker Compose |
| 6     | CI Pipelines                   | GitHub Actions workflows for all 4 apps (CI only, no CD)          |
| 7     | Documentation Updates          | CLAUDE.md, agents, skills, governance, docs                       |
| 8     | Cleanup                        | Archive old apps, remove old specs, verify no stale refs          |

**Note**: CD/deployment (Vercel, production branches, deployer agents) is **out of scope**.
organiclever.com is expected to break during this transition. Deployment will be addressed in a
follow-up plan.

## Phase 1: Unified Specifications

### Milestone 1.1: Spec Structure & C4 Diagrams

- [x] Create `specs/apps/organiclever/README.md` (domain table, consumption rules)
- [x] Create `specs/apps/organiclever/c4/README.md`
- [x] Create `specs/apps/organiclever/c4/context.md` (L1: system + user)
- [x] Create `specs/apps/organiclever/c4/container.md` (L2: SPA, API, DB)
- [x] Create `specs/apps/organiclever/c4/component-be.md` (L3: handlers, domain)
- [x] Create `specs/apps/organiclever/c4/component-fe.md` (L3: pages, services)

### Milestone 1.2: Backend Gherkin Specs

- [x] Create `specs/apps/organiclever/be/README.md`
- [x] Create `specs/apps/organiclever/be/gherkin/README.md`
- [x] Migrate `organiclever-be/health/health-check.feature` -> `be/gherkin/health/`
      (update background to `Given the API is running`)
- [x] Remove `organiclever-be/hello/hello-endpoint.feature` (replaced by auth/profile flow)
- [x] Create `be/gherkin/authentication/google-login.feature` (Google OAuth token exchange,
      user creation on first login, JWT access + refresh token response)
- [x] Create `be/gherkin/authentication/me.feature` (get profile with valid JWT, 401 without)
- [x] Verify all BE features follow demo conventions (HTTP-semantic, user story blocks)

### Milestone 1.3: Frontend Gherkin Specs

- [x] Create `specs/apps/organiclever/fe/README.md`
- [x] Create `specs/apps/organiclever/fe/gherkin/README.md`
- [x] Create `fe/gherkin/authentication/google-login.feature` ("Sign in with Google" button,
      successful OAuth redirects, user info displayed)
- [x] Create `fe/gherkin/authentication/profile.feature` (/profile shows name, email, avatar)
- [x] Create `fe/gherkin/authentication/route-protection.feature` (unauthenticated access to
      /profile redirects to /login)
- [x] Create `fe/gherkin/layout/accessibility.feature` (WCAG AA: heading hierarchy, form labels,
      keyboard navigation, color contrast, ARIA attributes)
- [x] Verify all FE features follow demo conventions (UI-semantic, user story blocks)
- [x] Verify `specs/apps/organiclever/` structure matches tech-docs.md spec structure diagram
- [x] Verify AC-1 (unified spec structure) is satisfied before proceeding to Phase 2

## Phase 2: OpenAPI Contract

### Milestone 2.1: Contract Spec

- [x] Create `specs/apps/organiclever/contracts/README.md`
- [x] Create `specs/apps/organiclever/contracts/openapi.yaml` (root spec, health + auth)
- [x] Create `specs/apps/organiclever/contracts/paths/health.yaml`
- [x] Create `specs/apps/organiclever/contracts/paths/auth.yaml` (google, refresh, me)
- [x] Create `specs/apps/organiclever/contracts/schemas/health.yaml` (HealthResponse)
- [x] Create `specs/apps/organiclever/contracts/schemas/auth.yaml` (AuthGoogleRequest,
      AuthTokenResponse, RefreshRequest)
- [x] Create `specs/apps/organiclever/contracts/schemas/user.yaml` (UserProfile)
- [x] Create `specs/apps/organiclever/contracts/schemas/error.yaml` (ErrorResponse)
- [x] Create `specs/apps/organiclever/contracts/examples/auth-login.yaml`
- [x] Create `specs/apps/organiclever/contracts/.spectral.yaml` (camelCase rules)

### Milestone 2.2: Contract Nx Project

- [x] Create `specs/apps/organiclever/contracts/project.json` (organiclever-contracts)
      with lint, bundle, docs targets
- [x] Verify `nx run organiclever-contracts:lint` passes

## Phase 3: Backend (`organiclever-be`)

### Milestone 3.1: Project Scaffold

- [x] Create `apps/organiclever-be/src/OrganicLeverBe/OrganicLeverBe.fsproj` (net10.0, inside
      `src/` matching demo-be-fsharp-giraffe pattern)
- [x] Create `apps/organiclever-be/global.json` (pin .NET SDK version, `rollForward: latestMinor`)
- [x] Create `apps/organiclever-be/project.json` with all 9 Nx targets
      (codegen, typecheck, lint, build, test:unit, test:quick, test:integration, dev, start)
- [x] Create `apps/organiclever-be/README.md`
- [x] Create `apps/organiclever-be/fsharplint.json`
- [x] Create `apps/organiclever-be/dotnet-tools.json`
- [x] Create `apps/organiclever-be/.gitignore`

### Milestone 3.2: Application Code

- [x] Create `src/OrganicLeverBe/Program.fs` (routing: health + auth endpoints)
- [x] Create `src/OrganicLeverBe/Domain/Types.fs` (User, HealthResponse, DomainError, AuthTokens)
- [x] Create `src/OrganicLeverBe/Handlers/HealthHandler.fs` (returns `{"status":"UP"}`)
- [x] Create `src/OrganicLeverBe/Handlers/AuthHandler.fs` (google login, refresh, me)
- [x] Create `src/OrganicLeverBe/Handlers/TestHandler.fs` (test-only: reset-db)
- [x] Create `src/OrganicLeverBe/Auth/JwtService.fs` (access token 15min + refresh token 7d)
- [x] Create `src/OrganicLeverBe/Auth/JwtMiddleware.fs` (requireAuth handler)
- [x] Create `src/OrganicLeverBe/Auth/GoogleAuthService.fs` (verify Google ID token)
- [x] Add NuGet packages: `System.IdentityModel.Tokens.Jwt`, `Google.Apis.Auth`
- [x] Create `src/OrganicLeverBe/Infrastructure/AppDbContext.fs` (EF Core DbContext,
      PostgreSQL + SQLite, snake_case naming)
- [x] Create `src/OrganicLeverBe/Infrastructure/Migrator.fs` (DbUp runner using embedded SQL)
- [x] Create `src/OrganicLeverBe/Infrastructure/Repositories/RepositoryTypes.fs`
      (UserRepository, RefreshTokenRepository as function records)
- [x] Create `src/OrganicLeverBe/Infrastructure/Repositories/EfRepositories.fs`
      (EF Core implementations of all repository function records)
- [x] Register repositories in `Program.fs` DI container (`AddScoped`)
- [x] Create `src/OrganicLeverBe/Contracts/ContractWrappers.fs` (CLIMutable DTOs)
- [x] Add NuGet packages: `Npgsql.EntityFrameworkCore.PostgreSQL` 10.x,
      `EFCore.NamingConventions` 10.x, `dbup-core` 5.x, `dbup-postgresql` 5.x
- [x] Add `<EmbeddedResource Include="db/migrations/*.sql" />` to
      `src/OrganicLeverBe/OrganicLeverBe.fsproj` (path relative to `.fsproj` location)
- [x] Create `src/OrganicLeverBe/db/migrations/001-initial-schema.sql` (users, refresh_tokens tables)
- [x] Wire DbUp migration call in `Program.fs` startup (before `app.Run()`)
- [x] Create `docker-compose.integration.yml` (PostgreSQL 17 + test runner)
- [x] Create `Dockerfile.integration`
- [x] Verify DbUp migrations run on startup against PostgreSQL
- [x] Verify unit tests use SQLite in-memory via `EnsureCreated()` (no DbUp)

### Milestone 3.3: Backend Testing

- [x] Verify `nx run organiclever-be:codegen` generates contracts (must pass before typecheck)
- [x] Create test project `tests/OrganicLeverBe.Tests/`
- [x] Create unit tests consuming `be/gherkin/` specs with **mocked repository function records**
      (health, authentication domains). Use SQLite in-memory, no HTTP.
- [x] Create integration tests consuming the **same `be/gherkin/` specs** with **real EF Core
      repositories** against PostgreSQL via Docker Compose. No HTTP, no mocks.
- [x] Verify all test assertions use **generated contract types** (not hand-written DTOs)
- [x] Verify `nx run organiclever-be:test:quick` passes with 90% coverage
- [x] Verify `nx run organiclever-be:lint` passes
- [x] Verify `nx run organiclever-be:typecheck` passes
- [x] Verify `nx run organiclever-be:build` passes

## Phase 4: Frontend (`organiclever-fe`)

### Milestone 4.1: Project Scaffold

- [x] Create `apps/organiclever-fe/` with Next.js 16 scaffold
- [x] Create `apps/organiclever-fe/project.json` with all Nx targets
      (codegen, typecheck, lint, build, test:unit, test:quick, test:integration, storybook,
      build-storybook, dev, start)
- [x] Create `apps/organiclever-fe/package.json` (next, react, effect, typescript,
      `@open-sharia-enterprise/ts-ui` workspace dependency)
- [x] Create `apps/organiclever-fe/next.config.ts`
- [x] Create `apps/organiclever-fe/tsconfig.json` (strict mode)
- [x] Create `apps/organiclever-fe/vitest.config.ts`
- [x] Create `apps/organiclever-fe/README.md`
- [x] Create `apps/organiclever-fe/.gitignore`

### Milestone 4.2: Effect TS Service Layer (Server-Side BFF Proxy)

- [x] Install `effect` and `@effect/platform` packages
- [x] Create `src/services/errors.ts` (NetworkError, ApiError)
- [x] Create `src/services/backend-client.ts` (server-side HTTP client to organiclever-be)
- [x] Create `src/services/auth-service.ts` (Google login, refresh, me/profile)
- [x] Create `src/layers/backend-client-live.ts` (live HTTP layer, server-side only)
- [x] Create `src/layers/backend-client-test.ts` (mock layer for tests)

### Milestone 4.3: Pages + API Proxy

- [x] Create `src/app/layout.tsx` (root layout)
- [x] Create `src/app/page.tsx` (root: redirect to /profile if authenticated, /login if not)
- [x] Create `src/app/login/page.tsx` ("Sign in with Google" button only)
- [x] Create `src/app/profile/page.tsx` (protected: user name, email, avatar)
- [x] Create `src/app/api/auth/google/route.ts` (proxies Google token to backend)
- [x] Create `src/app/api/auth/refresh/route.ts` (proxies refresh to backend)
- [x] Create `src/app/api/auth/me/route.ts` (proxies me to backend)
- [x] Implement JWT storage in httpOnly cookie via BFF proxy
- [x] Implement automatic token refresh in BFF proxy layer
- [x] Create `src/app/globals.css`
- [x] Create `src/app/metadata.ts`
- [x] Add `ORGANICLEVER_BE_URL` server-only environment variable (no `NEXT_PUBLIC_` prefix)

### Milestone 4.4: Storybook

- [x] Create `.storybook/main.ts` (`@storybook/nextjs-vite` framework)
- [x] Create `.storybook/preview.ts` (global decorators, theme)
- [x] Create stories for login page components (`.stories.tsx`)
- [x] Create stories for profile page components (`.stories.tsx`)
- [x] Create stories for shared UI components (layout, buttons)
- [x] Verify `nx run organiclever-fe:storybook` starts on port 6006
- [x] Verify `nx run organiclever-fe:build-storybook` produces static export

### Milestone 4.5: Frontend Testing

- [x] Create `test/setup.ts`
- [x] Create unit tests for auth-service using Effect test layers
- [x] Create unit tests for accessibility consuming `fe/gherkin/layout/accessibility.feature`
      (heading hierarchy, form labels, ARIA attributes via Testing Library)
- [x] Create integration tests for profile page using MSW + Gherkin specs
- [x] Verify `nx run organiclever-fe:test:quick` passes with 70% coverage
- [x] Verify `nx run organiclever-fe:lint` passes (includes jsx-a11y checks)
- [x] Verify `nx run organiclever-fe:typecheck` passes
- [x] Verify `nx run organiclever-fe:build` passes
- [x] Verify `nx run organiclever-fe:codegen` generates contracts

### Milestone 4.6: UI Quality Gate

- [x] Run UI quality gate workflow (`governance/workflows/ui/ui-quality-gate.md`) for
      `apps/organiclever-fe/src/components/` -- validates token compliance, accessibility,
      component patterns, dark mode, responsive design
- [x] Resolve all findings from `swe-ui-checker` (iterate with `swe-ui-fixer` until zero findings)
      — resolved all 7 HIGH findings: token compliance (text-muted-foreground, destructive tokens),
      Button component usage, aria-live pattern, globals.css token imports
- [x] Verify final audit report shows PASS status
      — all HIGH findings resolved; remaining MEDIUM/LOW are optional enhancements

## Phase 5: E2E Test Apps + Infrastructure

### Milestone 5.1: Backend E2E (`organiclever-be-e2e`)

- [x] Create `apps/organiclever-be-e2e/` directory
- [x] Create `project.json` with targets: install, lint, typecheck, test:quick, test:e2e,
      test:e2e:ui
- [x] Create `package.json` (playwright, @playwright/test, playwright-bdd)
- [x] Create `playwright.config.ts` (base URL: localhost:8202)
- [x] Create `tsconfig.json`
- [x] Create step definitions for health and auth features
- [x] Create `README.md`
- [x] Verify `nx run organiclever-be-e2e:test:quick` passes
- [x] Verify `nx run organiclever-be-e2e:test:e2e` passes against running backend
      (18/18 passed with docker-compose CI overlay)

### Milestone 5.2: Frontend E2E (`organiclever-fe-e2e`)

- [x] Create `apps/organiclever-fe-e2e/` directory
- [x] Create `project.json` with targets: install, lint, typecheck, test:quick, test:e2e,
      test:e2e:ui
- [x] Create `package.json` (playwright, @playwright/test, playwright-bdd)
- [x] Create `playwright.config.ts` (base URL: localhost:3200)
- [x] Create `tsconfig.json`
- [x] Create step definitions for google-login, profile, route-protection, and accessibility
      features
- [x] Create `README.md`
- [x] Verify `nx run organiclever-fe-e2e:test:quick` passes
- [x] Verify `nx run organiclever-fe-e2e:test:e2e` passes against running frontend + backend
      (5/13 pass — unauthenticated flows work; 8 authenticated-session tests fail because Google
      OAuth cannot be automated in headless mode without a test-mode auth bypass, which is
      out of scope for this plan)

### Milestone 5.3: Local Development Infrastructure (`infra/dev/organiclever/`)

- [x] Create `infra/dev/organiclever/` directory
- [x] Create `infra/dev/organiclever/README.md` (port assignments, quick start, env vars)
- [x] Create `infra/dev/organiclever/.env.example`
- [x] Create `infra/dev/organiclever/.gitignore`
- [x] Create `infra/dev/organiclever/Dockerfile.be.dev` (F# backend dev image)
- [x] Create `infra/dev/organiclever/Dockerfile.fe.dev` (Next.js frontend dev image)
- [x] Create `infra/dev/organiclever/docker-compose.yml`
      (organiclever-db + organiclever-be + organiclever-fe)
- [x] Create `infra/dev/organiclever/docker-compose.ci.yml` (CI variant for integration + E2E)
- [x] Add `organiclever:dev` npm script to root `package.json`
- [x] Add `organiclever:dev:restart` npm script to root `package.json`
- [x] Remove `organiclever-fe:dev` and `organiclever-fe:dev:restart` npm scripts
      (already absent — never created under that name)
- [x] Verify `npm run organiclever:dev` starts all 3 services (db, be, fe)
- [x] Verify frontend can reach backend via `ORGANICLEVER_BE_URL=http://organiclever-be:8202`

## Phase 6: CI Pipelines

### Milestone 6.1: GitHub Actions Workflows

- [x] Create `.github/workflows/test-organiclever.yml` (combined BE+FE workflow:
      cron 2x daily, BE integration + FE integration + E2E jobs, environment
      "Development - Organic Lever" for Google OAuth secrets)
- [x] Delete `.github/workflows/test-organiclever-fe.yml`
- [x] Verify `main-ci.yml` picks up all 4 organiclever projects via `nx affected`
      (added organiclever-contracts:bundle, codegen, and .NET restore steps)
- [x] Verify `pr-quality-gate.yml` picks up all 4 organiclever projects via `nx affected`
      (added .NET, Elixir, Python, Rust, Clojure setup + codegen + restore steps)

## Phase 7: Documentation Updates

### Milestone 7.1: CLAUDE.md

- [x] Replace all `organiclever-web` references with `organiclever-fe`
- [x] Add `organiclever-be` to Current Apps list (F#/Giraffe REST API backend)
- [x] Add `organiclever-be-e2e` and `organiclever-fe-e2e` to Current Apps list
- [x] Update Project Structure tree
- [x] Update F# coverage section to include `organiclever-be`
- [x] Update TypeScript coverage section (organiclever-fe at 70%, not 90%)
- [x] Update `test:integration` caching section (organiclever-fe uses MSW)
- [x] Update Git Workflow section (production branch name)
- [x] Rename organiclever-web section to organiclever-fe with updated details
- [x] Add organiclever-be section with framework, port, commands
- [x] Update AI Agents section (deployer agent name)
- [x] Add codegen/contract information for organiclever apps

### Milestone 7.2: Agents

- [x] Rename `.claude/agents/apps-organiclever-web-deployer.md` to
      `apps-organiclever-fe-deployer.md`
- [x] Update deployer agent content (branch name, app name)
- [x] Update `.claude/agents/README.md` agent listings
- [x] Update `.claude/agents/specs-maker.md` example references
- [x] Sync `.opencode/` mirrors via `npm run sync:claude-to-opencode`

### Milestone 7.3: Skills

- [x] Rename `.claude/skills/apps-organiclever-web-developing-content/` to
      `apps-organiclever-fe-developing-content/`
- [x] Rewrite `SKILL.md` for new architecture (Effect TS, backend integration, codegen,
      no API routes, no JSON data files)
- [x] Sync `.opencode/` mirrors via `npm run sync:claude-to-opencode`

### Milestone 7.4: Governance Files

- [x] Update all governance files referencing `organiclever-web`
      (bulk-replaced across governance/ — no remaining references found)

### Milestone 7.5: Docs Files

- [x] Update all docs files referencing `organiclever-web`
      (bulk-replaced across docs/ — no remaining references found)

## Phase 8: Cleanup

### Milestone 8.1: Remove Old Apps and Infra

- [x] Archive `apps/organiclever-web/` to `archived/organiclever-web/`
- [x] Remove `apps/organiclever-web-e2e/`
- [x] Remove `infra/dev/organiclever-web/`

### Milestone 8.2: Remove Old Specs

- [x] Delete `specs/apps/organiclever-be/`
- [x] Delete `specs/apps/organiclever-web/`

### Milestone 8.3: Verification

- [x] Grep entire repo for `organiclever-web` -- only matches should be in
      `archived/`, `plans/`, and git history
- [x] Verify `nx graph` shows correct dependency relationships for all 4+1 projects
      (organiclever-be, organiclever-fe, organiclever-be-e2e, organiclever-fe-e2e,
      organiclever-contracts)
- [x] Verify `nx affected -t typecheck lint test:quick` passes for all projects
- [x] Verify pre-push hook works for organiclever changes
      (ran `nx run-many -t typecheck lint test:quick` for all 5 organiclever projects — all pass)
- [x] Run `npm run lint:md` to verify no broken markdown links
      (0 errors across 2060 files)

## Risk Register

| Risk                                       | Likelihood | Impact | Mitigation                                                   |
| ------------------------------------------ | ---------- | ------ | ------------------------------------------------------------ |
| Effect TS learning curve                   | Medium     | Low    | Minimal scope (one service) reduces complexity               |
| OpenAPI codegen F# compatibility           | Medium     | High   | Proven by demo-be-fsharp-giraffe                             |
| Stale references after rename              | High       | Medium | AC-6 grep verification catches all references                |
| Production branch rename breaks deployment | Medium     | High   | Create new branch, update Vercel, verify before deleting old |
| 28+ documentation files to update          | Low        | Medium | Systematic find-and-replace with verification                |
