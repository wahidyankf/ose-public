---
description: Why force-push is destructive, why --no-verify is a safety bypass, why approval never carries forward, and the legitimate use cases for these operations.
when_to_use: Use when explaining to a user or teammate why this convention requires per-instance approval, or when judging whether a proposed force-push/hook-bypass is a legitimate use case.
---

# Rationale

## Why force-push is destructive

`git push --force` replaces the remote branch tip with the local commit. Any commits that existed on the remote but not locally are discarded. Because git history is shared, this affects every teammate who has already pulled those commits. Recovering discarded commits requires them to use `git reflog` on their own machines — a manual, error-prone process that can result in permanent data loss if it is not performed quickly.

`git push --force-with-lease` adds a lease check against the last-fetched remote tip. This reduces — but does not eliminate — the risk. The lease can silently succeed if the local fetch timestamp is stale or if a teammate pushed between the fetch and the push. From the perspective of safe automation, it remains a history-rewriting operation.

## Why --no-verify is a safety bypass

The pre-push hook exists specifically to prevent unsafe or invalid pushes from reaching the remote. It runs the registry-declared public-safety screens, the leak-review tests, and environment validation. Bypassing it with `--no-verify` removes the last automated barrier before CI. If an unsafe or broken push reaches the remote, CI fails for every contributor working from that branch, and reverting the push requires either a fix commit or another force-push. The problem compounds.

## Why no carryover approval

The state of a repository changes between operations. A force-push approved at 09:00 was approved in the context of what existed at 09:00. At 09:15 a teammate may have pushed new commits. Reusing the 09:00 approval at 09:15 would bypass the user's opportunity to reconsider in light of that change.

## Legitimate use cases

Force-push and hook-bypass operations are not always wrong. Common legitimate situations include:

- Cleaning up a local branch before merging (amending commits, squashing, rebasing) when the branch has no other contributors — including a `worktree-to-pr` plan branch mid-review, where a `--force-with-lease` push after a rebase is common once review feedback lands.
- Emergency hotfix where the pre-push hook is malfunctioning and the hook problem is being tracked separately.
- CI automation that explicitly documents the force-push in workflow files and is reviewed as part of code review (for example, the `prod-ayokoding-www` deployment workflow — see [Trunk Based Development Convention](../trunk-based-development.md)).

In every case, the decision requires human judgment about the specific context. An agent cannot reliably determine whether a force-push is safe without that context.
