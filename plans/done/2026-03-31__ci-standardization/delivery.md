# Delivery Plan: CI/CD Standardization

## Phase Overview

| Phase       | Workstreams                  | Focus                                                                                | Risk   |
| ----------- | ---------------------------- | ------------------------------------------------------------------------------------ | ------ |
| **Phase 1** | W1, W2                       | Foundation: governance docs + git hooks                                              | Low    |
| **Phase 2** | W3, W4, W7                   | Core: composite actions + PR gate + Docker standards                                 | Medium |
| **Phase 3** | W5, W6, W8, W11-W13, W15-W16 | DRY-up: workflows, Gherkin, a11y, env vars, specs, CLI Docker                        | Medium |
| **Phase 4** | W9, W10, W17, W14            | Optimization: caching, spec-coverage, compliance enforcement, governance propagation | Low    |

## Phase 1: Foundation

### W1: Governance & Documentation

- [x] Create `governance/development/infra/ci-conventions.md` with sections:
  - [x] Git hooks standard (pre-commit, commit-msg, pre-push)
  - [x] Nx target naming and caching rules (reference existing nx-targets.md)
  - [x] Three-level testing definitions (universal: unit/integration/e2e boundaries)
  - [x] App-type-specific test manifestations (BE, FE, FS, CLI, content platform, library)
  - [x] Gherkin consumption matrix (which levels consume specs per app type)
  - [x] Coverage threshold rationale table (90/80/75/70 with justifications)
  - [x] Docker conventions (Dockerfile template, compose patterns, .dockerignore)
  - [x] GitHub Actions conventions (composite actions, reusable workflows, naming)
  - [x] Naming conventions (apps, workflows, Docker files, compose files, infra/dev, specs)
  - [x] Adding a new app to CI checklist
- [x] Update existing `docs/how-to/hoto__local-dev-docker.md` (file already exists):
  - [x] Prerequisites section (Docker Desktop, Docker Compose v2)
  - [x] Quick start per app category (backend, frontend, full-stack, content platform)
  - [x] Port mapping reference table
  - [x] Environment variable configuration guide
  - [x] Database seeding and migration instructions
  - [x] Hot-reload mechanism per language table
  - [x] Troubleshooting section (port conflicts, volume permissions, etc.)
- [x] Update existing `docs/how-to/hoto__add-new-a-demo-backend.md` (file already exists):
  - [x] Dockerfile creation (using template from ci-conventions.md)
  - [x] docker-compose.yml creation (dev, integration, CI overlay)
  - [x] Dockerfile.integration creation
  - [x] project.json targets (codegen, typecheck, lint, build, test:unit, test:quick, test:integration)
  - [x] Specs folder setup (gherkin/ directory under specs/apps/)
  - [x] Creating per-variant workflow file calling reusable workflows
  - [x] Adding composite action (if new language)
  - [x] Adding to PR quality gate detection
  - [x] Adding to codecov-upload.yml
  - [x] Nx tags configuration (type, platform, language, domain)
- [x] Update `governance/development/quality/three-level-testing-standard.md`:
  - [x] Align definitions with R0.2 (unit = mocked, integration = real dep + no network, e2e = full)
  - [x] Add coverage enforcement section (test:quick enforces at pre-push, PR, and CRON)
  - [x] Add coverage threshold rationale section
  - [x] Add mandatory test levels matrix (BE: unit+int+e2e, FE: unit+e2e, CLI: unit+int, etc.)
  - [x] Remove FE integration level (FE requires unit + e2e only)
  - [x] Add CI workflow mapping (which workflows run which test levels)
  - [x] Add spec-coverage validation section (planned for Phase 4)
  - [x] Add "no network in integration" constraint (no inbound HTTP, no outbound calls)
  - [x] Add Gherkin-everywhere mandate (all test levels must consume specs)
  - [x] Document "external deps optional in E2E" policy
  - [x] Add repository pattern requirement for BE (swap point for test levels)
  - [x] Add contract-driven development requirement (OpenAPI + tRPC)
- [x] Update related markdown files to reference new conventions:
  - [x] Update `CLAUDE.md` CI-related sections (coverage rules, test levels, CRON strategy):
    - [x] Add explicit entry for `a-demo-fs-ts-nextjs` with 75% threshold (fullstack tier, distinct
          from the 70% frontend tier -- currently missing from CLAUDE.md coverage section)
    - [x] Verify `apps/a-demo-fs-ts-nextjs/project.json` enforces 75% (update from 70% if needed)
  - [x] Update `governance/development/infra/nx-targets.md` (caching rules, 5-track CRON)
  - [x] Update `governance/development/quality/code.md` (hook changes, formatting additions)
  - [x] Update `governance/development/quality/markdown.md` (if hook behavior changes)
  - [x] Update `governance/development/workflow/commit-messages.md` (if commit-msg hook changes)
  - [x] Update `docs/how-to/hoto__add-new-app.md` (Docker Compose, specs folder, CI checklist)
  - [x] Update `docs/reference/re__monorepo-structure.md` (infra/dev/ structure, specs standard)
  - [x] Update `governance/conventions/structure/plans.md` (if any plan-related conventions change)
  - [x] Update `specs/README.md` (new folder standard: contracts, c4, {role}/gherkin/)
  - [x] Update `apps/README.md` (naming pattern: {service-name}-{part})
  - [x] Update relevant app-level README.md files (test level changes, Docker dev instructions)
- [x] Update README.md CI-related sections if any are outdated

**Validation**: ✅ All governance docs pass `npm run lint:md` (0 errors) and Prettier formatting
check. All internal links resolve correctly.

### W2: Git Hooks Standardization

