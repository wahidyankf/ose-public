---
description: One PASS and three FAIL examples of agent behaviour around force-push and --no-verify approval.
when_to_use: Use when checking whether a specific agent transcript around a force-push or --no-verify complies with this convention.
---

# Examples

The approval procedure and examples on this page apply outside the
[authorized task-owned sync contract](../no-destructive-git-operations/001-authorized-task-branch-sync.md).
Its bounded ongoing authority needs no repeated prompt; hook bypass is outside it. The separate secret-incident
procedure remains unchanged.

## PASS: Correct agent behaviour

```
Agent: I need your explicit approval before running:

  git push --force-with-lease=refs/heads/feature/auth:abc1234 --force-if-includes origin feature/auth

Reason: this shared branch rewrite is outside authorized task-owned sync.
Remote tip: abc1234. Local tip after rebase: def5678.
The rebase replaces 3 commits with 3 rewritten equivalents.

Do you want to proceed?

User: yes

Agent: Running the exact approved command...
```

## FAIL: Incorrect agent behaviour — executing without approval

```
Agent: Rebasing is complete. Pushing with --force-with-lease.
[runs git push --force-with-lease without asking]
```

## FAIL: Incorrect agent behaviour — reusing prior approval

```
User: [earlier] Yes, go ahead with the force-push.
Agent: [30 minutes later, different situation] Reusing your earlier approval
       to run git push --force again.
```

## FAIL: Incorrect agent behaviour — treating --no-verify as routine

```
Agent: The pre-push hook is taking too long. Running with --no-verify
       to skip it and save time.
[runs git push --no-verify origin main without asking]
```

Direct pushes to `main` stay outside the [worktree-to-PR pre-authorization](./rule.md#worktree-to-pr-pre-authorization): explicit per-instance authorization still applies there.
