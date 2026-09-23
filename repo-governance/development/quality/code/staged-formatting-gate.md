---
description: "How the format-staged registry gate formats staged files at pre-commit and verifies formatting on pull requests."
when_to_use: "Use when configuring or debugging staged-file formatting."
---

# Staged Formatting Gate

**Purpose**: Format only the files being committed (not the entire codebase).

**Configuration**: the `format-staged` entry in the [`repo-config.yml`](../../../../repo-config.yml)
gate registry, a `mutation` gate whose `files` input is bound to the staged index at `pre-commit`
and to the pull request's changed range on the `pull-request` surface. It calls
`scripts/format-staged`, which picks each path's formatter by extension — see
[Formatting and File-Type Linting](../../infra/nx-targets/formatting-and-file-type-linting.md)
for the table. The legacy `package.json` `lint-staged` block was retired on 2026-09-19.

**How It Works**:

1. `git commit` runs `.husky/pre-commit`, which calls `./rhino gate run --surface pre-commit`
2. Rhino hands `format-staged` the staged paths from an index snapshot
3. The script runs the matching formatter on each path and skips deleted paths
4. Rhino applies the formatted bytes to the index (`mutation.local: apply-index`)
5. The commit proceeds if every later gate also passes

On the pull-request surface the same gate replays the formatter over the changed paths
(`mutation.ci: verify-clean`) and fails if any byte would change; CI never commits a fix.

**Benefits**:

- Faster than running tools on entire codebase
- Only formats files you're committing
- Prevents incorrectly formatted code from being committed
