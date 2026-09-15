---
description: Why a bare repository cannot push a branch deletion directly, and the two routes that work around it.
when_to_use: Use when a branch-and-pull-request landing needs its merged remote branch deleted from a bare repository.
---

# Remote-Branch Cleanup in a Bare Repository

When a unit of work lands through a branch and a pull request rather than through this document's
direct `git push origin HEAD:main`, the merged remote branch still has to be deleted. In a bare
repository the obvious command does not work, and the reason has nothing to do with the branch:

```console
$ git -C <private-sibling> push origin --delete <branch>
NX  Command failed: git diff --name-only --no-renames --relative HEAD .
fatal: this operation must be run in a work tree
husky - pre-push script failed (code 1)
error: failed to push some refs
```

The `pre-push` hook runs `nx affected`, which shells out to a work-tree operation. A bare repository
has none, so **every** push originating from it fails — including a pure ref deletion that carries
no content and could not fail a quality gate even in principle.

Two routes work. Either delete the branch **from inside the linked worktree, before removing it**,
while a work tree still exists for the hook to run in; or delete the ref through the forge's API
after the worktree is gone:

```console
gh api -X DELETE /repos/<owner>/<repo>/git/refs/heads/<branch>
```

That API call is the same path `gh pr merge --delete-branch` takes natively, so no hook is bypassed
and nothing is force-pushed. Note the ordering trap: this document's own step order removes the
worktree before cleanup would typically happen, which leaves the bare repository — the one actor
that cannot push — as the only one remaining.

**`--no-verify` is not the sanctioned answer here.** It is the obvious workaround, and the
[Git Push Safety Convention](../git-push-safety.md) requires explicit per-instance user approval for
it. A rule that is unexecutable as written pushes its reader toward exactly the escape hatch that
needs permission; both routes above avoid that.
