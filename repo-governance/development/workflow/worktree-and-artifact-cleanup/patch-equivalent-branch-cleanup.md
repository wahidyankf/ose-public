---
description: Delete a branch that carries no change main lacks, or a stale task branch once its tip is preserved, when the PR route offers no delivery proof.
when_to_use: Use when a branch has no usable merged-PR proof but every commit it carries already landed, or a task branch has sat unused for over 72 hours.
---

# Patch-Equivalent Branch Cleanup

[Branch Cleanup](./branch-cleanup.md) terminates the PR route: a branch whose merged PR still matches
its local tip can always be deleted. A second population has no such proof and, without this route,
no terminal state — review scratch, rebase backups, probe branches, a closed-PR branch, and any
branch whose merged PR head has since moved. `git branch -d` declines every one of them, because a
rebase or a squash leaves their commits off `main` even when each change they carry has landed.

**The proof is patch equivalence, not ancestry.** `git cherry origin/main <branch>` compares every
commit against `main` by patch id. A commit marked `-` already exists in `main` under a different
SHA; a commit marked `+` does not exist there at all.

```bash
git fetch origin
git cherry origin/main <branch>   # every line must start with "-"
git rev-parse <branch>            # record the tip before deleting
git branch -D <branch>
```

**Delete only when the output holds no `+` line,** unless the stale route below applies. A single `+`
means the branch carries a change `main` does not have: retain and escalate, exactly as the PR route
requires. Empty output means the
branch has no commit beyond the merge base, so plain `git branch -d` already succeeds — use it.

**Fetch first.** `git cherry` compares against the local `origin/main`, and a stale remote-tracking
ref marks landed commits `+`. That blocks a safe deletion; it never marks an unlanded commit `-`. A
stale ref is therefore conservative, not dangerous.

**Record the tip SHA before deleting.** The commit stays reachable through the reflog, and
`git branch <name> <sha>` restores the branch outright. That is what makes `-D` acceptable here: the
gate proves nothing unique is lost, and the record makes a mistake reversible regardless.

**A stale task branch may go once its tip is preserved.** A task branch, one a worktree route
created, may be deleted with `git branch -D` even when `git cherry` prints `+` lines, but only when
no worktree has it checked out (`git worktree list --porcelain` names no `branch refs/heads/<branch>`),
its tip's committer date (`git log -1 --format=%ct <branch>`) is more than 72 hours old, and
`gh pr list --head <branch> --state open` prints nothing. Preserve the tip first: keep
`origin/<branch>` when it holds the same commit, or else write
`git bundle create <path> origin/main..<branch>` under the primary checkout's ignored `local-tmp/`.
Record that ref or bundle path with the tip SHA. Any other branch with a `+` line is retained and
escalated.

This route never touches a remote ref. A live `origin/<branch>` means the branch is still published —
delete it through the PR route in [Branch Cleanup](./branch-cleanup.md), or leave it alone.
