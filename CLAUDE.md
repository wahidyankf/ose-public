# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**open-sharia-enterprise** - Enterprise platform for Sharia-compliant business systems built with Nx monorepo architecture.

**Status**: Phase 1 (OrganicLever - Productivity Tracker)
**License**: FSL-1.1-MIT for product apps and behavioral specs (WHAT); MIT for libs and demo implementation code (HOW)
**Main Branch**: `main` (Trunk Based Development)

### Tech Stack

- **Node.js**: 24.13.1 (LTS, managed by Volta)
- **npm**: 11.10.1
- **Monorepo**: Nx workspace
- **Current Apps**:
  - `oseplatform-web` - Next.js 16 content platform (TypeScript, tRPC)
  - `oseplatform-web-be-e2e` - Playwright BE E2E tests for oseplatform-web tRPC API
  - `oseplatform-web-fe-e2e` - Playwright FE E2E tests for oseplatform-web UI
  - `ayokoding-web` - Next.js 16 fullstack content platform (TypeScript, tRPC)
  - `ayokoding-web-be-e2e` - Playwright BE E2E tests for ayokoding-web tRPC API
  - `ayokoding-web-fe-e2e` - Playwright FE E2E tests for ayokoding-web UI
  - `ayokoding-cli` - Go CLI tool for content link validation
  - `rhino-cli` - Go CLI tool for repository management (Repository Hygiene & INtegration Orchestrator; includes `java validate-annotations`)
  - `oseplatform-cli` - Go CLI tool for OSE Platform site maintenance (link validation)
  - `organiclever-fe` - Next.js 16 landing and promotional website (www.organiclever.com)
  - `organiclever-be` - F#/Giraffe REST API backend for OrganicLever
  - `organiclever-fe-e2e` - Playwright FE E2E tests for organiclever-fe
  - `organiclever-be-e2e` - Playwright BE E2E tests for organiclever-be
  - `organiclever-contracts` - OpenAPI 3.1 API contract spec (in `specs/apps/organiclever/contracts/`); generates
    types + encoders/decoders for organiclever apps via `codegen` Nx target
  - `a-demo-be-golang-gin` - Go/Gin REST API backend (default backend)
  - `a-demo-be-java-springboot` - Spring Boot REST API backend (Java Spring Boot, alternative to a-demo-be-golang-gin)
  - `a-demo-be-elixir-phoenix` - Elixir/Phoenix REST API backend (alternative to a-demo-be-golang-gin)
  - `a-demo-be-fsharp-giraffe` - F#/Giraffe REST API backend (alternative to a-demo-be-golang-gin)
  - `a-demo-be-python-fastapi` - Python/FastAPI REST API backend (alternative to a-demo-be-golang-gin)
  - `a-demo-be-rust-axum` - Rust/Axum REST API backend (alternative to a-demo-be-golang-gin)
  - `a-demo-be-kotlin-ktor` - Kotlin/Ktor REST API backend (alternative to a-demo-be-golang-gin)
  - `a-demo-be-java-vertx` - Java/Vert.x REST API backend (alternative to a-demo-be-golang-gin)
  - `a-demo-be-ts-effect` - TypeScript/Effect REST API backend (alternative to a-demo-be-golang-gin)
  - `a-demo-be-csharp-aspnetcore` - C#/ASP.NET Core REST API backend (alternative to a-demo-be-golang-gin)
  - `a-demo-be-clojure-pedestal` - Clojure/Pedestal REST API backend (alternative to a-demo-be-golang-gin)
  - `a-demo-contracts` - OpenAPI 3.1 API contract spec (in `specs/apps/a-demo/contracts/`); generates
    types + encoders/decoders for all demo apps via `codegen` Nx target
  - `a-demo-be-e2e` - Playwright E2E tests for demo-be REST API backends
  - `a-demo-fe-ts-nextjs` - Next.js 16 frontend (TypeScript, App Router)
  - `a-demo-fe-ts-tanstack-start` - TanStack Start frontend (TypeScript, alternative to a-demo-fe-ts-nextjs)
  - `a-demo-fe-dart-flutterweb` - Flutter Web frontend (Dart, alternative to a-demo-fe-ts-nextjs)
  - `a-demo-fe-e2e` - Playwright E2E tests for demo-fe frontends
  - `a-demo-fs-ts-nextjs` - Next.js 16 fullstack app (TypeScript, App Router + Route Handlers)

## Project Structure

