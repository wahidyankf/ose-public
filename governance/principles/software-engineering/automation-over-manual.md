---
title: "Automation Over Manual"
description: Automate repetitive tasks to ensure consistency and reduce human error - humans for creative work, machines for repetition
category: explanation
subcategory: principles
tags:
  - principles
  - automation
  - git-hooks
  - ai-agents
  - consistency
created: 2025-12-15
updated: 2025-12-24
---

# Automation Over Manual

**Automate repetitive tasks** to ensure consistency and reduce human error. Humans should focus on creative and strategic work, machines should handle repetitive, mechanical tasks.

## Vision Supported

This principle serves the [Open Sharia Enterprise Vision](../../vision/open-sharia-enterprise.md) of scaling Islamic enterprise knowledge and quality assurance across a global community.

**How this principle serves the vision:**

- **Scales Knowledge Sharing**: Automated validation (docs-checker, repo-governance-checker) means quality knowledge spreads without requiring manual expert review. One expert creates a checker, thousands benefit
- **Lowers Contribution Barriers**: Automated formatting and linting mean contributors don't need to memorize style guides. Focus on Islamic finance logic, not formatting rules
- **Maintains Consistency**: As the community grows globally, automation ensures consistent quality across timezones and contributors. No gatekeepers needed
- **Frees Human Creativity**: Developers spend time understanding Shariah principles and building innovative solutions, not manual testing and formatting. Automation handles the tedious, humans handle the meaningful
- **Continuous Quality Improvement**: Automated checks run on every commit, catching issues early. Maintains professional standards that attract serious contributors

**Vision alignment**: Open-source thrives when contribution is easy and quality is automatic. Automation democratizes quality - everyone can produce professional-grade Islamic enterprise without requiring elite expertise in every domain.

## What

**Automation** means:

- Repetitive tasks run automatically
- Consistency enforced by machines
- Human intervention only when needed
- Errors caught before they cause problems
- Time spent on creative work, not mechanical tasks

**Manual processes** mean:

- Humans perform repetitive tasks
- Inconsistency due to human error
- Fatigue from repetitive work
- Errors discovered late
- Time wasted on mechanical tasks

## Why

### Benefits of Automation

1. **Consistency**: Machines perform tasks identically every time
2. **Error Reduction**: Catch mistakes before they propagate
3. **Time Savings**: Humans focus on creative work
4. **Scalability**: Automation scales without additional effort
5. **Documentation**: Automation codifies best practices

### Problems with Manual Processes

1. **Human Error**: Forgetting steps, typos, inconsistency
2. **Fatigue**: Repetitive tasks are boring and error-prone
3. **Inconsistency**: Different people do things differently
4. **Scalability**: Manual processes don't scale
5. **Knowledge Loss**: Tribal knowledge not captured

### When to Automate

**Automate when**:

- PASS: Task is performed repeatedly (more than 3 times)
- PASS: Task follows clear, mechanical rules
- PASS: Human error causes problems
- PASS: Consistency is important
- PASS: Automation time < manual time saved

**Don't automate when**:

- FAIL: Task requires creativity or judgment
- FAIL: Task is performed once or twice
- FAIL: Task changes frequently
- FAIL: Automation is more complex than the task

## How It Applies

### Git Hooks (Pre-commit)

**Context**: Ensuring code quality before commits.

**Automation**: `.husky/pre-commit` hook

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

**What it automates**:

- Code formatting with Prettier
- Automatically stages formatted files
- Blocks commit if formatting fails
- Runs only on staged files (fast)

**Manual alternative** (what we avoid):

```bash
# FAIL: Manual process - error-prone
# 1. Developer remembers to run Prettier
# 2. Developer runs on all files (slow)
# 3. Developer might forget
# 4. Inconsistent formatting in commits
```

### Commit Message Validation

**Context**: Ensuring commit messages follow convention.

