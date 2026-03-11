# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**open-sharia-enterprise** - Enterprise platform for Sharia-compliant business systems built with Nx monorepo architecture.

**Status**: Phase 1 (OrganicLever - Productivity Tracker)
**License**: MIT
**Main Branch**: `main` (Trunk Based Development)

### Tech Stack

- **Node.js**: 24.13.1 (LTS, managed by Volta)
- **npm**: 11.10.1
- **Monorepo**: Nx workspace
- **Current Apps**:
  - `oseplatform-web` - Hugo static site (PaperMod theme)
  - `ayokoding-web` - Hugo static site (Hextra theme, bilingual)
  - `ayokoding-cli` - Go CLI tool for content automation
  - `rhino-cli` - Go CLI tool for repository management (Repository Hygiene & INtegration Orchestrator; includes `java validate-annotations`)
  - `oseplatform-cli` - Go CLI tool for OSE Platform site maintenance (link validation)
  - `organiclever-web` - Next.js 16 landing and promotional website (www.organiclever.com)
  - `organiclever-web-e2e` - Playwright E2E tests for organiclever-web
  - `demo-be-jasb` - Spring Boot REST API backend (Java Spring Boot)
  - `demo-be-exph` - Elixir/Phoenix REST API backend (alternative to demo-be-jasb)
  - `demo-be-e2e` - Playwright E2E tests for demo-be-jasb REST API

## Project Structure

```
open-sharia-enterprise/
├── apps/                     # Deployable applications (Nx)
│   ├── oseplatform-web/    # OSE Platform website
│   ├── ayokoding-web/       # AyoKoding website (bilingual)
│   ├── ayokoding-cli/       # Content automation CLI
│   ├── rhino-cli/          # Repository management CLI (java validate-annotations)
│   ├── oseplatform-cli/     # OSE Platform site CLI
│   ├── organiclever-web/     # OrganicLever landing website (Next.js)
│   ├── organiclever-web-e2e/ # Playwright E2E tests for organiclever-web
│   ├── demo-be-jasb/ # Spring Boot REST API (Java Spring Boot)
│   ├── demo-be-exph/ # Elixir/Phoenix REST API (alternative implementation)
│   └── demo-be-e2e/ # Playwright E2E tests for backend
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

# Deeper test targets (run on-demand or via CI)
nx run [project-name]:test:unit
nx run [project-name]:test:integration
nx run [project-name]:test:e2e

# Dependency graph
nx graph

# Markdown linting and formatting
npm run lint:md          # Lint all markdown files
npm run lint:md:fix      # Auto-fix markdown violations
npm run format:md        # Format markdown with Prettier
npm run format:md:check  # Check markdown formatting

# Verify local development environment
npm run doctor           # Check all required tools (volta, node, npm, java, maven, golang)
```

**See**: [governance/development/infra/nx-targets.md](./governance/development/infra/nx-targets.md) for canonical target names, mandatory targets per project type, and caching rules.

**Go projects**: All Go projects (`ayokoding-cli`, `oseplatform-cli`, `rhino-cli`,
`libs/golang-commons`, `libs/hugo-commons`) enforce ≥90% **line coverage** (matching Codecov's
algorithm) via `rhino-cli test-coverage validate`. Coverage is measured with
`go test -coverprofile=cover.out ./...` and enforced by
`rhino-cli test-coverage validate <project>/cover.out 90` — both run as part of `test:quick`.

