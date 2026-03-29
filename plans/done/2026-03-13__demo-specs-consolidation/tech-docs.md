# Technical Documentation

## Path Mapping

### Core Spec Paths

| Old Path                      | New Path                       |
| ----------------------------- | ------------------------------ |
| `specs/apps/demo-be/`         | `specs/apps/demo/be/`          |
| `specs/apps/demo-be/gherkin/` | `specs/apps/demo/be/gherkin/`  |
| `specs/apps/demo-be/c4/`      | `specs/apps/demo/c4/` (merged) |
| `specs/apps/demo-fe/`         | `specs/apps/demo/fe/`          |
| `specs/apps/demo-fe/gherkin/` | `specs/apps/demo/fe/gherkin/`  |
| `specs/apps/demo-fe/c4/`      | `specs/apps/demo/c4/` (merged) |

### Path Forms Across Codebase

The old path `specs/apps/demo-be/gherkin` appears in three forms that must all be updated:

1. **Relative from app root**: `../../specs/apps/demo-be/gherkin` (project.json, test configs)
   - New: `../../specs/apps/demo/be/gherkin`

2. **Absolute container path**: `/specs/apps/demo-be/gherkin` (Docker volume mounts, Elixir config)
   - New: `/specs/apps/demo/be/gherkin`

3. **Relative from repo root**: `specs/apps/demo-be/gherkin` (documentation, governance)
   - New: `specs/apps/demo/be/gherkin`

## C4 Merge Strategy

### Context Level (L1) — Full Merge

Combine BE and FE context diagrams into one. The "Demo Application" becomes the system boundary
containing both the frontend and backend. Actors from both diagrams are unified:

- End User (from both)
- Administrator (from both)
- Operations Engineer (from both)
- Service Integrator (BE only)

### Container Level (L2) — Full Merge

Combine into a single diagram showing all runtime containers:

- **SPA** (from FE) — browser-based frontend
- **Static File Server** (from FE) — CDN/Nginx
- **REST API** (from BE) — backend service
- **Database** (from BE) — PostgreSQL
- **File Storage** (from BE) — attachment storage

Data flow: User → SPA → REST API → DB/FS

### Component Level (L3) — Separate Files

The component diagrams remain separate because they describe internal structures of different
containers with fundamentally different vocabularies:

- `component-be.md` — REST API internals (handlers, middleware, services, repositories)
- `component-fe.md` — SPA internals (pages, state stores, API client, guards)

Both reference each other as external systems (dashed boxes).

## Files Requiring Updates

### Category 1: Project Configuration (HIGH priority)

These files contain paths used by Nx to locate specs for `test:unit` and `test:integration`:

| File                                          | Path Form | Notes                        |
| --------------------------------------------- | --------- | ---------------------------- |
| `apps/demo-be-java-springboot/project.json`   | relative  | specs input for test targets |
| `apps/demo-be-java-vertx/project.json`        | relative  | specs input for test targets |
| `apps/demo-be-kotlin-ktor/project.json`       | relative  | specs input for test targets |
| `apps/demo-be-golang-gin/project.json`        | relative  | specs input for test targets |
| `apps/demo-be-python-fastapi/project.json`    | relative  | specs input for test targets |
| `apps/demo-be-rust-axum/project.json`         | relative  | specs input for test targets |
| `apps/demo-be-ts-effect/project.json`         | relative  | specs input for test targets |
| `apps/demo-be-fsharp-giraffe/project.json`    | relative  | specs input for test targets |
| `apps/demo-be-elixir-phoenix/project.json`    | relative  | specs input for test targets |
| `apps/demo-be-csharp-aspnetcore/project.json` | relative  | specs input for test targets |
| `apps/demo-be-clojure-pedestal/project.json`  | relative  | specs input for test targets |
| `apps/demo-be-e2e/playwright.config.ts`       | relative  | E2E spec discovery           |

### Category 2: Build Configuration (HIGH priority)

| File                                        | Path Form | Notes                               |
| ------------------------------------------- | --------- | ----------------------------------- |
| `apps/demo-be-java-springboot/pom.xml`      | relative  | maven-resources-plugin copies specs |
| `apps/demo-be-java-vertx/pom.xml`           | relative  | maven-resources-plugin copies specs |
| `apps/demo-be-kotlin-ktor/build.gradle.kts` | relative  | Gradle copies specs                 |

### Category 3: Test Runner Configuration (HIGH priority)