**Automation**: `.husky/commit-msg` hook + Commitlint

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx commitlint --edit $1
```

**What it automates**:

- Validates commit message format
- Enforces Conventional Commits standard
- Provides helpful error messages
- Blocks invalid commits

**Manual alternative** (what we avoid):

```bash
# FAIL: Manual review - inconsistent
# 1. Developer writes commit message
# 2. Reviewer checks format (maybe)
# 3. Format inconsistencies slip through
# 4. Git history becomes messy
```

### AI Agent Validation

**Context**: Checking documentation quality and consistency.

**Automation**: `docs-checker.md` agent

**What it automates**:

- Validates file naming conventions
- Checks frontmatter completeness
- Verifies internal link validity
- Detects contradictions
- Generates audit reports

**Manual alternative** (what we avoid):

```bash
# FAIL: Manual review - time-consuming, incomplete
# 1. Reviewer reads all documentation
# 2. Manually checks file names
# 3. Manually clicks all links
# 4. Tries to remember all conventions
# 5. Misses subtle issues
```

### Link Verification Cache

**Context**: Checking external links without redundant requests.

**Automation**: `docs-link-general-checker.md` agent with cache

**Location**: `docs/metadata/external-links-status.yaml`

**What it automates**:

- Verifies external links
- Caches results (6-month expiry per link)
- Tracks redirect chains
- Timestamps in UTC+7
- Generates consolidated report

**Manual alternative** (what we avoid):

```bash
# FAIL: Manual link checking - impractical
# 1. Click every external link
# 2. Record status and redirects
# 3. Repeat for every documentation update
# 4. Links change, manual check becomes stale
```

### Code Formatting

**Context**: Consistent code style.

**Automation**: Prettier via lint-staged

**Configuration** (`package.json`):

```json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx,mjs,cjs}": "prettier --write",
    "*.json": "prettier --write",
    "*.md": "prettier --write",
    "*.{yml,yaml}": "prettier --write"
  }
}
```

**What it automates**:

- Formats code to consistent style
- Runs automatically on commit
- No debates about formatting
- Consistent codebase

**Manual alternative** (what we avoid):

```bash
# FAIL: Manual formatting - waste of time
# 1. Developer manually formats code
# 2. Different developers format differently
# 3. Code review wastes time on style
# 4. Inconsistent codebase
```

## Anti-Patterns

### Manual Quality Checks

FAIL: **Problem**: Relying on humans to remember checks.

```bash
# FAIL: Manual checklist - often skipped
# Before committing:
# - Did I run Prettier? (maybe)
# - Did I check the commit message format? (probably not)
# - Did I validate the documentation? (forgot)
```

**Why it's bad**: Humans forget. Manual checklists are ignored when time is tight.

### No Validation Until PR

FAIL: **Problem**: Catching errors in code review instead of pre-commit.

```bash
# FAIL: Errors discovered in PR review
git commit -m "added feature"  # Invalid format
git push
# PR reviewer: "Please fix commit message format"
# Developer: *forces push with amended message*
```

**Why it's bad**: Wastes reviewer time. Disrupts workflow. Easy to automate.

### Inconsistent Tooling

FAIL: **Problem**: Different developers use different formatters.

```bash
# Developer A uses Prettier
# Developer B uses ESLint --fix
# Developer C manually formats
# Result: Inconsistent code style
```

**Why it's bad**: Inconsistency. Merge conflicts. Wasted time debating style.

### Manual Link Checking

FAIL: **Problem**: Clicking links manually to verify they work.

```bash
# FAIL: Manual link verification
# 1. Open each documentation file
# 2. Click every external link
# 3. Record which ones work
# 4. Repeat weekly
```

**Why it's bad**: Time-consuming. Error-prone. Unsustainable at scale.

## PASS: Best Practices

### 1. Automate at the Right Layer

**Git hooks** for pre-commit checks:

```bash
PASS: pre-commit: Format code, validate syntax
PASS: commit-msg: Validate commit message format
FAIL: CI/CD: Don't wait for CI to catch formatting (too slow)
```

**AI agents** for deep validation:

```bash
PASS: docs-checker: Validate conventions, detect contradictions
PASS: plan-checker: Verify plan completeness
FAIL: Git hooks: Don't run deep validation pre-commit (too slow)
```

### 2. Make Automation Fast

**Only process changed files**:

```json
{
  "lint-staged": {
    "*.ts": "prettier --write"
  }
}
```

**Not** entire codebase:

```bash
FAIL: prettier --write "**/*.ts"  # Too slow for pre-commit
```

### 3. Provide Clear Error Messages

**Good error message**:

```
 Commit message format invalid
