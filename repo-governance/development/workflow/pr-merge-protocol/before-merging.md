---
description: The full (a)-(e) precondition checklist an agent must confirm immediately before merging, and why the list is spelled out in full rather than abbreviated.
when_to_use: Use as the final checklist immediately before executing a PR merge.
---

# Before Merging

Before merging, confirm all five preconditions from [The Rule](./the-rule.md#the-rule):

1. **(a)** `Quality gate` is green for the PR's exact current head SHA and current base branch.
2. **(b)** Every pushed commit passed the push leak review, and one authenticated current-head
   `ose-pr-leak-review:v1` record reports `pass`, with the `leak-review` commit status `success` on
   that head.
3. **(c)** The branch is non-destructively current with the target and has no merge conflict.
4. **(d)** Every review conversation is resolved or explicitly dismissed by the user.
5. **(e)** Every applicable finite surface gate passed, or an unreachable surface has an explicit
   exemption.

> **Why this list is spelled out in full.** It previously carried only three items — CI completed,
> review conversations checked, branch up to date — because it ran immediately before a **human approval
> prompt**, and the human was the backstop for whatever the list omitted. Now that `[AI]` merges by
> default, that backstop is gone and this is the last checklist an autonomous merge passes through.
> An enumeration that was merely incomplete has become the thing standing in for a reviewer. Any
> future edit must keep it congruent with (a)-(e); never shorten it.
