---
title: "Commit Message Convention"
description: Understanding Conventional Commits and why we use them in open-sharia-enterprise
category: explanation
subcategory: development
tags:
  - conventional-commits
  - git
  - development
  - code-quality
created: 2025-11-24
---

# Commit Message Convention

<!--
  MAINTENANCE NOTE: Master reference for commit message format
  This is duplicated (intentionally) in multiple files for different audiences:
  1. governance/development/workflow/commit-messages.md (this file - comprehensive reference)
  2. AGENTS.md (quick reference for AI agents)
  When updating, synchronize both locations.
-->

This document explains the commit message convention used in the open-sharia-enterprise project, why we use it, and how it's enforced. Understanding commit messages helps maintain a clean, navigable project history that benefits all contributors.

## Principles Implemented/Respected

This practice respects the following core principles:

- **[Explicit Over Implicit](../../principles/software-engineering/explicit-over-implicit.md)**: Commit format (`type(scope): description`) explicitly states the nature of change. No guessing from cryptic messages like "fix stuff" or "updates". Commit type, scope, and description are all explicit.

- **[Automation Over Manual](../../principles/software-engineering/automation-over-manual.md)**: Commitlint automatically validates message format via git hooks. Commits rejected if format is invalid. No manual review of commit messages needed - automation enforces the standard.

## Conventions Implemented/Respected

**REQUIRED SECTION**: All development practice documents MUST include this section to ensure traceability from practices to documentation standards.

This practice implements/respects the following conventions:

- **[Code Quality Convention](../quality/code.md)**: Commit message validation is enforced through git hooks (Husky + Commitlint) as part of the automated code quality workflow.

- **[Content Quality Principles](../../conventions/writing/quality.md)**: Commit messages use active voice (imperative mood) and clear, concise descriptions - aligning with content quality standards for communication.

## What are Conventional Commits?

**Conventional Commits** is a specification for writing human and machine-readable commit messages. It provides a standardized format that clearly communicates the nature of changes in the repository.

The convention follows this structure:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

This is not just a style preference - it's an industry-standard specification adopted by thousands of open-source projects worldwide. Learn more at [conventionalcommits.org](https://www.conventionalcommits.org/).

## The Format Explained

### Header Line (Required)

```
<type>(<scope>): <description>
```

**Components:**

- **`<type>`** (required): The kind of change being made
- **`(<scope>)`** (optional): The area of the codebase affected
- **`<description>`** (required): A brief summary of the change

**Rules:**

- `<type>` must be lowercase (e.g., `feat`, not `Feat` or `FEAT`)
- `(<scope>)` is optional but recommended for clarity
- `<description>` must be in imperative mood (e.g., "add" not "added" or "adds")
- No period at the end of the description
- Total header length should be 50 characters or less

### Body (Optional)

The body provides additional context about the change:

```
A more detailed explanation of what changed and why.

Can span multiple paragraphs if needed.
```

**Rules:**

- Blank line required between header and body
- Each line must be 100 characters or less
- Use imperative mood
- Explain _what_ and _why_, not _how_

### Footer (Optional)

The footer contains metadata about the commit:

```
BREAKING CHANGE: description of breaking change
Fixes #123
Refs #456, #789
```

**Common footers:**

- `BREAKING CHANGE:` - Indicates a breaking API change
- `Fixes #issue` - Links to resolved issues
- `Refs #issue` - References related issues

## Valid Commit Types

