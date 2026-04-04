---
name: swe-developing-applications-common
description: Common software development workflow patterns shared across all language developer agents
created: 2026-01-25
updated: 2026-01-25
---

# Common Software Development Workflow

This Skill provides universal development workflow guidance shared across all language-specific developer agents in the Open Sharia Enterprise platform.

## Purpose

Use this Skill when:

- Developing applications in any programming language
- Working within the Nx monorepo structure
- Following platform git workflow standards
- Understanding tool usage patterns for development
- Leveraging platform automation

## Tool Usage for Developers

**Standard Developer Tools**: read, write, edit, glob, grep, bash

**Tool Purposes**:

- **read**: Load source files and documentation for analysis
- **write**: Create new source files and test files
- **edit**: Modify existing code files
- **glob**: Discover files matching patterns
- **grep**: Search code patterns across files
- **bash**: Execute language tooling, run tests, git operations

**Tool Selection Guidance**:

- Use **read** for understanding existing code and documentation
- Use **write** for creating new files from scratch
- Use **edit** for modifying existing files (preferred over write for changes)
- Use **glob** for file discovery (NOT bash find)
- Use **grep** for content search (NOT bash grep)
- Use **bash** for running compilers, test runners, build tools, git commands

## Nx Monorepo Integration

### Repository Structure

This platform uses **Nx** for monorepo management with clear separation of concerns:

**Apps** (`apps/[app-name]`):

- Deployable applications
- Import libraries but never export
- Each independently deployable
- Never import other apps

**Libraries** (`libs/[lib-name]`):

- Reusable code modules
- Flat structure (no nesting)
- Can import other libraries (no circular dependencies)
- Naming convention: `[language]-[name]` (e.g., `ts-utils`, `java-common`)

### Common Nx Commands

All target names follow [Nx Target Standards](../../../governance/development/infra/nx-targets.md). Use canonical names: `dev` (not `serve`), `test:quick` (not `test`), `start` (not `serve` for production).

**Development**:

```bash
nx dev [project-name]       # Start development server (use 'dev', not 'serve')
nx start [project-name]     # Start production server (use 'start', not 'serve')
```

**Building**:

```bash
nx build [project-name]     # Build specific project
nx affected -t build        # Build only affected projects
```

**Testing**:

```bash
nx run [project-name]:test:quick        # Fast pre-push quality gate (mandatory for all projects)
nx run [project-name]:test:unit         # Isolated unit tests
nx run [project-name]:test:integration  # Tests requiring external services
nx run [project-name]:test:e2e          # End-to-end tests (run via scheduled cron, not pre-push)
nx affected -t test:quick               # Run quality gate for affected projects
```

**Analysis**:

```bash
nx graph                   # Visualize dependencies
nx affected:graph          # Show affected dependency graph
```

**Affected Commands Philosophy**:

