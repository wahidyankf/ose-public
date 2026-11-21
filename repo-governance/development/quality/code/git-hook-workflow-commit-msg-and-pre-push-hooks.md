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
3. The only declared `commit-msg` gate, `commit-message`, runs Commitlint on the message
4. Commit proceeds if the lint passes

**What It Validates**:

- The message follows the [Conventional Commits](https://www.conventionalcommits.org/) format that
  `commitlint.config.js` sets. See [Commit Message Convention](../../workflow/commit-messages.md) for complete rules.
- It does **not** screen the message for public-safety shapes. The message-safety screen runs at the pull-request
  surface, and the pre-push leak scan covers the messages of the pushed commits.

**What Happens on Failure**:

- Commit is blocked
- Commitlint names the rule that failed
- Amend the message to follow the format and try again

**Example**:

```text
✖   subject may not be empty [subject-empty]
✖   type may not be empty [type-empty]
✖   found 2 problems, 0 warnings
```

## Pre-push Hook

**Location**: `.husky/pre-push`

**Execution Order**:

1. You run `git push`
2. Pre-push hook triggers (`.husky/pre-push`, a shim that runs
   `./rhino gate run --surface pre-push --push-updates-stdin` under the `./hippo` guard)
3. `gate run --surface pre-push` orchestrates every registry-declared `pre-push` gate in declaration order,
   failing fast. The gate set is registry-driven and changes as `repo-config.yml` changes. It is **not** a
   hand-maintained command list. Discover the live inventory rather than trusting prose here:

   ```bash
   ./rhino gate list
   ```

   See [Git Hook Lifecycle](../../workflow/git-hook-lifecycle.md) for the shared discovery and conformance workflow
   (`gate list`, `gate validate`) across all three Husky surfaces.

4. Push proceeds if every declared gate passes.

**What It Validates**: the leak scan over the pushed commits, their additions, names, and messages. Tests, lint,
and document checks do not run here; the pull-request gate runs them.

**What Happens on Failure**:

- Push is blocked
- The error names the gate that failed
- Fix the finding and try again

**Benefits**:

- Stops a leak before history leaves the machine
- Keeps the hook fast, because the heavier checks run once in the pull-request gate
- Registry-declared gates keep local pre-push and CI's PR gate in sync. See
  [Git Hook Lifecycle §CI relationship](../../workflow/git-hook-lifecycle.md#ci-relationship)
