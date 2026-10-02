---
description: Confirms a clean working tree, resolves as-of-date, and computes the Path B 60-day cutoff before inventory begins.
when_to_use: Use when starting a dependency-bump planning run and needing the preconditions checked first.
---

# Phase 0: Pre-flight (Sequential)

**Actions**:

- Confirm the `ose-public` working tree is clean (`git status --porcelain` empty).
- Resolve `as-of-date` (input, else current date). Compute and record the Path B cutoff:
  `cutoff = as-of-date − 60 days`. This is written verbatim into the clearance report per the
  policy's [Cutoff Date Computation](../../../development/workflow/dependency-bump-policy.md) section.
- Resolve `scope-filter` and `ecosystems`. Default scope = every dependency-bearing manifest in
  the monorepo: `apps/` and `libs/` project manifests, the workspace-root language pins,
  per-project `rust-toolchain.toml`, per-app `global.json`, `infra/` container definitions, and the
  CI toolchain pins under `.github/`.

**Output**: Cutoff date computed. Scope resolved.

**On failure**: If the tree is dirty, abort and ask the user to commit/stash first.
