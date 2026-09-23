---
description: Records that the shared cargo target-directory symlink cache retired with the in-tree Doctor, and how to reclaim a leftover cache safely.
when_to_use: Use when a crate's target/ is still a symlink into a shared cache, or when deciding whether worktrees share cargo build artifacts.
---

# Shared Cargo Target Directories

The retired in-tree Doctor's `--fix` mode once symlinked each Rust crate's `target/` into a shared
local-development cache (default `$HOME/.cache/ose-cargo-target`, overridable with
`OSE_CARGO_TARGET_CACHE`) so worktrees of the same repository reused build artifacts. That mechanism
and its `--prune-cargo-cache` collector retired with the in-tree Doctor. `npm run doctor` now only
validates declared toolchains, and `./rhino toolchain provision --apply` provisions declared
toolchains without creating these symlinks, so each crate builds into an ordinary crate-local
`target/`. Dependency resolution was never affected; it remains governed by `Cargo.lock`.

## Reclaiming a Leftover Cache

A checkout provisioned before the retirement may still hold a `target/` symlink and a shared cache
directory. Both are gitignored, regenerable build output under the
[Build-Artifact Sweeper Convention](../../infra/build-artifact-sweeper.md):

- Remove the dangling or stale `target/` symlink; the next `cargo` build recreates an ordinary
  `target/` directory from cold.
- Delete the shared cache root only after no live worktree still links into it. Removing a worktree
  never deletes shared entries, because other worktrees may still reference the same crate entry.
- `cargo clean` remains the standard per-crate cleanup.

CI never used the shared cache; CI runners always keep an isolated `target/` per job.
