---
description: The numbered sequence for landing a change through a bare repository or a side worktree.
when_to_use: Use as the step-by-step checklist while executing a bare-repo or side-worktree landing.
---

# The Method, As Numbered Steps

1. **Verify topology first** (see [Verify Topology First](./verify-topology-first.md#verify-topology-first) above).
2. `git fetch origin` — refresh remote-tracking refs before creating anything from them.
3. `git worktree add <path> origin/main` — create a linked worktree at the verified, up-to-date tip.
4. **Re-apply the delta and commit** inside that worktree, exactly as any other worktree-based change.
5. **Run local quality gates** in the worktree — typecheck, lint, `test:quick` (Unit runtime plus
   every applicable static `test:coverage:*` validator), and the Markdown gates where the change
   touches Markdown.
6. `git push origin HEAD:main` — push the worktree's branch tip directly onto the remote `main` ref.
   This is the **direct-push** landing path. When the unit of work instead lands through a branch and
   a pull request, this step becomes the PR's own push-and-merge, and step 7 needs the branch cleanup
   below before it runs.
7. `git worktree remove <path>` — remove the worktree non-destructively, never with `--force` and
   never `rm -rf`, per the
   [No Destructive Git Operations Convention](../no-destructive-git-operations.md). If step 6 was a
   branch-and-pull-request landing rather than a direct push, delete the merged remote branch
   **before** running this step — see
   [Remote-Branch Cleanup in a Bare Repository](./remote-branch-cleanup-in-a-bare-repository.md#remote-branch-cleanup-in-a-bare-repository). This
   step's worktree removal is exactly what triggers the ordering trap that section closes.
8. **Reconcile local `main`** — the step most often missing in practice. See
   [Terminal Reconcile](./terminal-reconcile.md#terminal-reconcile) for the exact command, keyed by topology.