| File                                                            | Path Form | Notes                           |
| --------------------------------------------------------------- | --------- | ------------------------------- |
| `apps/demo-be-golang-gin/internal/bdd/suite_test.go`            | relative  | Godog suite features path       |
| `apps/demo-be-golang-gin/internal/integration/suite_test.go`    | relative  | Godog suite features path       |
| `apps/demo-be-golang-gin/internal/integration_pg/suite_test.go` | relative  | Godog suite features path       |
| `apps/demo-be-python-fastapi/tests/unit/conftest.py`            | relative  | GHERKIN_ROOT                    |
| `apps/demo-be-python-fastapi/tests/integration/conftest.py`     | relative  | GHERKIN_ROOT                    |
| `apps/demo-be-rust-axum/tests/unit/main.rs`                     | relative  | Cucumber features path          |
| `apps/demo-be-rust-axum/tests/integration/main.rs`              | absolute  | Cucumber features path (Docker) |
| `apps/demo-be-ts-effect/.cucumber.js`                           | relative  | CucumberJS paths config         |
| `apps/demo-be-ts-effect/cucumber.js`                            | relative  | CucumberJS paths config         |
| `apps/demo-be-ts-effect/cucumber.unit.js`                       | relative  | CucumberJS paths config         |
| `apps/demo-be-elixir-phoenix/config/test.exs`                   | relative  | Cabbage features path           |
| `apps/demo-be-elixir-phoenix/config/integration.exs`            | absolute  | Docker container path           |

### Category 4: Docker Configuration (HIGH priority)

| File                                                         | Path Form | Notes                     |
| ------------------------------------------------------------ | --------- | ------------------------- |
| `apps/demo-be-fsharp-giraffe/Dockerfile.integration`         | absolute  | COPY specs path           |
| `apps/demo-be-csharp-aspnetcore/Dockerfile.integration`      | absolute  | COPY specs path           |
| `apps/demo-be-kotlin-ktor/Dockerfile.integration`            | absolute  | CMD mkdir/cp specs path   |
| `apps/demo-be-ts-effect/Dockerfile.integration`              | absolute  | CMD cp specs path         |
| `apps/demo-be-clojure-pedestal/Dockerfile.integration`       | absolute  | COPY/CMD specs path       |
| `apps/demo-be-python-fastapi/docker-compose.integration.yml` | relative  | volume mount              |
| `infra/dev/demo-be-*/docker-compose.yml`                     | relative  | volume mounts (~10 files) |

### Category 5: Documentation (LOW priority)

| File                                                                                                   | Notes                                   |
| ------------------------------------------------------------------------------------------------------ | --------------------------------------- |
| `CLAUDE.md`                                                                                            | Three-level testing standard references |
| `apps/demo-be-*/README.md`                                                                             | ~8 backend app READMEs                  |
| `apps/demo-be-e2e/README.md`                                                                           | E2E test suite README                   |
| `governance/development/infra/bdd-spec-test-mapping.md`                                                | Spec mapping convention                 |
| `governance/development/quality/three-level-testing-standard.md`                                       | Testing standard                        |
| `governance/development/infra/nx-targets.md`                                                           | Nx target docs                          |
| `docs/explanation/software-engineering/automation-testing/tools/playwright/ex-soen-aute-to-pl__bdd.md` | BDD Playwright docs                     |
| `governance/conventions/formatting/diagrams.md`                                                        | C4 example path references              |
| `governance/workflows/specs/specs-validation.md`                                                       | Workflow example paths                  |
| `specs/apps-labs/README.md`                                                                            | Cross-reference to demo specs           |
| `.claude/agents/specs-checker.md`                                                                      | Example folder paths                    |
| `.claude/agents/specs-maker.md`                                                                        | Example target paths                    |
| `.claude/agents/specs-fixer.md`                                                                        | Example paths                           |
| `specs/apps/demo/be/README.md`                                                                         | New — adapted from old demo-be README   |
| `specs/apps/demo/fe/README.md`                                                                         | New — adapted from old demo-fe README   |

### Category 6: Historical Plans (LOW priority — update only if trivial)

Files in `plans/done/` reference old paths. These are historical records. Update references
but do not restructure completed plan content.

## Migration Approach

### Step 1: Create New Structure (git mv)

```bash
# Create parent directory
mkdir -p specs/apps/demo

# Move BE specs (gherkin only — C4 will be merged separately)
mkdir -p specs/apps/demo/be
git mv specs/apps/demo-be/gherkin specs/apps/demo/be/gherkin
git mv specs/apps/demo-be/.gitignore specs/apps/demo/be/ 2>/dev/null || true

# Move FE specs (gherkin only)
mkdir -p specs/apps/demo/fe
git mv specs/apps/demo-fe/gherkin specs/apps/demo/fe/gherkin

# Remove old directories (after extracting content)
git rm -r specs/apps/demo-be/
git rm -r specs/apps/demo-fe/
```

