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

- [ ] Create `governance/development/infra/ci-conventions.md` with sections:
  - [ ] Git hooks standard (pre-commit, commit-msg, pre-push)
  - [ ] Nx target naming and caching rules (reference existing nx-targets.md)
  - [ ] Three-level testing definitions (universal: unit/integration/e2e boundaries)
  - [ ] App-type-specific test manifestations (BE, FE, FS, CLI, content platform, library)
  - [ ] Gherkin consumption matrix (which levels consume specs per app type)
  - [ ] Coverage threshold rationale table (90/80/75/70 with justifications)
  - [ ] Docker conventions (Dockerfile template, compose patterns, .dockerignore)
  - [ ] GitHub Actions conventions (composite actions, reusable workflows, naming)
  - [ ] Naming conventions (apps, workflows, Docker files, compose files, infra/dev, specs)
  - [ ] Adding a new app to CI checklist
- [ ] Update existing `docs/how-to/hoto__local-dev-docker.md` (file already exists):
  - [ ] Prerequisites section (Docker Desktop, Docker Compose v2)
  - [ ] Quick start per app category (backend, frontend, full-stack, content platform)
  - [ ] Port mapping reference table
  - [ ] Environment variable configuration guide
  - [ ] Database seeding and migration instructions
  - [ ] Hot-reload mechanism per language table
  - [ ] Troubleshooting section (port conflicts, volume permissions, etc.)
- [ ] Update existing `docs/how-to/hoto__add-new-a-demo-backend.md` (file already exists):
  - [ ] Dockerfile creation (using template from ci-conventions.md)
  - [ ] docker-compose.yml creation (dev, integration, CI overlay)
  - [ ] Dockerfile.integration creation
  - [ ] project.json targets (codegen, typecheck, lint, build, test:unit, test:quick, test:integration)
  - [ ] Specs folder setup (gherkin/ directory under specs/apps/)
  - [ ] Creating per-variant workflow file calling reusable workflows
  - [ ] Adding composite action (if new language)
  - [ ] Adding to PR quality gate detection
  - [ ] Adding to codecov-upload.yml
  - [ ] Nx tags configuration (type, platform, language, domain)
- [ ] Update `governance/development/quality/three-level-testing-standard.md`:
  - [ ] Align definitions with R0.2 (unit = mocked, integration = real dep + no network, e2e = full)
  - [ ] Add coverage enforcement section (test:quick enforces at pre-push, PR, and CRON)
  - [ ] Add coverage threshold rationale section
  - [ ] Add mandatory test levels matrix (BE: unit+int+e2e, FE: unit+e2e, CLI: unit+int, etc.)
  - [ ] Remove FE integration level (FE requires unit + e2e only)
  - [ ] Add CI workflow mapping (which workflows run which test levels)
  - [ ] Add spec-coverage validation section (planned for Phase 4)
  - [ ] Add "no network in integration" constraint (no inbound HTTP, no outbound calls)
  - [ ] Add Gherkin-everywhere mandate (all test levels must consume specs)
  - [ ] Document "external deps optional in E2E" policy
  - [ ] Add repository pattern requirement for BE (swap point for test levels)
  - [ ] Add contract-driven development requirement (OpenAPI + tRPC)
- [ ] Update related markdown files to reference new conventions:
  - [ ] Update `CLAUDE.md` CI-related sections (coverage rules, test levels, CRON strategy):
    - [ ] Add explicit entry for `a-demo-fs-ts-nextjs` with 75% threshold (fullstack tier, distinct
          from the 70% frontend tier -- currently missing from CLAUDE.md coverage section)
    - [ ] Verify `apps/a-demo-fs-ts-nextjs/project.json` enforces 75% (update from 70% if needed)
  - [ ] Update `governance/development/infra/nx-targets.md` (caching rules, 5-track CRON)
  - [ ] Update `governance/development/quality/code.md` (hook changes, formatting additions)
  - [ ] Update `governance/development/quality/markdown.md` (if hook behavior changes)
  - [ ] Update `governance/development/workflow/commit-messages.md` (if commit-msg hook changes)
  - [ ] Update `docs/how-to/hoto__add-new-app.md` (Docker Compose, specs folder, CI checklist)
  - [ ] Update `docs/reference/re__monorepo-structure.md` (infra/dev/ structure, specs standard)
  - [ ] Update `governance/conventions/structure/plans.md` (if any plan-related conventions change)
  - [ ] Update `specs/README.md` (new folder standard: contracts, c4, {role}/gherkin/)
  - [ ] Update `apps/README.md` (naming pattern: {service-name}-{part})
  - [ ] Update relevant app-level README.md files (test level changes, Docker dev instructions)
- [ ] Update README.md CI-related sections if any are outdated

**Validation**: All governance docs pass `npm run lint:md` and link validation. All internal
links resolve correctly.

### W2: Git Hooks Standardization

- [ ] Extend lint-staged configuration in `package.json`:
  - [ ] Add `"*.{ex,exs}": "mix format"` (move from separate pre-commit step)
  - [ ] Add `"*.py": "ruff format"` (new)
  - [ ] Add `"*.rs": "rustfmt"` (new)
  - [ ] Add `"*.cs": "dotnet format whitespace --include"` (new)
  - [ ] Add `"*.clj": "cljfmt fix"` (new)
  - [ ] Add `"*.dart": "dart format"` (new)
  - [ ] Test each new formatter with a sample staged file
  - [ ] Verify `dotnet format whitespace --include` works correctly for staged file subset in monorepo
  - [ ] Verify `cljfmt fix` handles monorepo paths (may need wrapper script)
