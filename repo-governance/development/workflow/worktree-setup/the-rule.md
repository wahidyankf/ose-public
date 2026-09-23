---
description: The mandatory guarded-install and read-only Doctor sequence, run order, and the drift-only transactional provisioning branch.
when_to_use: Use as the exact commands to run, in order, right after creating a worktree.
---

# The Rule

**After every operation that creates a worktree—whether `rtk git worktree add`, an `EnterWorktree`
invocation, or another creation mechanism—run BOTH steps from that new worktree's root, in order:**

```bash
# Set the active worktree root as the command workdir.

# Step 1: Node/Nx workspace dependencies (node_modules/) and Husky hooks
rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm install

# Step 2: Validate the declared native toolchains (read-only)
rtk npm run doctor

# Only when step 2 reports a missing or drifted toolchain: provision, then validate again
rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- ./rhino toolchain provision --apply
rtk npm run doctor
```

Each worktree needs its own ignored `node_modules/`. The guarded install there also runs the
repository's `prepare` script, which activates Husky's tracked hooks for Git operations from that
worktree. A successful install in the primary checkout does not initialize a new worktree.

**Order matters.** Run the guarded install first so the hooks and Node tooling exist before any
Git mutation. Run `rtk npm run doctor` second: its package script already runs
`./rhino toolchain validate` under an ephemeral HIPPO guard, so never wrap it in a second guard.

**Validate first; provision only on reported drift.** `npm run doctor` never installs anything and
rejects every argument with exit 2, so the retired `npm run doctor -- --fix` form fails. When it
reports a missing or drifted toolchain, `./rhino toolchain provision --apply` runs the provision
vectors the `repo-config.yml` toolchain entries declare; `--apply` is the explicit authorization, and the
transactional HIPPO class admits that mutation. Then re-run `rtk npm run doctor` and continue only
when it is clean. Install a tool whose entry declares no provision vector through the phase the
[Tool Inventory](../../../workflows/infra/development-environment-setup/tool-inventory.md) names.

## Shared Cargo Target Directories

The per-crate shared cargo `target/` symlinks were created by the retired in-tree Doctor.
`./rhino toolchain provision --apply` does not create them. See
[Reproducible Environments §Shared Cargo Target Directories](../reproducible-environments/shared-cargo-target-directories.md#shared-cargo-target-directories)
for their status and removal.