- [x] Extend lint-staged configuration in `package.json`:
  - [x] Add `"*.{ex,exs}": "scripts/format-elixir.sh"` (move from separate pre-commit step)
  - [x] Add `"*.py": "ruff format"` (new)
  - [x] Add `"*.rs": "rustfmt"` (new)
  - [x] Add `"*.cs": "scripts/format-csharp.sh"` (new)
  - [x] Add `"*.clj": "scripts/format-clojure.sh"` (new)
  - [x] Add `"*.dart": "scripts/format-dart.sh"` (new)
  - [x] Test each new formatter with a sample staged file
  - [x] Verify `dotnet format whitespace --include` works correctly for staged file subset in monorepo
  - [x] Verify `cljfmt fix` handles monorepo paths (may need wrapper script)
- [x] Verify lint-staged wrapper script works for `mix format` in monorepo context
  - [x] mix format needs to run from the Elixir project root, not workspace root
  - [x] Create wrapper script if needed: `scripts/format-elixir.sh`
- [x] Verify lint-staged wrapper for `ruff format` handles virtualenv paths
- [x] Verify lint-staged wrapper for `rustfmt` handles workspace crate paths
- [x] Verify lint-staged wrapper for `dart format` handles Flutter project paths
- [x] Update `apps/rhino-cli/cmd/git_pre_commit.go` (note: `.husky/pre-commit` is a single-line
      delegation to `rhino-cli git pre-commit` -- all 9 steps are implemented in Go source):
  - [x] Remove step 6 (Elixir formatting) -- now handled by lint-staged
  - [x] Verify step 4 (auto-add ayokoding-web content) is still needed; document why
  - [x] Add timeout wrapper for long-running steps (30s per step, 120s total)
- [x] Test pre-commit hook end-to-end with files from each language
- [x] Test pre-push hook with Nx cache warm and cold

**Validation**: Commit files in each language and verify formatting is applied automatically.

## Phase 2: Core Infrastructure

### W3: GitHub Actions Composite Actions

- [x] Create `.github/actions/setup-node/action.yml`:
  - [x] Input: `node-version` (default: 24)
  - [x] Steps: setup-node, npm ci, Nx cache configuration
  - [x] Cache: npm cache directory
- [x] Create `.github/actions/setup-golang/action.yml`:
  - [x] Input: `go-version` (default: 1.26), `golangci-lint-version` (default: v2.10.1)
  - [x] Steps: setup-go, install golangci-lint, install oapi-codegen
  - [x] Cache: Go modules, Go build cache
- [x] Create `.github/actions/setup-jvm/action.yml`:
  - [x] Input: `java-version` (default: 21), `java-version-alt` (default: 25)
  - [x] Steps: setup-java (Temurin), configure Maven/Gradle caches
  - [x] Cache: Maven local repo, Gradle wrapper + caches
- [x] Create `.github/actions/setup-dotnet/action.yml`:
  - [x] Input: `dotnet-version` (default: 10.0)
  - [x] Steps: setup-dotnet, install Fantomas, install fsharplint
  - [x] Cache: NuGet packages
- [x] Create `.github/actions/setup-python/action.yml`:
  - [x] Input: `python-version` (default: 3.13)
  - [x] Steps: setup-python, install uv, install datamodel-code-generator
  - [x] Cache: pip/uv cache
- [x] Create `.github/actions/setup-rust/action.yml`:
  - [x] Input: `rust-version` (default: stable)
  - [x] Steps: install Rust toolchain, install cargo-llvm-cov
  - [x] Cache: Cargo registry, target directory
- [x] Create `.github/actions/setup-elixir/action.yml`:
  - [x] Input: `elixir-version` (default: 1.19), `otp-version` (default: 27)
  - [x] Steps: setup-beam, install hex + rebar
  - [x] Cache: deps, \_build
- [x] Create `.github/actions/setup-flutter/action.yml`:
  - [x] Input: `flutter-channel` (default: stable)
  - [x] Steps: setup-flutter, pub get
  - [x] Cache: pub cache
- [x] Create `.github/actions/setup-clojure/action.yml`:
  - [x] Input: `java-version` (default: 21)
  - [x] Steps: setup-java, install Clojure CLI
  - [x] Cache: Maven local repo, Clojure gitlibs
- [x] Create `.github/actions/setup-playwright/action.yml`:
  - [x] Steps: install Playwright browsers + OS dependencies
  - [x] Cache: Playwright browser binaries
- [x] Create `.github/actions/setup-docker-cache/action.yml`:
  - [x] Steps: setup Docker Buildx, configure layer cache
  - [x] Cache: `/tmp/.buildx-cache`
- [x] Test each composite action in isolation via a temporary test workflow
- [x] Verify caching works correctly (run twice, second run should be faster)

**Validation**: Each composite action runs successfully in a test workflow. Caches hit on second run.

### W4: PR Quality Gate Optimization

- [x] Create detection job that identifies affected language families:
  - [x] Use `nx show projects --affected` to get affected project list
  - [x] Extract language tags from project configurations
  - [x] Set GitHub Actions outputs for each language family
  - [x] Handle edge case: changes only to markdown/docs/governance
- [x] Create per-language quality gate jobs:
  - [x] TypeScript job: setup-node + `nx affected -t typecheck lint test:quick --exclude=tag:language:golang,...`
  - [x] Go job: setup-node + setup-golang + Go-specific affected targets
  - [x] JVM job: setup-node + setup-jvm + Java/Kotlin-specific affected targets
  - [x] .NET job: setup-node + setup-dotnet + F#/C#-specific affected targets
  - [x] Python job: setup-node + setup-python + Python-specific affected targets
  - [x] Rust job: setup-node + setup-rust + Rust-specific affected targets
  - [x] Elixir job: setup-node + setup-elixir + Elixir-specific affected targets
  - [x] Clojure job: setup-node + setup-clojure + Clojure-specific affected targets
  - [x] Dart job: setup-node + setup-flutter + Dart-specific affected targets
  - [x] Markdown job: markdownlint-cli2 (only if .md files changed)
