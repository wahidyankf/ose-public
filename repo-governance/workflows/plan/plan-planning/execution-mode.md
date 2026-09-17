---
description: Describes the direct-orchestration execution mode for the plan-establishment workflow, the worktree default, and the provisioning commands.
when_to_use: Use when setting up or entering the worktree that plan-establishment authors into, or when confirming that grill sessions run in the calling context.
---

# Execution Mode

**Direct Orchestration** — the calling context (the top-level assistant session) is the
orchestrator. It follows this workflow step-by-step: exploring the repo, conducting grill sessions
via the `grill-me` Skill, delegating research to `web-researcher` and plan writing to
`plan-maker` via the Agent tool, and running the `plan-quality-gate` workflow inline.

Grill sessions run in the calling context (not delegated) so the user's conversation is preserved
across all turns.

**Worktree default**: All plan authoring happens inside a dedicated worktree at
`worktrees/<identifier>/`. If the worktree does not already exist, provision it from the latest
`origin/main` before Step 4; if it exists, enter it and sync it with `origin/main` first:

```bash
git fetch origin
git worktree add -b <identifier> worktrees/<identifier> origin/main
cd worktrees/<identifier>
./hippo run --class transactional --resource-tier standard --disk-path . -- npm install
npm run doctor -- --fix
```

All subsequent file operations — including the plan files written by `plan-maker` — are relative
to the worktree root. The resolved `<plan-dir>` (e.g., `plans/in-progress/<identifier>/`) is a
path within that worktree. See the
[Worktree Path Convention](../../../conventions/structure/worktree-path.md) for the canonical
worktree location and the
[Worktree Toolchain Initialization guide](../../../development/workflow/worktree-setup.md) for the
full post-provisioning setup sequence.

```
User: "Establish a plan to [describe desired change]"
```
