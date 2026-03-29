# Delivery Checklist

## Phase 1: Directory Restructuring

- [x] Create `specs/apps/demo/` directory
- [x] `git mv` BE gherkin specs: `specs/apps/demo-be/gherkin/` → `specs/apps/demo/be/gherkin/`
- [x] `git mv` BE .gitignore if present
- [x] `git mv` FE gherkin specs: `specs/apps/demo-fe/gherkin/` → `specs/apps/demo/fe/gherkin/`
- [x] Remove old `specs/apps/demo-be/` directory (after extracting gherkin)
- [x] Remove old `specs/apps/demo-fe/` directory (after extracting gherkin)
- [x] Verify new directory structure matches target layout

## Phase 2: C4 Diagram Merge

- [x] Write unified `specs/apps/demo/c4/context.md` (L1 — combined system context)
- [x] Write unified `specs/apps/demo/c4/container.md` (L2 — all containers in one diagram)
- [x] Adapt `specs/apps/demo/c4/component-be.md` (L3 — from old demo-be component.md)
- [x] Adapt `specs/apps/demo/c4/component-fe.md` (L3 — from old demo-fe component.md)
- [x] Write `specs/apps/demo/c4/README.md` (index with 4 diagrams)

## Phase 3: README Files

- [x] Write `specs/apps/demo/README.md` (unified overview, links to be/, fe/, c4/)
- [x] Write `specs/apps/demo/be/README.md` (adapted from old demo-be/README.md)
- [x] Write `specs/apps/demo/fe/README.md` (adapted from old demo-fe/README.md)
- [x] Verify `specs/apps/demo/be/gherkin/README.md` exists and links are correct
- [x] Verify `specs/apps/demo/fe/gherkin/README.md` exists and links are correct
- [x] Update internal cross-references in all README files

## Phase 4: Specs Validation Gate (OCD Mode)

Run the [specs-validation workflow](../../../governance/workflows/specs/specs-validation.md) in
**OCD mode** on the newly merged `specs/apps/demo/` to catch all issues before propagating paths
to 11 backends. This is the quality gate — fix everything in the specs themselves before touching
any application code.

- [x] Run specs-validation workflow: `folders: [specs/apps/demo], mode: ocd`
- [x] All 7 validation categories pass at ZERO findings:
  - [x] Structural Completeness — every directory has README.md
  - [x] Feature File Inventory — README counts match actual .feature files and scenarios
  - [x] Gherkin Format Compliance — headers, user stories, Background steps, naming
  - [x] Cross-Spec Consistency — `be/` and `fe/` shared domains align (auth, expenses, etc.)
  - [x] C4 Diagram Consistency — accessible colors, actor coherence across L1/L2/L3
  - [x] Cross-Reference Integrity — all markdown links resolve
  - [x] Spec-to-Implementation Alignment — README references point to real implementations
- [x] Commit specs fixes (if any) before proceeding to path rewiring

**Why before Phase 5**: If we rewire 107+ files to point at broken specs, we'd have to fix specs
AND re-validate all 11 backends. Fixing specs in isolation (before rewiring) keeps the blast
radius contained to `specs/apps/demo/` only.

## Phase 5: Backend Path Updates (HIGH priority)

### Project Configuration (11 files)

- [x] `apps/demo-be-java-springboot/project.json`
- [x] `apps/demo-be-java-vertx/project.json`
- [x] `apps/demo-be-kotlin-ktor/project.json`
- [x] `apps/demo-be-golang-gin/project.json`
- [x] `apps/demo-be-python-fastapi/project.json`
- [x] `apps/demo-be-rust-axum/project.json`
- [x] `apps/demo-be-ts-effect/project.json`
- [x] `apps/demo-be-fsharp-giraffe/project.json`
- [x] `apps/demo-be-elixir-phoenix/project.json`
- [x] `apps/demo-be-csharp-aspnetcore/project.json`
- [x] `apps/demo-be-clojure-pedestal/project.json`

### Build Configuration (3 files)

- [x] `apps/demo-be-java-springboot/pom.xml`
- [x] `apps/demo-be-java-vertx/pom.xml`
- [x] `apps/demo-be-kotlin-ktor/build.gradle.kts`

### Test Runner Configuration (~12 files)