Expected: <type>(<scope>): <description>
Received: "added feature"

Valid types: feat, fix, docs, style, refactor, test, chore

Example: feat(api): add user authentication endpoint
```

**Bad error message**:

```
FAIL: Invalid format
```

### 4. Cache Expensive Operations

**Link verification with cache**:

```yaml
# docs/metadata/external-links-status.yaml
links:
  - url: https://example.com/api
    status: 200
    lastChecked: "2025-12-15T10:00:00+07:00"
    expiresAt: "2026-06-15T10:00:00+07:00"
```

**Not** checking every time:

```bash
FAIL: curl every link on every run  # Too slow, wasteful
```

### 5. Document What's Automated

**In AGENTS.md**:

```markdown
## Code Quality & Git Hooks

The project enforces code quality through automated git hooks:

### Pre-commit Hook

1. Lint-staged selects staged files
2. Prettier formats matching files
3. Formatted files automatically staged
4. Commit blocked if issues found
```

## Examples from This Repository

### Husky Git Hooks

**Location**: `.husky/`

**Files**:

- `pre-commit` - Format code with Prettier
- `commit-msg` - Validate commit message with Commitlint

**Automation benefits**:

- PASS: Runs on every commit (no forgetting)
- PASS: Fast (only staged files)
- PASS: Consistent across all developers
- PASS: Blocks invalid commits immediately

### AI Validation Agents

**Location**: `.claude/agents/`

**Agents**:

- `docs-checker.md` - Validate documentation
- `docs-link-general-checker.md` - Verify links with cache
- `repo-governance-checker.md` - Check repository consistency
- `plan-checker.md` - Validate project plans

**Automation benefits**:

- PASS: Deep validation (beyond git hooks)
- PASS: Generates detailed reports
- PASS: Catches complex issues (contradictions, broken links)
- PASS: On-demand (not every commit)

### Prettier Configuration

**Location**: `package.json` (lint-staged)

**What it automates**:

- JavaScript/TypeScript formatting (2 spaces)
- JSON formatting
- Markdown formatting (excluding Hugo archetypes)
- YAML formatting

**Automation benefits**:

- PASS: No style debates
- PASS: Consistent codebase
- PASS: Automatic on commit
- PASS: Fast (only changed files)

### Link Verification Cache

**Location**: `docs/metadata/external-links-status.yaml`

**What it automates**:

- External link checking
- 6-month cache per link
- Redirect chain tracking
- Status code recording

**Automation benefits**:

- PASS: Fast (cached results)
- PASS: Reduces external requests
- PASS: Timestamps for expiry
- PASS: Centralized link status

## Relationship to Other Principles

- [Explicit Over Implicit](./explicit-over-implicit.md) - Automation makes behavior explicit
- [Simplicity Over Complexity](../general/simplicity-over-complexity.md) - Automate simple, repetitive tasks
- [Accessibility First](../content/accessibility-first.md) - Automated accessibility checks

## Related Conventions

- [Code Quality Convention](../../development/quality/code.md) - Git hooks and Prettier
- [AI Agents Convention](../../development/agents/ai-agents.md) - Validation agents
- [Commit Message Convention](../../development/workflow/commit-messages.md) - Automated validation
- [Repository Validation](../../development/quality/repository-validation.md) - Standard validation patterns

## References

**Automation Principles**:

- [The Joel Test](https://www.joelonsoftware.com/2000/08/09/the-joel-test-12-steps-to-better-code/) - Question 2: Build in one step
- [Continuous Integration](https://martinfowler.com/articles/continuousIntegration.html) - Martin Fowler
- [The Pragmatic Programmer](https://pragprog.com/titles/tpp20/the-pragmatic-programmer-20th-anniversary-edition/) - DRY and automation

**Git Hooks**:

- [Husky Documentation](https://typicode.github.io/husky/) - Git hooks made easy
- [lint-staged Documentation](https://github.com/lint-staged/lint-staged) - Run linters on staged files
- [Commitlint](https://commitlint.js.org/) - Lint commit messages

**Code Quality**:

- [Prettier](https://prettier.io/) - Opinionated code formatter
- [EditorConfig](https://editorconfig.org/) - Consistent coding styles

---

**Last Updated**: 2025-12-24
