---
description: The base-worktree procedure for landing changes into a repository with no primary checkout — topology verification, the landing sequence, and the terminal reconcile.
when_to_use: Use when landing a change into a bare repository, or when a landing is performed from a side worktree rather than the branch's own checkout.
---

# Bare-Repo Base-Worktree Landing Method

This document defines the **bare-repo git-ops method**: the procedure for landing changes into a
repository that has no primary checkout, and for closing the silent lag that a landing performed from
a side worktree can leave behind in local `main`. Any repository in this project's
ecosystem may be bare (`core.bare=true`) at a given time — bareness is a per-invocation property of a
specific clone, not a fixed attribute of a repository's name; verify with `git worktree list` (look
for the `(bare)` marker) rather than assuming from this document which repos are bare today. Any
repository with this shape needs the identical procedure.

## Contents

- [Principles and Conventions Implemented](./bare-repo-landing-method/principles-and-conventions-implemented.md) — Why this method exists.
- [When This Applies](./bare-repo-landing-method/when-this-applies.md) — The two triggering conditions.
- [Verify Topology First](./bare-repo-landing-method/verify-topology-first.md) — Two valid bareness checks, one forbidden command.
- [The Method, As Numbered Steps](./bare-repo-landing-method/the-method-as-numbered-steps.md) — The landing sequence.
- [Terminal Reconcile](./bare-repo-landing-method/terminal-reconcile.md) — The topology-keyed reconcile command for step 8.
- [Why Merge --ff-only Cannot Run in a Bare Repository](./bare-repo-landing-method/why-merge-ff-only-cannot-run-in-the-bare-siblings.md) — Why the refspec fetch form is the only universal one.
- [Worked Example — the 2026-07-21 Sibling Drift](./bare-repo-landing-method/worked-example-the-2026-07-21-sibling-drift.md) — A real transcript of silent local-main lag.
- [Measure After Fetching, Never Before](./bare-repo-landing-method/measure-after-fetching-never-before.md) — Why the drift check must run after a fetch.
- [Remote-Branch Cleanup in a Bare Repository](./bare-repo-landing-method/remote-branch-cleanup-in-a-bare-repository.md) — Deleting a merged branch when the bare repo can't push it.
- [Reading a File From Another Repository](./bare-repo-landing-method/reading-a-file-from-another-repository.md) — Reading another repository's file safely by ref.
- [One Landing Path Per Unit Of Work](./bare-repo-landing-method/one-landing-path-per-unit-of-work.md) — Why a unit of work must land through exactly one path.
- [Long-Lived WIP Belongs on a Branch, Not in the Index](./bare-repo-landing-method/long-lived-wip-belongs-on-a-branch-not-in-the-index.md) — Advisory guidance for long-lived WIP.
- [Why There Is No Guard](./bare-repo-landing-method/why-there-is-no-guard.md) — Why no hook can enforce the terminal reconcile step.

## Related Documentation

- [No Destructive Git Operations Convention](../workflow/no-destructive-git-operations.md) — the safety
  guarantees this method's steps satisfy.
- [Worktree and Artifact Cleanup Convention](../workflow/worktree-and-artifact-cleanup.md) — the teardown gate
  after this method's `git worktree remove` step.
- [Git Push Safety Convention](../workflow/git-push-safety.md) — the remote-side companion covering force-push
  and hook-bypass approval.
- [Worktree Toolchain Initialization](../workflow/worktree-setup.md) — the mandatory two-step init this method's
  worktree requires.
- [SDLC Gate Standard](../../../docs/reference/sdlc-gate-standard.md) — the worktree-agnostic
  execution rule this method's topology check refines.