- [x] `apps/demo-be-golang-gin/internal/bdd/suite_test.go`
- [x] `apps/demo-be-golang-gin/internal/integration/suite_test.go`
- [x] `apps/demo-be-golang-gin/internal/integration_pg/suite_test.go`
- [x] `apps/demo-be-python-fastapi/tests/unit/conftest.py`
- [x] `apps/demo-be-python-fastapi/tests/integration/conftest.py`
- [x] `apps/demo-be-rust-axum/tests/unit/main.rs`
- [x] `apps/demo-be-rust-axum/tests/integration/main.rs`
- [x] `apps/demo-be-ts-effect/.cucumber.js`
- [x] `apps/demo-be-ts-effect/cucumber.js`
- [x] `apps/demo-be-ts-effect/cucumber.unit.js`
- [x] `apps/demo-be-elixir-phoenix/config/test.exs`
- [x] `apps/demo-be-elixir-phoenix/config/integration.exs`

### Docker Configuration (~16 files)

- [x] `apps/demo-be-fsharp-giraffe/Dockerfile.integration`
- [x] `apps/demo-be-csharp-aspnetcore/Dockerfile.integration`
- [x] `apps/demo-be-kotlin-ktor/Dockerfile.integration`
- [x] `apps/demo-be-ts-effect/Dockerfile.integration`
- [x] `apps/demo-be-clojure-pedestal/Dockerfile.integration`
- [x] `apps/demo-be-python-fastapi/docker-compose.integration.yml`
- [x] `infra/dev/demo-be-java-springboot/docker-compose.yml`
- [x] `infra/dev/demo-be-java-vertx/docker-compose.yml`
- [x] `infra/dev/demo-be-kotlin-ktor/docker-compose.yml`
- [x] `infra/dev/demo-be-golang-gin/docker-compose.yml`
- [x] `infra/dev/demo-be-python-fastapi/docker-compose.yml`
- [x] `infra/dev/demo-be-fsharp-giraffe/docker-compose.yml`
- [x] `infra/dev/demo-be-elixir-phoenix/docker-compose.yml`
- [x] `infra/dev/demo-be-clojure-pedestal/docker-compose.yml`
- [x] `infra/dev/demo-be-rust-axum/docker-compose.yml`
- [x] `infra/dev/demo-be-csharp-aspnetcore/docker-compose.yml`

### E2E Test Suite

- [x] `apps/demo-be-e2e/playwright.config.ts`

## Phase 6: Documentation Updates (LOW priority)

- [x] `CLAUDE.md` — update specs path references
- [x] `apps/demo-be-java-springboot/README.md`
- [x] `apps/demo-be-java-vertx/README.md`
- [x] `apps/demo-be-golang-gin/README.md`
- [x] `apps/demo-be-python-fastapi/README.md`
- [x] `apps/demo-be-elixir-phoenix/README.md`
- [x] `apps/demo-be-fsharp-giraffe/README.md`
- [x] `apps/demo-be-rust-axum/README.md`
- [x] `apps/demo-be-ts-effect/README.md`
- [x] `apps/demo-be-csharp-aspnetcore/README.md`
- [x] `apps/demo-be-kotlin-ktor/README.md`
- [x] `apps/demo-be-clojure-pedestal/README.md`
- [x] `apps/demo-be-e2e/README.md`
- [x] `governance/development/infra/bdd-spec-test-mapping.md`
- [x] `governance/development/quality/three-level-testing-standard.md`
- [x] `governance/development/infra/nx-targets.md`
- [x] `docs/explanation/software-engineering/automation-testing/tools/playwright/ex-soen-aute-to-pl__bdd.md`
- [x] `governance/conventions/formatting/diagrams.md`
- [x] `governance/workflows/specs/specs-validation.md` (update example paths)
- [x] `specs/apps-labs/README.md`
- [x] `.claude/agents/specs-checker.md` (update example folder paths)
- [x] `.claude/agents/specs-maker.md` (update example target paths)
- [x] `.claude/agents/specs-fixer.md` (update example paths)
- [x] Run `npm run sync:claude-to-opencode` to sync `.opencode/agent/specs-*.md`

## Phase 7: Historical Plans (LOW priority)

- [x] Update `plans/done/` references where trivially fixable
- [x] Accept that some historical references may remain as-is

## Phase 8: Stale Reference Check