```
open-sharia-enterprise/
├── apps/                     # Deployable applications (Nx)
│   ├── oseplatform-web/    # OSE Platform website
│   ├── oseplatform-web-be-e2e/ # Playwright BE E2E tests for oseplatform-web
│   ├── oseplatform-web-fe-e2e/ # Playwright FE E2E tests for oseplatform-web
│   ├── ayokoding-web/       # AyoKoding website (Next.js 16)
│   ├── ayokoding-web-be-e2e/ # Playwright BE E2E tests for ayokoding-web
│   ├── ayokoding-web-fe-e2e/ # Playwright FE E2E tests for ayokoding-web
│   ├── ayokoding-cli/       # Content link validation CLI
│   ├── rhino-cli/          # Repository management CLI (java validate-annotations)
│   ├── oseplatform-cli/     # OSE Platform site CLI
│   ├── organiclever-fe/      # OrganicLever landing website (Next.js)
│   ├── organiclever-be/      # OrganicLever F#/Giraffe REST API backend
│   ├── organiclever-fe-e2e/  # Playwright FE E2E tests for organiclever-fe
│   ├── organiclever-be-e2e/  # Playwright BE E2E tests for organiclever-be
│   ├── a-demo-be-java-springboot/ # Spring Boot REST API (Java Spring Boot)
│   ├── a-demo-be-elixir-phoenix/ # Elixir/Phoenix REST API (alternative implementation)
│   ├── a-demo-be-fsharp-giraffe/ # F#/Giraffe REST API (alternative implementation)
│   ├── a-demo-be-golang-gin/ # Go/Gin REST API (alternative implementation)
│   ├── a-demo-be-python-fastapi/ # Python/FastAPI REST API (alternative implementation)
│   ├── a-demo-be-rust-axum/ # Rust/Axum REST API (alternative implementation)
│   ├── a-demo-be-kotlin-ktor/ # Kotlin/Ktor REST API (alternative implementation)
│   ├── a-demo-be-java-vertx/ # Java/Vert.x REST API (alternative implementation)
│   ├── a-demo-be-ts-effect/ # TypeScript/Effect REST API (alternative implementation)
│   ├── a-demo-be-csharp-aspnetcore/ # C#/ASP.NET Core REST API (alternative implementation)
│   ├── a-demo-be-clojure-pedestal/ # Clojure/Pedestal REST API (alternative implementation)
│   ├── a-demo-be-e2e/ # Playwright E2E tests for backend
│   ├── a-demo-fe-ts-nextjs/ # Next.js 16 frontend (TypeScript)
│   ├── a-demo-fe-ts-tanstack-start/ # TanStack Start frontend (TypeScript)
│   ├── a-demo-fe-dart-flutterweb/ # Flutter Web frontend (Dart)
│   ├── a-demo-fe-e2e/ # Playwright E2E tests for frontend
├── archived/                 # Archived applications (no longer active)
├── apps-labs/                # Experimental apps (NOT in Nx)
├── libs/                     # Reusable libraries (Nx, flat structure)
│   └── golang-commons/      # Shared Go utilities (links checker, output)
├── docs/                     # Documentation (Diátaxis framework)
│   ├── tutorials/           # Learning-oriented
│   ├── how-to/              # Problem-solving
│   ├── reference/           # Technical reference
│   └── explanation/         # Conceptual understanding
├── governance/              # Governance documentation
│   ├── conventions/         # Documentation standards
│   ├── development/         # Development practices
│   ├── principles/          # Core principles
│   ├── workflows/           # Multi-step processes
│   └── vision/              # Project vision
├── plans/                   # Project planning
│   ├── in-progress/         # Active plans
│   ├── backlog/             # Future plans
│   └── done/                # Completed plans
├── .claude/                 # Claude Code configuration
│   ├── agents/              # specialized AI agents
│   └── skills/              # skill packages
├── .husky/                  # Git hooks
├── nx.json                  # Nx workspace config
└── package.json             # Volta pinning + npm workspaces
```

## Common Development Commands

```bash
# Install dependencies (automatically runs doctor to verify tool versions)
npm install

# Build/test/lint all projects
npm run build
npm run lint

# Specific project operations
nx build [project-name]
nx run [project-name]:test:quick
nx lint [project-name]
nx dev [project-name]

# Affected projects only (canonical target names)
nx affected -t build
nx affected -t test:quick
nx affected -t lint

# Three-level test targets
nx run [project-name]:test:unit          # Mocked dependencies, no Docker, cacheable
nx run [project-name]:test:integration   # Demo-be: real PostgreSQL via docker-compose; others: MSW/Godog. NOT cacheable
nx run [project-name]:test:e2e           # Real HTTP via Playwright. NOT cacheable

# Contract codegen (generates types from OpenAPI spec into generated-contracts/)
nx run a-demo-contracts:lint       # Lint + bundle the OpenAPI spec
nx run a-demo-contracts:docs       # Generate browsable API documentation
nx run [project-name]:codegen    # Generate types for a specific app
nx run-many -t codegen --projects=demo-*  # Generate for all demo apps

# Dependency graph
nx graph

# Markdown linting and formatting
npm run lint:md          # Lint all markdown files
npm run lint:md:fix      # Auto-fix markdown violations
npm run format:md        # Format markdown with Prettier
npm run format:md:check  # Check markdown formatting

# Verify local development environment
npm run doctor                    # Check all required tools
npm run doctor -- --fix           # Auto-install missing tools
npm run doctor -- --fix --dry-run # Preview what would be installed
npm run doctor -- --scope minimal # Check only core tools (git, volta, node, npm, go, docker, jq)
```

