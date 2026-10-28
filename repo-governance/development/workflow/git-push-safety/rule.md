---
description: The core approval rule for force-push and hook-bypass operations, the standing worktree-to-PR pre-authorization for --no-verify, and the sole standing exception for confirmed secret-exposure history remediation.
when_to_use: Use when about to run a covered git push operation, or when handling a confirmed secret exposed in committed history.
---

# Rule

The approval procedure and examples on this page apply outside the
[authorized task-owned sync contract](../no-destructive-git-operations/001-authorized-task-branch-sync.md).
Its bounded ongoing authority needs no repeated prompt; hook bypass is outside it except the
[worktree-to-PR pre-authorization](#worktree-to-pr-pre-authorization). The separate secret-incident
procedure remains unchanged.

**AI agents and automation MUST NOT execute any of the covered operations autonomously**, except the
lease-protected remote rewrites required by a confirmed secret-exposure incident, and except `--no-verify` on a
task-owned branch under the worktree-to-PR pre-authorization below. `--no-verify` is
never part of the secret-incident exception.

For every invocation outside the bounded contract and the separate incident procedure, the agent must:

1. Stop before executing the command.
2. Describe to the user exactly what the command is, why it is being considered, and what data or history may be affected.
3. Wait for the user to provide explicit confirmation to proceed.
4. Execute the command only after that confirmation is received.

**A per-instance grant does not carry forward.** If the user approved a `git push --force` five minutes ago, that approval covers only that one execution. The next invocation starts from zero and requires a fresh confirmation.

## Worktree-to-PR pre-authorization

The maintainer pre-authorizes `--no-verify` on `git commit` and `git push` for a task-owned branch that lands through a pull request under the `worktree-to-pr` delivery mode, with no per-instance prompt, when every condition below holds. This is the only standing exception to the per-instance rule above. It supersedes the earlier HIPPO-congestion-only pre-authorization: when the pull-request gate mirrors the skipped hook's deterministic checks, pushing with `--no-verify` and letting CI run the gate is sound — and preferable under HIPPO contention (HIPPO deferral or failure, exit 124/125 never-started, abnormal latency, or a wait) — because the gate refuses the head when the hook would have.

- The branch is a task-owned `worktree-to-pr` branch whose only route to `main` is its pull request. Direct pushes to `main` stay outside this exception: explicit per-instance authorization still applies, strongly discouraged except for manual override.
- No reported finding is skipped: a hook that ran and reported a violation is fixed at its cause. The manual screens pass: the tracked-tree screen and the per-commit range screen both exit `0`, with no leak-review finding. The `commit-msg` hook stays enabled.
- Formatting is done by hand or editor; the pull-request gate verifies it.
- The bypass cites the HIPPO receipt and screen evidence in the push and PR notes, and never carries into a later operation.
- The branch does not merge until the pull-request gate passes on the exact pushed head. A later push replaces that head and owes a fresh pass; nothing about this exception waives it.

Enforcement: gated — `pr-quality-gate.yml` mirrors the hook contracts as merge-blocking checks, so a bypassed hook moves its failure into the gate, where it blocks the merge; review verifies the cited receipt and screen evidence against the gate result.

## Secret-exposure history-remediation exception

When a secret is suspected or confirmed in committed history, do not use the normal approval flow to
leave the exposure reachable. Follow the authoritative secret procedure, which requires all of the
following before any rewrite:

1. Contain and rotate the credential through its provider without reading, copying, or recording its
   value in a plan, terminal transcript, PR comment, commit, or issue.
2. Inventory every reachable affected ref: the branch and PR head, `main` or any other target branch,
   tags, release branches, and all repository-owned mirrors or sibling refs that contain the exposed
   commit. Preserve sanitized commit/ref evidence only.
3. Coordinate the rewrite from an isolated incident worktree, protect non-contaminated concurrent
   work, and rewrite each affected reachable ref with the approved secret-removal tool.
4. Verify the replacement history contains no exposed path or value, force-push each rewritten ref
   with `--force-with-lease`, delete contaminated remote branches/tags, and close the contaminated PR.
5. Open a replacement PR from clean history, re-run its required checks, and request provider-side
   cache/fork/PR-diff purge support where available. Record the limits: external clones, forks, and
   third-party caches cannot be erased by this repository.

This exception permits only the minimum `--force-with-lease` operations necessary for remediation;
it does not permit `--force`, `--no-verify`, unrelated branch cleanup, or a merge before the clean
replacement PR is verified.
