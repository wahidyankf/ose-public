---
description: "What the commit-msg and pre-push hooks validate."
when_to_use: "Use when debugging a commit-msg or pre-push hook."
---

# Git Hook Workflow: Commit-msg and Pre-push Hooks

## Commit-msg Hook

**Location**: `.husky/commit-msg`

**Execution Order**:

1. Pre-commit hook completes successfully
2. Commit-msg hook triggers
3. Commitlint validates commit message format
4. Commit proceeds if message is valid

**What It Validates**:

- Commit message follows [Conventional Commits](https://www.conventionalcommits.org/)
- See [Commit Message Convention](../../workflow/commit-messages.md) for complete rules

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
