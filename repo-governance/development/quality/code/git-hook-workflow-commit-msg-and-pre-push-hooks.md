---
description: "What the commit-msg and pre-push hooks validate."
when_to_use: "Use when debugging a commit-msg or pre-push hook."
---

# Git Hook Workflow: Commit-msg and Pre-push Hooks

## Commit-msg Hook

**Location**: `.husky/commit-msg`

**Execution Order**:

1. Pre-commit hook completes successfully
2. Commit-msg hook triggers (`./rhino gate run --surface commit-msg --message-file "$1"`)
3. The only declared `commit-msg` gate, `public-safety-commit-message`, screens the message
4. Commit proceeds if the screen is clean

**What It Validates**:

- The message contains none of the public-safety shapes this public repository must never publish
- It does **not** check [Conventional Commits](https://www.conventionalcommits.org/) format. Review
  checks that, and Commitlint can check it on demand — see
  [Commit Message Convention](../../workflow/commit-messages.md) for complete rules

**What Happens on Failure**:

- Commit is blocked
- The screen names a detector and line, never the matched value
- Remove the flagged value from the message and try again

**Example**:

```text
[public-safety] finding maintainer-path <commit-text-1>:1
[public-safety] commit: blocked, 1 finding(s); publication must not proceed
```

## Pre-push Hook

**Location**: `.husky/pre-push`

**Execution Order**:

1. You run `git push`
2. Pre-push hook triggers (`.husky/pre-push` — a shim line invoking
   `./rhino gate run --surface pre-push`, which runs the public-safety screen and then
   `./rhino gate run --surface pre-push`)
3. `gate run --surface=pre-push` orchestrates every registry-declared `pre-push`-surface gate in
   declaration order, failing fast. The gate set is registry-driven and changes as `repo-config.yml`
   changes — it is **not** a hand-maintained fixed command list. The affected-project quick gate
   owns Unit runtime and every applicable static `test:coverage:*` validator; other registry
   entries add always-run and path-gated checks. Discover the live inventory rather than trusting
   prose here:

   ```bash
   ./rhino gate list
   ```

   See [Git Hook Lifecycle](../../workflow/git-hook-lifecycle.md) for the shared discovery/conformance
   workflow (`gate list`, `gate validate`) across all three Husky surfaces.

4. Push proceeds if every declared gate passes.

**What It Validates**: whatever gates `repo-config.yml` currently declares on the `pre-push`
surface. Consult the live `gate list` output above for the current set and
their exact commands rather than this prose, which will go stale the next time the registry
changes.

**What Happens on Failure**:

- Push is blocked
- Error message shows which gate failed
- Fix the issue and try again

**Benefits**:

- Prevents broken code from reaching remote repository
- Affected-project-scoped gates only run checks on affected projects (faster than checking
  everything)
- Registry-declared gates keep local pre-push and CI's PR gate in sync — see
  [Git Hook Lifecycle §CI relationship](../../workflow/git-hook-lifecycle.md#ci-relationship)
- Nx caching means repeated checks on unchanged code are near-instant