- [x] Add `if: needs.detect.outputs.has-{lang} == 'true'` to each language job
- [x] Add contract codegen step to each job (if affected projects depend on contracts)
- [x] Configure required status checks in GitHub branch protection:
  - [x] Create a final `quality-gate` job in `pr-quality-gate.yml` that depends on all language
        jobs via `needs:` and always runs (even if some language jobs are skipped via `if:` conditions)
  - [x] Mark only `quality-gate` as the required status check in branch protection settings
        (GitHub branch protection cannot mark jobs as "required only when they run" — the gate job
        pattern works around this: if a language job is skipped, it is treated as passed by the
        gate job's `needs:` dependency)
  - [x] Verify the gate job correctly blocks merges when any language job fails
- [x] Test with PRs touching: (a) only TypeScript, (b) only Go, (c) multiple languages, (d) only docs
- [x] Compare CI times: old monolithic vs. new parallel approach
- [x] Keep old `pr-quality-gate.yml` as `pr-quality-gate.yml.bak` until new gate is validated
      (GitHub Actions does not process `.bak` extension files in `.github/workflows/` --
      this is safe to store there temporarily; delete in Post-Delivery Cleanup)

**Validation**: PR touching only TypeScript completes in < 5 minutes. Cross-language PR runs all
relevant jobs in parallel.

### W7: Docker Standardization

- [x] Audit all 11 Dockerfiles against the template from tech-docs.md:
  - [x] Verify multi-stage build pattern
  - [x] Add non-root user where missing
  - [x] Add HEALTHCHECK instruction where missing
  - [x] Add OCI LABEL metadata where missing
  - [x] Standardize health check to use `wget` (not `curl`)
  - [x] Verify dependency-manifest-first layer ordering
- [x] Audit all docker-compose.yml files against conventions:
  - [x] Dev compose: named volumes, source mounts, specs mount, healthchecks
  - [x] Integration compose: tmpfs, abort-on-container-exit, cleanup
  - [x] CI overlay: production env vars, ENABLE_TEST_API, frontend service
- [x] Fix naming exceptions:
  - [x] Merge `docker-compose.ci-e2e.yml` content into the existing `docker-compose.ci.yml` in
        `infra/dev/a-demo-be-elixir-phoenix/` (both files exist; `ci.yml` already exists so rename
        is not possible)
  - [x] Delete `docker-compose.ci-e2e.yml` after confirming the merged config passes
        `docker compose config`
  - [x] Verify Elixir CI workflow still works after the merge and deletion
- [x] Standardize all Dockerfile.integration files:
  - [x] Consistent base image versions per language
  - [x] Consistent spec mount paths (`/specs` inside container)
  - [x] Consistent exit code handling
  - [x] Document the template in ci-conventions.md
- [x] Review and standardize `.dockerignore`:
  - [x] Apply the pattern from tech-docs.md AD4.3
  - [x] Test each app's Docker build still works after changes
- [x] Validate all docker-compose files pass `docker compose config`

**Validation**: All Dockerfiles follow the template. All compose files pass config validation.
All integration tests still pass after changes.

## Phase 3: DRY-up

### W5: Backend Test Workflow DRY-up

- [x] Create `.github/workflows/_reusable-backend-integration.yml`:
  - [x] Inputs: backend-name, app-dir, compose-file
  - [x] Steps: checkout, docker compose up (integration), teardown
  - [x] Timeout: 15 minutes
- [x] Create `.github/workflows/_reusable-backend-e2e.yml`:
  - [x] Inputs: backend-name, compose-dir, health-url, health-timeout
  - [x] Steps: checkout, setup-node, setup-golang, npm ci, contracts, start stack, wait, Playwright, artifacts, teardown
  - [x] Timeout: 20 minutes
- [x] Create reusable workflows for backend test tracks:
  - [x] `.github/workflows/_reusable-backend-lint.yml` (inputs: backend-name, setup-action)
  - [x] `.github/workflows/_reusable-backend-typecheck.yml` (inputs: backend-name, setup-action)
  - [x] `.github/workflows/_reusable-backend-coverage.yml` (inputs: backend-name, setup-action)
  - [x] `.github/workflows/_reusable-backend-spec-coverage.yml` (inputs: backend-name, setup-action)
        -- **leave calls to this commented out in W5**; the `spec-coverage` Nx targets for all 11
        backends are created in W10 (Phase 4). Enable in W10 once targets exist.
- [x] Rewrite all 11 backend test workflows to call reusable workflows:
  - [x] Each file: ~40 lines calling reusable workflows with variant-specific inputs
  - [x] 4 active parallel tracks initially (Track 4 enabled in W10):
    - [x] Track 1: `lint` (calls `_reusable-backend-lint.yml`)
    - [x] Track 2: `typecheck` (calls `_reusable-backend-typecheck.yml`)
    - [x] Track 3: `test:quick` (calls `_reusable-backend-coverage.yml`)
    - [x] Track 4: `spec-coverage` (commented out until W10)
    - [x] Track 5: `integration` → `e2e` (sequential chain via `needs:`)
  - [x] Preserve: schedule (cron 2x daily), workflow_dispatch trigger
  - [x] Each backend workflow pairs with default frontend for E2E
- [x] Verify all 11 rewritten workflows produce identical results:
  - [x] Verify each backend's integration tests pass
  - [x] Verify each backend's E2E tests pass (with default FE pairing)
  - [x] Verify artifacts are uploaded per backend

**Validation**: All 11 rewritten workflows produce identical results to the originals. Each
workflow file reduced from ~150 lines to ~40 lines via reusable workflow calls.

### W6: Frontend & Fullstack Test Workflows

- [x] Create `.github/workflows/_reusable-frontend-e2e.yml`:
  - [x] Inputs: frontend-name, compose-dir, backend-compose-dir, health-urls
  - [x] Steps: checkout, setup-node, start backend + frontend, wait, Playwright, artifacts, teardown
  - [x] Timeout: 20 minutes
- [x] Rewrite all 3 frontend test workflows to call reusable workflows:
  - [x] `test-a-demo-fe-ts-nextjs.yml` (pairs with default BE: golang-gin)
  - [x] `test-a-demo-fe-ts-tanstack-start.yml` (pairs with default BE: golang-gin)
  - [x] `test-a-demo-fe-dart-flutterweb.yml` (pairs with default BE: golang-gin)
  - [x] Each file: ~30 lines calling `_reusable-frontend-e2e.yml`
  - [x] Preserve: schedule (cron 2x daily), workflow_dispatch trigger
- [x] Rewrite fullstack test workflow:
  - [x] `test-a-demo-fs-ts-nextjs.yml` (self-contained Next.js route handler app)
  - [x] ~30 lines calling `_reusable-backend-integration.yml` + `_reusable-backend-e2e.yml` with
        FS-specific inputs (no separate `_reusable-fullstack-*.yml` needed; FS app uses same
        integration + E2E pattern as backends)
- [x] Update `test-organiclever.yml` to use reusable workflows:
  - [x] Use `_reusable-backend-integration.yml` for BE integration
  - [x] Use `_reusable-backend-e2e.yml` or custom for full-stack E2E
  - [x] Keep OrganicLever-specific environment secrets handling

**Validation**: All frontend/fullstack E2E tests pass via rewritten workflows. Each workflow
file reduced from ~100+ lines to ~30 lines via reusable workflow calls.

### W8: Local Development with Docker

- [x] Add unified `dev:*` scripts to root `package.json`:
  - [x] `dev:a-demo-be-golang-gin` (and all 10 other backends)
  - [x] `dev:a-demo-fe-ts-nextjs` (and other frontends)
  - [x] `dev:a-demo-fs-ts-nextjs` (fullstack)
  - [x] `dev:organiclever` (full stack: BE + FE + DB)
  - [x] `dev:ayokoding-web`
  - [x] `dev:oseplatform-web`
- [x] Verify hot-reload works for each dev setup:
  - [x] Go: file change triggers recompilation via air/go run
  - [x] Java (Spring Boot): Spring DevTools reloads on class change
  - [x] Java (Vert.x): Vert.x launcher redeploys on change
  - [x] TypeScript (Effect): tsx watch restarts on change
  - [x] Python: uvicorn --reload picks up file changes
  - [x] Rust: cargo watch rebuilds on change
  - [x] Kotlin: Gradle continuous build restarts on change
  - [x] F#: dotnet watch rebuilds on change
  - [x] C#: dotnet watch rebuilds on change
  - [x] Elixir: Phoenix code reloader handles changes
  - [x] Clojure: nREPL + tools.namespace refreshes namespaces
- [x] Verify database seeding/migration for each backend:
  - [x] Go: auto-migration via GORM
  - [x] Java: Flyway/Liquibase migrations
  - [x] TypeScript: Drizzle migrations
  - [x] Python: Alembic migrations
  - [x] Others: language-specific migration tools
- [x] Verify `.env.example` exists for each dev setup (creation handled by W16)
- [x] Finalize `docs/how-to/hoto__local-dev-docker.md` with tested instructions

**Validation**: Developer can run `npm run dev:{any-app}` and the service health check passes,
confirming the environment is running and hot-reload is active.

### W11: Gherkin Consumption Remediation

FE, content platform, and OrganicLever FE unit tests currently do NOT consume Gherkin specs.
This must be fixed so all test levels verify behavioral specs.

- [x] **Spike: Select FE BDD runner for Vitest-based unit tests** (prerequisite for all steps below)
  - [x] Research available options: `vitest-cucumber`, `playwright-bdd` (repurposed), or other
  - [x] Selection criteria -- chosen tool MUST:
    - (a) integrate with Vitest without requiring test runner replacement
    - (b) support Given-When-Then step definitions in TypeScript
    - (c) not require a browser environment (JSDOM/happy-dom only is sufficient)
    - (d) support `--coverage` output compatible with `rhino-cli test-coverage validate`
  - [x] Document selected tool and rationale as AD10 in tech-docs.md
  - [x] If no tool satisfies all criteria, document the constraint and propose alternative
        (e.g., custom Gherkin parser, or defer Gherkin-at-unit-level for FE apps)
  - [x] **If deferral is selected**: document as a known gap in
        `governance/development/quality/three-level-testing-standard.md` under a "Known Gaps"
        section. Skip the remaining W11 steps below. The spec-coverage W10 target for FE projects
        should still be added (using whatever step definitions exist). Owner: plan executor. No
        additional approval needed for deferral -- this is a pragmatic decision based on tool
        availability.
- [x] Add Gherkin BDD runner to FE unit test setup (after spike resolves tool selection):
  - [x] Configure FE unit tests to consume `specs/apps/a-demo/fe/gherkin/*.feature`
  - [x] Implement step definitions for FE unit specs (MSW + JSDOM)
- [x] Add Gherkin consumption to demo frontend unit tests:
  - [x] `a-demo-fe-ts-nextjs`: wire vitest to consume FE Gherkin specs
  - [x] `a-demo-fe-ts-tanstack-start`: wire vitest to consume FE Gherkin specs
  - [x] `a-demo-fe-dart-flutterweb`: wire Flutter test to consume FE Gherkin specs
- [x] Add Gherkin consumption to content platform unit tests:
  - [x] `ayokoding-web`: wire vitest to consume `specs/apps/ayokoding/{be,fe}/gherkin/*.feature`
  - [x] `oseplatform-web`: wire vitest to consume `specs/apps/oseplatform/{be,fe}/gherkin/*.feature`
- [x] Add Gherkin consumption to OrganicLever FE unit tests:
  - [x] `organiclever-fe`: wire vitest to consume `specs/apps/organiclever/fe/gherkin/*.feature`
- [x] Remove redundant FE `test:integration` targets:
  - [x] Remove from `a-demo-fe-ts-nextjs/project.json`
  - [x] Remove from `a-demo-fe-ts-tanstack-start/project.json`
  - [x] Remove from `a-demo-fe-dart-flutterweb/project.json`
  - [x] Remove from `organiclever-fe/project.json`
  - [x] Update nx.json if FE integration targets have special caching rules
- [x] Verify all unit test suites now consume Gherkin specs:
  - [x] Run `rhino-cli spec-coverage validate` for each project
  - [x] Confirm spec-to-test mapping is complete

**Validation**: Every project's unit tests consume Gherkin specs. No test level exists without
Gherkin consumption. FE `test:integration` targets are removed.

### W12: Specs Folder Restructuring

Align specs folder structure with the standard defined in R0.2.

- [x] Restructure CLI specs to use `cli/gherkin/` pattern:
  - [x] Check for filename collisions before merging rhino-cli domain directories:
    - [x] Run `ls specs/apps/rhino-cli/*/` to inventory all feature file names across the 9 domains
    - [x] Confirm no two domains contain a `.feature` file with the same name
    - [x] If collisions exist, use domain-prefix naming (e.g., `agents-validate.feature`,
          `test-coverage-validate.feature`) before proceeding
  - [x] Move `specs/apps/rhino-cli/{domain}/*.feature` to `specs/apps/rhino-cli/cli/gherkin/`
  - [x] Move `specs/apps/ayokoding-cli/links/*.feature` to `specs/apps/ayokoding-cli/cli/gherkin/`
  - [x] Move `specs/apps/oseplatform-cli/links/*.feature` to `specs/apps/oseplatform-cli/cli/gherkin/`
  - [x] Update all godog step definition paths in CLI project configs
  - [x] Update all `inputs` in project.json that reference old spec paths
  - [x] Update godog feature path configurations in `apps/rhino-cli/` Go source code:
    - [x] Run `grep -r 'specs/apps/rhino-cli' apps/rhino-cli/` to find all hardcoded paths
    - [x] Update each occurrence to reference the new `cli/gherkin/` path
    - [x] Run `nx run rhino-cli:test:unit` to confirm no broken spec references
  - [x] Update godog feature path configurations in `apps/ayokoding-cli/` Go source code:
    - [x] Run `grep -r 'specs/apps/ayokoding-cli' apps/ayokoding-cli/` to find all hardcoded paths
    - [x] Update each occurrence to reference the new `cli/gherkin/` path
  - [x] Update godog feature path configurations in `apps/oseplatform-cli/` Go source code:
    - [x] Run `grep -r 'specs/apps/oseplatform-cli' apps/oseplatform-cli/` to find all hardcoded paths
    - [x] Update each occurrence to reference the new `cli/gherkin/` path
  - [x] Run `nx run-many -t test:unit --projects=rhino-cli,ayokoding-cli,oseplatform-cli` after all path updates to confirm no broken spec references
- [x] Add missing spec directories:
  - [x] Create `specs/apps/a-demo/fs/gherkin/` with README.md
- [x] Add README.md to all `gherkin/` directories that lack one
- [x] Reclassify `ayokoding/build-tools/gherkin/` to fit the standard pattern
- [x] Verify all Nx cache inputs still reference correct spec paths after restructuring
- [x] Run full test suite to confirm no broken spec references

**Validation**: `find specs -name '*.feature'` shows all feature files under `{role}/gherkin/`
pattern. All tests pass after restructuring.

### W13: CLI Docker Compose Setup

Add `infra/dev/` Docker Compose for CLI apps to ensure consistent local development.

- [x] Create `infra/dev/rhino-cli/docker-compose.yml`:
  - [x] Go build environment with correct version (1.26)
  - [x] Volume mount for source code (hot-rebuild)
  - [x] Specs mounted read-only
- [x] Create `infra/dev/ayokoding-cli/docker-compose.yml`:
  - [x] Same pattern as rhino-cli
  - [x] Include golang-commons and hugo-commons lib mounts
- [x] Create `infra/dev/oseplatform-cli/docker-compose.yml`:
  - [x] Same pattern as ayokoding-cli
- [x] Create corresponding `Dockerfile.cli.dev` for each CLI:
  - [x] Based on `golang:1.26-alpine`
  - [x] Install required tools (golangci-lint, godog, etc.)
- [x] Add `dev:rhino-cli`, `dev:ayokoding-cli`, `dev:oseplatform-cli` to root package.json
- [x] Test each CLI can build and run tests inside the container

**Validation**: `npm run dev:rhino-cli` starts a containerized dev environment. `go test ./...`
works inside the container.

### W15: Accessibility Testing Remediation

Ensure all UI apps have accessibility testing at lint, unit, and E2E levels per R0.2.

- [x] Add @axe-core/playwright to E2E apps that lack it:
  - [x] `ayokoding-web-fe-e2e`: install @axe-core/playwright, add axe scan to accessibility steps
  - [x] `oseplatform-web-fe-e2e`: install @axe-core/playwright, create accessibility steps
  - [x] `a-demo-fs-ts-nextjs` E2E: add axe-core integration
- [x] Add accessibility Gherkin specs where missing:
  - [x] `specs/apps/oseplatform/fe/gherkin/accessibility.feature` (missing entirely)
  - [x] Verify all existing a11y features cover the minimum required scenarios
- [x] Add accessibility unit test step implementations where missing:
  - [x] `oseplatform-web`: create unit accessibility steps consuming Gherkin specs
  - [x] Verify all UI apps have a11y step implementations at unit level
- [x] Evaluate Flutter a11y testing for `a-demo-fe-dart-flutterweb`:
  - [x] Research Flutter Semantics-based accessibility testing
  - [x] Add `flutter test` a11y assertions or document why deferred
- [x] Standardize oxlint configuration:
  - [x] Create `oxlint.json` with `jsx-a11y` plugin for apps that use CLI flag only
  - [x] Ensure consistent rule set across all UI apps
- [x] Verify a11y lint runs in pre-push and PR quality gate:
  - [x] Confirm `lint` target includes `--jsx-a11y-plugin` for all UI apps
  - [x] Confirm `lint` is part of `test:quick` / pre-push / PR gate

**Validation**: All UI apps pass axe-core scans in E2E. All UI apps have a11y Gherkin specs
at unit and E2E levels. `npx nx run-many -t lint` passes jsx-a11y rules for all UI apps.

### W16: Environment Variable Standardization

Ensure all apps use `.env.example` + `.env.local` pattern per R0.2.

- [x] Audit all `infra/dev/` directories for `.env.example`:
  - [x] List apps that have `.env.example` vs those that don't
  - [x] Document all environment variables used in each docker-compose.yml
- [x] Create `.env.example` for each `infra/dev/` directory missing one:
  - [x] `infra/dev/a-demo-be-golang-gin/.env.example`
  - [x] `infra/dev/a-demo-be-ts-effect/.env.example`
  - [x] `infra/dev/a-demo-be-python-fastapi/.env.example`
  - [x] `infra/dev/a-demo-be-rust-axum/.env.example`
  - [x] `infra/dev/a-demo-be-kotlin-ktor/.env.example`
  - [x] `infra/dev/a-demo-be-fsharp-giraffe/.env.example`
  - [x] `infra/dev/a-demo-be-csharp-aspnetcore/.env.example`
  - [x] `infra/dev/a-demo-be-clojure-pedestal/.env.example`
  - [x] `infra/dev/a-demo-be-java-vertx/.env.example`
  - [x] `infra/dev/a-demo-fe-ts-tanstack-start/.env.example`
  - [x] `infra/dev/a-demo-fs-ts-nextjs/.env.example`
  - [x] `infra/dev/ayokoding-web/.env.example`
  - [x] `infra/dev/oseplatform-web/.env.example`
- [x] Update docker-compose.yml files to use `env_file` directive where applicable
- [x] Verify `.env*.local` is in `.gitignore` (should already be)
- [x] Audit CI workflows for hardcoded secrets:
  - [x] Replace inline credentials with `${{ secrets.* }}` or `${{ vars.* }}`
  - [x] Document which GitHub secrets need to be configured per workflow
- [x] Add `.env.example` validation to pre-commit hook:
  - [x] Check that every env var in docker-compose.yml has a matching entry in `.env.example`

**Validation**: Every `infra/dev/` directory has a `.env.example`. No hardcoded credentials
in CI workflows (except test-only defaults in docker-compose.integration.yml). `git grep`
for `GOOGLE_CLIENT_SECRET=` or similar patterns returns zero hits outside `.env.example`.

## Phase 4: Optimization

### W9: CI Docker Caching & Optimization

- [x] Integrate `setup-docker-cache` composite action into reusable workflows:
  - [x] `_reusable-backend-integration.yml`: add Docker Buildx + cache
  - [x] `_reusable-backend-e2e.yml`: add Docker Buildx + cache
  - [x] `_reusable-frontend-e2e.yml`: add Docker Buildx + cache
- [x] Configure cache keys based on Dockerfile content hash:
  - [x] Key: `docker-${{ runner.os }}-${{ inputs.backend-name }}-${{ hashFiles('...Dockerfile*') }}`
  - [x] Restore keys: `docker-${{ runner.os }}-${{ inputs.backend-name }}-`
- [x] Measure CI times before and after caching:
  - [x] Record baseline times for 3 consecutive runs (no cache)
  - [x] Record cached times for 3 consecutive runs (warm cache)
  - [x] Target: 30-60% reduction for unchanged Dockerfiles
- [x] Update `codecov-upload.yml` to use composite actions:
  - [x] Replace inline language setup with composite action calls
  - [x] Verify all coverage uploads still work
- [x] Create `.github/workflows/_reusable-test-and-deploy.yml`:
  - [x] Inputs: app-name, prod-branch, health-url, health-timeout
  - [x] Jobs: unit (test:quick), integration, e2e (docker-compose + Playwright), detect-changes,
        deploy (conditional: changes detected + all tests pass → push to prod branch)
  - [x] Timeout: 30 minutes
- [x] Update `test-and-deploy-ayokoding-web.yml` to call `_reusable-test-and-deploy.yml`
- [x] Update `test-and-deploy-oseplatform-web.yml` to call `_reusable-test-and-deploy.yml`

**Validation**: Cached CI runs are measurably faster. All coverage uploads succeed.

### W10: Spec-Coverage Integration

All spec-coverage validation uses `rhino-cli spec-coverage validate`. If rhino-cli needs
enhancements to support new app types (FE unit specs, restructured CLI specs, content platform
specs), update rhino-cli first.

- [x] Verify `rhino-cli spec-coverage validate` supports all app types:
  - [x] Test with BE projects (already supported)
  - [x] Test with FE projects (may need enhancement for vitest-cucumber step detection)
  - [x] Test with CLI projects after specs restructuring (W12 -- new `cli/gherkin/` paths)
  - [x] Test with content platform projects (tRPC step definitions)
  - [x] Update rhino-cli if needed to handle new step definition patterns or paths
- [x] Add `spec-coverage` Nx target to demo backend projects:
  - [x] `a-demo-be-golang-gin/project.json`
  - [x] `a-demo-be-java-springboot/project.json`
  - [x] `a-demo-be-ts-effect/project.json`
  - [x] `a-demo-be-python-fastapi/project.json`
  - [x] `a-demo-be-rust-axum/project.json`
  - [x] `a-demo-be-kotlin-ktor/project.json`
  - [x] `a-demo-be-fsharp-giraffe/project.json`
  - [x] `a-demo-be-csharp-aspnetcore/project.json`
  - [x] `a-demo-be-clojure-pedestal/project.json`
  - [x] `a-demo-be-elixir-phoenix/project.json`
  - [x] `a-demo-be-java-vertx/project.json`
- [x] Add `spec-coverage` Nx target to frontend projects:
  - [x] `a-demo-fe-ts-nextjs/project.json`
  - [x] `a-demo-fe-ts-tanstack-start/project.json`
  - [x] `a-demo-fe-dart-flutterweb/project.json`
  - [x] `organiclever-fe/project.json`
- [x] Add `spec-coverage` Nx target to fullstack and content platform projects:
  - [x] `a-demo-fs-ts-nextjs/project.json`
  - [x] `ayokoding-web/project.json`
  - [x] `oseplatform-web/project.json`
- [x] Add `spec-coverage` Nx target to E2E projects:
  - [x] `a-demo-be-e2e/project.json`
  - [x] `a-demo-fe-e2e/project.json`
  - [x] `organiclever-be-e2e/project.json`
  - [x] `organiclever-fe-e2e/project.json`
- [x] Add `spec-coverage` Nx target to CLI projects:
  - [x] `rhino-cli/project.json`
  - [x] `ayokoding-cli/project.json`
  - [x] `oseplatform-cli/project.json`
- [x] Configure cache inputs for spec-coverage targets:
  - [x] Include: `{workspaceRoot}/specs/.../**/*.feature` + `{projectRoot}/**/*.{ext}`
  - [x] Set `cache: true` (deterministic based on specs + test files)
- [x] Add `spec-coverage` to pre-push hook:
  - [x] `npx nx affected -t typecheck lint test:quick spec-coverage --parallel="$PARALLEL"`
- [x] Add `spec-coverage` to PR quality gate detection and language jobs
- [x] Run spec-coverage validation across all projects and fix any gaps:
  - [x] Document any intentionally unimplemented scenarios with `@skip` tags
  - [x] Ensure all feature files have corresponding step definitions
- [x] Update governance documentation with spec-coverage CI integration

**Validation**: `npx nx affected -t spec-coverage` passes for all projects. Unimplemented
scenarios are tagged `@skip` with documented rationale. PR quality gate includes spec-coverage.

### W17: CI Compliance Enforcement

After CI conventions are documented (W1), create agents, skills, and workflows that
**automatically validate** all projects in the repository conform to CI standards. This is the
ongoing enforcement layer — without it, standards decay as new projects are added. W17 can run
in parallel with W14 (governance propagation) since it only depends on the conventions doc.

- [x] Create `ci-standards` inline skill (`.claude/skills/ci-standards/SKILL.md`):
  - [x] Reference CI conventions governance doc (`governance/development/infra/ci-conventions.md`)
  - [x] Include: mandatory Nx targets per app type, coverage thresholds, test level requirements,
        Docker setup requirements, pairing rules, Gherkin consumption mandate, env variable standard
  - [x] Serve `swe-*-developer` agents so they set up new projects correctly from the start
- [x] Create `ci-checker` agent (`.claude/agents/ci-checker.md`):
  - [x] Validates ALL projects against CI standards:
    - [x] Mandatory Nx targets present per app type (7 for demo, varies for others)
    - [x] Coverage thresholds configured correctly in `test:quick`
    - [x] `infra/dev/{app}/` exists with docker-compose.yml + docker-compose.ci.yml
    - [x] `.env.example` exists in every `infra/dev/` directory
    - [x] Gherkin specs exist under `specs/apps/{app}/{role}/gherkin/`
    - [x] Unit tests consume Gherkin specs (BDD runner configured)
    - [x] `spec-coverage` Nx target exists for testable projects
    - [x] Workflow file exists calling reusable workflows
    - [x] E2E pairing: BE variants paired with default FE, FE variants with default BE
    - [x] No hardcoded credentials in workflow files
  - [x] Skills: `ci-standards`, `repo-generating-validation-reports`, `repo-assessing-criticality-confidence`
  - [x] Output: audit report in `generated-reports/`
- [x] Create `ci-fixer` agent (`.claude/agents/ci-fixer.md`):
  - [x] Applies validated fixes from ci-checker audit reports
  - [x] Re-validates findings before applying (prevents false positives)
  - [x] Skills: `ci-standards`, `repo-applying-maker-checker-fixer`
- [x] Create `ci-quality-gate` workflow (`governance/workflows/ci/ci-quality-gate.md`):
  - [x] Orchestrates ci-checker → ci-fixer iteratively (same pattern as plan-quality-gate)
  - [x] Terminates on double-zero findings or max-iterations
  - [x] Scope: all projects, specific app type, or single project
- [x] Sync all new `.claude/` files to `.opencode/` via `npm run sync:claude-to-opencode`
- [x] Test ci-checker against current repository state:
  - [x] Run `ci-checker` to validate all existing projects
  - [x] Verify it catches known gaps (missing FE Gherkin, missing .env.example files)
  - [x] Verify it passes for fully compliant projects (e.g., a-demo-be-golang-gin)

**Validation**: `ci-checker` produces accurate findings for all project types (BE, FE, FS, CLI,
content platform, library). `ci-fixer` can remediate common issues. `ci-quality-gate` workflow
runs to completion with zero findings on a fully standardized project.

### W14: Governance Propagation

After all conventions are documented and implemented, run the `repo-governance-maker` agent to
propagate CI/CD rules and conventions across the governance layer. This ensures the six-layer
governance hierarchy (Vision → Principles → Conventions → Development → Agents → Workflows) is
consistent and that new CI conventions are discoverable by all agents.

- [x] Run `repo-governance-maker` to create/update governance documents:
  - [x] Propagate three-level testing definitions to relevant convention docs
  - [x] Propagate naming conventions to relevant convention docs
  - [x] Propagate caching rules and CI execution strategy
  - [x] Propagate repository pattern and contract-driven development requirements
  - [x] Propagate Docker Compose standard (all apps must have `infra/dev/`)
  - [x] Propagate Gherkin-everywhere mandate
  - [x] Propagate coverage enforcement rules (test:quick at all gates)
- [x] Run `repo-governance-checker` to validate consistency:
  - [x] Check for contradictions between new ci-conventions.md and existing docs
  - [x] Check for stale references to old workflow names in governance docs
  - [x] Check for duplication between ci-conventions.md and three-level-testing-standard.md
- [x] Run `repo-governance-fixer` to apply any fixes from checker output
- [x] Verify all agents that reference CI/testing patterns have updated skill knowledge:
  - [x] `swe-e2e-test-developer` agent references correct test level definitions
  - [x] `swe-*-developer` agents reference repository pattern requirement
  - [x] `plan-checker` agent can validate plans against new CI conventions
- [x] Run `docs-checker` on all modified governance and docs files
- [x] Run `docs-link-general-checker` to verify no broken links after updates

**Validation**: `repo-governance-checker` produces zero CRITICAL/HIGH findings related to CI
conventions. All governance docs are internally consistent. All agents reference correct
conventions.

## Post-Delivery Cleanup

- [x] Delete out-of-standards / superseded files:
  - [x] `infra/dev/a-demo-be-elixir-phoenix/docker-compose.ci-e2e.yml` (merged into ci.yml in W7)
  - [x] `.github/workflows/pr-quality-gate.yml.bak` (backup from Phase 2 refactor)
- [x] Verify no orphan references to deleted files:
  - [x] Search all `.yml` workflows for `ci-e2e` references
  - [x] Search all `project.json` files for removed `test:integration` targets in FE apps
  - [x] Run `docs-link-general-checker` to catch any broken links
- [x] Archive this plan to `plans/done/` with completion date
- [x] Update `plans/in-progress/README.md` to remove this plan
- [x] Update `plans/done/README.md` to add this plan

## Success Metrics

| Metric                                                                           | Before                                                                | Target                                                                     |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| GitHub Actions workflow files                                                    | 22                                                                    | ~30 (15 workflows rewritten + 7 updated + 8 new reusable workflows)        |
| Caller workflow YAML lines                                                       | ~4,500 (~150 lines × 22 files + 6 others)                             | ~1,500 (~40 lines × 15 BE/FE/FS callers, -67% per caller)                  |
| PR quality gate (TS-only PR)                                                     | 1 monolithic job (13+ runtimes installed)                             | 1-2 language-scoped parallel jobs                                          |
| CRON parallel tracks                                                             | 2 (integration, e2e)                                                  | 5 (lint, typecheck, test:quick, spec-coverage, int→e2e)                    |
| Adding a new backend to CI                                                       | Copy ~150 lines, make 5-10 manual substitutions                       | Create ~40-line workflow calling reusable + follow checklist               |
| Programming languages with auto-format on commit (markup/config already covered) | 4 (JS/TS, Go, F#, Elixir)                                             | 9 (+5: adds Python, Rust, C#, Clojure, Dart)                               |
| Apps with spec-coverage in CI                                                    | 0                                                                     | All testable projects                                                      |
| Projects with Gherkin at all test levels                                         | ~15 (BE + CLI only)                                                   | All testable projects                                                      |
| UI apps with @axe-core/playwright E2E                                            | 3 (organiclever-fe, a-demo-fe-ts-nextjs, a-demo-fe-ts-tanstack-start) | All UI apps                                                                |
| UI apps with a11y Gherkin specs                                                  | 3                                                                     | All UI apps                                                                |
| `infra/dev/` dirs with `.env.example`                                            | 5                                                                     | All (18+)                                                                  |
| Apps with `infra/dev/` Docker Compose                                            | 18                                                                    | 21 (+3 CLIs)                                                               |
| Redundant FE `test:integration` targets                                          | 5                                                                     | 0 (removed)                                                                |
| CI Docker cache hit rate                                                         | 0%                                                                    | 80%+                                                                       |
| Governance docs covering CI                                                      | 0                                                                     | 3 new docs                                                                 |
| CI compliance enforcement (agents + workflow)                                    | 0                                                                     | ci-checker + ci-fixer agents, ci-quality-gate workflow, ci-standards skill |
