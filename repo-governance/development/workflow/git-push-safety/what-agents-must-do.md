---
description: The three-step agent procedure — investigate a safe alternative first, present a complete approval prompt, then execute exactly what was approved.
when_to_use: Use when an agent is about to propose or execute a force-push or hook-bypass operation.
---

# What Agents Must Do

The approval procedure and examples on this page apply outside the
[authorized task-owned sync contract](../no-destructive-git-operations/001-authorized-task-branch-sync.md).
Its bounded ongoing authority needs no repeated prompt; hook bypass is outside it except the [worktree-to-PR pre-authorization](./rule.md#worktree-to-pr-pre-authorization). The separate secret-incident
procedure remains unchanged.

## Before proposing the operation

Before even surfacing the question to the user, the agent should investigate whether the underlying problem can be solved without a destructive operation:

- **For force-push**: Is there a non-rewriting alternative? Can the commits be reapplied cleanly with `git rebase` without rewriting shared history?
- **For --no-verify**: Is the pre-push hook failure a real code quality problem or a hook infrastructure issue? If it is a real problem, fix the code rather than bypass the gate.

## The approval prompt

When no safe alternative exists, the agent presents a clear, complete description of the operation:

```
I need your explicit approval before running:

  git push --force origin shared/topic

What this will do: replace the remote 'shared/topic' tip with local commit abc1234.
Remote commits not present locally: def5678 (pushed 12 minutes ago by the CI bot).
Those commits will be unreachable from 'shared/topic' after this push.

Do you want to proceed? (yes/no)
```

The prompt must include:

- The exact command as it will be run.
- What remote branch and commits will be affected.
- Any commits that exist on the remote but not locally (if determinable).
- An explicit yes/no question.

## After approval

Execute the command exactly as described. Do not modify the flags or target. If any parameter changes after approval is granted, stop and re-seek approval.
