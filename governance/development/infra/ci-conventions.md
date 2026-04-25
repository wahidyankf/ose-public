---
title: CI/CD Conventions
description: Central reference for CI/CD conventions in the multi-language Nx monorepo, covering git hooks, testing standards, Docker patterns, GitHub Actions structure, and naming rules
category: explanation
subcategory: development
tags:
  - ci-cd
  - git-hooks
  - github-actions
  - docker
  - testing
  - nx
  - coverage
created: 2026-03-31
---

# CI/CD Conventions

Central reference for CI/CD conventions across the multi-language Nx monorepo. This document defines
the standards that apply to all apps regardless of language or framework: git hook behaviour, test
level definitions, coverage thresholds, Docker patterns, GitHub Actions structure, and naming rules.

## Principles Implemented/Respected

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**:
  Every hook step, target name, workflow file, and Docker layer is explicitly documented. No
  implicit behaviour is tolerated — if something runs in CI, it is declared in a workflow file; if
  something runs in a hook, it is declared in the hook script.

- **[Automation Over Manual](../../principles/software-engineering/automation-over-manual.md)**:
  Pre-commit, commit-msg, and pre-push hooks enforce quality automatically on every developer
  machine. Reusable workflows and composite actions keep CI logic DRY, so adding a new app variant
  requires only a thin per-variant file calling shared logic.

- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)**:
  Three hook stages, three test levels, one canonical naming scheme. Per-variant test workflows are
  kept to ~40 lines each by delegating to reusable workflows.

## Conventions Implemented/Respected

- **[File Naming Convention](../../conventions/structure/file-naming.md)**: Workflow files,
  composite action directories, infra directories, and specs directories all follow the naming
  patterns defined in this convention.

- **[Nx Target Standards](./nx-targets.md)**: The targets referenced in this document
  (`test:unit`, `test:integration`, `test:e2e`, `test:quick`, `lint`, `typecheck`) use the
  canonical names and caching rules defined in `nx-targets.md`.

- **[Three-Level Testing Standard](../quality/three-level-testing-standard.md)**: Test level
  definitions (unit, integration, E2E) and the isolation rules enforced here derive from the
  authoritative three-level testing standard.

## Git Hooks Standard

All developer machines run three Husky hooks. Hook logic is implemented via `rhino-cli` subcommands
to keep the raw hook files thin and testable.

### pre-commit

The pre-commit hook delegates entirely to `rhino-cli git pre-commit`, which executes these steps in
order:

| Step | Action                                                                                         | Failure Mode                |
| ---- | ---------------------------------------------------------------------------------------------- | --------------------------- |
| 1    | Validate `.claude/` and `.opencode/` config (YAML, tools, model, skills, semantic equivalence) | Blocks commit               |
| 2    | Validate `docker-compose` files found in staged changes                                        | Blocks commit               |
| 3    | Run `nx affected run-pre-commit` (format checks, lightweight per-project hooks)                | Warn only — does not block  |
| 4    | Stage `ayokoding-web` content files (auto-generated link data)                                 | N/A (staging step)          |
| 5    | Run lint-staged (format all staged files by language)                                          | Blocks commit               |
| 6    | Sync app `package-lock.json` files                                                             | Blocks commit if sync fails |
| 7    | Validate docs file naming convention across staged files                                       | Blocks commit               |
| 8    | Validate markdown links in staged files                                                        | Blocks commit               |
| 9    | Lint all markdown files (`markdownlint-cli2`)                                                  | Blocks commit               |

**Lint-staged language formatters (step 5)**:

| Language / File Type                              | Formatter       |
| ------------------------------------------------- | --------------- |
| JavaScript, TypeScript, JSON, YAML, CSS, Markdown | Prettier        |
| Go                                                | `gofmt`         |
| F#                                                | `fantomas`      |
| Elixir                                            | `mix format`    |
| Python                                            | `ruff format`   |
| Rust                                              | `rustfmt`       |
| C#                                                | `dotnet format` |
| Clojure                                           | `cljfmt`        |
| Dart                                              | `dart format`   |

### commit-msg