### Step 2: Create Unified C4

Write new merged C4 diagrams at `specs/apps/demo/c4/`. Do not `git mv` the old C4 files since
the content is being merged/rewritten.

### Step 3: Create README Files

Write new README.md files at every level:

- `specs/apps/demo/README.md` — unified overview
- `specs/apps/demo/c4/README.md` — C4 index
- `specs/apps/demo/be/README.md` — adapted from old demo-be README
- `specs/apps/demo/be/gherkin/README.md` — already exists (moved)
- `specs/apps/demo/fe/README.md` — adapted from old demo-fe README
- `specs/apps/demo/fe/gherkin/README.md` — already exists (moved)

### Step 4: Specs Validation Gate (OCD Mode)

Before touching any application code, validate the merged specs are internally consistent:

```bash
# Run specs-validation workflow in OCD mode
# Validates: specs/apps/demo/ and all subfolders (be/, fe/, c4/)
# Mode: ocd (fix ALL levels — CRITICAL, HIGH, MEDIUM, LOW)
# Cross-folder: checks be/ ↔ fe/ consistency (shared domains, actors, terminology)
```

**What this catches before rewiring**:

- Missing or incorrect README counts (feature files, scenarios)
- Gherkin format issues (Background steps, naming conventions)
- C4 diagram inconsistencies (merged L1/L2 referencing actors not in both perspectives)
- Cross-reference broken links (old paths remaining in moved files)
- `be/` ↔ `fe/` consistency (shared domains like authentication, expenses should align)
- Spec-to-implementation alignment (README references to non-existent implementations)

**Why here**: Fixing spec issues in isolation (only `specs/apps/demo/`) is cheap. After rewiring
107+ files across 11 backends, any spec fix would require re-validating everything downstream.

Commit any fixes from the validation before proceeding.

### Step 5: Global Find-and-Replace

Run targeted replacements across the codebase:

```
specs/apps/demo-be/gherkin  →  specs/apps/demo/be/gherkin
specs/apps/demo-be/c4       →  specs/apps/demo/c4
specs/apps/demo-be/          →  specs/apps/demo/be/
specs/apps/demo-be            →  specs/apps/demo/be
/specs/apps/demo-be/gherkin  →  /specs/apps/demo/be/gherkin
specs/apps/demo-fe/gherkin   →  specs/apps/demo/fe/gherkin
specs/apps/demo-fe/c4        →  specs/apps/demo/c4
specs/apps/demo-fe/           →  specs/apps/demo/fe/
specs/apps/demo-fe            →  specs/apps/demo/fe
```

**Order matters**: Replace longer, more specific paths first to avoid partial replacements.

### Step 6: Validate Locally

1. `grep -r "specs/apps/demo-be" .` — should return nothing (except plans/done/)
2. `grep -r "specs/apps/demo-fe" .` — should return nothing (except plans/done/)
3. `npm run lint:md` and `npm run format:md:check` — markdown quality passes
4. `nx affected -t lint` — all linting passes
5. `nx affected -t typecheck` — all typechecks pass
6. `nx run-many -t test:quick` for all 11 demo-be backends — all pass
7. `nx run organiclever-fe:test:quick` and CLI tools — all pass

### Step 7: Validate on GitHub Actions

1. Push to main
2. Main CI passes (runs `test:quick` for all affected projects)
3. Trigger all 11 integration + E2E workflows manually (`gh workflow run`)
4. Trigger `test-integration-e2e-organiclever-fe` manually
5. Verify all 11 backend integration + E2E workflows pass
6. Verify organiclever-fe integration + E2E passes
7. Verify PR workflows (validate-links, format, quality-gate) have no issues

## Risk Mitigation

| Risk                          | Mitigation                                                             |
| ----------------------------- | ---------------------------------------------------------------------- |
| Broken Docker volume mounts   | Test integration suite locally for at least one backend before push    |
| Missed path reference         | Comprehensive grep after migration; CI catches functional breaks       |
| C4 diagram merge loses detail | Keep component-level diagrams separate; only merge context/container   |
| Git history lost              | Use `git mv` for Gherkin files; C4 rewrite is acceptable (small files) |
| Intermediate broken state     | Do the entire migration in one commit to avoid bisect issues           |
