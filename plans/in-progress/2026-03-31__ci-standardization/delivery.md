# Delivery Plan: CI/CD Standardization

## Phase Overview

| Phase       | Workstreams               | Focus                                                                          | Risk   |
| ----------- | ------------------------- | ------------------------------------------------------------------------------ | ------ |
| **Phase 1** | W1, W2                    | Foundation: governance docs + git hooks                                        | Low    |
| **Phase 2** | W3, W4, W7                | Core: composite actions + PR gate + Docker standards                           | Medium |
| **Phase 3** | W5, W6, W8, W11, W12, W13 | Consolidation: workflows, Gherkin remediation, specs restructuring, CLI Docker | Medium |
| **Phase 4** | W9, W10, W14              | Optimization: caching, spec-coverage, governance propagation                   | Low    |

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
- [ ] Create `docs/how-to/hoto__local-dev-with-docker.md`:
  - [ ] Prerequisites section (Docker Desktop, Docker Compose v2)
  - [ ] Quick start per app category (backend, frontend, full-stack, content platform)
  - [ ] Port mapping reference table
  - [ ] Environment variable configuration guide
  - [ ] Database seeding and migration instructions
  - [ ] Hot-reload mechanism per language table
  - [ ] Troubleshooting section (port conflicts, volume permissions, etc.)
- [ ] Create `docs/how-to/hoto__add-new-backend-ci.md`:
  - [ ] Dockerfile creation (using template from ci-conventions.md)
  - [ ] docker-compose.yml creation (dev, integration, CI overlay)
  - [ ] Dockerfile.integration creation
  - [ ] project.json targets (codegen, typecheck, lint, build, test:unit, test:quick, test:integration)
  - [ ] Specs folder setup (gherkin/ directory under specs/apps/)
  - [ ] Adding to matrix in test-demo-backends.yml
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
  - [ ] Update `CLAUDE.md` CI-related sections (coverage rules, test levels, CRON strategy)
  - [ ] Update `governance/development/infra/nx-targets.md` (caching rules, 4-track CRON)
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
  - [ ] Add `"*.dart": "dart format"` (new)
  - [ ] Test each new formatter with a sample staged file
- [ ] Verify lint-staged wrapper script works for `mix format` in monorepo context
  - [ ] mix format needs to run from the Elixir project root, not workspace root
  - [ ] Create wrapper script if needed: `scripts/format-elixir.sh`
- [ ] Verify lint-staged wrapper for `ruff format` handles virtualenv paths
- [ ] Verify lint-staged wrapper for `rustfmt` handles workspace crate paths
- [ ] Verify lint-staged wrapper for `dart format` handles Flutter project paths
- [ ] Simplify `.husky/pre-commit`:
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
  - [ ] Input: `go-version` (default: 1.26), `golangci-lint-version` (default: v2.1)
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
  - [ ] Mark detection job as always required
  - [ ] Mark language jobs as required only when they run
- [ ] Test with PRs touching: (a) only TypeScript, (b) only Go, (c) multiple languages, (d) only docs
- [ ] Compare CI times: old monolithic vs. new parallel approach
- [ ] Keep old `pr-quality-gate.yml` as `pr-quality-gate.yml.bak` until new gate is validated

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
  - [ ] Rename Elixir `docker-compose.ci-e2e.yml` to `docker-compose.ci.yml` (merge with overlay)
  - [ ] Verify Elixir CI workflow still works after rename
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

## Phase 3: Consolidation

### W5: Backend Test Workflow Consolidation

- [ ] Create `.github/workflows/_reusable-backend-integration.yml`:
  - [ ] Inputs: backend-name, app-dir, compose-file
  - [ ] Steps: checkout, docker compose up (integration), teardown
  - [ ] Timeout: 15 minutes
- [ ] Create `.github/workflows/_reusable-backend-e2e.yml`:
  - [ ] Inputs: backend-name, compose-dir, health-url, health-timeout
  - [ ] Steps: checkout, setup-node, setup-golang, npm ci, contracts, start stack, wait, Playwright, artifacts, teardown
  - [ ] Timeout: 20 minutes