The project uses the following types based on [Angular's commit convention](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#type) (verified 2026-02-08):

| Type       | Purpose                                     | Example                                                |
| ---------- | ------------------------------------------- | ------------------------------------------------------ |
| `feat`     | New feature                                 | `feat(auth): add two-factor authentication`            |
| `fix`      | Bug fix                                     | `fix: prevent race condition on startup`               |
| `docs`     | Documentation changes                       | `docs: update API reference`                           |
| `style`    | Code style changes (formatting, whitespace) | `style: remove unused imports`                         |
| `refactor` | Code refactoring (no behavior change)       | `refactor(parser): extract common logic`               |
| `perf`     | Performance improvement                     | `perf: optimize database query`                        |
| `test`     | Test changes                                | `test: add unit tests for auth module`                 |
| `chore`    | Build/tooling/dependency changes            | `chore: update dependencies`                           |
| `ci`       | CI/CD configuration changes                 | `ci: add GitHub Actions workflow`                      |
| `revert`   | Revert a previous commit                    | `revert: feat(auth): remove two-factor authentication` |

### Type Descriptions

**`feat`** - A new feature for the user (not a new feature for build script)

- Adds new functionality
- User-facing changes
- May include internal changes to support the feature

**`fix`** - A bug fix for the user (not a fix to a build script)

- Resolves incorrect behavior
- Patches security vulnerabilities
- Fixes regression issues

**`docs`** - Documentation only changes

- README updates
- Code comments
- API documentation
- Inline documentation

**`style`** - Changes that don't affect code meaning

- Formatting (indentation, whitespace)
- Missing semicolons
- Code style adjustments
- Not CSS changes (those are `feat` or `fix`)

**`refactor`** - Code restructuring without behavior change

- Improving code structure
- Extracting functions
- Renaming for clarity
- No functional changes

**`perf`** - Performance improvements

- Optimization changes
- Reducing computation time
- Improving memory usage
- Measurable performance gains

**`test`** - Adding or correcting tests

- New test cases
- Fixing broken tests
- Improving test coverage
- Test refactoring

**`chore`** - Maintenance tasks

- Dependency updates
- Build configuration
- Release preparation
- Tooling changes

**`ci`** - Continuous Integration changes

- GitHub Actions
- Build pipelines
- Deployment scripts
- CI configuration

**`revert`** - Reverting previous commits

- Undoing changes
- Rolling back features
- Include original commit reference

## Scope Examples

The `<scope>` indicates which part of the codebase is affected. Choose scopes that are meaningful for your project:

**Common scopes:**

- `auth` - Authentication and authorization
- `api` - API endpoints and routes
- `db` - Database-related changes
- `ui` - User interface components
- `config` - Configuration files
- `deps` - Dependencies
- `core` - Core business logic

**Examples:**

```
feat(auth): add login functionality
fix(api): correct validation error
docs(readme): update installation steps
refactor(db): extract query builder
```

## Real-World Examples

### Good Examples

**Basic feature:**

```
feat(auth): add login functionality
```

**Bug fix with scope:**

```
fix(api): prevent race condition on startup
```

**Documentation update:**

```
docs: update API reference
```

**Refactoring with detailed scope:**

```
refactor(parser): extract common logic into utilities
```

**Performance improvement with body:**

```
perf(db): optimize user query

Reduce query time from 500ms to 50ms by adding index on
email field and using prepared statements.
```

**Breaking change with footer:**

```
feat(api): redesign authentication endpoint

BREAKING CHANGE: The /auth endpoint now requires OAuth 2.0
instead of API keys. Update all client applications.
```

**Bug fix with issue reference:**

```
fix(validation): handle empty strings correctly

Fixes #123
```

### Bad Examples

**Missing type:**

```
FAIL: Added new feature
PASS: feat: add new feature
```

**Wrong tense:**

```
FAIL: feat: added login
PASS: feat: add login
```

**Wrong case:**

```
FAIL: FEAT(AUTH): ADD LOGIN
PASS: feat(auth): add login
```

**Period at end:**

```
FAIL: feat: add login.
PASS: feat: add login
```

**Too long header:**

```
FAIL: feat: add a really complex and detailed authentication system with multiple providers
PASS: feat(auth): add multi-provider authentication
```

**Not imperative mood:**

```
FAIL: feat: adds login capability
FAIL: feat: adding login
PASS: feat: add login
```

## Why We Use This Convention

### Benefits for Developers

1. **Clarity** - Immediately understand what a commit does
2. **Context Switching** - Quickly scan commit history
3. **Code Review** - Easier to review focused commits
4. **Git History** - Clean, navigable project history

### Benefits for Teams

1. **Consistency** - Everyone follows the same standard
2. **Communication** - Clear language across the team
3. **Onboarding** - New contributors understand conventions
4. **Collaboration** - Reduces friction in code review

### Benefits for the Project

1. **Automated Changelog** - Generate changelogs from commits
2. **Semantic Versioning** - Automatically determine version bumps
3. **Git Bisect** - More effective debugging with clear commits
4. **Release Notes** - Auto-generate release documentation

### Benefits for Users

1. **Transparency** - Clear understanding of what changed
2. **Trust** - Professional project management
3. **Predictability** - Know what to expect in releases

## How It's Enforced

The project uses automated tools to ensure all commits follow the convention:

### Commitlint

**Tool**: [@commitlint/config-conventional](https://github.com/conventional-changelog/commitlint)

**Configuration**: `commitlint.config.js`

```javascript
module.exports = {
  extends: ["@commitlint/config-conventional"],
};
```

**Note for Node.js 24+**: Node v24 introduced changes to module loading. Ensure:

- Project has `package.json` (this project uses npm workspaces )
- Or rename config to `commitlint.config.mjs` if using ES6 modules

**Validates:**

- Commit message format
- Valid types
- Description presence
- Character limits

### Husky Git Hook

**Hook**: `.husky/commit-msg`

**When it runs**: After you write a commit message, before the commit is created

**What it does:**

1. Intercepts the commit message
2. Runs `commitlint` to validate format
3. Rejects the commit if validation fails
4. Provides helpful error message

**Example error:**

```bash
⧗   input: Added new feature
   subject may not be empty [subject-empty]
   type may not be empty [type-empty]

   found 2 problems, 0 warnings
ⓘ   Get help: https://github.com/conventional-changelog/commitlint/#what-is-commitlint
```

### Workflow

```
1. Developer writes code
2. Developer stages changes (git add)
3. Pre-commit hook runs (Prettier formats files)
4. Developer writes commit message
5. Commit-msg hook runs (Commitlint validates message)
   ├─ Valid → Commit succeeds
   └─ Invalid → Commit rejected with error message
6. Developer fixes message and tries again
```

## Common Errors and Fixes

### Error: "type may not be empty"

**Problem**: Missing commit type

```bash
FAIL: update documentation
```

**Fix**: Add a valid type

```bash
PASS: docs: update documentation
```

### Error: "subject may not be empty"

**Problem**: Missing description after colon

```bash
FAIL: feat:
```

**Fix**: Add description

```bash
PASS: feat: add login functionality
```

### Error: "header must not be longer than 50 characters"

**Problem**: Header line too long

```bash
FAIL: feat(auth): add a comprehensive authentication system with multiple providers
```

**Fix**: Shorten description, add details to body

```bash
PASS: feat(auth): add multi-provider authentication

Supports OAuth 2.0, SAML, and API key authentication.
```

### Error: "type must be lowercase"

**Problem**: Type in wrong case

```bash
FAIL: Feat: add login
FAIL: FEAT: add login
```

**Fix**: Use lowercase

```bash
PASS: feat: add login
```

### Error: "body's lines must not be longer than 100 characters"

**Problem**: Body line exceeds character limit

**Fix**: Break into multiple lines

```bash
PASS: feat: add new feature

This is a longer explanation that has been broken into
multiple lines to ensure each line stays under 100
characters for better readability.
```

## Best Practices

### Write Clear Descriptions

**Good:**

```
feat(auth): add password reset functionality
fix(api): prevent duplicate user registration
docs: add API authentication guide
```

**Avoid:**

```
feat: stuff
fix: bug
docs: updates
```

### Use Scopes Consistently

Define project-wide scopes and stick to them:

```
feat(auth): ...
feat(api): ...
feat(ui): ...
```

Not:

```
feat(authentication): ...
feat(endpoints): ...
feat(frontend): ...
```

### One Logical Change Per Commit

**Good:**

```
feat(auth): add login endpoint
feat(auth): add logout endpoint
```

**Avoid:**

```
feat: add login and logout and password reset and user profile
```

### Use the Body for Context

**Good:**

```
perf(db): optimize user query

Add composite index on (email, status) to reduce query
time from 500ms to 50ms. Tested with 1M user dataset.
```

**Avoid:**

```
perf(db): optimize user query
```

### Reference Issues

Link commits to issues when applicable:

```
fix(auth): prevent session hijacking

Fixes #456
```

### Explain Breaking Changes

Always document breaking changes:

```
feat(api): redesign authentication endpoint

BREAKING CHANGE: The /auth endpoint now requires OAuth 2.0
instead of API keys. See migration guide in docs/migration.md.
```

## Commit Granularity

When making changes to the codebase, it's essential to split your work into multiple logical commits rather than creating one large commit with many unrelated changes. This practice improves code review, makes git history more navigable, and enables easier debugging with tools like `git bisect`.

### When to Split Commits

Split your work into multiple commits when:

**Different commit types** - Changes that fall under different conventional commit types should be separate commits:

```
PASS: Good:
1. feat(agents): add docs-link-checker agent
2. docs(agents): update agent index with new agent

FAIL: Bad:
1. feat(agents): add docs-link-checker agent and update agent index
```

**Creating vs updating** - Creating new files and updating references to them should be separate commits:

```
PASS: Good:
1. feat(auth): add user authentication module
2. refactor(api): integrate authentication module

FAIL: Bad:
1. feat(auth): add user authentication module and integrate it
```

**Renaming vs updating references** - Renaming files and updating all references should be separate commits:

```
PASS: Good:
1. refactor(agents): rename agents for consistency
2. docs(agents): update all references to renamed agents

FAIL: Bad:
1. refactor(agents): rename agents and update all references
```

**Different domains** - Changes to different parts of the codebase should be separate commits:

```
PASS: Good:
1. feat(api): add user endpoint
2. docs: document user API
3. test(api): add user endpoint tests

FAIL: Bad:
1. feat(api): add user endpoint with docs and tests
```

**Independent changes** - Changes that could be reviewed or reverted separately should be separate commits:

```
PASS: Good:
1. fix(validation): handle empty strings correctly
2. perf(db): optimize user query
3. docs: update API reference

FAIL: Bad:
1. fix: various improvements to validation, database, and docs
```

### When to Combine Commits

Combine related changes into a single commit when:

**Single logical change** - Multiple files that together form one atomic feature or fix:

```
PASS: Good:
1. feat(auth): add two-factor authentication
   (includes: auth.js, auth.test.js, auth.md, routes.js)

FAIL: Bad:
1. feat(auth): add auth.js
2. feat(auth): add auth.test.js
3. feat(auth): add auth.md
4. feat(auth): update routes.js
```

**Tightly coupled changes** - Changes that don't make sense separately or would break the build if separated:

```
PASS: Good:
1. refactor(api): rename getUserData to fetchUserProfile
   (includes renaming function definition and all call sites)

FAIL: Bad:
1. refactor(api): rename function definition
2. refactor(api): update call sites
   (This would break the build between commits)
```

### Commit Ordering Best Practices

When you have multiple commits, order them logically:

1. **Create before update** - Create new files before updating references to them
2. **Refactor before fix** - Refactor code before fixing bugs in the refactored code
3. **Type progression** - Follow a natural flow: `feat` → `refactor` → `docs` → `test` → `fix`

**Example of good commit ordering:**

```
1. feat(agents): add docs-link-checker agent          # Create new file
2. refactor(agents): rename agents for consistency    # Rename existing files
3. docs(agents): update all references to renamed agents  # Update references
4. fix(docs): align frontmatter date                  # Fix issues discovered
```

### Atomic Commits

Each commit should be **atomic** - meaning:

- **Self-contained**: The commit includes everything needed for the change
- **Functional**: The codebase builds and runs after the commit
- **Single purpose**: The commit has one clear, well-defined purpose
- **Reversible**: The commit can be reverted without breaking other changes

**Example of atomic commits:**

```
PASS: Good (atomic):
1. feat(db): add user index on email field
   - Includes migration file
   - Includes rollback script
   - Updates schema documentation
   - All related to ONE database change

FAIL: Bad (not atomic):
1. feat(db): add user index
   - Only adds migration, missing rollback
   - Builds fail until next commit
```

### Real-World Examples

**Example 1: Adding a new feature**

```
PASS: Good:
1. feat(analytics): add event tracking system
2. docs(analytics): document event tracking API
3. test(analytics): add event tracking tests

FAIL: Bad:
1. feat(analytics): add event tracking with docs and tests
```

**Example 2: Refactoring and fixing**

```
PASS: Good:
1. refactor(parser): extract validation logic
2. fix(parser): handle edge case in validation

FAIL: Bad:
1. refactor(parser): extract validation and fix edge case
```

**Example 3: Configuration changes**

```
PASS: Good:
1. chore(deps): update eslint to v8.0.0
2. style: fix linting errors from eslint update

FAIL: Bad:
1. chore: update eslint and fix all linting errors
```

### Benefits of Proper Commit Granularity

**For code review:**

- Easier to review focused, single-purpose commits
- Clear understanding of what changed and why
- Ability to approve/reject specific changes

**For debugging:**

- More effective `git bisect` with clear commit boundaries
- Easier to identify which commit introduced a bug
- Simpler to revert specific changes

**For project history:**

- Clean, navigable git log
- Clear narrative of how the project evolved
- Better documentation of decision-making process

**For collaboration:**

- Reduces merge conflicts
- Makes cherry-picking easier
- Improves communication between team members

## Making Commits

### Interactive Workflow

```bash
# 1. Stage your changes
git add <files>

# 2. Commit with message
git commit -m "feat(auth): add login functionality"

# 3. If validation fails, fix and try again
git commit -m "feat(auth): add login functionality"
```

### Commit with Body

```bash
git commit -m "feat(auth): add login functionality" -m "Implements OAuth 2.0 authentication with support for Google and GitHub providers."
```

### Multi-line Commit in Editor

```bash
# Opens your default editor
git commit

# Write:
feat(auth): add login functionality

Implements OAuth 2.0 authentication with support for
Google and GitHub providers. Includes session management
and refresh token handling.

Closes #123
```

## Related Documentation

- [AI Agents Convention](../agents/ai-agents.md) - Standards for AI agents
- [Code Quality Convention](../quality/code.md) - Automated tools and git hooks for code formatting and commit validation
- [Development Index](../README.md) - Overview of development conventions
- [Conventions Index](../../conventions/README.md) - Documentation conventions

## External Resources

- [Conventional Commits Specification](https://www.conventionalcommits.org/) - Official specification
- [Angular Commit Guidelines](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#type) (verified 2026-02-08) - Inspiration for commit types
- [Commitlint Documentation](https://commitlint.js.org/) - Tool documentation
- [Semantic Versioning](https://semver.org/) - Version numbering standard