- [ ] Verify lint-staged wrapper script works for `mix format` in monorepo context
  - [ ] mix format needs to run from the Elixir project root, not workspace root
  - [ ] Create wrapper script if needed: `scripts/format-elixir.sh`
- [ ] Verify lint-staged wrapper for `ruff format` handles virtualenv paths
- [ ] Verify lint-staged wrapper for `rustfmt` handles workspace crate paths
- [ ] Verify lint-staged wrapper for `dart format` handles Flutter project paths
- [ ] Update `apps/rhino-cli/cmd/git_pre_commit.go` (note: `.husky/pre-commit` is a single-line
      delegation to `rhino-cli git pre-commit` -- all 9 steps are implemented in Go source):
  - [ ] Remove step 6 (Elixir formatting) -- now handled by lint-staged
  - [ ] Verify step 4 (auto-add ayokoding-web content) is still needed; document why
  - [ ] Add timeout wrapper for long-running steps (30s per step, 120s total)
- [ ] Test pre-commit hook end-to-end with files from each language
- [ ] Test pre-push hook with Nx cache warm and cold

**Validation**: Commit files in each language and verify formatting is applied automatically.

## Phase 2: Core Infrastructure

### W3: GitHub Actions Composite Actions

- [ ] Create `.github/actions/setup-node/action.yml`:
  - [ ] Input: `node-version` (default: 24)
  - [ ] Steps: setup-node, npm ci, Nx cache configuration
  - [ ] Cache: npm cache directory
- [ ] Create `.github/actions/setup-golang/action.yml`:
  - [ ] Input: `go-version` (default: 1.26), `golangci-lint-version` (default: v2.10.1)
  - [ ] Steps: setup-go, install golangci-lint, install oapi-codegen
  - [ ] Cache: Go modules, Go build cache
- [ ] Create `.github/actions/setup-jvm/action.yml`:
  - [ ] Input: `java-version` (default: 21), `java-version-alt` (default: 25)
  - [ ] Steps: setup-java (Temurin), configure Maven/Gradle caches
  - [ ] Cache: Maven local repo, Gradle wrapper + caches
- [ ] Create `.github/actions/setup-dotnet/action.yml`:
  - [ ] Input: `dotnet-version` (default: 10.0)
  - [ ] Steps: setup-dotnet, install Fantomas, install fsharplint
  - [ ] Cache: NuGet packages
- [ ] Create `.github/actions/setup-python/action.yml`:
  - [ ] Input: `python-version` (default: 3.13)
  - [ ] Steps: setup-python, install uv, install datamodel-code-generator
  - [ ] Cache: pip/uv cache
- [ ] Create `.github/actions/setup-rust/action.yml`:
  - [ ] Input: `rust-version` (default: stable)
  - [ ] Steps: install Rust toolchain, install cargo-llvm-cov
  - [ ] Cache: Cargo registry, target directory
- [ ] Create `.github/actions/setup-elixir/action.yml`:
  - [ ] Input: `elixir-version` (default: 1.19), `otp-version` (default: 27)
  - [ ] Steps: setup-beam, install hex + rebar
  - [ ] Cache: deps, \_build
- [ ] Create `.github/actions/setup-flutter/action.yml`:
  - [ ] Input: `flutter-channel` (default: stable)
  - [ ] Steps: setup-flutter, pub get
  - [ ] Cache: pub cache
- [ ] Create `.github/actions/setup-clojure/action.yml`:
  - [ ] Input: `java-version` (default: 21)
  - [ ] Steps: setup-java, install Clojure CLI
  - [ ] Cache: Maven local repo, Clojure gitlibs
- [ ] Create `.github/actions/setup-playwright/action.yml`:
  - [ ] Steps: install Playwright browsers + OS dependencies
  - [ ] Cache: Playwright browser binaries
- [ ] Create `.github/actions/setup-docker-cache/action.yml`:
  - [ ] Steps: setup Docker Buildx, configure layer cache
  - [ ] Cache: `/tmp/.buildx-cache`
- [ ] Test each composite action in isolation via a temporary test workflow
- [ ] Verify caching works correctly (run twice, second run should be faster)

**Validation**: Each composite action runs successfully in a test workflow. Caches hit on second run.

### W4: PR Quality Gate Optimization

- [ ] Create detection job that identifies affected language families:
  - [ ] Use `nx show projects --affected` to get affected project list
  - [ ] Extract language tags from project configurations
  - [ ] Set GitHub Actions outputs for each language family
  - [ ] Handle edge case: changes only to markdown/docs/governance
- [ ] Create per-language quality gate jobs:
  - [ ] TypeScript job: setup-node + `nx affected -t typecheck lint test:quick --exclude=tag:language:golang,...`
  - [ ] Go job: setup-node + setup-golang + Go-specific affected targets
  - [ ] JVM job: setup-node + setup-jvm + Java/Kotlin-specific affected targets
  - [ ] .NET job: setup-node + setup-dotnet + F#/C#-specific affected targets
  - [ ] Python job: setup-node + setup-python + Python-specific affected targets
  - [ ] Rust job: setup-node + setup-rust + Rust-specific affected targets
  - [ ] Elixir job: setup-node + setup-elixir + Elixir-specific affected targets
  - [ ] Clojure job: setup-node + setup-clojure + Clojure-specific affected targets
  - [ ] Dart job: setup-node + setup-flutter + Dart-specific affected targets
  - [ ] Markdown job: markdownlint-cli2 (only if .md files changed)
