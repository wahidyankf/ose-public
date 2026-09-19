---
description: The five numbered steps from creating a worktree through confirming both init commands completed.
when_to_use: Use as a walkthrough when creating a worktree and running its toolchain init for the first time.
---

# Step-by-Step Procedure

1. Create the worktree using your preferred method:

   ```bash
   rtk git worktree add worktrees/my-feature-branch my-feature-branch
   ```

   This repo overrides the upstream coding-agent default worktree path — worktrees land at repo-root `worktrees/<name>/`, not under the platform binding directory. See [worktree-path.md](../../../conventions/structure/worktree-path.md) for the convention and the `WorktreeCreate` hook that enforces it.

2. Enter the root directory of the worktree just created.

3. Install its dependencies and activate Husky hooks:

   ```bash
   # Set the active worktree root as the command workdir.
   rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm install
   ```

4. Converge the toolchain from the same directory:

   ```bash
   rtk npm run doctor -- --fix
   ```

   The Doctor wrapper detects `--fix` and selects transactional admission. The command is
   idempotent — when the toolchain is already healthy it is a no-op pass; when drifted it actively
   converges. To preview changes without applying them, use
   `rtk npm run doctor -- --fix --dry-run`.

5. Confirm both steps completed without errors before Git commits or Nx commands in the worktree.
