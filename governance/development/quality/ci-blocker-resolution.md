---
title: "CI Blocker Resolution Convention"
description: Practice mandating that preexisting CI blockers are investigated at the root cause and fixed properly, never bypassed
category: explanation
subcategory: development
tags:
  - ci
  - quality-gates
  - root-cause
  - debugging
  - anti-pattern
  - preexisting-issues
created: 2026-04-04
updated: 2026-04-04
---

# CI Blocker Resolution Convention

NOT fixing preexisting problems that block CI is a **critical antipattern**. Bypassing blocked CI with `--no-verify`, skipping tests, or ignoring failures is **forbidden**. When `nx affected` blast radius is blocked by a preexisting issue, you MUST investigate the root cause deeply and fix it properly. No shortcuts. No workarounds. No "it was broken before my changes."

## Principles Implemented/Respected

This practice respects the following core principles:

- **[Root Cause Orientation](../../principles/general/root-cause-orientation.md)**: This convention is a direct expression of the Root Cause Orientation principle. Preexisting CI failures are not "someone else's problem" -- they are the repository's problem. Every contributor who encounters a blocker has a responsibility to investigate the root cause and fix it, not route around it.

- **[Deliberate Problem-Solving](../../principles/general/deliberate-problem-solving.md)**: Bypassing CI is the opposite of deliberate problem-solving. It substitutes a quick escape for a thoughtful investigation. This convention requires the implementer to understand the failure before acting, choose the correct fix, and verify the fix resolves the root cause.

- **[Automation Over Manual](../../principles/software-engineering/automation-over-manual.md)**: CI automation exists to catch problems early. Bypassing it destroys the value of that automation. This convention protects the integrity of the automated quality boundary by making bypass a forbidden action rather than a tolerated workaround.

- **[Simplicity Over Complexity](../../principles/general/simplicity-over-complexity.md)**: A clean, passing CI pipeline is simpler than a pipeline with known failures that everyone works around. Fixing preexisting issues reduces the complexity of the development environment for every contributor.

## Conventions Implemented/Respected

This practice implements/respects the following conventions:

- **[Code Quality Convention](./code.md)**: The quality gates (typecheck, lint, test:quick, spec-coverage) are the CI boundary this convention protects. Bypassing those gates with `--no-verify` or test skipping is the specific action this convention forbids.

- **[Git Push Safety Convention](../workflow/git-push-safety.md)**: Both conventions share the stance that `--no-verify` is not a routine shortcut. This convention extends the principle to the broader case of any CI bypass mechanism.

- **[Trunk Based Development Convention](../workflow/trunk-based-development.md)**: TBD requires that `main` is always in a releasable state. Preexisting CI failures on `main` violate that requirement. This convention mandates fixing them rather than tolerating them.

## The Rule

**When CI is blocked by a preexisting issue, you MUST:**

1. **Investigate the root cause deeply.** Read the error output. Trace it to the source. Understand why it fails, not just that it fails.
2. **Fix it properly.** Apply a correct, minimal fix that addresses the root cause. No monkey-patches, no `@ts-ignore`, no `skip()` on tests, no `--no-verify`.
3. **Commit the fix separately.** Preexisting fixes go in their own commit with an appropriate conventional commit message (typically `fix(scope):` or `chore(scope):`), separate from your feature work.
4. **Verify the fix.** Re-run the affected quality gates and confirm they pass before proceeding with your original work.

## Forbidden Actions

The following actions are **explicitly forbidden** as responses to preexisting CI blockers:

| Forbidden Action                                              | Why It Is Wrong                                                |
| ------------------------------------------------------------- | -------------------------------------------------------------- |
| `git push --no-verify`                                        | Bypasses all quality gates, ships broken code to remote        |
| `git commit --no-verify`                                      | Bypasses pre-commit validation, hides formatting/config issues |
| Adding `skip()` or `.skip` to failing tests                   | Hides the failure instead of fixing it                         |
| Adding `@ts-ignore` or `// eslint-disable` to suppress errors | Silences the symptom, root cause remains                       |
| Commenting out failing test assertions                        | Destroys test coverage, hides regressions                      |
| Removing failing tests entirely (without replacing them)      | Reduces quality coverage                                       |
| Adding `cache: false` to work around stale cache issues       | Masks a cache configuration problem                            |
| Saying "it was broken before my changes" and moving on        | Abdicates responsibility for repository health                 |
| Creating a "fix later" ticket without fixing now              | Defers the problem indefinitely                                |

## The Investigation Process

When you encounter a preexisting CI failure, follow this process:

### Step 1: Read the Error

Read the full error output. Not just the summary line -- the full stack trace, the full lint output, the full test failure message. The root cause is in the details.

### Step 2: Identify the Blast Radius

Determine which projects are affected:

```bash
# See which projects are affected by your changes
npx nx affected -t typecheck lint test:quick spec-coverage --dry-run
```