- [ ] Add `if: needs.detect.outputs.has-{lang} == 'true'` to each language job
- [ ] Add contract codegen step to each job (if affected projects depend on contracts)
- [ ] Configure required status checks in GitHub branch protection:
  - [ ] Create a final `quality-gate` job in `pr-quality-gate.yml` that depends on all language
        jobs via `needs:` and always runs (even if some language jobs are skipped via `if:` conditions)
  - [ ] Mark only `quality-gate` as the required status check in branch protection settings
        (GitHub branch protection cannot mark jobs as "required only when they run" — the gate job
        pattern works around this: if a language job is skipped, it is treated as passed by the
        gate job's `needs:` dependency)
  - [ ] Verify the gate job correctly blocks merges when any language job fails
- [ ] Test with PRs touching: (a) only TypeScript, (b) only Go, (c) multiple languages, (d) only docs
- [ ] Compare CI times: old monolithic vs. new parallel approach
- [ ] Keep old `pr-quality-gate.yml` as `pr-quality-gate.yml.bak` until new gate is validated
      (GitHub Actions does not process `.bak` extension files in `.github/workflows/` --
      this is safe to store there temporarily; delete in Post-Delivery Cleanup)

**Validation**: PR touching only TypeScript completes in < 5 minutes. Cross-language PR runs all
relevant jobs in parallel.

### W7: Docker Standardization

- [ ] Audit all 11 Dockerfiles against the template from tech-docs.md:
  - [ ] Verify multi-stage build pattern
  - [ ] Add non-root user where missing
  - [ ] Add HEALTHCHECK instruction where missing
  - [ ] Add OCI LABEL metadata where missing
  - [ ] Standardize health check to use `wget` (not `curl`)
  - [ ] Verify dependency-manifest-first layer ordering
- [ ] Audit all docker-compose.yml files against conventions:
  - [ ] Dev compose: named volumes, source mounts, specs mount, healthchecks
  - [ ] Integration compose: tmpfs, abort-on-container-exit, cleanup
  - [ ] CI overlay: production env vars, ENABLE_TEST_API, frontend service
- [ ] Fix naming exceptions:
  - [ ] Merge `docker-compose.ci-e2e.yml` content into the existing `docker-compose.ci.yml` in
        `infra/dev/a-demo-be-elixir-phoenix/` (both files exist; `ci.yml` already exists so rename
        is not possible)
  - [ ] Delete `docker-compose.ci-e2e.yml` after confirming the merged config passes
        `docker compose config`
  - [ ] Verify Elixir CI workflow still works after the merge and deletion
- [ ] Standardize all Dockerfile.integration files:
  - [ ] Consistent base image versions per language
  - [ ] Consistent spec mount paths (`/specs` inside container)
  - [ ] Consistent exit code handling
  - [ ] Document the template in ci-conventions.md
- [ ] Review and standardize `.dockerignore`:
  - [ ] Apply the pattern from tech-docs.md AD4.3
  - [ ] Test each app's Docker build still works after changes
- [ ] Validate all docker-compose files pass `docker compose config`

**Validation**: All Dockerfiles follow the template. All compose files pass config validation.
All integration tests still pass after changes.

## Phase 3: DRY-up

### W5: Backend Test Workflow DRY-up

- [ ] Create `.github/workflows/_reusable-backend-integration.yml`:
  - [ ] Inputs: backend-name, app-dir, compose-file
  - [ ] Steps: checkout, docker compose up (integration), teardown
  - [ ] Timeout: 15 minutes
- [ ] Create `.github/workflows/_reusable-backend-e2e.yml`:
  - [ ] Inputs: backend-name, compose-dir, health-url, health-timeout
  - [ ] Steps: checkout, setup-node, setup-golang, npm ci, contracts, start stack, wait, Playwright, artifacts, teardown
  - [ ] Timeout: 20 minutes
- [ ] Create reusable workflows for backend test tracks:
  - [ ] `.github/workflows/_reusable-backend-lint.yml` (inputs: backend-name, setup-action)
  - [ ] `.github/workflows/_reusable-backend-typecheck.yml` (inputs: backend-name, setup-action)
  - [ ] `.github/workflows/_reusable-backend-coverage.yml` (inputs: backend-name, setup-action)
  - [ ] `.github/workflows/_reusable-backend-spec-coverage.yml` (inputs: backend-name, setup-action)
        -- **leave calls to this commented out in W5**; the `spec-coverage` Nx targets for all 11
        backends are created in W10 (Phase 4). Enable in W10 once targets exist.
- [ ] Rewrite all 11 backend test workflows to call reusable workflows:
  - [ ] Each file: ~40 lines calling reusable workflows with variant-specific inputs
  - [ ] 4 active parallel tracks initially (Track 4 enabled in W10):
    - [ ] Track 1: `lint` (calls `_reusable-backend-lint.yml`)
    - [ ] Track 2: `typecheck` (calls `_reusable-backend-typecheck.yml`)
    - [ ] Track 3: `test:quick` (calls `_reusable-backend-coverage.yml`)
    - [ ] Track 4: `spec-coverage` (commented out until W10)
    - [ ] Track 5: `integration` → `e2e` (sequential chain via `needs:`)
  - [ ] Preserve: schedule (cron 2x daily), workflow_dispatch trigger
  - [ ] Each backend workflow pairs with default frontend for E2E
- [ ] Verify all 11 rewritten workflows produce identical results:
  - [ ] Verify each backend's integration tests pass
  - [ ] Verify each backend's E2E tests pass (with default FE pairing)
  - [ ] Verify artifacts are uploaded per backend

**Validation**: All 11 rewritten workflows produce identical results to the originals. Each
workflow file reduced from ~150 lines to ~40 lines via reusable workflow calls.

### W6: Frontend & Fullstack Test Workflows

- [ ] Create `.github/workflows/_reusable-frontend-e2e.yml`:
  - [ ] Inputs: frontend-name, compose-dir, backend-compose-dir, health-urls
  - [ ] Steps: checkout, setup-node, start backend + frontend, wait, Playwright, artifacts, teardown
  - [ ] Timeout: 20 minutes
- [ ] Rewrite all 3 frontend test workflows to call reusable workflows:
  - [ ] `test-a-demo-fe-ts-nextjs.yml` (pairs with default BE: golang-gin)
  - [ ] `test-a-demo-fe-ts-tanstack-start.yml` (pairs with default BE: golang-gin)
  - [ ] `test-a-demo-fe-dart-flutterweb.yml` (pairs with default BE: golang-gin)
  - [ ] Each file: ~30 lines calling `_reusable-frontend-e2e.yml`
  - [ ] Preserve: schedule (cron 2x daily), workflow_dispatch trigger
- [ ] Rewrite fullstack test workflow:
  - [ ] `test-a-demo-fs-ts-nextjs.yml` (self-contained Next.js route handler app)
  - [ ] ~30 lines calling `_reusable-backend-integration.yml` + `_reusable-backend-e2e.yml` with
        FS-specific inputs (no separate `_reusable-fullstack-*.yml` needed; FS app uses same
        integration + E2E pattern as backends)
- [ ] Update `test-organiclever.yml` to use reusable workflows:
  - [ ] Use `_reusable-backend-integration.yml` for BE integration
  - [ ] Use `_reusable-backend-e2e.yml` or custom for full-stack E2E
  - [ ] Keep OrganicLever-specific environment secrets handling

**Validation**: All frontend/fullstack E2E tests pass via rewritten workflows. Each workflow
file reduced from ~100+ lines to ~30 lines via reusable workflow calls.

### W8: Local Development with Docker

- [ ] Add unified `dev:*` scripts to root `package.json`:
  - [ ] `dev:a-demo-be-golang-gin` (and all 10 other backends)
  - [ ] `dev:a-demo-fe-ts-nextjs` (and other frontends)
  - [ ] `dev:a-demo-fs-ts-nextjs` (fullstack)
  - [ ] `dev:organiclever` (full stack: BE + FE + DB)
  - [ ] `dev:ayokoding-web`
  - [ ] `dev:oseplatform-web`
- [ ] Verify hot-reload works for each dev setup:
  - [ ] Go: file change triggers recompilation via air/go run
  - [ ] Java (Spring Boot): Spring DevTools reloads on class change
  - [ ] Java (Vert.x): Vert.x launcher redeploys on change
  - [ ] TypeScript (Effect): tsx watch restarts on change
  - [ ] Python: uvicorn --reload picks up file changes
  - [ ] Rust: cargo watch rebuilds on change
  - [ ] Kotlin: Gradle continuous build restarts on change
  - [ ] F#: dotnet watch rebuilds on change
  - [ ] C#: dotnet watch rebuilds on change
  - [ ] Elixir: Phoenix code reloader handles changes
  - [ ] Clojure: nREPL + tools.namespace refreshes namespaces
- [ ] Verify database seeding/migration for each backend:
  - [ ] Go: auto-migration via GORM
  - [ ] Java: Flyway/Liquibase migrations
  - [ ] TypeScript: Drizzle migrations
  - [ ] Python: Alembic migrations
  - [ ] Others: language-specific migration tools
- [ ] Verify `.env.example` exists for each dev setup (creation handled by W16)
- [ ] Finalize `docs/how-to/hoto__local-dev-docker.md` with tested instructions

**Validation**: Developer can run `npm run dev:{any-app}` and the service health check passes,
confirming the environment is running and hot-reload is active.

### W11: Gherkin Consumption Remediation

FE, content platform, and OrganicLever FE unit tests currently do NOT consume Gherkin specs.
This must be fixed so all test levels verify behavioral specs.

- [ ] **Spike: Select FE BDD runner for Vitest-based unit tests** (prerequisite for all steps below)
  - [ ] Research available options: `vitest-cucumber`, `playwright-bdd` (repurposed), or other
  - [ ] Selection criteria -- chosen tool MUST:
    - (a) integrate with Vitest without requiring test runner replacement
    - (b) support Given-When-Then step definitions in TypeScript
    - (c) not require a browser environment (JSDOM/happy-dom only is sufficient)
    - (d) support `--coverage` output compatible with `rhino-cli test-coverage validate`
  - [ ] Document selected tool and rationale as AD10 in tech-docs.md
  - [ ] If no tool satisfies all criteria, document the constraint and propose alternative
        (e.g., custom Gherkin parser, or defer Gherkin-at-unit-level for FE apps)
  - [ ] **If deferral is selected**: document as a known gap in
        `governance/development/quality/three-level-testing-standard.md` under a "Known Gaps"
        section. Skip the remaining W11 steps below. The spec-coverage W10 target for FE projects
        should still be added (using whatever step definitions exist). Owner: plan executor. No
        additional approval needed for deferral -- this is a pragmatic decision based on tool
        availability.
- [ ] Add Gherkin BDD runner to FE unit test setup (after spike resolves tool selection):
  - [ ] Configure FE unit tests to consume `specs/apps/a-demo/fe/gherkin/*.feature`
  - [ ] Implement step definitions for FE unit specs (MSW + JSDOM)
- [ ] Add Gherkin consumption to demo frontend unit tests:
  - [ ] `a-demo-fe-ts-nextjs`: wire vitest to consume FE Gherkin specs
  - [ ] `a-demo-fe-ts-tanstack-start`: wire vitest to consume FE Gherkin specs
  - [ ] `a-demo-fe-dart-flutterweb`: wire Flutter test to consume FE Gherkin specs
- [ ] Add Gherkin consumption to content platform unit tests:
  - [ ] `ayokoding-web`: wire vitest to consume `specs/apps/ayokoding/{be,fe}/gherkin/*.feature`
  - [ ] `oseplatform-web`: wire vitest to consume `specs/apps/oseplatform/{be,fe}/gherkin/*.feature`
- [ ] Add Gherkin consumption to OrganicLever FE unit tests:
  - [ ] `organiclever-fe`: wire vitest to consume `specs/apps/organiclever/fe/gherkin/*.feature`
- [ ] Remove redundant FE `test:integration` targets:
  - [ ] Remove from `a-demo-fe-ts-nextjs/project.json`
  - [ ] Remove from `a-demo-fe-ts-tanstack-start/project.json`
  - [ ] Remove from `a-demo-fe-dart-flutterweb/project.json`
  - [ ] Remove from `organiclever-fe/project.json`
  - [ ] Update nx.json if FE integration targets have special caching rules
- [ ] Verify all unit test suites now consume Gherkin specs:
  - [ ] Run `rhino-cli spec-coverage validate` for each project
  - [ ] Confirm spec-to-test mapping is complete

**Validation**: Every project's unit tests consume Gherkin specs. No test level exists without
Gherkin consumption. FE `test:integration` targets are removed.

### W12: Specs Folder Restructuring

Align specs folder structure with the standard defined in R0.2.

- [ ] Restructure CLI specs to use `cli/gherkin/` pattern:
  - [ ] Check for filename collisions before merging rhino-cli domain directories:
    - [ ] Run `ls specs/apps/rhino-cli/*/` to inventory all feature file names across the 9 domains
    - [ ] Confirm no two domains contain a `.feature` file with the same name
    - [ ] If collisions exist, use domain-prefix naming (e.g., `agents-validate.feature`,
          `test-coverage-validate.feature`) before proceeding
  - [ ] Move `specs/apps/rhino-cli/{domain}/*.feature` to `specs/apps/rhino-cli/cli/gherkin/`
  - [ ] Move `specs/apps/ayokoding-cli/links/*.feature` to `specs/apps/ayokoding-cli/cli/gherkin/`
  - [ ] Move `specs/apps/oseplatform-cli/links/*.feature` to `specs/apps/oseplatform-cli/cli/gherkin/`
  - [ ] Update all godog step definition paths in CLI project configs
  - [ ] Update all `inputs` in project.json that reference old spec paths
  - [ ] Update godog feature path configurations in `apps/rhino-cli/` Go source code:
    - [ ] Run `grep -r 'specs/apps/rhino-cli' apps/rhino-cli/` to find all hardcoded paths
    - [ ] Update each occurrence to reference the new `cli/gherkin/` path
    - [ ] Run `nx run rhino-cli:test:unit` to confirm no broken spec references
  - [ ] Update godog feature path configurations in `apps/ayokoding-cli/` Go source code:
    - [ ] Run `grep -r 'specs/apps/ayokoding-cli' apps/ayokoding-cli/` to find all hardcoded paths
    - [ ] Update each occurrence to reference the new `cli/gherkin/` path
  - [ ] Update godog feature path configurations in `apps/oseplatform-cli/` Go source code:
    - [ ] Run `grep -r 'specs/apps/oseplatform-cli' apps/oseplatform-cli/` to find all hardcoded paths
    - [ ] Update each occurrence to reference the new `cli/gherkin/` path
  - [ ] Run `nx run-many -t test:unit --projects=rhino-cli,ayokoding-cli,oseplatform-cli` after all path updates to confirm no broken spec references
- [ ] Add missing spec directories:
  - [ ] Create `specs/apps/a-demo/fs/gherkin/` with README.md
- [ ] Add README.md to all `gherkin/` directories that lack one
- [ ] Reclassify `ayokoding/build-tools/gherkin/` to fit the standard pattern
- [ ] Verify all Nx cache inputs still reference correct spec paths after restructuring
- [ ] Run full test suite to confirm no broken spec references

**Validation**: `find specs -name '*.feature'` shows all feature files under `{role}/gherkin/`
pattern. All tests pass after restructuring.

### W13: CLI Docker Compose Setup

Add `infra/dev/` Docker Compose for CLI apps to ensure consistent local development.

- [ ] Create `infra/dev/rhino-cli/docker-compose.yml`:
  - [ ] Go build environment with correct version (1.26)
  - [ ] Volume mount for source code (hot-rebuild)
  - [ ] Specs mounted read-only
- [ ] Create `infra/dev/ayokoding-cli/docker-compose.yml`:
  - [ ] Same pattern as rhino-cli
  - [ ] Include golang-commons and hugo-commons lib mounts
- [ ] Create `infra/dev/oseplatform-cli/docker-compose.yml`:
  - [ ] Same pattern as ayokoding-cli
- [ ] Create corresponding `Dockerfile.cli.dev` for each CLI:
  - [ ] Based on `golang:1.26-alpine`
  - [ ] Install required tools (golangci-lint, godog, etc.)
- [ ] Add `dev:rhino-cli`, `dev:ayokoding-cli`, `dev:oseplatform-cli` to root package.json
- [ ] Test each CLI can build and run tests inside the container

**Validation**: `npm run dev:rhino-cli` starts a containerized dev environment. `go test ./...`
works inside the container.

### W15: Accessibility Testing Remediation

Ensure all UI apps have accessibility testing at lint, unit, and E2E levels per R0.2.

- [ ] Add @axe-core/playwright to E2E apps that lack it:
  - [ ] `ayokoding-web-fe-e2e`: install @axe-core/playwright, add axe scan to accessibility steps
  - [ ] `oseplatform-web-fe-e2e`: install @axe-core/playwright, create accessibility steps
  - [ ] `a-demo-fs-ts-nextjs` E2E: add axe-core integration
- [ ] Add accessibility Gherkin specs where missing:
  - [ ] `specs/apps/oseplatform/fe/gherkin/accessibility.feature` (missing entirely)
  - [ ] Verify all existing a11y features cover the minimum required scenarios
- [ ] Add accessibility unit test step implementations where missing:
  - [ ] `oseplatform-web`: create unit accessibility steps consuming Gherkin specs
  - [ ] Verify all UI apps have a11y step implementations at unit level
- [ ] Evaluate Flutter a11y testing for `a-demo-fe-dart-flutterweb`:
  - [ ] Research Flutter Semantics-based accessibility testing
  - [ ] Add `flutter test` a11y assertions or document why deferred
- [ ] Standardize oxlint configuration:
  - [ ] Create `oxlint.json` with `jsx-a11y` plugin for apps that use CLI flag only
  - [ ] Ensure consistent rule set across all UI apps
- [ ] Verify a11y lint runs in pre-push and PR quality gate:
  - [ ] Confirm `lint` target includes `--jsx-a11y-plugin` for all UI apps
  - [ ] Confirm `lint` is part of `test:quick` / pre-push / PR gate

**Validation**: All UI apps pass axe-core scans in E2E. All UI apps have a11y Gherkin specs
at unit and E2E levels. `npx nx run-many -t lint` passes jsx-a11y rules for all UI apps.

### W16: Environment Variable Standardization

Ensure all apps use `.env.example` + `.env.local` pattern per R0.2.

- [ ] Audit all `infra/dev/` directories for `.env.example`:
  - [ ] List apps that have `.env.example` vs those that don't
  - [ ] Document all environment variables used in each docker-compose.yml
- [ ] Create `.env.example` for each `infra/dev/` directory missing one:
  - [ ] `infra/dev/a-demo-be-golang-gin/.env.example`
  - [ ] `infra/dev/a-demo-be-ts-effect/.env.example`
  - [ ] `infra/dev/a-demo-be-python-fastapi/.env.example`
  - [ ] `infra/dev/a-demo-be-rust-axum/.env.example`
  - [ ] `infra/dev/a-demo-be-kotlin-ktor/.env.example`
  - [ ] `infra/dev/a-demo-be-fsharp-giraffe/.env.example`
  - [ ] `infra/dev/a-demo-be-csharp-aspnetcore/.env.example`
  - [ ] `infra/dev/a-demo-be-clojure-pedestal/.env.example`
  - [ ] `infra/dev/a-demo-be-java-vertx/.env.example`
  - [ ] `infra/dev/a-demo-fe-ts-tanstack-start/.env.example`
  - [ ] `infra/dev/a-demo-fs-ts-nextjs/.env.example`
  - [ ] `infra/dev/ayokoding-web/.env.example`
  - [ ] `infra/dev/oseplatform-web/.env.example`
- [ ] Update docker-compose.yml files to use `env_file` directive where applicable
- [ ] Verify `.env*.local` is in `.gitignore` (should already be)
- [ ] Audit CI workflows for hardcoded secrets:
  - [ ] Replace inline credentials with `${{ secrets.* }}` or `${{ vars.* }}`
  - [ ] Document which GitHub secrets need to be configured per workflow
- [ ] Add `.env.example` validation to pre-commit hook:
  - [ ] Check that every env var in docker-compose.yml has a matching entry in `.env.example`

**Validation**: Every `infra/dev/` directory has a `.env.example`. No hardcoded credentials
in CI workflows (except test-only defaults in docker-compose.integration.yml). `git grep`
for `GOOGLE_CLIENT_SECRET=` or similar patterns returns zero hits outside `.env.example`.

## Phase 4: Optimization

### W9: CI Docker Caching & Optimization

- [ ] Integrate `setup-docker-cache` composite action into reusable workflows:
  - [ ] `_reusable-backend-integration.yml`: add Docker Buildx + cache
  - [ ] `_reusable-backend-e2e.yml`: add Docker Buildx + cache
  - [ ] `_reusable-frontend-e2e.yml`: add Docker Buildx + cache
- [ ] Configure cache keys based on Dockerfile content hash:
  - [ ] Key: `docker-${{ runner.os }}-${{ inputs.backend-name }}-${{ hashFiles('...Dockerfile*') }}`
  - [ ] Restore keys: `docker-${{ runner.os }}-${{ inputs.backend-name }}-`
- [ ] Measure CI times before and after caching:
  - [ ] Record baseline times for 3 consecutive runs (no cache)
  - [ ] Record cached times for 3 consecutive runs (warm cache)
  - [ ] Target: 30-60% reduction for unchanged Dockerfiles
- [ ] Update `codecov-upload.yml` to use composite actions:
  - [ ] Replace inline language setup with composite action calls
  - [ ] Verify all coverage uploads still work
- [ ] Create `.github/workflows/_reusable-test-and-deploy.yml`:
  - [ ] Inputs: app-name, prod-branch, health-url, health-timeout
  - [ ] Jobs: unit (test:quick), integration, e2e (docker-compose + Playwright), detect-changes,
        deploy (conditional: changes detected + all tests pass → push to prod branch)
  - [ ] Timeout: 30 minutes
- [ ] Update `test-and-deploy-ayokoding-web.yml` to call `_reusable-test-and-deploy.yml`
- [ ] Update `test-and-deploy-oseplatform-web.yml` to call `_reusable-test-and-deploy.yml`

**Validation**: Cached CI runs are measurably faster. All coverage uploads succeed.

### W10: Spec-Coverage Integration

All spec-coverage validation uses `rhino-cli spec-coverage validate`. If rhino-cli needs
enhancements to support new app types (FE unit specs, restructured CLI specs, content platform
specs), update rhino-cli first.

- [ ] Verify `rhino-cli spec-coverage validate` supports all app types:
  - [ ] Test with BE projects (already supported)
  - [ ] Test with FE projects (may need enhancement for vitest-cucumber step detection)
  - [ ] Test with CLI projects after specs restructuring (W12 -- new `cli/gherkin/` paths)
  - [ ] Test with content platform projects (tRPC step definitions)
  - [ ] Update rhino-cli if needed to handle new step definition patterns or paths
- [ ] Add `spec-coverage` Nx target to demo backend projects:
  - [ ] `a-demo-be-golang-gin/project.json`
  - [ ] `a-demo-be-java-springboot/project.json`
  - [ ] `a-demo-be-ts-effect/project.json`
  - [ ] `a-demo-be-python-fastapi/project.json`
  - [ ] `a-demo-be-rust-axum/project.json`
  - [ ] `a-demo-be-kotlin-ktor/project.json`
  - [ ] `a-demo-be-fsharp-giraffe/project.json`
  - [ ] `a-demo-be-csharp-aspnetcore/project.json`
  - [ ] `a-demo-be-clojure-pedestal/project.json`
  - [ ] `a-demo-be-elixir-phoenix/project.json`
  - [ ] `a-demo-be-java-vertx/project.json`
- [ ] Add `spec-coverage` Nx target to frontend projects:
  - [ ] `a-demo-fe-ts-nextjs/project.json`
  - [ ] `a-demo-fe-ts-tanstack-start/project.json`
  - [ ] `a-demo-fe-dart-flutterweb/project.json`
  - [ ] `organiclever-fe/project.json`
- [ ] Add `spec-coverage` Nx target to fullstack and content platform projects:
  - [ ] `a-demo-fs-ts-nextjs/project.json`
  - [ ] `ayokoding-web/project.json`
  - [ ] `oseplatform-web/project.json`
- [ ] Add `spec-coverage` Nx target to E2E projects:
  - [ ] `a-demo-be-e2e/project.json`
  - [ ] `a-demo-fe-e2e/project.json`
  - [ ] `organiclever-be-e2e/project.json`
  - [ ] `organiclever-fe-e2e/project.json`
- [ ] Add `spec-coverage` Nx target to CLI projects:
  - [ ] `rhino-cli/project.json`
  - [ ] `ayokoding-cli/project.json`
  - [ ] `oseplatform-cli/project.json`
- [ ] Configure cache inputs for spec-coverage targets:
  - [ ] Include: `{workspaceRoot}/specs/.../**/*.feature` + `{projectRoot}/**/*.{ext}`
  - [ ] Set `cache: true` (deterministic based on specs + test files)
- [ ] Add `spec-coverage` to pre-push hook:
  - [ ] `npx nx affected -t typecheck lint test:quick spec-coverage --parallel="$PARALLEL"`
- [ ] Add `spec-coverage` to PR quality gate detection and language jobs
- [ ] Run spec-coverage validation across all projects and fix any gaps:
  - [ ] Document any intentionally unimplemented scenarios with `@skip` tags
  - [ ] Ensure all feature files have corresponding step definitions
- [ ] Update governance documentation with spec-coverage CI integration

**Validation**: `npx nx affected -t spec-coverage` passes for all projects. Unimplemented
scenarios are tagged `@skip` with documented rationale. PR quality gate includes spec-coverage.

### W17: CI Compliance Enforcement

After CI conventions are documented (W1), create agents, skills, and workflows that
**automatically validate** all projects in the repository conform to CI standards. This is the
ongoing enforcement layer — without it, standards decay as new projects are added. W17 can run
in parallel with W14 (governance propagation) since it only depends on the conventions doc.

- [ ] Create `ci-standards` inline skill (`.claude/skills/ci-standards/SKILL.md`):
  - [ ] Reference CI conventions governance doc (`governance/development/infra/ci-conventions.md`)
  - [ ] Include: mandatory Nx targets per app type, coverage thresholds, test level requirements,
        Docker setup requirements, pairing rules, Gherkin consumption mandate, env variable standard
  - [ ] Serve `swe-*-developer` agents so they set up new projects correctly from the start
- [ ] Create `ci-checker` agent (`.claude/agents/ci-checker.md`):
  - [ ] Validates ALL projects against CI standards:
    - [ ] Mandatory Nx targets present per app type (7 for demo, varies for others)
    - [ ] Coverage thresholds configured correctly in `test:quick`
    - [ ] `infra/dev/{app}/` exists with docker-compose.yml + docker-compose.ci.yml
    - [ ] `.env.example` exists in every `infra/dev/` directory
    - [ ] Gherkin specs exist under `specs/apps/{app}/{role}/gherkin/`
    - [ ] Unit tests consume Gherkin specs (BDD runner configured)
    - [ ] `spec-coverage` Nx target exists for testable projects
    - [ ] Workflow file exists calling reusable workflows
    - [ ] E2E pairing: BE variants paired with default FE, FE variants with default BE
    - [ ] No hardcoded credentials in workflow files
  - [ ] Skills: `ci-standards`, `repo-generating-validation-reports`, `repo-assessing-criticality-confidence`
  - [ ] Output: audit report in `generated-reports/`
- [ ] Create `ci-fixer` agent (`.claude/agents/ci-fixer.md`):
  - [ ] Applies validated fixes from ci-checker audit reports
  - [ ] Re-validates findings before applying (prevents false positives)
  - [ ] Skills: `ci-standards`, `repo-applying-maker-checker-fixer`
- [ ] Create `ci-quality-gate` workflow (`governance/workflows/ci/ci-quality-gate.md`):
  - [ ] Orchestrates ci-checker → ci-fixer iteratively (same pattern as plan-quality-gate)
  - [ ] Terminates on double-zero findings or max-iterations
  - [ ] Scope: all projects, specific app type, or single project
- [ ] Sync all new `.claude/` files to `.opencode/` via `npm run sync:claude-to-opencode`
- [ ] Test ci-checker against current repository state:
  - [ ] Run `ci-checker` to validate all existing projects
  - [ ] Verify it catches known gaps (missing FE Gherkin, missing .env.example files)
  - [ ] Verify it passes for fully compliant projects (e.g., a-demo-be-golang-gin)

**Validation**: `ci-checker` produces accurate findings for all project types (BE, FE, FS, CLI,
content platform, library). `ci-fixer` can remediate common issues. `ci-quality-gate` workflow
runs to completion with zero findings on a fully standardized project.

### W14: Governance Propagation

After all conventions are documented and implemented, run the `repo-governance-maker` agent to
propagate CI/CD rules and conventions across the governance layer. This ensures the six-layer
governance hierarchy (Vision → Principles → Conventions → Development → Agents → Workflows) is
consistent and that new CI conventions are discoverable by all agents.

- [ ] Run `repo-governance-maker` to create/update governance documents:
  - [ ] Propagate three-level testing definitions to relevant convention docs
  - [ ] Propagate naming conventions to relevant convention docs
  - [ ] Propagate caching rules and CI execution strategy
  - [ ] Propagate repository pattern and contract-driven development requirements
  - [ ] Propagate Docker Compose standard (all apps must have `infra/dev/`)
  - [ ] Propagate Gherkin-everywhere mandate
  - [ ] Propagate coverage enforcement rules (test:quick at all gates)
- [ ] Run `repo-governance-checker` to validate consistency:
  - [ ] Check for contradictions between new ci-conventions.md and existing docs
  - [ ] Check for stale references to old workflow names in governance docs
  - [ ] Check for duplication between ci-conventions.md and three-level-testing-standard.md
- [ ] Run `repo-governance-fixer` to apply any fixes from checker output
- [ ] Verify all agents that reference CI/testing patterns have updated skill knowledge:
  - [ ] `swe-e2e-test-developer` agent references correct test level definitions
  - [ ] `swe-*-developer` agents reference repository pattern requirement
  - [ ] `plan-checker` agent can validate plans against new CI conventions
- [ ] Run `docs-checker` on all modified governance and docs files
- [ ] Run `docs-link-general-checker` to verify no broken links after updates

**Validation**: `repo-governance-checker` produces zero CRITICAL/HIGH findings related to CI
conventions. All governance docs are internally consistent. All agents reference correct
conventions.

## Post-Delivery Cleanup

- [ ] Delete out-of-standards / superseded files:
  - [ ] `infra/dev/a-demo-be-elixir-phoenix/docker-compose.ci-e2e.yml` (merged into ci.yml in W7)
  - [ ] `.github/workflows/pr-quality-gate.yml.bak` (backup from Phase 2 refactor)
- [ ] Verify no orphan references to deleted files:
  - [ ] Search all `.yml` workflows for `ci-e2e` references
  - [ ] Search all `project.json` files for removed `test:integration` targets in FE apps
  - [ ] Run `docs-link-general-checker` to catch any broken links
- [ ] Archive this plan to `plans/done/` with completion date
- [ ] Update `plans/in-progress/README.md` to remove this plan
- [ ] Update `plans/done/README.md` to add this plan

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