- [ ] Create `.github/workflows/test-demo-backends.yml`:
  - [ ] Matrix strategy with all 11 backends
  - [ ] Each matrix entry: name, language, compose-dir, app-dir, setup-action
  - [ ] 4 parallel tracks per R0.4:
    - [ ] Track 1: `lint` (independent matrix job)
    - [ ] Track 2: `typecheck` (independent matrix job)
    - [ ] Track 3: `test:quick` (independent matrix job)
    - [ ] Track 4: `integration` → `e2e` (sequential chain via `needs:`)
  - [ ] Schedule: cron 2x daily (06:00 WIB, 18:00 WIB)
  - [ ] workflow_dispatch with backend filter input
- [ ] Create `prepare` job for workflow_dispatch filtering:
  - [ ] Parse `backends` input (comma-separated)
  - [ ] Generate filtered matrix JSON
  - [ ] Default to full matrix when input is empty
- [ ] Test consolidated workflow with all 11 backends:
  - [ ] Verify each backend's integration tests pass
  - [ ] Verify each backend's E2E tests pass
  - [ ] Verify artifacts are uploaded per backend
  - [ ] Verify workflow_dispatch filtering works
- [ ] Delete individual backend test workflows (11 files):
  - [ ] `test-a-demo-be-golang-gin.yml`
  - [ ] `test-a-demo-be-java-springboot.yml`
  - [ ] `test-a-demo-be-java-vertx.yml`
  - [ ] `test-a-demo-be-python-fastapi.yml`
  - [ ] `test-a-demo-be-rust-axum.yml`
  - [ ] `test-a-demo-be-kotlin-ktor.yml`
  - [ ] `test-a-demo-be-fsharp-giraffe.yml`
  - [ ] `test-a-demo-be-csharp-aspnetcore.yml`
  - [ ] `test-a-demo-be-clojure-pedestal.yml`
  - [ ] `test-a-demo-be-elixir-phoenix.yml`
  - [ ] `test-a-demo-be-ts-effect.yml`

**Validation**: Consolidated workflow produces identical results to individual workflows. Manual
dispatch with single backend filter works.

### W6: Frontend & Fullstack Test Workflows

- [ ] Create `.github/workflows/_reusable-frontend-e2e.yml`:
  - [ ] Inputs: frontend-name, compose-dir, backend-compose-dir, health-urls
  - [ ] Steps: checkout, setup-node, start backend + frontend, wait, Playwright, artifacts, teardown
  - [ ] Timeout: 20 minutes
- [ ] Create `.github/workflows/test-demo-frontends.yml`:
  - [ ] Matrix strategy with frontend apps:
    - [ ] a-demo-fe-ts-nextjs (with Go backend)
    - [ ] a-demo-fe-ts-tanstack-start (with Go backend)
    - [ ] a-demo-fe-dart-flutterweb (with Go backend)
    - [ ] a-demo-fs-ts-nextjs (fullstack, no separate backend)
  - [ ] Schedule: cron 2x daily (same as backends)
  - [ ] workflow_dispatch with frontend filter input
- [ ] Test consolidated workflow with all frontends
- [ ] Delete individual frontend test workflows:
  - [ ] `test-a-demo-fe-ts-nextjs.yml`
  - [ ] `test-a-demo-fe-dart-flutterweb.yml`
  - [ ] `test-a-demo-fe-ts-tanstack-start.yml`
  - [ ] `test-a-demo-fs-ts-nextjs.yml`
- [ ] Update `test-organiclever.yml` to use reusable workflows:
  - [ ] Use `_reusable-backend-integration.yml` for BE integration
  - [ ] Use `_reusable-backend-e2e.yml` or custom for full-stack E2E
  - [ ] Keep OrganicLever-specific environment secrets handling

**Validation**: All frontend E2E tests pass via consolidated workflow. TanStack Start and Flutter
Web frontends are now tested in CI.

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
- [ ] Add `.env.example` files for any dev setup that lacks one
- [ ] Finalize `docs/how-to/hoto__local-dev-with-docker.md` with tested instructions

