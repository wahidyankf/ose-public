---
description: The principles and companion conventions the bare-repo landing method implements and respects.
when_to_use: Use when tracing why the bare-repo landing method exists back to the principles and conventions it respects.
---

# Principles and Conventions Implemented

## Principles Implemented/Respected

This procedure implements/respects the following core principles:

- **[Deliberate Problem-Solving](../../../principles/general/deliberate-problem-solving.md)**: the method
  is a fixed, ordered sequence rather than an improvised set of commands chosen per instance — every
  step exists because skipping it has produced an observed failure.
- **[Root Cause Orientation](../../../principles/general/root-cause-orientation.md)**: the terminal
  reconcile step closes the actual cause of the local-`main`-lag defect (a push that never updates the
  pushing checkout's own branch), rather than treating the symptom — a stale local `main` — as
  unavoidable.
- **[Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md)**:
  topology is verified with a named command before any mutation, never assumed from a repository's
  name or from memory of what it was last time.

## Conventions Implemented/Respected

This procedure implements/respects the following conventions:

- **[No Destructive Git Operations Convention](../no-destructive-git-operations.md)**: every step below
  uses a non-destructive equivalent — `git worktree remove` without `--force`, `git merge --ff-only`
  in place of a reset, `git fetch origin main:main` in place of a forced ref overwrite.
- **[Worktree and Artifact Cleanup Convention](../worktree-and-artifact-cleanup.md)**: the method's
  worktree-removal step feeds directly into that convention's mandatory post-merge cleanup gate; this
  document does not restate the five pre-removal checks there, it precedes them.
- **[Worktree Toolchain Initialization](../worktree-setup.md)**: the worktree this method creates needs
  the same two-step checksum-pinned HIPPO-guarded install followed by read-only Doctor validation
  as any other worktree in this repository.
