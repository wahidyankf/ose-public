# Delivery Plan: OrganicLever Fullstack Evolution

## Phase Overview

| Phase | Name                        | Description                                              |
| ----- | --------------------------- | -------------------------------------------------------- |
| 1     | Unified Specifications      | Create `specs/apps/organiclever/`, migrate hello + health specs |
| 2     | OpenAPI Contract            | Contract with codegen for F# and TypeScript              |
| 3     | Backend (`organiclever-be`) | F#/Giraffe app with hello + health endpoints             |
| 4     | Frontend (`organiclever-fe`)| Next.js + Effect TS with /hello page                     |
| 5     | E2E Test Apps               | Playwright E2E for backend and frontend                  |
| 6     | CI/CD Pipelines             | GitHub Actions workflows for all 4 apps                  |
| 7     | Documentation Updates       | CLAUDE.md, agents, skills, governance, docs              |
| 8     | Cleanup                     | Archive old apps, remove old specs, verify no stale refs |

## Phase 1: Unified Specifications

### Milestone 1.1: Spec Structure & C4 Diagrams

- [ ] Create `specs/apps/organiclever/README.md` (domain table, consumption rules)
- [ ] Create `specs/apps/organiclever/c4/README.md`
- [ ] Create `specs/apps/organiclever/c4/context.md` (L1: system + user)
- [ ] Create `specs/apps/organiclever/c4/container.md` (L2: SPA, API, DB)
- [ ] Create `specs/apps/organiclever/c4/component-be.md` (L3: handlers, domain)
- [ ] Create `specs/apps/organiclever/c4/component-fe.md` (L3: pages, services)

### Milestone 1.2: Backend Gherkin Specs

- [ ] Create `specs/apps/organiclever/be/README.md`
- [ ] Create `specs/apps/organiclever/be/gherkin/README.md`
- [ ] Migrate `organiclever-be/health/health-check.feature` -> `be/gherkin/health/`
  (update background to `Given the API is running`)
- [ ] Migrate `organiclever-be/hello/hello-endpoint.feature` -> `be/gherkin/hello/`
  (update background to `Given the API is running`)
- [ ] Verify all BE features follow demo conventions (HTTP-semantic, user story blocks)

### Milestone 1.3: Frontend Gherkin Specs

- [ ] Create `specs/apps/organiclever/fe/README.md`
- [ ] Create `specs/apps/organiclever/fe/gherkin/README.md`
- [ ] Create `fe/gherkin/hello/hello-page.feature` (new: /hello page shows "world" from backend,
  loading state, error handling)
- [ ] Verify all FE features follow demo conventions (UI-semantic, user story blocks)

## Phase 2: OpenAPI Contract

### Milestone 2.1: Contract Spec

- [ ] Create `specs/apps/organiclever/contracts/README.md`
- [ ] Create `specs/apps/organiclever/contracts/openapi.yaml` (root spec, 2 endpoints)
- [ ] Create `specs/apps/organiclever/contracts/paths/hello.yaml`
- [ ] Create `specs/apps/organiclever/contracts/paths/health.yaml`
- [ ] Create `specs/apps/organiclever/contracts/schemas/hello.yaml` (HelloResponse)
- [ ] Create `specs/apps/organiclever/contracts/schemas/health.yaml` (HealthResponse)
- [ ] Create `specs/apps/organiclever/contracts/schemas/error.yaml` (ErrorResponse)
- [ ] Create `specs/apps/organiclever/contracts/examples/hello-response.yaml`
- [ ] Create `specs/apps/organiclever/contracts/.spectral.yaml` (camelCase rules)

### Milestone 2.2: Contract Nx Project

- [ ] Create `specs/apps/organiclever/contracts/project.json` (organiclever-contracts)
  with lint, bundle, docs targets
- [ ] Verify `nx run organiclever-contracts:lint` passes

## Phase 3: Backend (`organiclever-be`)

### Milestone 3.1: Project Scaffold

- [ ] Create `apps/organiclever-be/OrganicLeverBe.fsproj` (net10.0)
- [ ] Create `apps/organiclever-be/project.json` with all 9 Nx targets
  (codegen, typecheck, lint, build, test:unit, test:quick, test:integration, dev, start)
