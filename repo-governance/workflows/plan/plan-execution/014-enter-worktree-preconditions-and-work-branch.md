---
description: Defines the backlog-promotion precondition and the three-tier precedence for selecting the plan's work branch.
when_to_use: Use when resolving which branch or worktree a plan executes on before any implementation work begins.
---

# 0. Enter the Designated Worktree (Sequential, Hard Gate)

**Precondition — backlog promotion already resolved `plan-path`**: if the plan being executed
originally resolved inside `plans/backlog/`, the delivery-mode-aware
[Starting Work procedure](../../../conventions/structure/plans/starting-and-completing-work.md#starting-work)
MUST have landed the pure move on `origin/main` before this step begins. `worktree-to-pr` completes
and merges the move from its dedicated worktree; `main-to-pr` does so from the synced primary
checkout. A direct push is valid only under a permitted selected direct-push mode. `plan-path` now
resolves to `plans/in-progress/`. A direct caller, including
[`multi-plans-execution.md`](../multi-plans-execution.md) with an `all-backlog` selector, MUST
perform that same procedure for each backlog plan first. See
[Execute Plan from Backlog](./046-example-usage-and-iteration-example.md#execute-plan-from-backlog) for the full worked example.

Plan execution happens in the plan's declared designated worktree, synced to the latest
`origin/main`. The resolved `worktree-to-pr` mode and `## Worktree` section determine that work
location. An invocation-selected delivery-unit branch is valid only inside it; the primary checkout
or another existing branch cannot override the mode or location. The executor's first action is to
sync that work branch with the latest `origin/main`. Executing from a stale work branch is forbidden.
