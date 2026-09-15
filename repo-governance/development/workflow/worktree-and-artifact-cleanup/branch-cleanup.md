---
description: Safely delete plan-created branches after their PR is confirmed merged.
when_to_use: Use when deleting local or remote branches after removing a repo's worktree.
---

# Branch Cleanup

Removing a shared worktree leaves one branch per delivery unit. Ordinarily run this after removing
the worktree.

**Bare-repository ordering exception.** When the repository is bare and its pre-push hook requires a
working tree, delete each verified live remote branch from inside the linked plan worktree **before**
removing that worktree. The local branch cleanup may follow removal from the repository root. If the
worktree is already gone, use the forge API route documented in
[Remote-Branch Cleanup in a Bare Repository](../bare-repo-landing-method/remote-branch-cleanup-in-a-bare-repository.md);
never bypass hooks. This changes order only, not the ownership, delivery, or no-unpushed checks.

**Delete only inventory branches after rechecking delivery and no-unpushed proof.** For `*-to-pr`,
the recorded PR must be `MERGED`; its exact branch and head must equal the inventory's reviewed-head
SHA; and its live `origin/<branch>` must equal that SHA, unless GitHub proves automatic deletion with
`HEAD_REF_DELETED_EVENT` and enabled `delete_branch_on_merge`. Any other absent ref is unsafe. Direct
push needs its recorded commit on `origin/main` and no open PR. Include every plan-created/current
branch, not only the initial branch.

**Local deletion uses `git branch -d`** — `git branch -D` only under the proof gate below. For a
squash-merged PR branch, make
the merged PR the delivery proof, then fetch without pruning and verify the local and
`origin/<branch>` tips are identical. Set that matching remote ref as the branch upstream if needed,
then use the ordinary non-force delete:

```bash
git fetch origin
test "$(git rev-parse origin/<branch>)" = "<recorded-reviewed-head-SHA>"
test "$(git rev-parse <branch>)" = "$(git rev-parse origin/<branch>)"
git branch --set-upstream-to=origin/<branch> <branch>
git branch -d <branch>
git push origin --delete <branch>
```

Equal tips prove no local commit followed review; `git branch -d` retains Git's merged check.
`git log origin/main..<branch>` proves nothing after a squash merge.

For a GitHub-auto-deleted branch, preserve the required GitHub proof and local-head equality; do not
recreate or delete a remote ref. Attempt `git branch -d <branch>` first. A squash merge leaves the
branch's own commits off `main`, so `-d`'s ancestry test asks a question no squash-merged branch can
answer.

**Proof-gated terminal deletion.** When `-d` declines for that reason and _all four_ hold — the PR
reports `MERGED`; its `headRefOid` equals the local tip; its merge commit is contained in
`origin/main`; and `HEAD_REF_DELETED_EVENT` with enabled `delete_branch_on_merge` explains the absent
remote ref — then `git branch -D <branch>` is the authorized terminal step:

```bash
gh pr view <n> --json state,headRefOid,mergeCommit   # MERGED, headRefOid == local tip
git merge-base --is-ancestor <mergeCommit> origin/main
git branch -D <branch>
```

This gate is strictly stronger than `-d`'s check, not a relaxation of it: `-d` proves reachability,
the gate proves the reviewed head itself merged. Any one proof missing means no deletion — retain and
escalate; worktree removal remains valid regardless. `-D` is authorized by this gate alone, never to
cover absent evidence, and never alongside a fabricated tracking ref or a direct ref delete.

A branch with no usable proof here may still qualify under [Patch-Equivalent Branch Cleanup](./patch-equivalent-branch-cleanup.md).

**Use `git push origin --delete <branch>`** only for a plan-pushed, still-live branch after its PR is
`MERGED`. Verified GitHub auto-deletion needs no second command. **Never delete `main` or an
environment branch.** Environment branches are repo-specific: `ose-public` has `prod-*`/`stag-*`;
the private sibling currently has none. Confirm each repo with `git branch -a`.

**Jurisdiction.** `git push origin --delete` deletes a remote ref; it is not history-rewriting
force-push. It is governed by this convention's merged-check requirement, not the per-instance gate
for `--force`, `--force-with-lease`, or hook bypass. Other local/remote force-push rules defer here.

**Run `git worktree prune`** after removals; it touches only removed entries.

**Never `gc` or object-store `prune`** during cleanup: shared-machine history maintenance risks
corruption while another process writes.