- [ ] Create `apps/organiclever-be/README.md`
- [ ] Create `apps/organiclever-be/fsharplint.json`
- [ ] Create `apps/organiclever-be/dotnet-tools.json`
- [ ] Create `apps/organiclever-be/.gitignore`

### Milestone 3.2: Application Code

- [ ] Create `src/OrganicLeverBe/Program.fs` (routing: /api/v1/hello, /api/v1/health)
- [ ] Create `src/OrganicLeverBe/Domain/Types.fs` (HelloResponse, HealthResponse)
- [ ] Create `src/OrganicLeverBe/Handlers/HelloHandler.fs` (returns `{"message":"world"}`)
- [ ] Create `src/OrganicLeverBe/Handlers/HealthHandler.fs` (returns `{"status":"UP"}`)
- [ ] Create `src/OrganicLeverBe/Handlers/TestHandler.fs` (test-only: reset-db)
- [ ] Create `src/OrganicLeverBe/Infrastructure/AppDbContext.fs` (minimal EF Core)
- [ ] Create `src/OrganicLeverBe/Contracts/ContractWrappers.fs` (CLIMutable DTOs)
- [ ] Create `db/migrations/001-initial-schema.sql` (minimal)
- [ ] Create `docker-compose.integration.yml` (PostgreSQL)
- [ ] Create `Dockerfile.integration`

### Milestone 3.3: Backend Testing

- [ ] Create test project `tests/OrganicLeverBe.Tests/`
- [ ] Create unit tests consuming `be/gherkin/hello/` and `be/gherkin/health/` specs
- [ ] Create integration tests with real PostgreSQL
- [ ] Verify `nx run organiclever-be:test:quick` passes with 90% coverage
- [ ] Verify `nx run organiclever-be:lint` passes
- [ ] Verify `nx run organiclever-be:typecheck` passes
- [ ] Verify `nx run organiclever-be:build` passes
- [ ] Verify `nx run organiclever-be:codegen` generates contracts

## Phase 4: Frontend (`organiclever-fe`)

### Milestone 4.1: Project Scaffold

- [ ] Create `apps/organiclever-fe/` with Next.js 16 scaffold
- [ ] Create `apps/organiclever-fe/project.json` with all 9 Nx targets
  (codegen, typecheck, lint, build, test:unit, test:quick, test:integration, dev, start)
- [ ] Create `apps/organiclever-fe/package.json` (next, react, effect, typescript)
- [ ] Create `apps/organiclever-fe/next.config.mjs`
- [ ] Create `apps/organiclever-fe/tsconfig.json` (strict mode)
- [ ] Create `apps/organiclever-fe/vitest.config.ts`
- [ ] Create `apps/organiclever-fe/README.md`
- [ ] Create `apps/organiclever-fe/.gitignore`

### Milestone 4.2: Effect TS Service Layer

- [ ] Install `effect` and `@effect/platform` packages
- [ ] Create `src/services/errors.ts` (NetworkError, ApiError)
- [ ] Create `src/services/api-client.ts` (base HTTP client with Effect)
- [ ] Create `src/services/hello-service.ts` (HelloService tag + implementation)
- [ ] Create `src/layers/api-client-live.ts` (live HTTP layer)
- [ ] Create `src/layers/api-client-test.ts` (mock layer for tests)

### Milestone 4.3: Hello Page

- [ ] Create `src/app/layout.tsx` (root layout)
- [ ] Create `src/app/page.tsx` (minimal root page)
- [ ] Create `src/app/hello/page.tsx` (calls backend, displays message)
- [ ] Create `src/app/globals.css`
- [ ] Create `src/app/metadata.ts`
- [ ] Add `ORGANICLEVER_API_URL` environment variable support

### Milestone 4.4: Frontend Testing

- [ ] Create `test/setup.ts`
- [ ] Create unit tests for hello-service using Effect test layers
- [ ] Create integration tests for hello page using MSW + Gherkin specs
- [ ] Verify `nx run organiclever-fe:test:quick` passes with 70% coverage
- [ ] Verify `nx run organiclever-fe:lint` passes
- [ ] Verify `nx run organiclever-fe:typecheck` passes
- [ ] Verify `nx run organiclever-fe:build` passes
- [ ] Verify `nx run organiclever-fe:codegen` generates contracts

