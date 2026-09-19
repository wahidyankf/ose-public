---
description: The mandatory guarded-install and transactional-Doctor sequence, run order, the --fix flag, and the shared cargo target-directory symlink it provisions.
when_to_use: Use as the exact commands to run, in order, right after creating a worktree.
---

# The Rule

**After every operation that creates a worktree—whether `rtk git worktree add`, an `EnterWorktree`
invocation, or another creation mechanism—run BOTH commands from that new worktree's root, in order:**

```bash
# Set the active worktree root as the command workdir.

# Step 1: Node/Nx workspace dependencies (node_modules/)
rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm install

# Step 2: Toolchain convergence (Rust, .NET/F#, TypeScript/Node — all managed by Rhino)
rtk npm run doctor -- --fix
```

Each worktree needs its own ignored `node_modules/`. The guarded install there also runs the
repository's `prepare` script, which activates Husky's tracked hooks for Git operations from that
worktree. A successful install in the primary checkout does not initialize a new worktree.

**Order matters.** Run the guarded install first, because `./rhino toolchain validate` is an F#/.NET program
invoked through the Node tooling and may need synchronized `node_modules/`. Run
`rtk npm run doctor -- --fix` second; its argv-aware wrapper selects transactional admission before
actively converging the native toolchain.

**Use `--fix`, not plain `doctor`.** Plain `rtk npm run doctor` only detects drift and requires a second human action. `rtk npm run doctor -- --fix` actively converges to the declared toolchain state in a single step. For a preview, use `rtk npm run doctor -- --fix --dry-run`.

## Shared Cargo Target Directories (Local-Dev Only)

`rtk npm run doctor -- --fix` also creates per-crate `target/` symlinks pointing into a shared cargo build-artifact cache, so multiple worktrees of the same repo reuse build artifacts instead of recompiling the same crates independently. This step is **local-dev only** — it is a no-op under CI. See [Reproducible Environments §Shared Cargo Target Directories](../reproducible-environments/shared-cargo-target-directories.md#shared-cargo-target-directories) for the full mechanism, including the cache root, the `OSE_CARGO_TARGET_CACHE` override, and the worktree-aware `doctor --prune-cargo-cache` garbage collector.
