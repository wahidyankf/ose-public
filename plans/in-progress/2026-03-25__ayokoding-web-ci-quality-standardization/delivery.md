# Delivery Plan: ayokoding-web CI and Quality Gate Standardization

## Overview

**Delivery Type**: Direct commits to `main` (small, independent changes)

**Git Workflow**: Trunk Based Development — each phase is one commit

**Phase Independence**: Phases 1–3 (CI and documentation fixes, Goals 1–4) are independently committable. Phases 4–7 (repository pattern refactor, Goals 5–6) form a cohesive unit. Phases 8–12 (linting, FE unit tests, unit purity, E2E Gherkin) are independently committable but Phase 9 (unit test purity) should follow Phases 4–7 since it moves a file to the integration project created in Phase 7. Phase 13 (Verify and Validate) applies to whichever set of phases was most recently completed.

## Implementation Phases

### Phase 1: Fix Documentation Drift in nx-targets.md

**Goal**: Correct the stale `platform:hugo` tag for ayokoding-web in the governance doc

**Implementation Steps**:

- [x] Open `governance/development/infra/nx-targets.md`
- [x] In the Current Project Tags table, update ayokoding-web row from `["type:app", "platform:hugo", "domain:ayokoding"]` to `["type:app", "platform:nextjs", "lang:ts", "domain:ayokoding"]`
- [x] Verify no other references to ayokoding-web as a Hugo site in nx-targets.md
- [x] Commit: `docs(nx-targets): fix stale ayokoding-web tag — platform:nextjs not hugo`

### Phase 2: Add Gherkin Spec Inputs to test:quick

**Goal**: Ensure test:quick cache invalidates when BDD specs change

**Implementation Steps**:

- [x] Open `apps/ayokoding-web/project.json`
- [x] Add `"inputs": ["default", "{workspaceRoot}/specs/apps/ayokoding-web/**/*.feature"]` to the `test:quick` target
- [x] Run `nx run ayokoding-web:test:quick` locally to verify it still passes
  - Note: `test:integration` will fail at this stage — the `integration` vitest project config is not added until Phase 7. Only `test:quick` is required to pass here.
- [x] Commit: `fix(ayokoding-web): add Gherkin spec inputs to test:quick cache`

### Phase 3: Add test:integration to Scheduled CI

**Goal**: Run integration tests in the scheduled workflow so all three test levels execute in CI

**Implementation Steps**:

- [x] Open `.github/workflows/test-and-deploy-ayokoding-web.yml`
- [x] Add a new `integration` job that runs `npx nx run ayokoding-web:test:integration`
- [x] Model the job setup (checkout, Volta, Node, npm ci) after the existing `unit` job
- [x] Update the `deploy` job's `needs` array to include `integration`
- [x] Update the `deploy` job's `if:` condition to include `&& needs.integration.result == 'success'` alongside the existing `needs.unit.result == 'success'` and `needs.e2e.result == 'success'` checks
- [x] Verify the `integration` job has no explicit `if:` condition (like the `unit` job — both run unconditionally on any scheduled or manual trigger, not via an explicit `if:` guard)
- [x] Commit: `ci(ayokoding-web): add test:integration to scheduled workflow`

### Phase 4: Introduce ContentRepository Interface and Implementations

**Goal**: Define the data access contract and provide two implementations

**Implementation Steps**:

- [x] Create `src/server/content/repository.ts` with `ContentRepository` interface:
  - `readAllContent(): Promise<ContentMeta[]>`
  - `readFileContent(filePath: string): Promise<{ content: string; frontmatter: Record<string, unknown> }>`
- [x] Create `src/server/content/repository-fs.ts` — `FileSystemContentRepository` wrapping current `reader.ts` functions
- [x] Create `src/server/content/repository-memory.ts` — `InMemoryContentRepository` with Maps for fixture data
- [x] Run `nx run ayokoding-web:typecheck` to confirm both implementations satisfy the `ContentRepository` interface
- [x] Commit: `feat(ayokoding-web): add ContentRepository interface with fs and in-memory implementations`

### Phase 5: Refactor Content Service Layer

**Goal**: Extract business logic into `ContentService` that accepts `ContentRepository` via constructor

**Implementation Steps**:

- [x] Create `src/server/content/service.ts` — `ContentService` class:
  - Constructor takes `ContentRepository`
  - Moves index building logic from `index.ts` (`buildContentIndex`, `buildTrees`, `computePrevNext`)
  - Moves search logic from `search-index.ts` (`buildSearchIndex`, `searchContent`)
  - Exposes: `getBySlug()`, `listChildren()`, `getTree()`, `search()`, `getIndex()`
  - Calls `parseMarkdown()` internally for `getBySlug()`
- [x] Update `src/server/trpc/init.ts`:
  - [x] Change `initTRPC.create(...)` to `initTRPC.context<{ contentService: ContentService }>().create(...)`
  - [x] Instantiate `ContentService` with `FileSystemContentRepository` above the `initTRPC` call
  - [x] Export `createTRPCContext` returning `{ contentService }`
- [x] Update the tRPC route handler adapter (`src/app/api/trpc/[trpc]/route.ts`) to call `createTRPCContext` and pass it to the fetch handler
- [x] Update the server-side tRPC caller (`src/lib/trpc/server.ts`) to pass a real `ContentService` context when creating the caller
- [x] Refactor `src/server/trpc/procedures/content.ts` — delegate to `ctx.contentService` instead of importing module functions
- [x] Refactor `src/server/trpc/procedures/search.ts` — delegate to `ctx.contentService`
- [x] Update `src/app/sitemap.ts`, `src/app/feed.xml/route.ts`, `generateStaticParams` — use shared `ContentService` singleton
- [x] Run `nx run ayokoding-web:typecheck` to confirm all consumers compile before removing source files
- [x] Remove `src/server/content/index.ts` (logic moved to `service.ts`)
- [x] Remove `src/server/content/search-index.ts` (logic moved to `service.ts`)
- [x] Run `nx run ayokoding-web:typecheck` to verify no broken imports after deletions
- [x] Commit: `refactor(ayokoding-web): extract ContentService with repository injection`

### Phase 6: Refactor Unit Tests to Use InMemoryContentRepository

**Goal**: Replace `vi.mock()` approach with in-memory repository, consuming same Gherkin specs

**Implementation Steps**:

- [x] Create `test/unit/be-steps/helpers/test-service.ts` — instantiate `ContentService` with `InMemoryContentRepository` populated with fixture data
- [x] Substantially rewrite `test/unit/be-steps/helpers/test-caller.ts`:
  - [x] Replace the empty `createCaller({})` context with `createCaller({ contentService: new ContentService(new InMemoryContentRepository(populateFixtureData())) })`
  - [x] Delete the entire `vi.hoisted()` block and all four `vi.mock()` calls (`@/server/content/index`, `@/server/content/reader`, `@/server/content/parser`, `@/server/content/search-index`)
  - [x] Convert the existing `mock-content.ts` fixture data file into the `InMemoryContentRepository` fixture population function rather than deleting it
- [x] Run `nx run ayokoding-web:typecheck` to confirm `test-caller.ts` compiles with the new context shape before running tests
- [x] Verify all 5 existing step files still pass: `content-api`, `search-api`, `navigation-api`, `i18n-api`, `health-check`
- [x] Update `vitest.config.ts` coverage exclusions — remove `index.ts` and `search-index.ts`, keep `reader.ts`, `repository-fs.ts`, `parser.ts`, `types.ts`
- [x] Run `nx run ayokoding-web:test:quick` to verify coverage threshold still passes
- [x] Commit: `refactor(ayokoding-web): unit tests use InMemoryContentRepository instead of vi.mock`

### Phase 7: Add Integration Tests with FileSystemContentRepository

**Goal**: Add integration test suite that uses real filesystem, consuming same Gherkin specs

**Implementation Steps**:

- [x] Add `integration` vitest project to `vitest.config.ts`:
  - `include: ["test/integration/be-steps/**/*.steps.ts"]`
  - `environment: "node"`