**Note on `npm install` + doctor**: The comment on `npm install` above says it "automatically runs doctor to verify tool versions". That is literally true — the `postinstall` hook invokes `npm run doctor || true` — but the trailing `|| true` silently swallows doctor failures, so `npm install` can complete while the polyglot toolchain is actually broken. For **worktree setup** (after `git worktree add`, `EnterWorktree`, or entering an existing worktree session), run BOTH `npm install` AND `npm run doctor -- --fix` explicitly in the root worktree, in that order. The explicit `doctor --fix` call is the only action that guarantees the 18+ polyglot toolchains (Go, Java, Rust, Elixir, Python, .NET, Dart, Clojure, Kotlin, C#, Node) converge. See [Worktree Toolchain Initialization](./governance/development/workflow/worktree-setup.md) for the full rationale and procedure.

**See**: [governance/development/infra/nx-targets.md](./governance/development/infra/nx-targets.md) for canonical target names, mandatory targets per project type, and caching rules.

**Coverage thresholds** (all enforced via `rhino-cli test-coverage validate` in `test:quick`):

| Project(s)                                                                                                                            | Threshold | Report format                         | Notes                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------------------------------------- | ------------------------------------------------------ |
| Go CLI projects (`ayokoding-cli`, `oseplatform-cli`, `rhino-cli`, `libs/golang-commons`, `libs/hugo-commons`, `a-demo-be-golang-gin`) | ≥90%      | `cover.out` (go test)                 |                                                        |
| `a-demo-be-ts-effect`                                                                                                                 | ≥90%      | LCOV (Vitest)                         |                                                        |
| `a-demo-be-java-springboot`, `a-demo-be-java-vertx`                                                                                   | ≥90%      | JaCoCo XML                            |                                                        |
| `a-demo-be-kotlin-ktor`                                                                                                               | ≥90%      | Kover JaCoCo XML                      |                                                        |
| `a-demo-be-python-fastapi`                                                                                                            | ≥90%      | LCOV (coverage.py)                    |                                                        |
| `a-demo-be-rust-axum`                                                                                                                 | ≥90%      | LCOV (cargo-llvm-cov)                 |                                                        |
| `a-demo-be-fsharp-giraffe`, `organiclever-be`                                                                                         | ≥90%      | AltCover LCOV (`altcov.info`)         | Uses `--linecover` to avoid F# `task{}` BRDA inflation |
| `a-demo-be-csharp-aspnetcore`                                                                                                         | ≥90%      | Coverlet LCOV (`coverage.info`)       |                                                        |
| `a-demo-be-clojure-pedestal`                                                                                                          | ≥90%      | cloverage LCOV (`--lcov`)             |                                                        |
| `a-demo-be-elixir-phoenix`                                                                                                            | ≥90%      | LCOV (ExCoveralls, `cover/lcov.info`) |                                                        |
| `a-demo-fs-ts-nextjs`                                                                                                                 | ≥75%      | LCOV (Vitest)                         |                                                        |
| `ayokoding-web`, `oseplatform-web`                                                                                                    | ≥80%      | LCOV (Vitest)                         |                                                        |
| `organiclever-fe`, `a-demo-fe-ts-nextjs`, `a-demo-fe-dart-flutterweb`                                                                 | ≥70%      | LCOV                                  | fe threshold: API/auth layers fully mocked by design   |

**`test:integration` caching**: Default `cache: false` in `nx.json`. Demo-be backends use
docker-compose with real PostgreSQL — non-deterministic and must never be cached. Projects using
in-process mocking only (MSW, Godog) override to `cache: true` in their `project.json`:
`organiclever-fe` (MSW), Go CLI apps (Godog at both unit and integration levels), `hugo-commons` (Godog + tmpdir mocks),
`golang-commons` (Godog + mock closures).

**Three-level testing standard** (demo-be backends):

1. **Unit (`test:unit`)**: All mocked dependencies; must consume Gherkin specs from `specs/apps/a-demo/be/gherkin/`; call service functions directly with mocked repositories; coverage measured here (>=90%)
2. **Integration (`test:integration`)**: Real PostgreSQL via docker-compose; **no HTTP calls** (no MockMvc, TestClient, httptest, ConnTest, WebApplicationFactory, fetch, clj-http, Router.oneshot); must consume Gherkin specs; call service functions directly with real DB
3. **E2E (`test:e2e`)**: Full stack via Playwright; real HTTP + real DB; must consume Gherkin specs

All three levels consume the same Gherkin specs — only step implementations change. `test:quick`
includes only `test:unit` + coverage validation. It does NOT include `lint`, `typecheck`,
`test:integration`, or `test:e2e`. `spec-coverage` (`rhino-cli spec-coverage validate`) runs as a
separate Nx target enforced by the pre-push hook; it is active for demo-be backends and most other
projects.

**Three-level testing standard** (Go CLI apps):

1. **Unit (`test:unit`)**: All mocked dependencies; consumes Gherkin specs from `specs/apps/<cli-name>/` via godog (no build tag); mocks all I/O via package-level function variables; coverage measured here (>=90%)
2. **Integration (`test:integration`)**: Real filesystem via `/tmp` fixtures; consumes same Gherkin specs via godog (`//go:build integration`); drives commands in-process via `cmd.RunE()`; cacheable
3. **E2E**: Not applicable for CLI apps

Both unit and integration levels consume the same Gherkin specs — step implementations differ (mocked I/O vs real filesystem). `test:quick` includes `test:unit` (with godog BDD scenarios) + coverage validation.

**Mandatory Nx targets for demo apps**: All `a-demo-be-*` and `a-demo-fe-*` apps must have 7 targets:
`codegen`, `typecheck`, `lint`, `build`, `test:unit`, `test:quick`, `test:integration`. Coverage
thresholds: backends ≥90%, frontends ≥70%.

**Contract enforcement**: All demo apps have a `codegen` Nx target that generates types +
encoders/decoders from the OpenAPI spec at `specs/apps/a-demo/contracts/`. Generated code lives in
`generated-contracts/` (gitignored). The `codegen` target is a dependency of `typecheck` and
`build` — so contract violations are caught by `nx affected -t typecheck` and `test:quick`
in the pre-push hook and PR quality gate. (Exception: Rust and Flutter also declare `codegen` as a
dependency of `test:unit` due to generated code being required at compile time.)

**OrganicLever contract enforcement**: `organiclever-be` and `organiclever-fe` share an OpenAPI 3.1
contract spec at `specs/apps/organiclever/contracts/`. The `organiclever-contracts` project lints
and bundles the spec. Both apps have a `codegen` Nx target generating types into
`generated-contracts/` (gitignored), following the same pattern as demo apps.

**See**: [governance/development/quality/three-level-testing-standard.md](./governance/development/quality/three-level-testing-standard.md)

## Markdown Quality

All markdown files are automatically linted and formatted:

- **Prettier** (v3.6.2): Formatting (runs on pre-commit)
- **markdownlint-cli2** (v0.20.0): Linting (runs on pre-push)
- **Claude Code Hook**: Auto-formats and lints after Edit/Write operations (requires `jq`)

**Quick Fix**: If pre-push hook blocks your push due to markdown violations:

```bash
npm run lint:md:fix
```

**See**: [governance/development/quality/markdown.md](./governance/development/quality/markdown.md)

## Monorepo Architecture

This project uses **Nx** to manage applications and libraries:

- **`apps/`** - Deployable applications (naming: `[domain]-[type]`)
  - Apps import libs but never export
  - Each app independently deployable
  - Apps never import other apps
- **`libs/`** - Reusable libraries (naming: `ts-[name]`, future: `java-*`, `py-*`)
  - Flat structure, no nesting
  - Import via `@open-sharia-enterprise/ts-[lib-name]`
  - Libs can import other libs (no circular dependencies)
- **`apps-labs/`** - Experimental apps outside Nx (framework evaluation, POCs)

**Nx Commands**:

```bash
nx dev [app-name]            # Start development server
nx build [app-name]          # Build specific project
nx affected -t build         # Build only affected projects
nx affected -t test:quick    # Run pre-push quality gate for affected projects
nx graph                     # Visualize dependencies
```

**See**: [docs/reference/monorepo-structure.md](./docs/reference/monorepo-structure.md), [docs/how-to/add-new-app.md](./docs/how-to/add-new-app.md), [governance/development/infra/nx-targets.md](./governance/development/infra/nx-targets.md)

## Git Workflow

**Trunk Based Development** - All development on `main` branch:

- **Default branch**: `main`
- **Environment branches** (Vercel deployment only — never commit directly):
  - `prod-ayokoding-web` → [ayokoding.com](https://ayokoding.com)
  - `prod-oseplatform-web` → [oseplatform.com](https://oseplatform.com)
  - `prod-organiclever-fe` → [www.organiclever.com](https://www.organiclever.com/)
- **Commit format**: Conventional Commits `<type>(<scope>): <description>`
  - Types: feat, fix, docs, style, refactor, perf, test, chore, ci, revert
  - Scope optional but recommended
  - Imperative mood (e.g., "add" not "added")
  - No period at end
- **Split commits by domain**: Different types/domains/concerns should be separate commits

**See**: [governance/development/workflow/commit-messages.md](./governance/development/workflow/commit-messages.md)

## Git Hooks (Automated Quality)

Husky + lint-staged enforce quality:

- **Pre-commit**:
  - Validates `.claude/` and `.opencode/` configuration (if changed in staged files)
    - Validates `.claude/` source format (YAML, tools, model, skills)
    - Auto-syncs `.claude/` → `.opencode/`
    - Validates `.opencode/` output (semantic equivalence)
  - Formats staged files with Prettier (JS/TS/JSON/YAML/CSS/MD), gofmt (Go), and mix format (Elixir)
  - Validates markdown links in staged files
  - Validates all markdown files (markdownlint)
  - Auto-stages changes
- **Commit-msg**: Validates Conventional Commits format (Commitlint)
- **Pre-push**: Runs `typecheck`, `lint`, `test:quick`, and `spec-coverage` for affected projects (parallelism: cores-1)
  - Runs markdown linting
  - All four Nx targets are cacheable — if pre-push times out, run `npx nx affected -t typecheck lint test:quick spec-coverage` first to warm the cache, then push again

**See**: [governance/development/quality/code.md](./governance/development/quality/code.md)

## Documentation Organization

**Diátaxis Framework** - Four categories:

- **Tutorials** (`docs/tutorials/`) - Learning-oriented
- **How-to** (`docs/how-to/`) - Problem-solving
- **Reference** (`docs/reference/`) - Technical specifications
- **Explanation** (`docs/explanation/`) - Conceptual understanding

**File Naming**: Lowercase kebab-case (standard markdown + GitHub compatibility)

**Examples**:

- `file-naming.md` (governance/conventions/structure)
- `getting-started.md` (tutorials)
- `deploy-docker.md` (how-to)

**Exception**: Index files use `README.md` for GitHub compatibility

**See**: [governance/conventions/structure/file-naming.md](./governance/conventions/structure/file-naming.md), [governance/conventions/structure/diataxis-framework.md](./governance/conventions/structure/diataxis-framework.md)

## Core Principles

All work follows foundational principles from `governance/principles/` (key principles listed below — see [Principles Index](./governance/principles/README.md) for the complete list):

- **Deliberate Problem-Solving**: Understand before acting; prefer reversible decisions
- **Simplicity Over Complexity**: Minimum viable abstraction
- **Root Cause Orientation**: Fix root causes, not symptoms; minimal impact; senior engineer standard; proactively fix preexisting errors encountered during work (do not mention and defer)
- **Accessibility First**: WCAG AA compliance, color-blind friendly
- **Documentation First**: Documentation is mandatory, not optional
- **No Time Estimates**: Never give time estimates; focus on outcomes
- **Progressive Disclosure**: Layer complexity; start simple
- **Automation Over Manual**: Automate repetitive tasks
- **Explicit Over Implicit**: Explicit configuration over magic
- **Immutability Over Mutability**: Prefer immutable data structures
- **Pure Functions Over Side Effects**: Functional core, imperative shell
- **Reproducibility First**: Deterministic builds and environments

**See**: [governance/principles/README.md](./governance/principles/README.md)

## Key Conventions

### File Naming

Lowercase kebab-case (`[a-z0-9-]+`) with a standard extension; rule anchored on standard markdown and GitHub compatibility
Exception: `README.md` for index files, `docs/metadata/` files

**See**: [governance/conventions/structure/file-naming.md](./governance/conventions/structure/file-naming.md)

### Linking

GitHub-compatible markdown: `Text` with `.md` extension
Next.js sites (ayokoding-web, oseplatform-web) use standard GitHub-compatible markdown links with `.md` extension

**See**: [governance/conventions/formatting/linking.md](./governance/conventions/formatting/linking.md)

### Indentation

Markdown nested bullets: 2 spaces per level
YAML frontmatter: 2 spaces
Code: language-specific

**See**: [governance/conventions/formatting/indentation.md](./governance/conventions/formatting/indentation.md)

### Emoji Usage

Allowed: `docs/`, README files, `plans/`, `governance/`, CLAUDE.md, `AGENTS.md`, `.claude/agents/`, `.opencode/agent/`, `.opencode/skill/`
Forbidden: config files (`*.json`, `*.yaml`, `*.toml`), source code

**See**: [governance/conventions/formatting/emoji.md](./governance/conventions/formatting/emoji.md)

### Diagrams

Mermaid diagrams with color-blind friendly palette, proper accessibility

**See**: [governance/conventions/formatting/diagrams.md](./governance/conventions/formatting/diagrams.md)

### Content Quality

Active voice, single H1, proper heading nesting, alt text for images, WCAG AA color contrast

**See**: [governance/conventions/writing/quality.md](./governance/conventions/writing/quality.md)

### Dynamic Collection References

Never hardcode counts of dynamic collections (agents, skills, conventions, practices, principles, workflows) in documentation. Reference the collection by name and link.

**See**: [governance/conventions/writing/dynamic-collection-references.md](./governance/conventions/writing/dynamic-collection-references.md)

## Development Practices

### Functional Programming

Prefer immutability, pure functions, functional core/imperative shell

**See**: [governance/development/pattern/functional-programming.md](./governance/development/pattern/functional-programming.md)

### Implementation Workflow

Make it work → Make it right → Make it fast

**See**: [governance/development/workflow/implementation.md](./governance/development/workflow/implementation.md)

### Reproducible Environments

Volta for Node.js/npm pinning, package-lock.json, .env.example

**See**: [governance/development/workflow/reproducible-environments.md](./governance/development/workflow/reproducible-environments.md)

### Agent Workflow Orchestration

Plan mode for non-trivial tasks (3+ steps or architecture decisions), subagents for focused subtasks, verify before done, autonomous bug fixing, self-improvement loop after corrections

**See**: [governance/development/agents/agent-workflow-orchestration.md](./governance/development/agents/agent-workflow-orchestration.md)

### Manual Verification & CI Blockers

- **Verify behavior**: Playwright MCP for UI, curl for API ([manual-behavioral-verification.md](./governance/development/quality/manual-behavioral-verification.md))
- **CI blockers**: Investigate root cause, fix properly, never bypass ([ci-blocker-resolution.md](./governance/development/quality/ci-blocker-resolution.md))

## AI Agents

**Content Creation**: docs-maker, docs-tutorial-maker, readme-maker, specs-maker, apps-ayokoding-web-general-maker, apps-ayokoding-web-by-example-maker, apps-ayokoding-web-in-the-field-maker, apps-oseplatform-web-content-maker, swe-ui-maker

**Validation**: docs-checker, docs-tutorial-checker, docs-link-general-checker, docs-software-engineering-separation-checker, readme-checker, specs-checker, apps-ayokoding-web-general-checker, apps-ayokoding-web-by-example-checker, apps-ayokoding-web-in-the-field-checker, apps-ayokoding-web-facts-checker, apps-ayokoding-web-link-checker, apps-oseplatform-web-content-checker, swe-code-checker, swe-ui-checker, ci-checker

**Fixing**: docs-fixer, docs-tutorial-fixer, docs-software-engineering-separation-fixer, readme-fixer, specs-fixer, apps-ayokoding-web-general-fixer, apps-ayokoding-web-by-example-fixer, apps-ayokoding-web-in-the-field-fixer, apps-ayokoding-web-facts-fixer, apps-ayokoding-web-link-fixer, apps-oseplatform-web-content-fixer, docs-file-manager, swe-ui-fixer, ci-fixer

**Planning**: plan-maker, plan-checker, plan-executor, plan-execution-checker, plan-fixer

**Development**: swe-elixir-developer, swe-golang-developer, swe-java-developer, swe-python-developer, swe-typescript-developer, swe-e2e-test-developer, swe-dart-developer, swe-kotlin-developer, swe-csharp-developer, swe-fsharp-developer, swe-clojure-developer, swe-rust-developer

**Operations**: apps-ayokoding-web-deployer, apps-oseplatform-web-deployer, apps-organiclever-fe-deployer

**Meta** _(CLAUDE.md grouping — in [agents/README.md](./.claude/agents/README.md) these are distributed by role: Makers, Checkers, Fixers)_: agent-maker, repo-governance-maker, repo-governance-checker, repo-governance-fixer, repo-workflow-maker, repo-workflow-checker, repo-workflow-fixer, social-linkedin-post-maker

**Maker-Checker-Fixer Pattern**: Three-stage workflow with criticality levels (CRITICAL/HIGH/MEDIUM/LOW), confidence assessment (HIGH/MEDIUM/FALSE_POSITIVE)

**Skills Infrastructure**: Agents leverage skills providing two modes:

- **Inline skills** (default) - Inject knowledge into current conversation
- **Fork skills** (`context: fork`) - Skills that trigger subagent spawning, delegating tasks to isolated agent contexts and returning summarized results

Skills serve agents with knowledge and execution services but don't govern them (service relationship, not governance).

### Working with .claude/ and .opencode/ Directories

Edit `.claude/` and `.opencode/` files with the normal `Write` / `Edit` tools. Both paths are pre-authorized in `.claude/settings.json` (`Write(.claude/**)`, `Edit(.claude/**)`, `Write(.opencode/**)`, `Edit(.opencode/**)`), so no approval prompt fires. `Bash` heredoc and `sed` remain fine for bulk mechanical substitutions, but there is no rule against direct edits.

**Applies to all paths**:

- `.claude/agents/*.md` — agent definitions
- `.claude/skills/*/SKILL.md` — skill files
- `.claude/skills/*/reference/*.md` — skill reference modules
- `.opencode/agent/*.md` — OpenCode agent mirrors
- `.opencode/skill/*/SKILL.md` — OpenCode skill mirrors

**See**: [.claude/agents/README.md](./.claude/agents/README.md), [governance/development/pattern/maker-checker-fixer.md](./governance/development/pattern/maker-checker-fixer.md)

## Dual-Mode Configuration (Claude Code + OpenCode)

This repository maintains **dual compatibility** with both Claude Code and OpenCode systems:

- **`.claude/`**: Source of truth (PRIMARY) - All updates happen here first
- **`.opencode/`**: Auto-generated (SECONDARY) - Synced from `.claude/`

**Making Changes:**

1. Edit agents/skills in `.claude/` directory first
2. Run sync script: `npm run sync:claude-to-opencode`
3. Both systems stay synchronized automatically

**Format Differences:**

- **Tools**: Claude Code uses arrays `[Read, Write]`, OpenCode uses boolean flags `{ read: true, write: true }`
- **Models**: Claude Code uses `sonnet`/`haiku` (or omits), OpenCode uses `zai-coding-plan/glm-5.1` (sonnet/opus/omitted), `zai-coding-plan/glm-5-turbo` (haiku)
- **Skills**: Folder structure maintained (`.claude/skills/{name}/SKILL.md` → `.opencode/skill/{name}/SKILL.md`)
- **Permissions**: Claude Code uses `settings.json` permissions, OpenCode uses `opencode.json` permission block (both configured with equivalent access)
- **MCP/Plugins**: Claude Code uses plugins (Context7, Playwright, Nx, LSPs), OpenCode uses MCP servers (Playwright, Nx, Z.ai, Perplexity)

**Security Policy**: Only use skills from trusted sources. All skills in this repository are maintained by the project team.

**See**: [.claude/agents/README.md](./.claude/agents/README.md), [AGENTS.md](./AGENTS.md) for OpenCode documentation

## Repository Architecture

Six-layer governance hierarchy:

- **Layer 0: Vision** - WHY we exist (democratize Shariah-compliant enterprise)
- **Layer 1: Principles** - WHY we value approaches
- **Layer 2: Conventions** - WHAT documentation rules
- **Layer 3: Development** - HOW we develop
- **Layer 4: AI Agents** - WHO enforces rules
- **Layer 5: Workflows** - WHEN we run processes (orchestrated sequences)

**Skills**: Delivery infrastructure serving agents, two modes:

- **Inline skills** - Knowledge injection into current conversation
- **Fork skills** (`context: fork`) - Task delegation to agents in isolated contexts
- Service relationship: Skills serve agents but don't govern them

**See**: [governance/repository-governance-architecture.md](./governance/repository-governance-architecture.md)

## Web Sites

### oseplatform-web

- **URL**: <https://oseplatform.com>
- **Production branch**: `prod-oseplatform-web` → oseplatform.com
- **Framework**: Next.js 16 (App Router, TypeScript, tRPC)
- **Deployment**: Vercel
- **Content**: Marketing site for platform
- **Dev port**: 3100
- **E2E tests**: `oseplatform-web-be-e2e`, `oseplatform-web-fe-e2e`

**Commands**:

```bash
nx dev oseplatform-web                           # Development server (localhost:3100)
nx build oseplatform-web                         # Production build
nx run oseplatform-web:test:quick                # Unit tests + coverage + link validation
nx run oseplatform-web:test:integration          # Integration tests
nx run oseplatform-web-be-e2e:test:e2e           # Backend E2E tests
nx run oseplatform-web-fe-e2e:test:e2e           # Frontend E2E tests
```

**See**: [apps/oseplatform-web/README.md](./apps/oseplatform-web/README.md)

### ayokoding-web

- **URL**: <https://ayokoding.com>
- **Production branch**: `prod-ayokoding-web` → ayokoding.com
- **Framework**: Next.js 16 (App Router, TypeScript, tRPC)
- **Languages**: English (primary), Indonesian
- **Deployment**: Vercel
- **Content**: Educational platform (programming, AI, security)
- **E2E tests**: `ayokoding-web-be-e2e`, `ayokoding-web-fe-e2e`

**Commands**:

```bash
nx dev ayokoding-web                           # Development server (localhost:3101)
nx build ayokoding-web                         # Production build
nx run ayokoding-web:test:quick                # Unit tests + coverage + link validation
nx run ayokoding-web-be-e2e:test:e2e           # Backend E2E tests
nx run ayokoding-web-fe-e2e:test:e2e           # Frontend E2E tests
```

**See**: [apps/ayokoding-web/README.md](./apps/ayokoding-web/README.md)

### organiclever-fe

- **URL**: <https://www.organiclever.com/>
- **Production branch**: `prod-organiclever-fe` → www.organiclever.com
- **Framework**: Next.js 16 (App Router)
- **Deployment**: Vercel
- **Content**: Landing and promotional website for OrganicLever
- **E2E tests**: `organiclever-fe-e2e`
- **Dev port**: 3200

**Commands**:

```bash
nx dev organiclever-fe                     # Development server (localhost:3200)
nx build organiclever-fe                   # Production build
nx run organiclever-fe-e2e:test:e2e        # Run FE E2E tests headlessly
nx run organiclever-fe-e2e:test:e2e:ui    # Run FE E2E tests with Playwright UI
```

**See**: [apps/organiclever-fe/README.md](./apps/organiclever-fe/README.md), [.claude/skills/apps-organiclever-fe-developing-content/SKILL.md](./.claude/skills/apps-organiclever-fe-developing-content/SKILL.md)

### organiclever-be

- **Framework**: F#/Giraffe REST API
- **Deployment**: Kubernetes (staging/production)
- **Content**: Backend API for OrganicLever productivity tracker
- **E2E tests**: `organiclever-be-e2e`
- **Dev port**: 8202
- **Contract**: OpenAPI 3.1 spec at `specs/apps/organiclever/contracts/`

**Commands**:

```bash
nx dev organiclever-be                     # Development server (localhost:8202)
nx build organiclever-be                   # Production build
nx run organiclever-be:test:quick          # Unit tests + coverage validation
nx run organiclever-be:test:integration    # Integration tests with real DB
nx run organiclever-be-e2e:test:e2e        # Run BE E2E tests headlessly
```

## Temporary Files for AI Agents

AI agents use designated directories:

- **`generated-reports/`**: Validation/audit reports (Write + Bash tools required)
  - Pattern: `{agent-family}__{uuid-chain}__{YYYY-MM-DD--HH-MM}__audit.md`
  - Checkers MUST write progressive reports during execution
- **`local-temp/`**: Miscellaneous temporary files

**See**: [governance/development/infra/temporary-files.md](./governance/development/infra/temporary-files.md)

## Plans Organization

Project planning in `plans/` folder:

- **ideas.md**: 1-3 liner ideas
- **backlog/**: Future plans
- **in-progress/**: Active work
- **done/**: Completed plans

**Folder naming**: `YYYY-MM-DD__[project-identifier]/`

**See**: [governance/conventions/structure/plans.md](./governance/conventions/structure/plans.md)

## Important Notes

- **Do NOT stage or commit** unless explicitly instructed. Per-request commits are one-time only.
- **License**: FSL-1.1-MIT for product apps and behavioral specs (WHAT); MIT for libs and demo code (HOW). See [LICENSING-NOTICE.md](./LICENSING-NOTICE.md)
- **AI agent invocation**: Use natural language to invoke agents/workflows
- **Token budget**: Don't worry about token limits - we have reliable compaction
- **No time estimates**: Never give time estimates. Focus on what needs to be done, not how long it takes.

## Related Documentation

- **Conventions Index**: [governance/conventions/README.md](./governance/conventions/README.md) - Documentation writing and organization standards
- **Development Index**: [governance/development/README.md](./governance/development/README.md) - Software development practices and workflows
- **Principles Index**: [governance/principles/README.md](./governance/principles/README.md) - Foundational values governing all layers
- **Agents Index**: [.claude/agents/README.md](./.claude/agents/README.md) - Specialized agents organized by role
- **Workflows Index**: [governance/workflows/README.md](./governance/workflows/README.md) - Orchestrated processes
- **Repository Architecture**: [governance/repository-governance-architecture.md](./governance/repository-governance-architecture.md) - Six-layer governance hierarchy

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
