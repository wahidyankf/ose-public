---
description: The table of git push operations that require explicit, per-instance user approval before an agent may run them.
when_to_use: Use when deciding whether a specific push command or its aliased/scripted equivalent needs approval before running.
---

# Covered Operations

The approval procedure and examples on this page apply outside the
[authorized task-owned sync contract](../no-destructive-git-operations/001-authorized-task-branch-sync.md).
Its bounded ongoing authority needs no repeated prompt; hook bypass is outside it except the [worktree-to-PR pre-authorization](./rule.md#worktree-to-pr-pre-authorization). The separate secret-incident
procedure remains unchanged.

Outside the bounded contract and the worktree-to-PR pre-authorization, the following operations require explicit, per-instance user approval:

| Operation                       | Why it is destructive or safety-bypassing                                                                                                                                                                                                                                                                                                             |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `git push --force`              | Overwrites the remote branch tip, permanently discarding any remote commits not present locally. Teammates lose pushed work without warning.                                                                                                                                                                                                          |
| `git push --force-with-lease`   | A bare lease uses a tracking ref that background fetches can refresh. An explicit expected-value lease refuses a different remote tip but does not prove task ownership or authorization.                                                                                                                                                             |
| `git push --no-verify`          | Skips all git hooks on the push side, bypassing `typecheck`, `lint`, and `test:quick` quality gates. Broken code can reach the remote and block CI. Pre-authorized only on a task-owned `worktree-to-pr` branch under the [worktree-to-PR pre-authorization](./rule.md#worktree-to-pr-pre-authorization), where the PR gate still runs and must pass. |
| Any combination of the above    | The risks compound; combined flags require the same explicit approval.                                                                                                                                                                                                                                                                                |
| Aliased or scripted equivalents | Any shell alias, npm script, Makefile target, or CI step that invokes the above flags is subject to the same rule. The mechanism does not change the requirement.                                                                                                                                                                                     |