**Validation**: Developer can run `npm run dev:{any-app}` and get a working dev environment with
hot-reload within 60 seconds.

## Phase 4: Optimization

### W9: CI Docker Caching & Optimization

- [ ] Integrate `setup-docker-cache` composite action into reusable workflows:
  - [ ] `_reusable-backend-integration.yml`: add Docker Buildx + cache
  - [ ] `_reusable-backend-e2e.yml`: add Docker Buildx + cache
  - [ ] `_reusable-frontend-e2e.yml`: add Docker Buildx + cache
- [ ] Configure cache keys based on Dockerfile content hash:
  - [ ] Key: `docker-${{ runner.os }}-${{ matrix.backend.name }}-${{ hashFiles('...Dockerfile*') }}`
  - [ ] Restore keys: `docker-${{ runner.os }}-${{ matrix.backend.name }}-`
- [ ] Measure CI times before and after caching:
  - [ ] Record baseline times for 3 consecutive runs (no cache)
  - [ ] Record cached times for 3 consecutive runs (warm cache)
  - [ ] Target: 30-60% reduction for unchanged Dockerfiles
- [ ] Update `codecov-upload.yml` to use composite actions:
  - [ ] Replace inline language setup with composite action calls
  - [ ] Verify all coverage uploads still work
- [ ] Update `test-and-deploy-ayokoding-web.yml` to use reusable workflows
- [ ] Update `test-and-deploy-oseplatform-web.yml` to use reusable workflows

**Validation**: Cached CI runs are measurably faster. All coverage uploads succeed.

### W10: Spec-Coverage Integration

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

### W11: Gherkin Consumption Remediation

FE, content platform, and OrganicLever FE unit tests currently do NOT consume Gherkin specs.
This must be fixed so all test levels verify behavioral specs.

- [ ] Add Gherkin BDD runner to FE unit test setup:
  - [ ] Evaluate vitest-cucumber or playwright-bdd for Vitest-based unit tests
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
  - [ ] Move `specs/apps/rhino-cli/{domain}/*.feature` to `specs/apps/rhino-cli/cli/gherkin/`
  - [ ] Move `specs/apps/ayokoding-cli/links/*.feature` to `specs/apps/ayokoding-cli/cli/gherkin/`
  - [ ] Move `specs/apps/oseplatform-cli/links/*.feature` to `specs/apps/oseplatform-cli/cli/gherkin/`
  - [ ] Update all godog step definition paths in CLI project configs
  - [ ] Update all `inputs` in project.json that reference old spec paths
- [ ] Add missing spec directories:
  - [ ] Create `specs/apps/a-demo/c4/` with README.md
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

- [ ] Delete `pr-quality-gate.yml.bak` (kept as backup during Phase 2)
- [ ] Archive this plan to `plans/done/` with completion date
- [ ] Update `plans/in-progress/README.md` to remove this plan
- [ ] Update `plans/done/README.md` to add this plan

## Success Metrics

| Metric                                   | Before                    | Target                |
| ---------------------------------------- | ------------------------- | --------------------- |
| GitHub Actions workflow files            | 22                        | 12 (-45%)             |
| Total workflow YAML lines                | ~4,500                    | ~1,500 (-67%)         |
| PR quality gate time (TS-only PR)        | ~12 min                   | ~5 min (-58%)         |
| Adding a new backend to CI               | ~3 hours                  | ~30 min (checklist)   |
| Languages with auto-format on commit     | 4 (JS/TS, Go, F#, Elixir) | 9 (+5)                |
| Apps with spec-coverage validation       | 0                         | 25+                   |
| Projects with Gherkin at all test levels | ~15 (BE + CLI only)       | All testable projects |
| Apps with `infra/dev/` Docker Compose    | 18                        | 21 (+3 CLIs)          |
| Redundant FE `test:integration` targets  | 5                         | 0 (removed)           |
| CI Docker cache hit rate                 | 0%                        | 80%+                  |
| Governance docs covering CI              | 0                         | 3 new docs            |