- [x] Create `test/integration/be-steps/helpers/test-service.ts` — instantiate `ContentService` with `FileSystemContentRepository` pointing at real `content/` directory
- [x] Create `test/integration/be-steps/helpers/test-caller.ts` — tRPC caller backed by real filesystem service
- [x] Create integration step files consuming the same Gherkin specs — assertions verify structural properties (non-empty results, valid HTML, correct ordering) not specific content:
  - [x] `test/integration/be-steps/health-check.steps.ts` → `specs/apps/ayokoding-web/be/gherkin/health/health-check.feature`
  - [x] `test/integration/be-steps/content-api.steps.ts` → `specs/apps/ayokoding-web/be/gherkin/content-api/content-api.feature`
  - [x] `test/integration/be-steps/search-api.steps.ts` → `specs/apps/ayokoding-web/be/gherkin/search-api/search-api.feature`
  - [x] `test/integration/be-steps/navigation-api.steps.ts` → `specs/apps/ayokoding-web/be/gherkin/navigation-api/navigation-api.feature`
  - [x] `test/integration/be-steps/i18n-api.steps.ts` → `specs/apps/ayokoding-web/be/gherkin/i18n/i18n-api.feature`
- [x] Add Gherkin spec inputs to `test:integration` in `project.json`: `"inputs": ["default", "{workspaceRoot}/specs/apps/ayokoding-web/**/*.feature"]` (even though `cache: false`, this documents the dependency for consistency with `test:unit` and `test:quick`)
- [x] Verify `nx run ayokoding-web:test:integration` passes
- [x] Commit: `feat(ayokoding-web): add integration tests with FileSystemContentRepository`

### Phase 8: Add Oxlint Config for Unused Code Errors

**Goal**: Treat unused vars, imports, and dead code as linting errors with full plugin and category configuration

**Implementation Steps**:

- [x] Create `apps/ayokoding-web/oxlint.json` with:
  - `$schema`: `"./node_modules/oxlint/configuration_schema.json"`
  - Plugins: `["typescript", "react", "nextjs", "import", "unicorn", "jsx-a11y", "vitest"]`
  - Categories: `{ "correctness": "error", "suspicious": "warn" }`
  - Rules: `{ "no-unused-vars": "error", "no-console": "error", "eqeqeq": "error" }`
  - Settings: `{ "next": { "rootDir": "." }, "react": { "version": "detect" } }`
  - Env: `{ "browser": true, "node": true, "es2022": true }`
  - IgnorePatterns: `[".next/", "coverage/", "node_modules/", "content/"]`
- [x] Create slimmer `apps/ayokoding-web-be-e2e/oxlint.json` and `apps/ayokoding-web-fe-e2e/oxlint.json` with: `typescript`, `import`, `unicorn` plugins only (no react/nextjs/jsx-a11y — these are Playwright test projects)
- [x] Run `nx run ayokoding-web:lint` and fix any existing violations surfaced by the new error-level rules and plugin categories
- [x] Run `nx run ayokoding-web-be-e2e:lint` and `nx run ayokoding-web-fe-e2e:lint` and fix any violations
- [x] Verify TypeScript strict mode is already enabled (`strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true` in tsconfig.json)
- [x] Commit: `feat(ayokoding-web): add oxlint config with plugins, categories, and strict rules`

### Phase 9: Enforce Unit Test Purity — Move Integration-Level Test

**Prerequisite**: Phase 7 must be complete (the `integration` vitest project must exist in `vitest.config.ts`). Step 3 below updates the `integration` project's include pattern — this will fail if Phase 7 has not been executed.

**Goal**: Ensure all unit tests are mock-only by relocating real-I/O tests to integration project

**Implementation Steps**:

- [x] Move `test/unit/be-steps/integration-content.unit.test.ts` to `test/integration/be-steps/integration-content.integration.test.ts`
- [x] Rename from `.unit.test.ts` to `.integration.test.ts`
- [x] Update the `integration` vitest project include pattern to also match `**/*.integration.{test,spec}.{ts,tsx}` alongside `test/integration/be-steps/**/*.steps.ts`
- [x] Verify `nx run ayokoding-web:test:unit` no longer runs the moved test
- [x] Verify `nx run ayokoding-web:test:integration` runs it successfully
- [x] Commit: `refactor(ayokoding-web): move integration-content test from unit to integration project`

### Phase 10: Create FE Unit Step Files for All FE Gherkin Specs

**Goal**: Populate the empty `unit-fe` vitest project with step files consuming all 6 FE Gherkin specs

**Implementation Steps**:

- [x] Create `test/unit/fe-steps/helpers/test-setup.ts` — jsdom setup, mock tRPC client, mock router, render helpers
- [x] Create step files for all 6 FE features using `@amiceli/vitest-cucumber`:
  - [x] `test/unit/fe-steps/content-rendering.steps.tsx` → `specs/apps/ayokoding-web/fe/gherkin/content-rendering.feature`
  - [x] `test/unit/fe-steps/navigation.steps.tsx` → `specs/apps/ayokoding-web/fe/gherkin/navigation.feature`
  - [x] `test/unit/fe-steps/search.steps.tsx` → `specs/apps/ayokoding-web/fe/gherkin/search.feature`
  - [x] `test/unit/fe-steps/responsive.steps.tsx` → `specs/apps/ayokoding-web/fe/gherkin/responsive.feature`
  - [x] `test/unit/fe-steps/i18n.steps.tsx` → `specs/apps/ayokoding-web/fe/gherkin/i18n.feature`
  - [x] `test/unit/fe-steps/accessibility.steps.tsx` → `specs/apps/ayokoding-web/fe/gherkin/accessibility.feature`
- [x] All step files must use mocks only — mocked tRPC responses, mocked router, `@testing-library/react` for rendering
- [x] Run `nx run ayokoding-web:test:unit` and verify all 6 FE step files execute
- [x] Run `nx run ayokoding-web:test:quick` to verify coverage threshold still passes
- [ ] Commit: `feat(ayokoding-web): add FE unit step files consuming all FE Gherkin specs`

### Phase 11: Convert BE E2E Tests to Consume Gherkin Specs via playwright-bdd

**Goal**: Replace plain Playwright spec files with Gherkin-driven tests in `ayokoding-web-be-e2e`

**Implementation Steps**:

- [ ] Install `playwright-bdd` in `apps/ayokoding-web-be-e2e`: `npm install -D playwright-bdd`
- [ ] Update `playwright.config.ts` to use `defineBddConfig` with feature file paths pointing to `../../specs/apps/ayokoding-web/be/gherkin/`
- [ ] Create step files in `src/steps/` for all 5 BE features:
  - [ ] `health-check.steps.ts` → `health/health-check.feature`
  - [ ] `content-api.steps.ts` → `content-api/content-api.feature`
  - [ ] `search-api.steps.ts` → `search-api/search-api.feature`
  - [ ] `navigation-api.steps.ts` → `navigation-api/navigation-api.feature` (NEW — was missing)
  - [ ] `i18n-api.steps.ts` → `i18n/i18n-api.feature`
- [ ] Remove old plain Playwright spec files from `src/tests/`
- [ ] Update `apps/ayokoding-web-be-e2e/project.json` — add Gherkin spec inputs: `"inputs": ["default", "{workspaceRoot}/specs/apps/ayokoding-web/be/gherkin/**/*.feature"]`
- [ ] Add `.features-gen/` to `.gitignore`
- [ ] Verify `nx run ayokoding-web-be-e2e:test:e2e` passes against running server
- [ ] Commit: `feat(ayokoding-web-be-e2e): convert to playwright-bdd consuming BE Gherkin specs`

### Phase 12: Convert FE E2E Tests to Consume Gherkin Specs via playwright-bdd

**Goal**: Replace plain Playwright spec files with Gherkin-driven tests in `ayokoding-web-fe-e2e`

**Implementation Steps**:

- [ ] Install `playwright-bdd` in `apps/ayokoding-web-fe-e2e`: `npm install -D playwright-bdd`
- [ ] Update `playwright.config.ts` to use `defineBddConfig` with feature file paths pointing to `../../specs/apps/ayokoding-web/fe/gherkin/`
- [ ] Create step files in `src/steps/` for all 6 FE features:
  - [ ] `content-rendering.steps.ts` → `content-rendering.feature`
  - [ ] `navigation.steps.ts` → `navigation.feature`
  - [ ] `search.steps.ts` → `search.feature`
  - [ ] `responsive.steps.ts` → `responsive.feature`
  - [ ] `i18n.steps.ts` → `i18n.feature`
  - [ ] `accessibility.steps.ts` → `accessibility.feature`
- [ ] Remove old plain Playwright spec files from `src/tests/`
- [ ] Update `apps/ayokoding-web-fe-e2e/project.json` — add Gherkin spec inputs: `"inputs": ["default", "{workspaceRoot}/specs/apps/ayokoding-web/fe/gherkin/**/*.feature"]`
- [ ] Add `.features-gen/` to `.gitignore`
- [ ] Verify `nx run ayokoding-web-fe-e2e:test:e2e` passes against running server
- [ ] Commit: `feat(ayokoding-web-fe-e2e): convert to playwright-bdd consuming FE Gherkin specs`