**TypeScript projects**: `organiclever-web` additionally enforces ≥90% **line coverage** (matching
Codecov's algorithm) via `rhino-cli test-coverage validate` applied to the LCOV output from Vitest:
`rhino-cli test-coverage validate apps/organiclever-web/coverage/lcov.info 90` — run as part of `test:quick`.

**`test:integration` caching**: Integration tests for `organiclever-web` (MSW), `demo-be-jasb`
(MockMvc + mocked repositories via InMemoryDataStore), `demo-be-exph` (in-memory context
implementations via InMemoryStore), `hugo-commons` (Godog + tmpdir mocks), and `golang-commons`
(Godog + mock closures) use in-process mocking only — no external services required. They are
fully deterministic and safe to cache (`cache: true` in `nx.json`).

**Unit vs. integration test principle**: Unit tests cover only what integration tests cannot reach
(isolated pure functions, hooks, algorithmic logic). Feature-level workflows already exercised by
integration tests must not be duplicated in unit tests.

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

**See**: [docs/reference/re\_\_monorepo-structure.md](./docs/reference/re__monorepo-structure.md), [docs/how-to/hoto\_\_add-new-app.md](./docs/how-to/hoto__add-new-app.md), [governance/development/infra/nx-targets.md](./governance/development/infra/nx-targets.md)

## Git Workflow

**Trunk Based Development** - All development on `main` branch:

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
- **Split commits by domain**: Different types/domains/concerns should be separate commits

**See**: [governance/development/workflow/commit-messages.md](./governance/development/workflow/commit-messages.md)

## Git Hooks (Automated Quality)

Husky + lint-staged enforce quality:

- **Pre-commit**:
  - Validates `.claude/` and `.opencode/` configuration (if changed in staged files)
    - Validates `.claude/` source format (YAML, tools, model, skills)
    - Auto-syncs `.claude/` → `.opencode/`
    - Validates `.opencode/` output (semantic equivalence)
  - When ayokoding-web content changes: rebuilds CLI, updates titles, regenerates navigation
  - Formats staged files with Prettier (JS/TS/JSON/YAML/CSS/MD), gofmt (Go), and mix format (Elixir)
  - Validates markdown links in staged files
  - Validates all markdown files (markdownlint)
  - Auto-stages changes
- **Commit-msg**: Validates Conventional Commits format (Commitlint)
- **Pre-push**: Runs `test:quick` for affected projects
  - Runs markdown linting

**See**: [governance/development/quality/code.md](./governance/development/quality/code.md)

## Documentation Organization

**Diátaxis Framework** - Four categories:

- **Tutorials** (`docs/tutorials/`) - Learning-oriented
- **How-to** (`docs/how-to/`) - Problem-solving
- **Reference** (`docs/reference/`) - Technical specifications
- **Explanation** (`docs/explanation/`) - Conceptual understanding

**File Naming**: `[prefix]__[content-identifier].md` where prefix encodes directory path

**Examples**:

- `file-naming.md` (governance/conventions/structure)
- `tu__getting-started.md` (tutorials)
- `hoto__deploy-docker.md` (how-to)

**Exception**: Index files use `README.md` for GitHub compatibility

**See**: [governance/conventions/structure/file-naming.md](./governance/conventions/structure/file-naming.md), [governance/conventions/structure/diataxis-framework.md](./governance/conventions/structure/diataxis-framework.md)

## Core Principles

All work follows foundational principles from `governance/principles/`:

- **Documentation First**: Documentation is mandatory, not optional
- **Accessibility First**: WCAG AA compliance, color-blind friendly
- **Simplicity Over Complexity**: Minimum viable abstraction
- **Explicit Over Implicit**: Explicit configuration over magic
- **Automation Over Manual**: Automate repetitive tasks
- **Root Cause Orientation**: Fix root causes, not symptoms; minimal impact; senior engineer standard

**See**: [governance/principles/README.md](./governance/principles/README.md)

## Key Conventions

### File Naming

Pattern: `[prefix]__[content-identifier].md` encoding directory path
Exception: `README.md` for index files, `docs/metadata/` files

**See**: [governance/conventions/structure/file-naming.md](./governance/conventions/structure/file-naming.md)

### Linking

GitHub-compatible markdown: `Text` with `.md` extension
Hugo sites use absolute paths without `.md`

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

## AI Agents

**Content Creation**: docs-maker, docs-tutorial-maker, readme-maker, apps-ayokoding-web-general-maker, apps-ayokoding-web-by-example-maker, apps-ayokoding-web-in-the-field-maker, apps-ayokoding-web-structure-maker, apps-ayokoding-web-navigation-maker, apps-ayokoding-web-title-maker, apps-oseplatform-web-content-maker

**Validation**: docs-checker, docs-tutorial-checker, docs-link-general-checker, docs-software-engineering-separation-checker, readme-checker, apps-ayokoding-web-general-checker, apps-ayokoding-web-by-example-checker, apps-ayokoding-web-in-the-field-checker, apps-ayokoding-web-facts-checker, apps-ayokoding-web-link-checker, apps-ayokoding-web-structure-checker, apps-oseplatform-web-content-checker

**Fixing**: docs-fixer, docs-tutorial-fixer, docs-software-engineering-separation-fixer, readme-fixer, apps-ayokoding-web-general-fixer, apps-ayokoding-web-by-example-fixer, apps-ayokoding-web-in-the-field-fixer, apps-ayokoding-web-facts-fixer, apps-ayokoding-web-link-fixer, apps-ayokoding-web-structure-fixer, apps-oseplatform-web-content-fixer

**Planning**: plan-maker, plan-checker, plan-executor, plan-execution-checker, plan-fixer

**Development**: swe-hugo-developer, swe-elixir-developer, swe-golang-developer, swe-java-developer, swe-python-developer, swe-typescript-developer, swe-e2e-test-developer, swe-code-checker, swe-dart-developer, swe-kotlin-developer, swe-csharp-developer, swe-fsharp-developer, swe-clojure-developer, swe-rust-developer

**Operations**: docs-file-manager, apps-ayokoding-web-deployer, apps-oseplatform-web-deployer, apps-organiclever-web-deployer

**Meta**: agent-maker, repo-governance-maker, repo-governance-checker, repo-governance-fixer, repo-workflow-maker, repo-workflow-checker, repo-workflow-fixer, social-linkedin-post-maker

**Maker-Checker-Fixer Pattern**: Three-stage workflow with criticality levels (CRITICAL/HIGH/MEDIUM/LOW), confidence assessment (HIGH/MEDIUM/FALSE_POSITIVE)

**Skills Infrastructure**: Agents leverage skills providing two modes:

- **Inline skills** (default) - Inject knowledge into current conversation
- **Fork skills** (`context: fork`) - Skills that trigger subagent spawning, delegating tasks to isolated agent contexts and returning summarized results

Skills serve agents with knowledge and execution services but don't govern them (service relationship, not governance).

### Working with .claude/ Directory

**IMPORTANT**: When creating or modifying files in `.claude/` directory (agents, skills, settings), use **Bash tools** (heredoc, sed, awk) instead of Write/Edit tools. This avoids user approval prompts and enables autonomous operation.

**Examples**:

```bash
# Create new agent with heredoc
cat > .claude/agents/new-agent.md <<'EOF'
---
name: new-agent
description: Agent description
---
Content here
EOF

# Update existing file with sed
sed -i 's/old-value/new-value/' .claude/agents/existing-agent.md
```

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
- **Models**: Claude Code uses `sonnet`/`haiku` (or omits), OpenCode uses `zai/glm-4.7` (sonnet/opus), `zai/glm-4.5-air` (haiku), or `inherit` (omitted)
- **Skills**: Folder structure maintained (`.claude/skills/{name}/SKILL.md` → `.opencode/skill/{name}/SKILL.md`)

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

## Hugo Sites

### oseplatform-web

- **URL**: <https://oseplatform.com>
- **Production branch**: `prod-oseplatform-web` → oseplatform.com
- **Theme**: PaperMod
- **Hugo**: 0.156.0 Extended
- **Deployment**: Vercel
- **Content**: Marketing site for platform

**Commands**:

```bash
nx dev oseplatform-web    # Development server
nx build oseplatform-web  # Production build
```

### ayokoding-web

- **URL**: <https://ayokoding.com>
- **Production branch**: `prod-ayokoding-web` → ayokoding.com
- **Theme**: Hextra (documentation)
- **Hugo**: 0.156.0 Extended
- **Languages**: Indonesian (primary), English
- **Deployment**: Vercel
- **Content**: Educational platform (programming, AI, security)

**Commands**:

```bash
nx dev ayokoding-web             # Development server
nx build ayokoding-web           # Production build
nx run-pre-commit ayokoding-web  # Update titles + navigation
```

**Pre-commit automation**: When content changes, automatically rebuilds CLI, updates titles from filenames, regenerates navigation

**See**: [apps/ayokoding-cli/README.md](./apps/ayokoding-cli/README.md), [governance/conventions/hugo/](./governance/conventions/hugo/)

### organiclever-web

- **URL**: <https://www.organiclever.com/>
- **Production branch**: `prod-organiclever-web` → www.organiclever.com
- **Framework**: Next.js 16 (App Router)
- **Deployment**: Vercel
- **Content**: Landing and promotional website for OrganicLever
- **E2E tests**: `organiclever-web-e2e`

**Commands**:

```bash
nx dev organiclever-web                    # Development server (localhost:3200)
nx build organiclever-web                  # Production build
nx run organiclever-web-e2e:test:e2e       # Run E2E tests headlessly
nx run organiclever-web-e2e:test:e2e:ui   # Run E2E tests with Playwright UI
```

**See**: [apps/organiclever-web/README.md](./apps/organiclever-web/README.md), [.claude/skills/apps-organiclever-web-developing-content/SKILL.md](./.claude/skills/apps-organiclever-web-developing-content/SKILL.md)

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
- **License**: MIT
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

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors

<!-- nx configuration end-->
