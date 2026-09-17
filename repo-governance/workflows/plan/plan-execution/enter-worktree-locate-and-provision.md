---
description: Defines how the orchestrator locates the plan's declared ## Worktree section and navigates to or auto-provisions the worktree.
when_to_use: Use when a plan's worktree does not yet exist and must be provisioned from the latest origin/main, or when locating its declared path.
---

# Enter the Designated Worktree — Locate and Provision

**Continues** [Enter the Designated Worktree — Delivery-Mode Resolution](./enter-worktree-delivery-mode-resolution.md).

**Orchestrator action**:

1. **Locate the `## Worktree` section** in the plan:
   - **Multi-file plans**: in `delivery.md` (top-level `## Worktree` heading, before any phase).
   - **Existing pre-contract single-file plans only**: in `README.md` (top-level `## Worktree`
     before `## Delivery Checklist`). This compatibility branch never authorizes a new single-file
     formal plan.
2. **If the section is missing**: terminate immediately with status `fail`. An invocation branch
   cannot replace or bypass the mandatory declaration. Emit: `Worktree specification missing — add
a "## Worktree" section to <delivery.md|README.md> per
repo-governance/conventions/structure/plans/worktree-specification.md#worktree-specification
before re-invoking plan execution.`
3. **Parse the declared worktree path** (format: `worktrees/<plan-identifier>/`).
   If the plan records the documented authoring-worktree exception with `Provisioning status:
pending`, treat provisioning and identity initialization below as a blocking gate. No delivery
   packet may begin first.
4. **Go to the designated worktree — navigate or provision** (default behaviour; no user prompt needed):
   - Check whether the worktree is already registered: `rtk git worktree list --porcelain` from the repo root, and confirm the directory `<repo-root>/worktrees/<plan-identifier>` exists.
   - **If it exists**: make it the execution root. If the current working directory is not already inside it, switch to it (e.g., `cd <repo-root>/worktrees/<plan-identifier>` or the harness's worktree-entry tool). Emit: `Worktree gate: entering existing worktree at worktrees/<plan-identifier>/`.
   - **If it does not exist**: auto-provision it from the latest `origin/main`:
     1. Emit a user-visible line: `Auto-provisioning worktree at worktrees/<plan-identifier>/…`
     2. From the repo root run:

        ```bash
        rtk git fetch origin
        rtk git worktree add -b <plan-identifier>-base worktrees/<plan-identifier> origin/main
        ```

        If the branch `<plan-identifier>-base` already exists (e.g., a prior worktree was removed but its branch kept), reuse it instead: `rtk git worktree add worktrees/<plan-identifier> <plan-identifier>-base`.

     3. If `rtk git worktree add` fails (e.g., path already exists as a stale entry), run `rtk git worktree prune` and retry once; if it still fails, terminate with status `fail` and emit the error output verbatim.
     4. From the new worktree root, immediately run
        `rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm install`, then
        `rtk npm run doctor -- --fix`, to install its dependencies, activate Husky hooks, and
        converge tooling, per
        [Worktree Toolchain Initialization](../../../development/workflow/worktree-setup.md).
     5. Add the immutable [Provisioned Worktree Identity](../../../conventions/structure/plans/worktree-specification.md#worktree-identity-record) and initial [Delivery Branch Inventory](../../../conventions/structure/plans/worktree-specification.md#delivery-branch-inventory) entry to the plan using its declared repository-relative route, the branch returned by `rtk git worktree add`, the executor identity, and current UTC time. Reconcile the resolved runtime path with `rtk git worktree list --porcelain`, but keep that host-specific path in ignored runtime evidence rather than the plan. The entry is `provisioned`/`active`; its proof is that exact creation command and timestamp. A missing, conflicting, or uninitialized record blocks later cleanup.
        Replace `Provisioning status: pending` with `Provisioning status: provisioned` in the same
        atomic plan update.
     6. Emit a user-visible line: `Worktree provisioned at worktrees/<plan-identifier>/ — continuing execution.`
