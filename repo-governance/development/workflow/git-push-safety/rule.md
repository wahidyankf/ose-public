---
description: The core approval rule for force-push and hook-bypass operations, and the sole standing exception for confirmed secret-exposure history remediation.
when_to_use: Use when about to run a covered git push operation, or when handling a confirmed secret exposed in committed history.
---

# Rule

The approval procedure and examples on this page apply outside the
[authorized task-owned sync contract](../no-destructive-git-operations/001-authorized-task-branch-sync.md).
Its bounded ongoing authority needs no repeated prompt; hook bypass is outside it. The separate secret-incident
procedure remains unchanged.

**AI agents and automation MUST NOT execute any of the covered operations autonomously**, except the
lease-protected remote rewrites required by a confirmed secret-exposure incident. `--no-verify` is
never part of that exception.

For every invocation outside the bounded contract and the separate incident procedure, the agent must:

1. Stop before executing the command.
2. Describe to the user exactly what the command is, why it is being considered, and what data or history may be affected.
3. Wait for the user to provide explicit confirmation to proceed.
4. Execute the command only after that confirmation is received.

**A per-instance grant does not carry forward.** If the user approved a `git push --force` five minutes ago, that approval covers only that one execution. The next invocation starts from zero and requires a fresh confirmation.

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