### Phase 13: Verify and Validate

**Goal**: Confirm all changes work together

**Implementation Steps**:

- [ ] Run `nx run ayokoding-web:test:quick` and confirm it passes
- [ ] Run `nx run ayokoding-web:test:integration` and confirm it passes
- [ ] Run `nx affected -t typecheck lint test:quick` and confirm pre-push gate passes
- [ ] Verify `nx-targets.md` renders correctly and the tag table is accurate
- [ ] Verify oxlint config catches unused vars/imports as errors
- [ ] Verify all BE Gherkin specs consumed at 3 levels (unit, integration, E2E)
- [ ] Verify all FE Gherkin specs consumed at 2 levels (unit, E2E)
- [ ] Verify no unit test performs real filesystem I/O
- [ ] Push to `main` and verify pre-push hook succeeds

## Validation Checklist

- [ ] `nx-targets.md` tag table matches `apps/ayokoding-web/project.json` tags
- [ ] `test:quick` target has explicit Gherkin spec cache inputs
- [ ] Scheduled CI workflow has unit, integration, and e2e jobs
- [ ] Deploy job depends on all three test jobs passing (both `needs` array and `if:` condition)
- [ ] `ContentRepository` interface exists with `InMemoryContentRepository` and `FileSystemContentRepository` implementations
- [ ] `ContentService` encapsulates all business logic and is the sole entry point for content access
- [ ] BE unit tests use `InMemoryContentRepository` — no `vi.mock()` on content modules
- [ ] Integration tests use `FileSystemContentRepository` against real `content/` directory — no HTTP calls
- [ ] Both BE unit and integration tests consume all 5 BE Gherkin specs
- [ ] Coverage exclusions updated in `vitest.config.ts` — confirm `service.ts` is NOT in the exclusion list and `repository-fs.ts` IS in the exclusion list; run `nx run ayokoding-web:test:quick` to confirm the 80% threshold passes
- [ ] `oxlint.json` exists in ayokoding-web, ayokoding-web-be-e2e, and ayokoding-web-fe-e2e with `no-unused-vars: error`
- [ ] TypeScript strict mode verified: `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`
- [ ] No unit test performs real filesystem I/O — `integration-content.unit.test.ts` moved to integration project
- [ ] FE unit step files exist for all 6 FE Gherkin specs with mock-only dependencies
- [ ] `ayokoding-web-be-e2e` consumes all 5 BE Gherkin specs via `playwright-bdd` (including navigation-api)
- [ ] `ayokoding-web-fe-e2e` consumes all 6 FE Gherkin specs via `playwright-bdd`
- [ ] Both E2E projects declare Gherkin spec inputs in `project.json`
- [ ] All local quality gates pass (`nx affected -t typecheck lint test:quick`)

## Success Metrics

| Metric                           | Before                                        | After                                                           |
| -------------------------------- | --------------------------------------------- | --------------------------------------------------------------- |
| Documentation accuracy (tags)    | Stale `platform:hugo`                         | Correct `platform:nextjs`                                       |
| PR quality gate step clarity     | Steps already well-named (no change needed)   | Steps verified clear — no action taken                          |
| test:quick cache correctness     | Missing Gherkin spec inputs                   | Includes spec inputs                                            |
| CI test level coverage           | 2 of 3 levels (unit, e2e)                     | 3 of 3 levels (unit, integration, e2e)                          |
| Content layer testability        | `vi.mock()` on 4 modules, 0% service coverage | Repository pattern, service logic covered by unit tests         |
| Test architecture alignment      | Diverges from demo-be pattern                 | Matches demo-be pattern (interface + two implementations + BDD) |
| BE spec consumption completeness | Unit: 5/5, Integration: 0/5, E2E: 4/5         | Unit: 5/5, Integration: 5/5, E2E: 5/5                           |
| FE spec consumption completeness | Unit: 0/6, E2E: 0/6 (specs exist, unconsumed) | Unit: 6/6, E2E: 6/6                                             |
| Unit test purity                 | 1 test reads real filesystem                  | All unit tests mock-only                                        |
| Unused code enforcement          | Oxlint bare defaults (warnings only)          | `no-unused-vars: error` + TypeScript strict mode                |
| Pre-push gate                    | Passing                                       | Passing (no regression)                                         |
