---
description: >-
  Allows routine rebase and expected-lease publication within an authorized task while preserving foreign work,
  recovery, incoming-diff review, and ordinary delivery gates.
when_to_use: >-
  Use when an ongoing authorized task synchronizes or republishes its owned branch, including reviewed conflict repair.
---

# Authorized Task Branch Sync

## Contract

Continue routine synchronization and publication of an authorized task-owned branch without requesting permission for
each rebase or lease push when every precondition below holds.

Reason: following the repository's delivery route carries out the authorized outcome; a moving trunk does not create a
new authorization decision.

1. Confirm that the ongoing task authorizes delivery in this repository and owns the branch and commits being replayed.
   A generic edit request alone grants no publication authority; follow
   [Commit Authorization][catalog-commit-authorization].
2. Record the actual branch, clean index and working tree, pre-sync head, current trunk, and expected remote branch tip
   immediately before acting. Disable auto-stash and preserve all foreign or uncommitted work.
3. Retain a verified recoverable copy of the pre-sync commits before rewriting them, and keep it until delivery and
   reconciliation are proved.
4. Rebase only the task-owned commits onto the current trunk under [Integration Path][catalog-integration-path].
5. Resolve a conflict only when its affected paths and intended behavior are owned and already settled by the task;
   review the resolution and rerun affected checks. Abort and escalate a conflict involving foreign work, uncertain
   intent, or a new material choice. Never choose all incoming or current changes blindly.
6. Read the incoming changes under [Integration Diff Review](../integration-diff-review.md), and verify that the replay
   preserves the task's intended change apart from recorded, reviewed conflict resolutions.
7. Publish a rewritten task branch only with `--force-with-lease=<ref>:<expected-sha>` and `--force-if-includes`, using
   the recorded actual remote tip. A rejected lease stops the push; inspect the new remote work before deciding the next
   action. Never refresh the expectation blindly to make a retry pass.
8. Run ordinary hooks, safety screens, affected tests, exact-head reviews, and required CI; invalidate prior head-bound
   evidence after a rewrite. Merge only when the repository's normal landing preconditions hold.

This contract never permits force-pushing the trunk, rewriting another actor's commits, discarding uncommitted work,
removing recovery, bypassing a gate, or rewriting published history to remediate a leaked secret. Those effects remain
under [No Destructive Git Operations](../no-destructive-git-operations.md). It changes no repository's delivery route,
remote restrictions, or task-specific no-commit instruction.

## Verification Observations

- Followed: an authorized task's clean owned branch has recorded refs and recovery proof; its rebase and explicit lease
  push proceed with reviewed changes and current-head gates, without another permission prompt.
- Violated: an agent demands a fresh approval solely because that same task needs another routine rebase or lease push.
- Violated: an agent applies the exception to foreign or uncertain changes, a dirty tree, an unchecked remote tip, a
  trunk force push, absent recovery, or stale head-bound evidence.

## Enforcement Disposition

The contract is **unenforced by decision** for its full semantic scope: a mechanical check cannot establish task
ownership, authorization, or whether a conflict introduces a new choice. Review verifies the observations and retained
receipts. Git's lease guard and ordinary gates remain required; their success alone does not prove the contract.

## Supersession

This contract supersedes per-instance approval for routine owned-branch sync within the same authorized delivery task,
and blanket escalation of every rebase conflict. Destructive effects outside this bounded contract still require their
own approval. Authorization ends with the task; it does not transfer to a new task or repository.

[catalog-commit-authorization]: https://github.com/wahidyankf/ose-rules/blob/9e15c702ef01187f5a3fafca975d2891854c0495/repo-governance/development/workflow/commit-authorization.md
[catalog-integration-path]: https://github.com/wahidyankf/ose-rules/blob/9e15c702ef01187f5a3fafca975d2891854c0495/repo-governance/development/workflow/integration-path.md