## Phase 5: E2E Test Apps

### Milestone 5.1: Backend E2E (`organiclever-be-e2e`)

- [ ] Create `apps/organiclever-be-e2e/` directory
- [ ] Create `project.json` with targets: install, lint, typecheck, test:quick, test:e2e,
  test:e2e:ui
- [ ] Create `package.json` (playwright, @playwright/test, playwright-bdd)
- [ ] Create `playwright.config.ts` (base URL: localhost:8202)
- [ ] Create `tsconfig.json`
- [ ] Create step definitions for hello and health features
- [ ] Create `README.md`
- [ ] Verify `nx run organiclever-be-e2e:test:quick` passes
- [ ] Verify `nx run organiclever-be-e2e:test:e2e` passes against running backend

### Milestone 5.2: Frontend E2E (`organiclever-fe-e2e`)

- [ ] Create `apps/organiclever-fe-e2e/` directory
- [ ] Create `project.json` with targets: install, lint, typecheck, test:quick, test:e2e,
  test:e2e:ui
- [ ] Create `package.json` (playwright, @playwright/test, playwright-bdd)
- [ ] Create `playwright.config.ts` (base URL: localhost:3200)
- [ ] Create `tsconfig.json`
- [ ] Create step definitions for hello page feature
- [ ] Create `README.md`
- [ ] Verify `nx run organiclever-fe-e2e:test:quick` passes
- [ ] Verify `nx run organiclever-fe-e2e:test:e2e` passes against running frontend + backend

## Phase 6: CI/CD Pipelines

### Milestone 6.1: GitHub Actions Workflows

- [ ] Create `.github/workflows/test-organiclever-be.yml`
  (cron 2x daily, integration + E2E jobs, .NET 10 + Node.js 24)
- [ ] Create `.github/workflows/test-organiclever-fe.yml`
  (cron 2x daily, integration + E2E jobs, .NET 10 + Node.js 24)
- [ ] Delete `.github/workflows/test-organiclever-web.yml`
- [ ] Verify `main-ci.yml` picks up all 4 organiclever projects via `nx affected`
- [ ] Verify `pr-quality-gate.yml` picks up all 4 organiclever projects via `nx affected`

### Milestone 6.2: Vercel Deployment

- [ ] Create/update production branch for frontend (`prod-organiclever-fe`)
- [ ] Update Vercel project settings if needed
- [ ] Verify deployment works end-to-end

## Phase 7: Documentation Updates

### Milestone 7.1: CLAUDE.md

