---
title: Code Quality Convention
tags:
  - development
  - code-quality
  - prettier
  - husky
  - lint-staged
  - git-hooks
  - automation
category: explanation
subcategory: development
---

# Code Quality Convention

This document explains the automated code quality tools and git hooks used in this repository to maintain consistent code formatting and commit message standards.

## Principles Implemented/Respected

This practice respects the following core principles:

- **[Automation Over Manual](../../principles/software-engineering/automation-over-manual.md)**: Git hooks (Husky) automatically run Prettier and Commitlint before commits. Humans write code, machines enforce formatting and standards. No manual formatting or message validation required.

- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)**: Prettier uses default settings - no custom configuration file. Commitlint uses standard Conventional Commits spec. Minimal tooling configuration reduces complexity.

## Conventions Implemented/Respected

**REQUIRED SECTION**: All development practice documents MUST include this section to ensure traceability from practices to documentation standards.

This practice implements/respects the following conventions:

- **[Commit Message Convention](../workflow/commit-messages.md)**: Git hooks enforce Conventional Commits format through Commitlint, validating commit message structure before commits are created.

- **[Indentation Convention](../../conventions/formatting/indentation.md)**: Prettier enforces consistent indentation (2 spaces for YAML frontmatter) across all formatted file types.

- **[File Naming Convention](../../conventions/structure/file-naming.md)**: Pre-commit hook formats all files matching the repository's file naming patterns without altering the naming structure.

## Overview

This project enforces code quality through automated tools that run during the development workflow:

- **Prettier** - Automatic code formatting
- **Husky** - Git hooks management
- **Lint-staged** - Run tools on staged files only
- **Commitlint** - Commit message validation (see [Commit Message Convention](../workflow/commit-messages.md))

These tools work together to ensure code consistency and quality without manual intervention.

## Prettier - Code Formatting

**Purpose**: Automatically format code to maintain consistent style across the codebase.

**Supported File Types**:

- JavaScript/TypeScript: `*.{js,jsx,ts,tsx,mjs,cjs}`
- JSON: `*.json`
- Markdown: `*.md` (excluding Hugo archetypes)
- YAML: `*.{yml,yaml}`
- CSS/SCSS: `*.{css,scss}`

**Note**: Hugo archetype template files (`apps/oseplatform-web/archetypes/**/*.md`) are excluded from Prettier formatting as they contain Go template syntax.

**When It Runs**: Automatically on staged files before each commit via the pre-commit hook.

**Configuration**: Prettier uses default settings (no custom configuration file). This ensures maximum compatibility and reduces configuration overhead.

**Manual Formatting**: You can manually format files with:

```bash
npx prettier --write [file-path]
```

## Husky - Git Hooks

**Purpose**: Manage git hooks to run automated checks at specific points in the git workflow.

**Hooks Configured**:

- `.husky/pre-commit` - Runs before commit is created
- `.husky/commit-msg` - Runs after commit message is entered
- `.husky/pre-push` - Runs before pushing to remote

**Why Husky**: Ensures all developers have the same git hooks configured automatically after running `npm install`. Hooks are stored in the repository (`.husky/` directory) for version control.

## Lint-staged

**Purpose**: Run linters and formatters only on staged files (not the entire codebase).

**Configuration** (in `package.json`):

```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx,mjs,cjs}": "prettier --write",
    "*.json": "prettier --write",
    "apps/oseplatform-web/archetypes/**/*.md": "echo 'Skipping Hugo archetype'",
    "*.md": "prettier --write",
    "*.{yml,yaml}": "prettier --write",
    "*.{css,scss}": "prettier --write"
  }
}
```

**How It Works**:

1. Identifies files staged for commit (`git add`)
2. Runs Prettier on matching file types
3. Automatically stages formatted files
4. Allows commit to proceed if successful

**Benefits**:

- Faster than running tools on entire codebase
- Only formats files you're committing
- Prevents incorrectly formatted code from being committed

## Git Hook Workflow

### Pre-commit Hook

**Location**: `.husky/pre-commit`

**Execution Order**:

1. You run `git commit`
2. Pre-commit hook triggers (`.husky/pre-commit` — a single `go run` line)
3. `rhino-cli git pre-commit` orchestrates all 9 steps in order, failing fast:

