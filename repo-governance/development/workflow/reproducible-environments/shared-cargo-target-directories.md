---
description: How doctor --fix symlinks each crate's target/ into a shared local-dev cache, and how to garbage-collect it safely.
when_to_use: Use when investigating the shared cargo target-directory symlink mechanism, its cache root, or pruning stale entries.
---

# Shared Cargo Target Directories

`npm run doctor -- --fix` provisions a shared cargo build-artifact cache for local development, in addition to the toolchain convergence described in [Worktree Toolchain Initialization](../worktree-setup.md). This mechanism targets build-artifact reuse across worktrees of the same repo — it does not change dependency resolution, which remains governed by `Cargo.lock`.

## Symlink Mechanism and Cache Root

For each Rust crate, `npm run doctor -- --fix` creates a `target/` symlink that points into a shared cache instead of leaving `target/` as an ordinary crate-local directory. The symlink target follows this layout:

```text
<cache_root>/<repo_name>/<crate_leaf>
```

- **Cache root**: defaults to `$HOME/.cache/ose-cargo-target`, overridable with the `OSE_CARGO_TARGET_CACHE` environment variable.
- **`<repo_name>`**: derived from the git common directory, so every worktree of the same repository resolves to the same cache namespace and shares build artifacts across worktrees.
- **`<crate_leaf>`**: the crate's own path segment, so distinct crates in the same repo never collide in the shared cache.

This is a **local-development-only** mechanism, reducing redundant compilation when multiple worktrees of the same repo build the same crates.

## CI Guard

Under CI (detected via the `CI` or `GITHUB_ACTIONS` environment variable), the doctor target-share step is a no-op — it never creates a symlink on CI runners, and reports "CI detected — skipped." CI runners keep an ordinary, isolated `target/` directory per job.

## Worktree-Aware Pruning (`doctor --prune-cargo-cache`)

`the documented shared-target maintenance command` is a worktree-aware garbage collector for the shared cache. It deletes shared-cache entries that no live worktree or checkout of the repo references any more. Use `--dry-run` to preview candidate deletions without deleting anything. Like the target-share step, pruning is a no-op under CI.

**Anti-pattern — no per-worktree delete hook.** Removing a git worktree (`git worktree remove`) deliberately does NOT delete that worktree's shared-cache entry. The shared cache is keyed by crate, not by worktree, so other worktrees may still reference the same entry after one worktree is removed. Reclaiming shared-cache space happens exclusively through the explicit, worktree-aware `doctor --prune-cargo-cache` GC — never as a side effect of worktree removal.

## Cleanup Path

Two complementary cleanup mechanisms apply:

- **`cargo clean`**: per-crate, standard Cargo cleanup, unaffected by the shared-cache mechanism.
- **`cargo-sweep`** (optional periodic stale-artifact reclamation): when `cargo-sweep` is installed on `PATH`, the doctor shells out to it with:

  ```bash
  cargo-sweep --time 30 --recursive <cache_root>
  ```

  When `cargo-sweep` is not installed, the doctor degrades gracefully and reports "cargo-sweep not installed — skipped." It is never a hard dependency.
