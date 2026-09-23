---
description: The MUST-run-both-steps rule for agents, and why re-running the init (not re-provisioning) is the correct response to missing worktree dependencies mid-session.
when_to_use: Use when an agent creates a worktree or discovers missing dependencies/build output mid-session.
---

# Notes for AI Agents

Agents that create worktrees via `rtk git worktree add`, the `EnterWorktree` tool, or an
`isolation: "worktree"` configuration MUST immediately run BOTH
`rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- npm install` AND
`rtk npm run doctor` from that worktree's root, in order. The install activates Husky hooks
as well as dependencies; Doctor is a read-only validation that already carries its own HIPPO guard.
Only when it reports drift, run
`rtk ./hippo run --class transactional --resource-tier standard --disk-path . -- ./rhino toolchain provision --apply`
and then `rtk npm run doctor` again. Doing only one step is a rule violation, and the retired
`npm run doctor -- --fix` form exits 2.

Merely entering an existing worktree does not trigger the sequence again.

Re-run both steps whenever a worktree's dependencies or build output turn out to be missing mid-session. The [Build-Artifact Sweeper Convention](../../infra/build-artifact-sweeper.md) makes that an expected occurrence — the worktree itself is intact, so the response is re-running this two-step init (plus any needed `nx build`), never re-provisioning the worktree or investigating a defect.

The active worktree root is available from the environment context or can be confirmed with
`git rev-parse --show-toplevel`. See the [Git Worktree Awareness](../../agents/ai-agents/information-accuracy-verification-git-worktree-awareness.md)
section for the full agent rules.