| Step | Trigger                           | Action                                                                | On failure |
| ---- | --------------------------------- | --------------------------------------------------------------------- | ---------- |
| 1    | `.claude/` or `.opencode/` staged | Validate → Sync → Validate-sync                                       | exit 1     |
| 2    | `docker-compose.ya?ml` staged     | `docker compose -f <file> config` per file                            | exit 1     |
| 3    | always                            | `nx affected -t run-pre-commit --skip-nx-cache`                       | warn only  |
| 4    | always                            | `git add apps/ayokoding-web/content/`                                 | ignored    |
| 5    | always                            | `npx lint-staged`                                                     | exit 1     |
| 6    | `.ex`/`.exs` staged, `mix` found  | `mix format <files>` per project root, then `git add`                 | exit 1     |
| 7    | `docs/` staged                    | Validate + auto-fix naming, then `git add docs/ governance/ .claude/` | exit 1     |
| 8    | always                            | Validate markdown links (staged only)                                 | exit 1     |
| 9    | always                            | `npm run lint:md`                                                     | exit 1     |

1. Commit proceeds if no errors

**Implementation**: `apps/rhino-cli/internal/git/runner.go` — all steps call internal Go functions directly (no subprocess round-trips for rhino-cli-owned logic); external tools are shelled out via `os/exec`.

**What It Validates**:

**Configuration Validation** (Added 2026-01-22):

Validates `.claude/` and `.opencode/` consistency before commit:

1. Detects if `.claude/` or `.opencode/` in staged files
2. If changed:
   - Validates `.claude/` source format (YAML, tools, model, skills)
   - Syncs `.claude/` → `.opencode/` (auto-sync)
   - Validates `.opencode/` output (semantic equivalence)
3. If unchanged: Skips validation (performance)

**Benefits:**

- Catches config errors before commit (earliest possible)
- Prevents invalid commits from being created locally
- Ensures `.claude/` and `.opencode/` stay in sync
- Auto-syncs on commit (no manual step)
- Only runs when config files in staged files (~260ms when needed)

**Markdown:**

- Validates markdown links in staged files only (fast, targeted)
- Validates all markdown files meet linting standards (comprehensive)

**What Happens on Failure**:

- Commit is blocked
- Error message shows which check failed (config, formatting, or markdown)
- Fix the issue and try again

**Example**:

```bash
$ git commit -m "feat: add new feature"
🔍 Validating .claude/ and .opencode/ configuration...
✅ Configuration validation passed
⏭️  Skipping docker-compose validation (no docker-compose.yml changes in staged files)
⏭️  Skipping Elixir formatting (no .ex/.exs files staged)
⏭️  Skipping docs naming validation (no docs/ changes in staged files)
[main abc1234] feat: add new feature
```

### Commit-msg Hook

**Location**: `.husky/commit-msg`

**Execution Order**:

1. Pre-commit hook completes successfully
2. Commit-msg hook triggers
3. Commitlint validates commit message format
4. Commit proceeds if message is valid

**What It Validates**:

- Commit message follows [Conventional Commits](https://www.conventionalcommits.org/)
- See [Commit Message Convention](../workflow/commit-messages.md) for complete rules

**What Happens on Failure**:

- Commit is blocked
- Error message shows what's wrong with the commit message
- Fix the message and try again

**Example**:

```bash
$ git commit -m "added new feature"
⧗   input: added new feature
   subject may not be empty [subject-empty]
   type may not be empty [type-empty]
   found 2 problems, 0 warnings
```

### Pre-push Hook

**Location**: `.husky/pre-push`

**Execution Order**:

1. You run `git push`
2. Pre-push hook triggers
3. Nx detects affected projects since last push
4. `typecheck` runs for each affected project that declares it
5. `lint` runs for each affected project
6. `test:quick` runs for each affected project
7. `spec-coverage` runs for each affected project that declares it
8. Push proceeds if all four gates pass

**What It Validates**:

- **Type correctness** (`typecheck`): Catches type errors in TypeScript, Dart/Flutter, and other
  statically typed projects. Projects without a `typecheck` target are silently skipped by Nx.
- **Code quality** (`lint`): Static analysis across all projects (includes static a11y checks via
  oxlint jsx-a11y plugin for TypeScript UI projects and `dart analyze` for Dart projects). Also
  enforced remotely in the PR quality gate and in all scheduled Test CI workflows.
- **Fast quality gate** (`test:quick`): Unit tests, build smoke tests, or other fast checks
  defined per project. Also enforced remotely as a required GitHub Actions status check before PR
  merge.
- **Spec coverage** (`spec-coverage`): Validates that every Gherkin step in feature files has a
  matching step definition in source code. Compulsory for all apps and E2E runners. Uses
  `rhino-cli spec-coverage validate`.

**What Happens on Failure**:

- Push is blocked
- Error message shows which target and project failed
- Fix the issue and try again

**Example**:

```bash
$ git push origin main

> nx affected -t typecheck

 Running target typecheck for affected projects...
   organiclever-web
 All checks passed

> nx affected -t lint

 Running target lint for affected projects...
   organiclever-web
 All checks passed

> nx affected -t test:quick

 Running target test:quick for affected projects...
   organiclever-web
 All checks passed

> nx affected -t spec-coverage

 Running target spec-coverage for affected projects...
   organiclever-web
 All checks passed

Enumerating objects: 5, done.
[main abc1234] Successfully pushed
```

**Benefits**:

- Prevents broken code from reaching remote repository
- Only runs checks on affected projects (faster than checking everything)
- Catches type errors, lint violations, and test failures before CI/CD
- Nx caching means repeated checks on unchanged code are near-instant

## Bypassing Hooks (Not Recommended)

You can bypass git hooks using `--no-verify`:

```bash
git commit --no-verify -m "message"
```

**WARNING**: Only use this in exceptional circumstances:

- Emergency hotfixes where formatting can be fixed later
- When hooks are malfunctioning (report the issue)
- **NEVER** use this to avoid fixing code quality issues

Bypassing hooks regularly defeats the purpose of automated quality checks.

## Troubleshooting

### Prettier Fails to Format

**Symptom**: Pre-commit hook fails with Prettier errors

**Solutions**:

1. Check if the file has syntax errors (Prettier can't format invalid code)
2. Run Prettier manually to see detailed error: `npx prettier --write [file]`
3. Fix syntax errors, then commit again

### Commitlint Rejects Valid Message

**Symptom**: Commit-msg hook fails but message looks correct

**Solutions**:

1. Verify message follows exact format: `<type>(<scope>): <description>`
2. Check type is lowercase and from valid list
3. Ensure description is in imperative mood
4. See [Commit Message Convention](../workflow/commit-messages.md) for complete rules

### Hooks Not Running

**Symptom**: Git hooks don't execute when committing or pushing

**Solutions**:

1. Run `npm install` to ensure Husky is set up
2. Check `.husky/` directory exists with hook files
3. Verify hook files are executable: `ls -la .husky/`
4. If needed, make executable: `chmod +x .husky/pre-commit .husky/commit-msg .husky/pre-push`

### Pre-push Hook Times Out or Runs Slowly

**Symptom**: Pre-push hook takes too long or times out on large changesets

**Solution** — warm the Nx cache before pushing:

```bash
# Run all four targets first (this warms the cache)
npx nx affected -t typecheck lint test:quick spec-coverage

# Now push — the hook replays from cache (near-instant)
git push
```

**Why this works**: `typecheck`, `lint`, `test:quick`, and `spec-coverage` are all cacheable Nx targets (`cache: true` in `nx.json`). Running them manually stores results in the local Nx cache. When the pre-push hook runs the same targets, Nx replays from cache instead of re-executing — making the hook near-instant regardless of how many projects are affected.

### Tests Fail on Pre-push

**Symptom**: Pre-push hook blocks push due to test failures

**Solutions**:

1. Check which tests failed in the error output
2. Run tests locally: `nx affected -t test:quick`
3. Fix failing tests
4. Commit fixes and push again
5. If tests pass locally but fail in hook, ensure all changes are committed

### Config Validation Fails on Pre-commit

**Symptom**: Pre-commit hook fails with config validation errors

**Solutions**:

1. Identify which step failed:
   - `.claude/` validation: Fix source files in `.claude/agents/` or `.claude/skills/`
   - Sync: Check rhino-cli output, may be a bug
   - `.opencode/` validation: Re-run `npm run sync:claude-to-opencode`

2. Run validation manually to debug:

   ```bash
   npm run validate:claude      # Check .claude/ format
   npm run sync:claude-to-opencode  # Sync to .opencode/
   npm run validate:opencode    # Check .opencode/ output
   ```

3. Common validation errors:
   - Invalid tool name: Must be Read, Write, Edit, Glob, Grep, Bash, TodoWrite, WebFetch, WebSearch
   - Missing description: All agents/skills need description field
   - Invalid model: Must be empty, "sonnet", "opus", or "haiku"
   - Skill not found: Ensure skill exists in `.claude/skills/`

4. Bypass hook temporarily (emergency only):

   ```bash
   git push --no-verify
   ```

   Note: Fix validation errors before merging to main.

## Adding New File Types

To add Prettier formatting for new file types:

1. Update `lint-staged` configuration in `package.json`
2. Add new glob pattern and Prettier command
3. Test with a sample file
4. Commit the configuration change

**Example** (adding Python files):

```json
{
  "lint-staged": {
    "*.py": ["prettier --write"]
  }
}
```

## Integration with Development Workflow

### Normal Workflow

```bash
# 1. Make changes to files
vim src/index.ts

# 2. Stage files
git add src/index.ts

# 3. Commit (hooks run automatically)
git commit -m "feat(api): add new endpoint"

# Hooks execute:
#  Prettier formats src/index.ts
#  Commitlint validates message
#  Commit succeeds

# 4. Push to remote (pre-push hook runs)
git push origin main

# Pre-push hook executes:
#  Nx detects affected projects
#  Runs test:quick for affected projects
#  Push succeeds
```

### When Hooks Modify Files

```bash
# 1. Stage and commit
git add src/messy.ts
git commit -m "fix: correct validation logic"

# Prettier formats messy.ts and stages it
# Commit includes formatted version automatically
```

## ayokoding-web Link Validation

Internal links in ayokoding-web content are validated
automatically on every `test:quick` run via `ayokoding-cli links check`.

**Convention:**

- Internal links are validated for correctness
- External links (`http://`, `https://`, `mailto:`) are NOT validated by this tool — use the
  `apps-ayokoding-web-link-checker` AI agent for those
- Same-page anchors (`#section`) are not validated

**Examples:**

```markdown
<!-- Correct internal link -->

[Overview](/en/learn/swe/overview)

<!-- Correct — resolves to _index.md for section pages -->

[Learn](/en/learn)

<!-- Wrong — relative paths break in Hugo sidebar/menu contexts -->

[Overview](../overview)

<!-- Wrong — .md extension is not used in Hugo internal links -->

[Overview](/en/learn/swe/overview.md)
```

**Validation runs automatically** as part of `test:quick` (pre-push hook and CI):

```bash
# Full quality gate including link check
nx run ayokoding-web:test:quick

# Link check only (standalone)
nx run ayokoding-web:links:check
```

**When broken links are found:**

1. The command exits with code 1 — CI fails
2. Output table shows source file, line number, link text, and broken target
3. Fix by correcting the target path in the source file
4. Re-run `nx run ayokoding-web:links:check` to confirm

**Dependency chain:** `ayokoding-cli:build` → `ayokoding-web:links:check` → `ayokoding-web:test:quick`

## Go CLI Linting

Go CLI projects (`apps/rhino-cli`, `apps/ayokoding-cli`) use [golangci-lint](https://golangci-lint.run/) for static analysis.

**Shared configuration**: A single `.golangci.yml` at the repository root serves all Go CLIs. golangci-lint discovers it automatically by walking up the directory tree from each app's working directory — no `--config` flag or per-project files are needed.

**Active linter set** (from `.golangci.yml`):

- **Standard**: `errcheck`, `govet`, `ineffassign`, `staticcheck`, `unused`
- **Nil-safety**: `forcetypeassert`, `nilerr`, `nilnesserr`, `nilnil`
- **Exhaustiveness**: `exhaustive` (switch statements and map literals)
- **staticcheck checks**: `all` (SA\*, ST\*, S\*, QF\*) with 4 cosmetic ST checks excluded

**Usage**:

```bash
# Run from app directory
cd apps/rhino-cli && golangci-lint run ./...

# Run via Nx
nx lint rhino-cli
nx lint ayokoding-cli

# Verify which config file is resolved (verbose flag)
golangci-lint run -v ./... 2>&1 | grep "Config"
```

**Convention**: All Go projects in this repository share the root `.golangci.yml`. Per-project override files should only be added if a specific project genuinely needs different rules — which should be rare given the CLIs have the same purpose and audience.

## Elixir Formatting

**Purpose**: Auto-format Elixir source files to maintain consistent style across the three Elixir
projects: `apps/organiclever-be-exph`, `libs/elixir-gherkin`, and `libs/elixir-cabbage`.

**Tool**: `mix format`

**Why a Separate Hook Step (Not lint-staged)**:

`organiclever-be-exph`'s `.formatter.exs` uses `import_deps: [:ecto, :ecto_sql, :phoenix]`, which
loads `locals_without_parens` rules from those dependencies (e.g. Phoenix route macros, Ecto schema
macros). `mix format` must run from the project root where `mix.exs` and `_build/` are present.
Running from the repository root (no `mix.exs`) would silently apply incorrect formatting —
removing parentheses that Phoenix/Ecto expect to be omitted.

lint-staged changes the working directory per file glob, which breaks the project-root requirement.
A dedicated hook step groups staged files by their nearest Mix project root and runs `mix format`
from each one.

**Implementation**: `apps/rhino-cli/internal/git/runner.go` (`step6ElixirFormat`). The logic runs as part of `rhino-cli git pre-commit` (step 6).

**How It Works**:

1. Collect staged `.ex`/`.exs` files (excluding `deps/` and `_build/`)
2. If none staged: skip with message
3. If `mix` not installed: skip with warning (graceful degradation)
4. Walk up from each file's directory to find the nearest `mix.exs` (the project root)
5. For each unique project root, run `mix format <relative-file-paths>`
6. Re-stage all formatted files

**Configuration**: Each project's `.formatter.exs` governs formatting rules — no global config.

**Manual Formatting**:

```bash
# From a project root (e.g. apps/organiclever-be-exph)
mix format

# Format specific file
mix format lib/my_module.ex
```

## Language-Specific Auto-Formatters

In addition to Prettier (JS/TS/JSON/YAML/CSS/MD) and `mix format` (Elixir), the following
language-specific formatters run automatically as part of the pre-commit hook or CI pipeline:

| Language | Tool            | Trigger                                 |
| -------- | --------------- | --------------------------------------- |
| Go       | `gofmt`         | Pre-commit (lint-staged)                |
| Elixir   | `mix format`    | Pre-commit (step 6, project-root aware) |
| Python   | `ruff format`   | Pre-commit (lint-staged)                |
| Rust     | `rustfmt`       | Pre-commit (lint-staged)                |
| C#       | `dotnet format` | Pre-commit (lint-staged)                |
| Clojure  | `cljfmt`        | Pre-commit (lint-staged)                |
| Dart     | `dart format`   | Pre-commit (lint-staged)                |

Each formatter uses its language's standard style conventions. No custom configuration is applied
unless a project-specific config file exists (e.g., `rustfmt.toml`, `pyproject.toml`).

## Best Practices

1. **Trust the Tools**: Let Prettier handle formatting - don't fight it
2. **Commit Often**: Smaller commits = faster hook execution
3. **Fix Issues Immediately**: Don't accumulate quality debt
4. **Don't Bypass**: Resist temptation to use `--no-verify`
5. **Keep Updated**: Run `npm install` after pulling changes to sync hook versions

## Related Documentation

- [Commit Message Convention](../workflow/commit-messages.md) - Detailed commit message rules
- [No Machine-Specific Information in Commits](./no-machine-specific-commits.md) - Practice prohibiting machine-specific paths and credentials from committed code
- [Trunk Based Development](../workflow/trunk-based-development.md) - Git workflow and branching strategy
- [Git Push Safety Convention](../workflow/git-push-safety.md) - Requires explicit per-instance user approval before any agent or automation runs `git push --force`, `--force-with-lease`, or `--no-verify`
- [Nx Target Standards](../infra/nx-targets.md) - Canonical target names, `test:quick` composition rules, and caching configuration that the pre-push hook depends on
- [Three-Level Testing Standard](./three-level-testing-standard.md) - Mandatory unit/integration/E2E testing architecture for all projects; defines what `test:unit`, `test:integration`, and `test:e2e` must do at each level

## References

- [Prettier Documentation](https://prettier.io/docs/en/)
- [Husky Documentation](https://typicode.github.io/husky/)
- [lint-staged Documentation](https://github.com/lint-staged/lint-staged)
- [Conventional Commits](https://www.conventionalcommits.org/)