The commit-msg hook runs `commitlint` to enforce the [Conventional Commits](https://www.conventionalcommits.org/) format.

**Required format**: `<type>(<scope>): <description>`

Valid types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `revert`.

The scope is optional but recommended. The description must use imperative mood and must not end
with a period.

### pre-push

The pre-push hook runs two commands in sequence:

```bash
nx affected -t typecheck lint test:quick spec-coverage --parallel=cores-1
npm run lint:md
```

`nx affected` computes which projects changed since the merge base and runs only those projects.
`--parallel=cores-1` reserves one core for system responsiveness. `lint:md` runs
`markdownlint-cli2` over all markdown files as a final gate. `spec-coverage` validates that every
Gherkin step has a matching step definition and is compulsory for all apps and E2E runners.

If the pre-push hook times out, warm the Nx cache first:

```bash
npx nx affected -t typecheck lint test:quick spec-coverage
```

Then push again — the cached results make the second run fast.

After the baseline gate, the hook conditionally runs the naming validators when the push range
touches the relevant trees:

- `nx run rhino-cli:validate:naming-agents` — fires when `.claude/agents/**` or `.opencode/agent/**` changed
- `nx run rhino-cli:validate:naming-workflows` — fires when `governance/workflows/**` changed

Both are cacheable, so no-op pushes pay near-zero cost. The CI quality-gate workflow also runs
both targets unconditionally on every PR against `main` to catch drift from hand-edited files
that bypassed the local hook.

## Nx Target Naming and Caching Rules

This document uses the canonical target names defined in [Nx Target Standards](./nx-targets.md).
Refer to that document for:

- The full required target set per project type
- Caching rules per target (`cache: true` / `cache: false`)
- Input declarations required for correct cache invalidation
- The four-dimension tag scheme for `project.json`

Key targets referenced throughout this document:

| Target             | Summary                                                         |
| ------------------ | --------------------------------------------------------------- |
| `test:quick`       | Fast pre-push gate: `test:unit` + coverage validation           |
| `test:unit`        | Isolated unit tests, all dependencies mocked, coverage measured |
| `test:integration` | Real infrastructure, no HTTP layer, not cacheable               |
| `test:e2e`         | Full stack via Playwright, not cacheable                        |
| `lint`             | Static analysis                                                 |
| `typecheck`        | Type verification without producing artifacts                   |

## Three-Level Testing Definitions

The three levels apply universally across all project types. The isolation boundary at each level
is fixed — only the step implementation details change per language and framework.

| Level                                | Dependencies                | HTTP Layer                     | Coverage      | Nx Cache       |
| ------------------------------------ | --------------------------- | ------------------------------ | ------------- | -------------- |
| **Unit** (`test:unit`)               | All mocked                  | None — call functions directly | Measured here | `cache: true`  |
| **Integration** (`test:integration`) | Real infra (DB, filesystem) | None — no HTTP dispatch        | Not measured  | `cache: false` |
| **E2E** (`test:e2e`)                 | All real                    | Real HTTP via Playwright       | Not measured  | `cache: false` |

For the full definition including architecture diagrams, Docker infrastructure requirements, and
per-backend implementation patterns, see the
[Three-Level Testing Standard](../quality/three-level-testing-standard.md).

## App-Type-Specific Test Manifestations

Each app type implements the three levels according to its domain. The table below shows how each
app type realises each level.

| App Type                                                  | Unit (`test:unit`)                                 | Integration (`test:integration`)                                                                   | E2E (`test:e2e`)                                     |
| --------------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **BE API** (`organiclever-be`)                            | BDD, mocked repos, calls service fns directly      | Real PostgreSQL via docker-compose, calls service fns directly (no HTTP)                           | Playwright, real HTTP + real PostgreSQL              |
| **FE** (`organiclever-web`)                               | Vitest, all API calls mocked (MSW / mock services) | MSW with real DOM; in-process mocking only                                                         | Playwright against running FE + BE                   |
| **CLI** (`*-cli`)                                         | Godog, all I/O mocked via function variables       | Godog (`//go:build integration`), real filesystem via `/tmp` fixtures, in-process via `cmd.RunE()` | Not applicable                                       |
| **Content platform** (`ayokoding-web`, `oseplatform-web`) | Vitest, components and tRPC routes mocked          | MSW, in-process mocking                                                                            | Playwright BE E2E (`*-be-e2e`) + FE E2E (`*-fe-e2e`) |
| **Library** (`golang-commons`)                            | Unit tests + Godog, mock closures                  | Godog, tmpdir mocks, cacheable                                                                     | Not applicable                                       |
| **Hugo site** (historical -- no active Hugo sites remain) | Not applicable                                     | Not applicable                                                                                     | Not applicable                                       |
| **E2E runner** (`*-e2e`)                                  | Not applicable                                     | Not applicable                                                                                     | Playwright — this project IS the E2E suite           |

## Gherkin Consumption Matrix

All testable projects must consume Gherkin specifications at every applicable test level. Hugo sites
(historical -- no active Hugo sites remain) were exempt because they had no application logic. E2E
runner projects ARE the Gherkin consumers at the E2E level.

| App Type                   | Unit consumes Gherkin                        | Integration consumes Gherkin | E2E consumes Gherkin              |
| -------------------------- | -------------------------------------------- | ---------------------------- | --------------------------------- |
| BE API (`organiclever-be`) | Yes — `specs/apps/organiclever-be/gherkin/`  | Yes — same specs             | Yes — same specs                  |
| FE (`organiclever-web`)    | Yes — `specs/apps/organiclever-web/gherkin/` | Yes — same specs             | Yes — via `organiclever-web-e2e`  |
| CLI (`*-cli`)              | Yes — `specs/apps/{domain}/cli/gherkin/`     | Yes — same specs             | Not applicable                    |
| Content platform           | Yes — project-local specs                    | Yes — same specs             | Yes — via `*-be-e2e` / `*-fe-e2e` |
| Library                    | Yes — library-specific specs                 | Yes — same specs             | Not applicable                    |
| Hugo site (historical)     | Exempt                                       | Exempt                       | Exempt                            |
| E2E runner                 | Not applicable                               | Not applicable               | Yes — consumes shared specs       |

## Coverage Threshold Rationale

Coverage thresholds are enforced by `rhino-cli test-coverage validate` as part of `test:quick`.
Thresholds differ by project type to reflect the realistic upper bound achievable through mocked
unit tests.

| Threshold | App Types                                              | Rationale                                                                                                                                                                       |
| --------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **90%**   | BE API backends (`organiclever-be`), CLI apps, Go libs | Core business logic with high mock isolation. Service functions operate on pure data structures; 90% is achievable without heroic effort.                                       |
| **80%**   | Content platforms (`ayokoding-web`, `oseplatform-web`) | Significant UI rendering code and Next.js route handlers that are harder to unit-test. Some RSC rendering paths are excluded by design.                                         |
| **70%**   | FE apps (`organiclever-web`)                           | API, auth, and query layers are mocked by design; the mock boundaries limit what can be covered by unit tests. Lower threshold reflects this intentional architecture decision. |

Coverage is measured via the appropriate reporter for each language and converted to LCOV or
JaCoCo XML before being passed to `rhino-cli test-coverage validate`. See `CLAUDE.md` for the
exact command per language.

## Docker Conventions

### Dockerfile Template

All production Dockerfiles follow a multi-stage pattern:

```dockerfile
# syntax=docker/dockerfile:1

# ── Stage 1: dependency manifest layer ──────────────────────────────────────
# Copy only manifest files first so this layer is cached across code changes.
FROM base-image AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ── Stage 2: build ──────────────────────────────────────────────────────────
FROM deps AS builder
COPY . .
RUN npm run build

# ── Stage 3: production runtime ─────────────────────────────────────────────
FROM base-image AS runner
WORKDIR /app

# OCI standard image labels
LABEL org.opencontainers.image.source="https://github.com/open-sharia-enterprise/open-sharia-enterprise"
LABEL org.opencontainers.image.description="App description"

# Run as non-root user
RUN addgroup --system --gid 1001 appgroup \
  && adduser --system --uid 1001 appuser
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
USER appuser

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/main.js"]
```

**Key requirements**:

- **Multi-stage**: Separate dependency installation, build, and runtime stages.
- **Dependency-manifest-first layer ordering**: Copy `package.json` / lock file before source
  code so Docker layer cache survives code-only changes.
- **Non-root user**: All containers run as a non-root system user.
- **HEALTHCHECK with `wget`**: Use `wget` for health checks — never `curl`. Many minimal base
  images (Alpine, distroless) include `wget` but not `curl`.
- **OCI LABEL**: Every production image must carry `org.opencontainers.image.source` and
  `org.opencontainers.image.description` labels.

### Docker Compose Patterns

Three docker-compose file roles exist per app:

| Role            | Path                                        | Purpose                                                               |
| --------------- | ------------------------------------------- | --------------------------------------------------------------------- |
| **Dev**         | `infra/dev/{app}/docker-compose.yml`        | Local development services (databases, message queues, etc.)          |
| **Integration** | `apps/{app}/docker-compose.integration.yml` | Real infrastructure for `test:integration` (PostgreSQL + test runner) |
| **CI overlay**  | `infra/dev/{app}/docker-compose.ci.yml`     | Overrides for CI environment (no volume mounts, deterministic ports)  |

All compose files must pass `docker compose config` without errors before merging. The CI overlay
is applied with `-f docker-compose.yml -f docker-compose.ci.yml` to keep dev and CI configs DRY.

### `.dockerignore` Pattern

Use broad exclusions with narrow inclusions rather than enumerating every excluded path:

```dockerignore
# Exclude everything by default
**

# Include only what the build needs
!apps/{app-name}/
!libs/
!package.json
!package-lock.json
!nx.json
!tsconfig*.json
```

Broad exclusion prevents accidentally including large directories (e.g., `node_modules`, `.git`,
`generated-reports`) that would bloat the build context and slow transfers.

## GitHub Actions Conventions

### File Organisation

| Artifact                  | Path                                          | Purpose                                                          |
| ------------------------- | --------------------------------------------- | ---------------------------------------------------------------- |
| Composite action          | `.github/actions/{name}/action.yml`           | One per language/tool setup (e.g., `setup-golang`, `setup-java`) |
| Reusable workflow         | `.github/workflows/_reusable-{purpose}.yml`   | Shared job logic called by per-variant workflows                 |
| Per-variant test workflow | `.github/workflows/test-{app-name}.yml`       | ~40-line file that calls reusable workflows                      |
| PR quality gate           | `.github/workflows/pr-{purpose}.yml`          | Runs `nx affected` checks on pull requests                       |
| Deploy workflow           | `.github/workflows/test-and-deploy-{app}.yml` | Runs tests then deploys on branch push                           |

The underscore prefix on reusable workflows (`_reusable-*.yml`) visually separates shared
infrastructure from top-level entry-point workflows in the GitHub Actions UI.

### Composite Actions

Each language or tool that requires non-trivial setup lives in its own composite action under
`.github/actions/{name}/action.yml`. A composite action encapsulates:

- Tool version pinning (via Volta, `setup-go`, `setup-java`, etc.)
- Dependency caching configuration
- Any post-setup verification steps

When adding a new language to the monorepo, create a corresponding composite action before wiring
the language into any workflow.

**Examples**:

```
.github/actions/setup-golang/action.yml
.github/actions/setup-java/action.yml
.github/actions/setup-node/action.yml
.github/actions/setup-python/action.yml
```

### Reusable Workflows

Reusable workflows live in `.github/workflows/_reusable-{purpose}.yml` and are called via
`workflow_call`. They contain the actual job definitions (checkout, setup, test execution, artifact
upload). Per-variant test workflows stay thin (~40 lines) by calling these reusable workflows with
variant-specific inputs.

**Examples**:

```
.github/workflows/_reusable-backend-e2e.yml
.github/workflows/_reusable-frontend-e2e.yml
.github/workflows/_reusable-coverage-upload.yml
```

### CRON Schedule

Scheduled workflows (the production `test-and-deploy-*.yml` quartet for ayokoding-web,
oseplatform-web, organiclever, and wahidyankf-web) run twice daily aligned to WIB (UTC+7) business hours:

| WIB Time | UTC Time             | Purpose                                     |
| -------- | -------------------- | ------------------------------------------- |
| 06:00    | 23:00 (previous day) | Morning run — catches overnight regressions |
| 18:00    | 11:00                | Afternoon run — validates pre-EOD state     |

### 5-Track Parallel CRON

Each scheduled test run executes five parallel tracks:

| Track | Nx Target / Command             | Notes                                                                               |
| ----- | ------------------------------- | ----------------------------------------------------------------------------------- |
| 1     | `lint`                          | Static analysis across all affected projects (includes static a11y for UI projects) |
| 2     | `typecheck`                     | Type verification                                                                   |
| 3     | `test:quick`                    | Unit tests + coverage validation                                                    |
| 4     | `spec-coverage`                 | Validates Gherkin step coverage for all apps and E2E runners                        |
| 5     | `test:integration` → `test:e2e` | Sequential: integration then E2E per service                                        |

Tracks 1–4 run in parallel. Track 5 sequences integration before E2E within each service but
services themselves run in parallel across matrix entries.

## Naming Conventions

| Entity              | Pattern                                                                                   | Example                                   |
| ------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------- |
| Backend app         | `{domain}-be` or `{domain}-be-{lang}-{framework}`                                         | `organiclever-be`                         |
| Frontend app        | `{domain}-fe` or `{domain}-fe-{lang}-{framework}`                                         | `organiclever-web`                        |
| Infra dev directory | `infra/dev/{app-name}/`                                                                   | `infra/dev/organiclever-be/`              |
| Specs directory     | See [Specs Directory Structure](../../conventions/structure/specs-directory-structure.md) | `specs/apps/organiclever/be/gherkin/`     |
| Test workflow       | `test-{app-name}.yml`                                                                     | `test-and-deploy-organiclever.yml`        |
| Reusable workflow   | `_reusable-{purpose}.yml`                                                                 | `_reusable-backend-e2e.yml`               |
| Composite action    | `.github/actions/{name}/action.yml`                                                       | `.github/actions/setup-golang/action.yml` |
| Deploy workflow     | `test-and-deploy-{app}.yml`                                                               | `test-and-deploy-organiclever.yml`        |
| PR workflow         | `pr-{purpose}.yml`                                                                        | `pr-quality-gate.yml`                     |

See [GitHub Actions Workflow Naming Convention](./github-actions-workflow-naming.md) for the full
derivation rule between workflow `name:` fields and filenames.

## Adding a New App to CI

Follow this checklist in order when adding a new app variant to the monorepo.

1. Create the app in `apps/{name}/` with a `project.json` that declares all mandatory Nx targets
   for its project type (see [Nx Target Standards](./nx-targets.md) for the required target set).
2. Add Nx tags to `project.json` using the four-dimension scheme: `type:`, `platform:`, `lang:`,
   `domain:`.
3. Create `infra/dev/{name}/` containing `docker-compose.yml`, `docker-compose.ci.yml`, and
   `.env.example`.
4. Write Dockerfiles (`Dockerfile` for production, `Dockerfile.integration` if the integration
   tests run in a container).
5. Create the specs directory following the
   [Specs Directory Structure Convention](../../conventions/structure/specs-directory-structure.md)
   and add at least one `.feature` file.
6. Wire Gherkin consumption in unit tests using the appropriate BDD runner for the language (godog,
   Cucumber, SpecFlow, etc.).
7. Create a per-variant test workflow at `.github/workflows/test-{name}.yml` calling the
   appropriate reusable workflow(s).
8. If the app uses a new language, create a composite action at
   `.github/actions/setup-{lang}/action.yml` before wiring it into any workflow.
9. Add language detection to the PR quality gate workflow so `nx affected` picks up the new
   project type.
10. Update the coverage section of `CLAUDE.md` with the new app's threshold and validate command.

## E2E Test Pairing Rule

Each app pairs with dedicated E2E runner projects for end-to-end testing.

| App Type                                           | E2E Pairing                                    |
| -------------------------------------------------- | ---------------------------------------------- |
| Backend (`organiclever-be`, `ayokoding-web`, etc.) | Dedicated `*-be-e2e` Playwright runner project |
| Frontend (`organiclever-web`, etc.)                | Dedicated `*-fe-e2e` Playwright runner project |
| Content platforms                                  | Both `*-be-e2e` and `*-fe-e2e` runners         |

Each product app has its own dedicated E2E runner (`*-be-e2e`, `*-fe-e2e`) scoped to that product's
scenarios.

## Environment Variable Standard

Every app with runtime configuration must satisfy these requirements:

- **`.env.example` in `infra/dev/{app}/`**: Documents all required and optional environment
  variables with placeholder values and inline comments explaining each variable.
- **`env_file` directive in docker-compose**: Compose services load environment variables via
  `env_file: .env` rather than hardcoding values in the `environment:` block.
- **`.env*.local` in `.gitignore`**: Local override files (`.env.local`, `.env.development.local`,
  etc.) must never be committed. The root `.gitignore` must include `**/.env*.local`.
- **No hardcoded secrets in CI workflows**: GitHub Actions workflows must reference secrets via
  `${{ secrets.SECRET_NAME }}`. Plain-text credentials must never appear in workflow YAML files,
  even in non-production environments.

When a new variable is added to an app, the developer must update `.env.example` in the same
commit. CI will fail if the app starts without the variable, surfacing the omission early.