- [x] `grep -r "specs/apps/demo-be" . --include='*.json' --include='*.xml' --include='*.yml' --include='*.yaml' --include='*.ts' --include='*.js' --include='*.go' --include='*.rs' --include='*.py' --include='*.exs' --include='*.ex' --include='*.fs' --include='*.cs' --include='*.kts' --include='*.clj' --include='*.edn' --include='*.md' --exclude-dir=node_modules --exclude-dir=.nx --exclude-dir=dist --exclude-dir=target --exclude-dir=build --exclude-dir=.features-gen --exclude-dir=generated-reports` — returns nothing (except `plans/done/`)
- [x] `grep -r "specs/apps/demo-fe" . --include='*.json' --include='*.ts' --include='*.md' --include='*.yml' --include='*.yaml' --exclude-dir=node_modules --exclude-dir=.nx --exclude-dir=dist --exclude-dir=target --exclude-dir=build --exclude-dir=.features-gen --exclude-dir=generated-reports` — returns nothing (except `plans/done/`)
- [x] Verify no stale references remain outside `plans/done/` historical records

## Phase 9: Local Validation — Lint and Typecheck

- [x] `npm run lint:md` passes
- [x] `npm run format:md:check` passes
- [x] `nx affected -t lint` passes
- [x] `nx affected -t typecheck` passes

## Phase 10: Local Validation — test:quick (All 11 Backends)

- [x] `nx run demo-be-java-springboot:test:quick` passes
- [x] `nx run demo-be-java-vertx:test:quick` passes
- [x] `nx run demo-be-kotlin-ktor:test:quick` passes
- [x] `nx run demo-be-golang-gin:test:quick` passes
- [x] `nx run demo-be-python-fastapi:test:quick` passes
- [x] `nx run demo-be-rust-axum:test:quick` passes
- [x] `nx run demo-be-ts-effect:test:quick` passes
- [x] `nx run demo-be-fsharp-giraffe:test:quick` passes
- [x] `nx run demo-be-elixir-phoenix:test:quick` passes
- [x] `nx run demo-be-csharp-aspnetcore:test:quick` passes
- [x] `nx run demo-be-clojure-pedestal:test:quick` passes

## Phase 11: Local Validation — Non-Backend Projects

- [x] `nx run organiclever-fe:test:quick` passes
- [x] `nx run rhino-cli:test:quick` passes
- [x] `nx run ayokoding-cli:test:quick` passes
- [x] `nx run oseplatform-cli:test:quick` passes

## Phase 12: Push and GitHub Actions — Main CI

- [x] Commit and push to main
- [x] Main CI workflow passes (runs `test:quick` for all affected projects) — run 23061929347 SUCCESS

## Phase 13: GitHub Actions — Integration + E2E (All 11 Backends)

Trigger all 11 integration + E2E workflows manually and verify they pass:

- [x] `test-integration-e2e-demo-be-java-springboot` — SUCCESS
- [x] `test-integration-e2e-demo-be-java-vertx` — SUCCESS
- [x] `test-integration-e2e-demo-be-kotlin-ktor` — SUCCESS
- [x] `test-integration-e2e-demo-be-golang-gin` — SUCCESS
- [x] `test-integration-e2e-demo-be-python-fastapi` — SUCCESS
- [x] `test-integration-e2e-demo-be-rust-axum` — SUCCESS
- [x] `test-integration-e2e-demo-be-ts-effect` — SUCCESS
- [x] `test-integration-e2e-demo-be-fsharp-giraffe` — SUCCESS
- [x] `test-integration-e2e-demo-be-elixir-phoenix` — SUCCESS
- [x] `test-integration-e2e-demo-be-csharp-aspnetcore` — SUCCESS
- [x] `test-integration-e2e-demo-be-clojure-pedestal` — SUCCESS

## Phase 14: GitHub Actions — Other Workflows

- [x] `test-integration-e2e-organiclever-fe` — SUCCESS
- [x] `pr-validate-links` — no broken links from path changes (verified via Main CI)
- [x] `pr-format` — no formatting issues (verified via Main CI)
- [x] `pr-quality-gate` — passes (verified via Main CI)

## Phase 15: Cleanup

- [x] Move this plan to `plans/done/`
- [x] Update `plans/in-progress/README.md`
- [x] Update `plans/done/README.md`