If a project you did not modify is failing, it is a preexisting issue. Your changes did not cause it, but you are responsible for fixing it because you discovered it.

### Step 3: Reproduce the Failure

Reproduce the failure in isolation to confirm it is preexisting:

```bash
# Run the specific failing target for the specific project
npx nx run <project>:typecheck
npx nx run <project>:lint
npx nx run <project>:test:quick
npx nx run <project>:spec-coverage
```

### Step 4: Trace to Root Cause

Common root causes of preexisting CI failures:

| Symptom                                    | Common Root Cause                                             |
| ------------------------------------------ | ------------------------------------------------------------- |
| Type errors in a project you did not touch | A shared library changed its types without updating consumers |
| Lint errors in generated code              | The codegen target needs to run before lint                   |
| Test failures with stale snapshots         | Snapshots need updating after a dependency upgrade            |
| Import resolution failures                 | A dependency was added to one project but not another         |
| Coverage threshold failure                 | A recent commit removed tests without replacing them          |
| Spec-coverage failure                      | A command was added without a corresponding Gherkin scenario  |

### Step 5: Apply the Fix

Fix the root cause with a minimal, correct change. Commit it separately:

```bash
# Fix the issue
# ... edit files ...

# Commit the preexisting fix separately
git add .
git commit -m "fix(project-name): resolve preexisting typecheck failure in shared types"

# Now continue with your feature work
```

### Step 6: Verify

Re-run the quality gates to confirm the fix resolves the failure:

```bash
npx nx affected -t typecheck lint test:quick spec-coverage
```

## Commit Separation

Preexisting fixes MUST be committed separately from feature work. This serves multiple purposes:

- **Clear history**: The fix is visible as a distinct change, not buried in a feature commit.
- **Easy revert**: If the fix introduces a new problem, it can be reverted independently.
- **Accurate attribution**: The commit message accurately describes what changed and why.
- **Review clarity**: Reviewers can evaluate the fix on its own merits.

**Commit message patterns for preexisting fixes:**

```
fix(project-name): resolve preexisting lint violations in auth module
fix(shared-types): update type exports to match current API shape
chore(project-name): update test snapshots after dependency upgrade
fix(project-name): add missing Gherkin step definitions for existing commands
```

## Examples

### PASS: Fixing a preexisting blocker

```
Developer: I'm implementing a new feature in organiclever-fe.
           Running test:quick, I see that organiclever-be has
           a failing typecheck due to a stale codegen output.

Action:
1. Run nx run organiclever-be:codegen to regenerate types
2. Run nx run organiclever-be:typecheck to confirm it passes
3. Commit: "fix(organiclever-be): regenerate types from updated contract"
4. Continue with organiclever-fe feature work
```

### FAIL: Bypassing the blocker

```
Developer: I'm implementing a new feature in organiclever-fe.
           Running test:quick, I see that organiclever-be has
           a failing typecheck. That's not my project.

Action: git push --no-verify
Result: Broken code reaches remote. CI fails for everyone.
```

### FAIL: Deferring the fix

```
Developer: I see the preexisting failure. I'll create a ticket
           to fix it later. For now, I'll skip that project's tests.

Action: Adds skip() to failing tests, pushes.
Result: Test coverage decreases. The failure is hidden, not fixed.
        The ticket sits in the backlog indefinitely.
```

### PASS: Multiple preexisting issues

```
Developer: I encounter three preexisting issues across two projects.

Action:
1. Fix issue 1: "fix(project-a): resolve stale snapshot after v3 upgrade"
2. Fix issue 2: "fix(project-a): add missing null check in validator"
3. Fix issue 3: "fix(project-b): update import path after module rename"
4. Verify all three projects pass
5. Continue with original feature work
```

## Scope

This convention applies to:

- All CI quality gates: typecheck, lint, test:quick, spec-coverage
- All projects in the Nx workspace
- All contributors: human developers and AI agents
- All branches: main, worktree branches, and PR branches

It does not apply to:

- Intentional test removals that are part of a documented refactoring plan (the plan itself must justify the removal)
- CI infrastructure failures unrelated to code (GitHub Actions outage, runner disk full, network timeout) -- these are operational issues, not code quality issues

## Related Documentation

- [Code Quality Convention](./code.md) -- Quality gates that this convention protects
- [Git Push Safety Convention](../workflow/git-push-safety.md) -- Per-instance approval for `--no-verify`
- [Trunk Based Development Convention](../workflow/trunk-based-development.md) -- Main must always be releasable
- [Root Cause Orientation Principle](../../principles/general/root-cause-orientation.md) -- The foundational principle this convention implements
- [Commit Message Convention](../workflow/commit-messages.md) -- Conventional commit format for preexisting fixes
- [Nx Target Standards](../infra/nx-targets.md) -- Canonical target names for quality gates
