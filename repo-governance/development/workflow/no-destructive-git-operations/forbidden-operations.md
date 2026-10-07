---
description: The table of local git operations forbidden without explicit per-instance approval, what each one destroys, and the non-destructive equivalent.
when_to_use: Use before running any git operation that could discard uncommitted work, rewrite history, or delete a branch or worktree.
---

# Forbidden Operations

Forbidden without explicit per-instance approval. Grouped by what they destroy.

**The table is illustrative, not exhaustive — read the rule first.** _Any_ git invocation whose effect
is to destroy work you did not create, discard uncommitted changes, rewrite published history, or
remove the means of recovering any of those, is forbidden without explicit per-instance approval —
whether or not its spelling appears below. Naming a flag is a convenience for recognising the common
cases; it is never the boundary of the rule. `git switch --discard-changes`, `git checkout -f`,
`git update-ref -d`, `git worktree prune`, `git branch -M` over an existing ref, and any future
spelling that achieves the same effect are all covered by the sentence above despite being absent
from the table. If you are reasoning about whether your command is "on the list," you are asking the
wrong question — ask what it destroys and whether you created it.

| Operation                                                          | What it destroys                                                | Use instead                                                 |
| ------------------------------------------------------------------ | --------------------------------------------------------------- | ----------------------------------------------------------- |
| `git push --force` (bare)                                          | Others' commits on the remote tip                               | `--force-with-lease=<ref>:<expect>` + `--force-if-includes` |
| `git push --force-with-lease` (bare, no expected value)            | Same, when the local fetch is stale                             | The explicit `=<ref>:<expect>` form                         |
| `git rebase` / `git commit --amend` of **published** commits       | Downstream contributors' history                                | `git revert` (a new inverse commit)                         |
| `git filter-repo` / `git filter-branch`                            | All history, for everyone                                       | Scoped revert; coordinate out-of-band                       |
| `git reset --hard`                                                 | Uncommitted work, irrecoverably                                 | `git stash push` (keep, never drop), or commit first        |
| `git clean -fd` / `-fdx`                                           | Untracked files recursively, including ignored build output     | `git clean -n` to preview; delete named paths               |
| `git stash drop` / `git stash clear`                               | Stash entries, which then become prunable                       | Leave entries; they cost nothing                            |
| `git branch -D`                                                    | A branch, skipping the merged-check                             | `git branch -d` (merged-check retained)                     |
| `git reflog expire --expire=now --all` + `git gc --prune=now`      | The recovery path itself, plus concurrent-write corruption risk | Let git's automatic maintenance run                         |
| `git worktree remove --force` (single or doubled)                  | Another actor's working tree and its uncommitted contents       | Non-force `git worktree remove`                             |
| `rm -rf <worktree>`                                                | The worktree, leaving orphaned administrative state behind      | `git worktree remove`; `git worktree repair` if moved       |
| `git checkout -- <path>` / `git restore <path>` over unstaged work | Unstaged edits at those paths                                   | Commit or stash first, then restore                         |

**One standing exception.** `git branch -D` on a task branch needs no per-instance approval when
[Branch Cleanup](../worktree-and-artifact-cleanup/branch-cleanup.md) proves it merged at its reviewed
head, or [Patch-Equivalent Branch Cleanup](../worktree-and-artifact-cleanup/patch-equivalent-branch-cleanup.md)
proves it landed, or stale for over 72 hours with its tip preserved first. Any other `-D` still
needs approval.
