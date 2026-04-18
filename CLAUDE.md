# CLAUDE.md

Guidance for Claude Code (claude.ai/code) working with code in this repository.

## Project Overview

**open-sharia-enterprise** - Enterprise platform for Sharia-compliant business systems, Nx monorepo.

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
  - `organiclever-contracts` - OpenAPI 3.1 API contract spec (in `specs/apps/organiclever/contracts/`); generates types + encoders/decoders for organiclever apps via `codegen` Nx target

Polyglot demo apps (11 backend implementations + 3 frontends + 1 fullstack) were extracted 2026-04-18 to the downstream [`ose-primer`](https://github.com/wahidyankf/ose-primer) template, which is now authoritative for the polyglot showcase.

## Project Structure

```
ose-public/
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
nx run organiclever-contracts:lint   # Lint + bundle the OpenAPI spec
nx run organiclever-contracts:docs   # Generate browsable API documentation
nx run [project-name]:codegen        # Generate types for a specific app

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

**Note on `npm install` + doctor**: `postinstall` hook runs `npm run doctor || true` — trailing `|| true` swallows doctor failures silently. `npm install` can complete while polyglot toolchain broken. For **worktree setup** (after `git worktree add`, `EnterWorktree`, or entering existing worktree session), run BOTH `npm install` AND `npm run doctor -- --fix` explicitly in root worktree, that order. Explicit `doctor --fix` only action guaranteeing 18+ polyglot toolchains (Go, Java, Rust, Elixir, Python, .NET, Dart, Clojure, Kotlin, C#, Node) converge. See [Worktree Toolchain Initialization](./governance/development/workflow/worktree-setup.md) for full rationale and procedure.

**See**: [governance/development/infra/nx-targets.md](./governance/development/infra/nx-targets.md) for canonical target names, mandatory targets per project type, and caching rules.

**Coverage thresholds** (all enforced via `rhino-cli test-coverage validate` in `test:quick`):

| Project(s)                                                                                                    | Threshold | Report format                 | Notes                                                  |
| ------------------------------------------------------------------------------------------------------------- | --------- | ----------------------------- | ------------------------------------------------------ |
| Go CLI projects (`ayokoding-cli`, `oseplatform-cli`, `rhino-cli`, `libs/golang-commons`, `libs/hugo-commons`) | ≥90%      | `cover.out` (go test)         |                                                        |
| `organiclever-be`                                                                                             | ≥90%      | AltCover LCOV (`altcov.info`) | Uses `--linecover` to avoid F# `task{}` BRDA inflation |
| `ayokoding-web`, `oseplatform-web`                                                                            | ≥80%      | LCOV (Vitest)                 |                                                        |
| `organiclever-fe`                                                                                             | ≥70%      | LCOV                          | fe threshold: API/auth layers fully mocked by design   |

**`test:integration` caching**: Default `cache: false` in `nx.json`. Projects using in-process mocking only (MSW, Godog) override to `cache: true` in their `project.json`: `organiclever-fe` (MSW), Go CLI apps (Godog at both unit and integration levels), `hugo-commons` (Godog + tmpdir mocks), `golang-commons` (Godog + mock closures).

**Three-level testing standard** (Go CLI apps):

1. **Unit (`test:unit`)**: All mocked deps; consumes Gherkin specs from `specs/apps/<cli-name>/` via godog (no build tag); mocks all I/O via package-level function variables; coverage measured here (>=90%)
2. **Integration (`test:integration`)**: Real filesystem via `/tmp` fixtures; consumes same Gherkin specs via godog (`//go:build integration`); drives commands in-process via `cmd.RunE()`; cacheable
3. **E2E**: Not applicable for CLI apps

Both unit and integration levels consume same Gherkin specs — step implementations differ (mocked I/O vs real filesystem). `test:quick` includes `test:unit` (with godog BDD scenarios) + coverage validation.

**OrganicLever contract enforcement**: `organiclever-be` and `organiclever-fe` share OpenAPI 3.1 contract spec at `specs/apps/organiclever/contracts/`. `organiclever-contracts` project lints and bundles spec. Both apps have `codegen` Nx target generating types into `generated-contracts/` (gitignored). `codegen` is a dependency of `typecheck` and `build` — contract violations caught by `nx affected -t typecheck` and `test:quick` in pre-push hook and PR quality gate.

For the broader polyglot three-level testing examples (demo backends in Go, Java, Elixir, F#, Python, Rust, Kotlin, TypeScript, C#, Clojure), see the downstream [`ose-primer`](https://github.com/wahidyankf/ose-primer) repository.

**See**: [governance/development/quality/three-level-testing-standard.md](./governance/development/quality/three-level-testing-standard.md)

## Markdown Quality

All markdown files auto-linted and formatted:

- **Prettier** (v3.6.2): Formatting (runs on pre-commit)
- **markdownlint-cli2** (v0.20.0): Linting (runs on pre-push)
- **Claude Code Hook**: Auto-formats and lints after Edit/Write operations (requires `jq`)

**Quick Fix**: If pre-push hook blocks push due to markdown violations:

```bash
npm run lint:md:fix
```

**See**: [governance/development/quality/markdown.md](./governance/development/quality/markdown.md)

## Monorepo Architecture

Uses **Nx** to manage apps and libs:

- **`apps/`** - Deployable apps (naming: `[domain]-[type]`)
  - Apps import libs but never export
  - Each app independently deployable
  - Apps never import other apps
- **`libs/`** - Reusable libraries (naming: `ts-[name]`, future: `java-*`, `py-*`)
  - Flat structure, no nesting
  - Import via `@open-sharia-enterprise/ts-[lib-name]`
  - Libs can import other libs (no circular deps)
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

**Trunk Based Development** - All development on `main`:

- **Default branch**: `main`
- **Environment branches** (Vercel deployment only — never commit directly):
  - `prod-ayokoding-web` → [ayokoding.com](https://ayokoding.com)
  - `prod-oseplatform-web` → [oseplatform.com](https://oseplatform.com)
  - `prod-organiclever-web` → [www.organiclever.com](https://www.organiclever.com/)
- **Commit format**: Conventional Commits `<type>(<scope>): <description>`
  - Types: feat, fix, docs, style, refactor, perf, test, chore, ci, revert
  - Scope optional but recommended
  - Imperative mood (e.g., "add" not "added")
  - No period at end
- **Split commits by domain**: Different types/domains/concerns = separate commits

**See**: [governance/development/workflow/commit-messages.md](./governance/development/workflow/commit-messages.md)

## Git Hooks (Automated Quality)

Husky + lint-staged enforce quality:

- **Pre-commit**:
  - Validates `.claude/` and `.opencode/` config (if changed in staged files)
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
  - All four Nx targets cacheable — if pre-push times out, run `npx nx affected -t typecheck lint test:quick spec-coverage` first to warm cache, then push again

**See**: [governance/development/quality/code.md](./governance/development/quality/code.md)

## Documentation Organization

**Diátaxis Framework** - Four categories:

- **Tutorials** (`docs/tutorials/`) - Learning-oriented
- **How-to** (`docs/how-to/`) - Problem-solving
- **Reference** (`docs/reference/`) - Technical specs
- **Explanation** (`docs/explanation/`) - Conceptual understanding

**File Naming**: Lowercase kebab-case (standard markdown + GitHub compatibility)

**Examples**:

- `file-naming.md` (governance/conventions/structure)
- `getting-started.md` (tutorials)
- `deploy-docker.md` (how-to)

**Exception**: Index files use `README.md` for GitHub compatibility

**See**: [governance/conventions/structure/file-naming.md](./governance/conventions/structure/file-naming.md), [governance/conventions/structure/diataxis-framework.md](./governance/conventions/structure/diataxis-framework.md)

## Core Principles

All work follows foundational principles from `governance/principles/` (key ones below — see [Principles Index](./governance/principles/README.md) for complete list):

- **Deliberate Problem-Solving**: Understand before acting; prefer reversible decisions
- **Simplicity Over Complexity**: Minimum viable abstraction
- **Root Cause Orientation**: Fix root causes, not symptoms; minimal impact; senior engineer standard; proactively fix preexisting errors encountered during work (do not mention and defer)
- **Accessibility First**: WCAG AA compliance, color-blind friendly
- **Documentation First**: Documentation mandatory, not optional
- **No Time Estimates**: Never give time estimates; focus on outcomes
- **Progressive Disclosure**: Layer complexity; start simple
- **Automation Over Manual**: Automate repetitive tasks
- **Explicit Over Implicit**: Explicit config over magic
- **Immutability Over Mutability**: Prefer immutable data structures
- **Pure Functions Over Side Effects**: Functional core, imperative shell
- **Reproducibility First**: Deterministic builds and environments

**See**: [governance/principles/README.md](./governance/principles/README.md)

## Key Conventions

### File Naming

Lowercase kebab-case (`[a-z0-9-]+`) with standard extension; rule anchored on standard markdown and GitHub compatibility
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

Never hardcode counts of dynamic collections (agents, skills, conventions, practices, principles, workflows) in docs. Reference collection by name and link.

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

**Validation**: docs-checker, docs-tutorial-checker, docs-link-checker, docs-software-engineering-separation-checker, readme-checker, specs-checker, apps-ayokoding-web-general-checker, apps-ayokoding-web-by-example-checker, apps-ayokoding-web-in-the-field-checker, apps-ayokoding-web-facts-checker, apps-ayokoding-web-link-checker, apps-oseplatform-web-content-checker, swe-code-checker, swe-ui-checker, ci-checker

**Fixing**: docs-fixer, docs-tutorial-fixer, docs-software-engineering-separation-fixer, readme-fixer, specs-fixer, apps-ayokoding-web-general-fixer, apps-ayokoding-web-by-example-fixer, apps-ayokoding-web-in-the-field-fixer, apps-ayokoding-web-facts-fixer, apps-ayokoding-web-link-fixer, apps-oseplatform-web-content-fixer, docs-file-manager, swe-ui-fixer, ci-fixer

**Planning**: plan-maker, plan-checker, plan-execution-checker, plan-fixer (see [plan-execution workflow](./governance/workflows/plan/plan-execution.md))

**Development**: swe-elixir-dev, swe-golang-dev, swe-java-dev, swe-python-dev, swe-typescript-dev, swe-e2e-dev, swe-dart-dev, swe-kotlin-dev, swe-csharp-dev, swe-fsharp-dev, swe-clojure-dev, swe-rust-dev

**Operations**: apps-ayokoding-web-deployer, apps-oseplatform-web-deployer, apps-organiclever-fe-deployer

**Meta** _(CLAUDE.md grouping — in [agents/README.md](./.claude/agents/README.md) distributed by role: Makers, Checkers, Fixers)_: agent-maker, repo-rules-maker, repo-rules-checker, repo-rules-fixer, repo-workflow-maker, repo-workflow-checker, repo-workflow-fixer, social-linkedin-post-maker

**Maker-Checker-Fixer Pattern**: Three-stage workflow with criticality levels (CRITICAL/HIGH/MEDIUM/LOW), confidence assessment (HIGH/MEDIUM/FALSE_POSITIVE)

**Web Research Default**: `web-research-maker` is the default primitive for public-web information gathering across all agents. See [Web Research Delegation Convention](./governance/conventions/writing/web-research-delegation.md) for the normative rule, delegation threshold (2+ `WebSearch` or 3+ `WebFetch` per claim), and enumerated exceptions (single-shot known URL; fixer re-validation; link-reachability checkers).

**Skills Infrastructure**: Agents leverage skills providing two modes:

- **Inline skills** (default) - Inject knowledge into current conversation
- **Fork skills** (`context: fork`) - Trigger subagent spawning, delegate tasks to isolated agent contexts, return summarized results

Skills serve agents with knowledge and execution services but don't govern them (service relationship, not governance).

### Working with .claude/ and .opencode/ Directories

Edit `.claude/` and `.opencode/` files with normal `Write` / `Edit` tools. Both paths pre-authorized in `.claude/settings.json` (`Write(.claude/**)`, `Edit(.claude/**)`, `Write(.opencode/**)`, `Edit(.opencode/**)`), no approval prompt fires. `Bash` heredoc and `sed` remain fine for bulk mechanical substitutions, but no rule against direct edits.

**Applies to all paths**:

- `.claude/agents/*.md` — agent definitions
- `.claude/skills/*/SKILL.md` — skill files
- `.claude/skills/*/reference/*.md` — skill reference modules
- `.opencode/agent/*.md` — OpenCode agent mirrors
- `.opencode/skill/*/SKILL.md` — OpenCode skill mirrors

**See**: [.claude/agents/README.md](./.claude/agents/README.md), [governance/development/pattern/maker-checker-fixer.md](./governance/development/pattern/maker-checker-fixer.md), [Agent Naming Convention](./governance/conventions/structure/agent-naming.md), [Workflow Naming Convention](./governance/conventions/structure/workflow-naming.md)

## Dual-Mode Configuration (Claude Code + OpenCode)

Repo maintains **dual compatibility** with Claude Code and OpenCode:

- **`.claude/`**: Source of truth (PRIMARY) - All updates happen here first
- **`.opencode/`**: Auto-generated (SECONDARY) - Synced from `.claude/`

**Making Changes:**

1. Edit agents/skills in `.claude/` first
2. Run sync: `npm run sync:claude-to-opencode`
3. Both systems stay synced automatically

**Format Differences:**

- **Tools**: Claude Code uses arrays `[Read, Write]`, OpenCode uses boolean flags `{ read: true, write: true }`
- **Models**: Claude Code uses `sonnet`/`haiku` (or omits), OpenCode uses `zai-coding-plan/glm-5.1` (sonnet/opus/omitted), `zai-coding-plan/glm-5-turbo` (haiku)
- **Skills**: Folder structure maintained (`.claude/skills/{name}/SKILL.md` → `.opencode/skill/{name}/SKILL.md`)
- **Permissions**: Claude Code uses `settings.json` permissions, OpenCode uses `opencode.json` permission block (both configured with equivalent access)
- **MCP/Plugins**: Claude Code uses plugins (Context7, Playwright, Nx, LSPs), OpenCode uses MCP servers (Playwright, Nx, Z.ai, Perplexity)

**Security Policy**: Only use skills from trusted sources. All skills in this repo maintained by project team.

**See**: [.claude/agents/README.md](./.claude/agents/README.md), [AGENTS.md](./AGENTS.md) for OpenCode docs

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
- **Production branch**: `prod-organiclever-web` → www.organiclever.com
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
- **`local-temp/`**: Misc temporary files

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

- **Do NOT stage or commit** unless explicitly instructed. Per-request commits one-time only.
- **License**: FSL-1.1-MIT for product apps and behavioral specs (WHAT); MIT for libs and demo code (HOW). See [LICENSING-NOTICE.md](./LICENSING-NOTICE.md)
- **AI agent invocation**: Use natural language to invoke agents/workflows
- **Token budget**: Don't worry about token limits - reliable compaction available
- **No time estimates**: Never give time estimates. Focus on what needs doing, not how long.

## Related Documentation

- **Conventions Index**: [governance/conventions/README.md](./governance/conventions/README.md) - Documentation writing and org standards
- **Development Index**: [governance/development/README.md](./governance/development/README.md) - Software dev practices and workflows
- **Principles Index**: [governance/principles/README.md](./governance/principles/README.md) - Foundational values governing all layers
- **Agents Index**: [.claude/agents/README.md](./.claude/agents/README.md) - Specialized agents organized by role
- **Workflows Index**: [governance/workflows/README.md](./governance/workflows/README.md) - Orchestrated processes
- **Repository Architecture**: [governance/repository-governance-architecture.md](./governance/repository-governance-architecture.md) - Six-layer governance hierarchy

## Related Repositories

`ose-public` is the **upstream source of truth**. A downstream template repository, [`ose-primer`](https://github.com/wahidyankf/ose-primer), is a public MIT-licensed template packaging the scaffolding layer (governance, AI agents, skills, conventions, CI harness, polyglot demo apps) for teams building their own Sharia-compliant enterprise products. `ose-public` uses per-directory licensing (FSL-1.1-MIT for product apps, MIT for scaffolding); `ose-primer` is MIT throughout and intentionally excludes the FSL product layer.

Content flows in both directions under classifier-driven rules:

- **Propagation** (`ose-public` → `ose-primer`): scaffolding improvements authored upstream flow to the template via `repo-ose-primer-propagation-maker`. Always via pull request against the primer's `main` branch; never direct commits.
- **Adoption** (`ose-primer` → `ose-public`): generic improvements contributed downstream can flow back via `repo-ose-primer-adoption-maker`. Applied to `ose-public` as direct commits to `main` per Trunk-Based Development.

Product-specific paths (`apps/organiclever-*`, `apps/ayokoding-*`, `apps/oseplatform-*`, product specs, product roadmap, product plans) are classified `neither` and never sync.

See: [Related Repositories reference](./docs/reference/related-repositories.md), [ose-primer sync convention](./governance/conventions/structure/ose-primer-sync.md).

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring workspace, invoke `nx-workspace` skill first - has patterns for querying projects, targets, and deps
- When running tasks (build, lint, test, e2e, etc.), prefer running through `nx` (`nx run`, `nx run-many`, `nx affected`) instead of underlying tooling directly
- Prefix nx commands with workspace package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to Nx MCP server and its tools, use them
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin config, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you know
- `nx-generate` skill handles generator discovery internally - don't call nx_docs to look up generator syntax

<!-- nx configuration end-->

<!-- rtk-instructions v2 -->

# RTK (Rust Token Killer) - Token-Optimized Commands

## Golden Rule

**Always prefix commands with `rtk`**. If RTK has dedicated filter, uses it. If not, passes through unchanged. RTK always safe to use.

**Important**: Even in command chains with `&&`, use `rtk`:

```bash
# ❌ Wrong
git add . && git commit -m "msg" && git push

# ✅ Correct
rtk git add . && rtk git commit -m "msg" && rtk git push
```

## Meta Commands

```bash
rtk gain              # Show token savings analytics
rtk gain --history    # Show command usage history with savings
rtk discover          # Analyze Claude Code history for missed opportunities
rtk proxy <cmd>       # Execute raw command without filtering (for debugging)
```

Full command reference with all workflows and savings: <https://github.com/rtk-ai/rtk>

<!-- /rtk-instructions -->