- After making changes, use `nx affected:*` commands
- Only builds/tests projects impacted by your changes
- Efficient in large monorepo (don't rebuild everything)

### Monorepo Best Practices

1. **Keep libraries focused**: Each library should have single responsibility
2. **Avoid circular dependencies**: Libraries form directed acyclic graph (DAG)
3. **Use affected commands**: Leverage Nx's smart rebuilding
4. **Apps never depend on apps**: Only libraries are shared
5. **Test at library level**: Unit test libraries, integration test apps

## Git Workflow

### Trunk Based Development

**Core Principle**: All development happens on `main` branch

**Branch Strategy**:

- **Default branch**: `main` (all development work)
- **Environment branches**: `prod-*` (deployment only, never commit directly)
- **No feature branches**: Commit small changes frequently to main
- **No long-lived branches**: Keep changes integrated

**Why Trunk Based Development?**

- Reduces merge conflicts (no long-lived branches)
- Encourages small, incremental changes
- Faster feedback loop
- Simplifies deployment pipeline

### Conventional Commits Format

**Pattern**: `<type>(<scope>): <description>`

**Required Format**:

- **type**: Category of change (see types below)
- **scope**: Optional but recommended (component/module affected)
- **description**: Imperative mood ("add" not "added"), no period at end

**Commit Types**:

- **feat**: New feature or capability
- **fix**: Bug fix
- **docs**: Documentation changes only
- **style**: Code style changes (formatting, no logic change)
- **refactor**: Code restructuring (no feature change, no bug fix)
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Build process, tooling, dependencies
- **ci**: CI/CD pipeline changes
- **revert**: Reverting previous commit

**Examples**:

```bash
feat(auth): add OAuth2 login support
fix(api): handle null response in user endpoint
docs(readme): update installation instructions
refactor(utils): simplify date formatting logic
test(auth): add integration tests for login flow
```

**Split Commits by Domain**:

- Different types → separate commits
- Different scopes → separate commits
- Different concerns → separate commits

**Example** (wrong):

```bash
git commit -m "feat(auth): add login + fix(api): fix bug + docs: update readme"
```

**Example** (correct):

```bash
git commit -m "feat(auth): add OAuth2 login support"
git commit -m "fix(api): handle null response in user endpoint"
git commit -m "docs(readme): update installation instructions"
```

### Git Discipline

**CRITICAL**: Never stage or commit unless explicitly instructed by user

**Default Behavior**:

- Do NOT run `git add` automatically
- Do NOT run `git commit` automatically
- User must explicitly request commits

**Commit Permission**:

- One-time only (not continuous)
- User says "commit these changes" → you commit once
- User does NOT say "commit everything I ask you to do" → don't assume

**Why This Matters**:

- User controls git history
- Prevents unwanted commits
- User decides commit boundaries
- Respects user's workflow preferences

## Pre-commit Automation

### Automated Quality Gates

When code files are modified, **Husky + lint-staged** automatically run:

**Pre-commit Hooks**:

1. **Format with Prettier**: Automatically formats staged files
2. **Lint markdown**: Validates markdown files with markdownlint
3. **Validate links**: Checks markdown links aren't broken
4. **Auto-stage changes**: Automatically stages formatting fixes

**Commit-msg Hook**:

- **Validate commit format**: Ensures Conventional Commits compliance
- **Blocks invalid commits**: Prevents commit if format wrong

**Pre-push Hook**:

- **Run `test:quick` for affected projects**: Executes the fast quality gate (`nx affected -t test:quick`) — this is the canonical pre-push check. Every project must expose a `test:quick` target.
- **Markdown linting**: Final markdown quality check

> **Note**: `test:e2e` does NOT run in the pre-push hook. It runs on a scheduled GitHub Actions cron job (twice daily per workflow) targeting each `*-e2e` project. See [Nx Target Standards](../../../governance/development/infra/nx-targets.md) for the full execution model.

### Trust the Automation

**Philosophy**: Focus on code quality, let automation handle style

**What This Means**:

- Don't manually format code (Prettier handles it)
- Don't worry about markdown formatting (automated)
- Don't manually check links (automation validates)
- Trust that tests will run before push

**If Pre-commit Hook Fails**:

1. Read the error message carefully
2. Fix the reported issue
3. Re-stage files if needed
4. Commit again (creates NEW commit, don't amend unless asked)

**Common Failures**:

- **Markdown linting**: Run `npm run lint:md:fix` to auto-fix
- **Test failures**: Fix the failing test, re-commit
- **Link validation**: Fix broken links, re-commit
- **Commit message format**: Rewrite commit message following Conventional Commits

## Development Environment Setup

Before implementing any changes, ensure the development environment is ready. This prevents wasted time on toolchain issues mid-implementation.

### Quick Verification

```bash
# Verify all tools are installed and at correct versions
npm run doctor

# If tools are missing, auto-install them
npm run doctor -- --fix

# Preview what would be installed (dry run)
npm run doctor -- --fix --dry-run

# Check only core tools (git, volta, node, npm, go, docker, jq)
npm run doctor -- --scope minimal
```

### Environment File Management (rhino-cli)

The repository uses `rhino-cli` for environment file management:

```bash
# Initialize .env files from .env.example templates
CGO_ENABLED=0 go run -C apps/rhino-cli main.go env init

# Backup current .env files
CGO_ENABLED=0 go run -C apps/rhino-cli main.go env backup

# Restore .env files from backup
CGO_ENABLED=0 go run -C apps/rhino-cli main.go env restore --force

# Restore including config files (AI tool settings, Docker overrides, etc.)
CGO_ENABLED=0 go run -C apps/rhino-cli main.go env restore --force --include-config
```

### When to Run Environment Setup

- **Before starting any implementation work** — verify tools and env files are ready
- **After pulling changes** that modify `package.json`, `go.mod`, `.tool-versions`, or other version config
- **After switching between projects** that use different toolchains
- **When any build/test/lint command fails with a "not found" or version error** — run `npm run doctor` first

### Full Setup Guide

For complete step-by-step environment setup (new machine, fresh OS, or broken toolchain), see:
[Development Environment Setup Workflow](../../../governance/workflows/infra/development-environment-setup.md)

## Development Workflow Pattern

### Standard 6-Step Workflow

All language developers follow this pattern:

1. **Requirements Analysis**: Understand functional and technical requirements
2. **Design**: Apply appropriate patterns and platform architecture
3. **Implementation**: Write clean, tested, documented code
4. **Testing**: Comprehensive unit, integration, and e2e tests
5. **Code Review**: Self-review against coding standards
6. **Documentation**: Update relevant docs and code comments

### Implementation Philosophy

**Make it work → Make it right → Make it fast**

1. **Make it work**: Get basic functionality working (passing tests)
2. **Make it right**: Refactor for clarity, follow standards, eliminate duplication
3. **Make it fast**: Optimize performance where needed (measure first)

**Avoid**:

- Premature optimization (fast before right)
- Over-engineering (complex before simple)
- Skipping tests (work without validation)

## Reference Documentation Patterns

### Standard Project Documentation

**All language developers reference**:

- **[CLAUDE.md](../../../CLAUDE.md)**: Primary guidance for all agents
- **[Monorepo Structure](../../../docs/reference/re__monorepo-structure.md)**: Nx workspace organization
- **[Commit Messages Convention](../../../governance/development/workflow/commit-messages.md)**: Conventional Commits detailed guide
- **[Code Quality Convention](../../../governance/development/quality/code.md)**: Git hooks and automation
- **[Trunk Based Development](../../../governance/development/workflow/trunk-based-development.md)**: Git workflow philosophy
- **[Development Environment Setup](../../../governance/workflows/infra/development-environment-setup.md)**: Complete toolchain setup (doctor, rhino-cli env, all language runtimes)

### Language-Specific Documentation

Each language has authoritative coding standards in:

```
docs/explanation/software-engineering/programming-languages/[language]/README.md
```

**Examples**:

- TypeScript: `docs/explanation/software-engineering/programming-languages/typescript/README.md`
- Java: `docs/explanation/software-engineering/programming-languages/java/README.md`
- Python: `docs/explanation/software-engineering/programming-languages/python/README.md`
- Elixir: `docs/explanation/software-engineering/programming-languages/elixir/README.md`
- Go: `docs/explanation/software-engineering/programming-languages/golang/README.md`

**Each language README covers**:

1. Language idioms and patterns
2. Best practices for clean code
3. Anti-patterns to avoid
4. Framework-specific guidance
5. Testing strategies

## Related Conventions

**Workflow Conventions**:

- [Trunk Based Development](../../../governance/development/workflow/trunk-based-development.md) - Git workflow details (main = direct push; worktree = branch + PR)
- [PR Merge Protocol](../../../governance/development/workflow/pr-merge-protocol.md) - Explicit user approval required, all quality gates must pass
- [Commit Messages Convention](../../../governance/development/workflow/commit-messages.md) - Conventional Commits specification
- [Implementation Workflow](../../../governance/development/workflow/implementation.md) - Make it work → right → fast

**Quality Conventions**:

- [Code Quality Convention](../../../governance/development/quality/code.md) - Git hooks, linting, formatting
- [Manual Behavioral Verification](../../../governance/development/quality/manual-behavioral-verification.md) - Playwright MCP for UI, curl for API testing
- [Feature Change Completeness](../../../governance/development/quality/feature-change-completeness.md) - Specs, contracts, and tests must update with every feature change
- [CI Blocker Resolution](../../../governance/development/quality/ci-blocker-resolution.md) - Preexisting CI failures must be investigated and fixed, never bypassed
- [Reproducible Environments](../../../governance/development/workflow/reproducible-environments.md) - Volta, package-lock.json

**Architecture Conventions**:

- [Monorepo Structure Reference](../../../docs/reference/re__monorepo-structure.md) - Nx workspace organization
- [Nx Target Standards](../../../governance/development/infra/nx-targets.md) - Canonical target names, mandatory targets per project type, caching rules
- [Functional Programming](../../../governance/development/pattern/functional-programming.md) - FP principles across languages

## Related Skills

Language-specific skills provide deep expertise for each language:

- `swe-programming-typescript` - TypeScript idioms, patterns, frameworks
- `swe-programming-java` - Java idioms, patterns, frameworks
- `swe-programming-python` - Python idioms, patterns, frameworks
- `swe-programming-elixir` - Elixir idioms, OTP patterns, Phoenix
- `swe-programming-golang` - Go idioms, patterns, frameworks

---

**Note**: This Skill provides universal workflow guidance. Language-specific development patterns are in dedicated language skills.
