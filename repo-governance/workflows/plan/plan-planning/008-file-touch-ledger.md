---
description: States the two planning-side obligations that follow from a plan never being the only writer to its repository — the durable Files Changed ledger and the never-touch-outside-footprint rule.
when_to_use: Use when scaffolding a delivery step's implementation-notes block, or when a plan's execution encounters another actor's in-flight work in the same repo.
---

# File-Touch Ledger (All Plans, Unconditional)

Every plan executes in a repository that other agents, engineers, and background processes are
editing at the same time — in other worktrees, on other branches, and on local `main`. A plan is
therefore never the only writer to the tree it runs in, and `git status` during execution shows the
union of every writer's work.

Two planning-side obligations follow, and they apply to every plan without exception:

- **Each delivery step's implementation-notes block carries a `Files Changed` list.** That list is
  the plan's durable, on-disk copy of the executor's touched-file ledger — the one artefact that
  survives a context compaction, a session restart, or a handoff to a different agent, because it
  lives in `delivery.md` rather than in a context window. `plan-maker` scaffolds the field; execution
  fills it in per [Iron Rule 4](../plan-execution/012-iron-rules-1-5.md#iron-rules-non-negotiable).
- **A plan never authorizes touching paths outside its own footprint.** Encountering another actor's
  in-flight work is an expected condition, not an anomaly to tidy up: leave it, and say so.

The ledger never proves worktree path, branch, or creation ownership; those belong in the plan's
[Provisioned Worktree Identity](../../../conventions/structure/plans/worktree-specification.md#worktree-identity-record).
The full standard — the ledger, its compaction-survival requirement, degraded mode when it is lost,
and the rule that generated harness mirrors ship in their source's commit — is
[File-Touch Discipline](../../../development/practice/file-touch-discipline.md).