- [ ] Replace all `organiclever-web` references with `organiclever-fe`
- [ ] Add `organiclever-be` to Current Apps list (F#/Giraffe REST API backend)
- [ ] Add `organiclever-be-e2e` and `organiclever-fe-e2e` to Current Apps list
- [ ] Update Project Structure tree
- [ ] Update F# coverage section to include `organiclever-be`
- [ ] Update TypeScript coverage section (organiclever-fe at 70%, not 90%)
- [ ] Update `test:integration` caching section (organiclever-fe uses MSW)
- [ ] Update Git Workflow section (production branch name)
- [ ] Rename organiclever-web section to organiclever-fe with updated details
- [ ] Add organiclever-be section with framework, port, commands
- [ ] Update AI Agents section (deployer agent name)
- [ ] Add codegen/contract information for organiclever apps

### Milestone 7.2: Agents

- [ ] Rename `.claude/agents/apps-organiclever-web-deployer.md` to
  `apps-organiclever-fe-deployer.md`
- [ ] Update deployer agent content (branch name, app name)
- [ ] Update `.claude/agents/README.md` agent listings
- [ ] Update `.claude/agents/specs-maker.md` example references
- [ ] Sync `.opencode/` mirrors via `npm run sync:claude-to-opencode`

### Milestone 7.3: Skills

- [ ] Rename `.claude/skills/apps-organiclever-web-developing-content/` to
  `apps-organiclever-fe-developing-content/`
- [ ] Rewrite `SKILL.md` for new architecture (Effect TS, backend integration, codegen,
  no API routes, no JSON data files)
- [ ] Sync `.opencode/` mirrors via `npm run sync:claude-to-opencode`

### Milestone 7.4: Governance Files (14+ files)

- [ ] Update `governance/development/agents/ai-agents.md`
- [ ] Update `governance/development/frontend/component-patterns.md`
- [ ] Update `governance/development/frontend/styling.md`
- [ ] Update `governance/development/frontend/design-tokens.md`
- [ ] Update `governance/workflows/ui/ui-quality-gate.md`
- [ ] Update `governance/workflows/specs/specs-validation.md`
- [ ] Update `governance/development/infra/vercel-deployment.md`
- [ ] Update `governance/development/infra/nx-targets.md`
- [ ] Update `governance/development/infra/github-actions-workflow-naming.md`
- [ ] Update `governance/development/quality/specs-application-sync.md`
- [ ] Update `governance/development/quality/code.md`
- [ ] Update `governance/development/quality/three-level-testing-standard.md`
- [ ] Update `governance/development/quality/best-practices.md`
- [ ] Update `governance/conventions/writing/dynamic-collection-references.md`

### Milestone 7.5: Docs Files (14+ files)

- [ ] Update `docs/reference/system-architecture/re-syar__ci-cd.md`
- [ ] Update `docs/reference/system-architecture/re-syar__technology-stack.md`
- [ ] Update `docs/reference/system-architecture/re-syar__deployment.md`
- [ ] Update `docs/reference/system-architecture/re-syar__applications.md`
- [ ] Update `docs/reference/re__monorepo-structure.md`
- [ ] Update `docs/reference/re__project-dependency-graph.md`
- [ ] Update `docs/reference/re__nx-configuration.md`
- [ ] Update `docs/reference/re__code-coverage.md`
- [ ] Update `docs/how-to/hoto__local-dev-docker.md`
- [ ] Update `docs/explanation/software-engineering/programming-languages/typescript/ex-soen-prla-ty__testing.md`
- [ ] Update `docs/explanation/software-engineering/programming-languages/README.md`
- [ ] Update `docs/explanation/software-engineering/platform-web/tools/jvm-spring-boot/ex-soen-plwe-to-jvspbo__security.md`
- [ ] Update `docs/explanation/software-engineering/development/test-driven-development-tdd/ex-soen-de-tedrdetd__integration-testing-standards.md`
- [ ] Update `docs/explanation/software-engineering/automation-testing/tools/playwright/ex-soen-aute-to-pl__configuration.md`

## Phase 8: Cleanup

### Milestone 8.1: Remove Old Apps

- [ ] Archive `apps/organiclever-web/` to `archived/organiclever-web/`
- [ ] Remove `apps/organiclever-web-e2e/`

### Milestone 8.2: Remove Old Specs

- [ ] Delete `specs/apps/organiclever-be/`
- [ ] Delete `specs/apps/organiclever-web/`

### Milestone 8.3: Verification

- [ ] Grep entire repo for `organiclever-web` -- only matches should be in
  `archived/`, `plans/`, and git history
- [ ] Verify `nx graph` shows correct dependency relationships for all 4+1 projects
  (organiclever-be, organiclever-fe, organiclever-be-e2e, organiclever-fe-e2e,
  organiclever-contracts)
- [ ] Verify `nx affected -t typecheck lint test:quick` passes for all projects
- [ ] Verify pre-push hook works for organiclever changes
- [ ] Run `npm run lint:md` to verify no broken markdown links

## Risk Register

| Risk                                            | Likelihood | Impact | Mitigation                                           |
| ----------------------------------------------- | ---------- | ------ | ---------------------------------------------------- |
| Effect TS learning curve                        | Medium     | Low    | Minimal scope (one service) reduces complexity       |
| OpenAPI codegen F# compatibility                | Medium     | High   | Proven by demo-be-fsharp-giraffe                     |
| Stale references after rename                   | High       | Medium | AC-6 grep verification catches all references        |
| Production branch rename breaks deployment      | Medium     | High   | Create new branch, update Vercel, verify before deleting old |
| 28+ documentation files to update               | Low        | Medium | Systematic find-and-replace with verification        |
