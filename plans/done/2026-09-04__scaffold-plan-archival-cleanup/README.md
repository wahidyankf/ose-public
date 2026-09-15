# Scaffold Plan-Archival Cleanup Steps

**Status**: Done

Make the plan-authoring template emit the worktree-removal and branch-cleanup steps that the
governance layer already requires, and make `plan-checker` notice when they are missing.

## Context

The obligation exists and is thorough. `branch-cleanup.md` under
[worktree-and-artifact-cleanup](../../../repo-governance/development/workflow/worktree-and-artifact-cleanup/branch-cleanup.md)
defines proof-gated local and remote branch deletion, and two surfaces route to it:

- [`plan-execution` finalization](../../../repo-governance/workflows/plan/plan-execution/finalization-worktree-cleanup-and-pr-archival.md)
  — "`git worktree remove`, complete the canonical branch cleanup … and run `git worktree prune`"
- [`plans` worktree specification](../../../repo-governance/conventions/structure/plans/worktree-specification-continued.md)
  — the same sequence at the convention layer

What does **not** exist is the scaffolding. The authoring template at
`.claude/skills/plan-creating-project-plans/reference/plan-archival.md` contains the word "branch"
**zero times**, and `plan-validating-quality` has no rule that checks for it. A plan authored from
that template therefore ships an archival section that never mentions removing the worktree or
deleting the branch.

This was found the direct way: the `update-tmp-folders` plan was authored from the template and
omitted branch deletion entirely until a maintainer asked about it.

## Why it matters even though the rule binds

`plan-execution` binds the executor at runtime regardless of what `delivery.md` says, so branches do
get deleted when the workflow is followed. The damage is narrower and still real:

- A reviewer reading `delivery.md` cannot see the cleanup obligation, so they cannot check it.
- An executor working from the checklist rather than the workflow has no line to tick.
- The plan's own `Delivery Branch Inventory` asks for a per-branch classification that no archival
  step then consumes.

## Scope

**In scope**

- Add worktree-removal and branch-cleanup steps to the `plan-archival.md` authoring template.
- Give `plan-checker` a check for their presence — extending the existing worktree-specification
  rule rather than minting a new rule number.
- Give `plan-fixer` the matching repair recipe.
- Regenerate the affected Skill mirrors.
- Do the same in the private sibling, as a second independent `rules-propagation` run.

**Out of scope**

- Any change to `branch-cleanup.md` itself. The procedure is correct and was hardened in
  `ose-public` PRs #466 and #467; this plan only makes plans point at it.
- Retrofitting archived plans under `plans/done/`. They record what was true when they ran.
- Any change to `plan-execution`, which already states the obligation correctly.

## Approach Summary

One template edit, one validation rule extension, one fixer recipe, per repository — run through
[rules-propagation](../../../repo-governance/workflows/rules/rules-propagation.md) because it
changes a rules surface. Small enough to be one delivery unit per repository.

## Navigation

- [brd.md](./brd.md) — why this exists and what success looks like
- [prd.md](./prd.md) — acceptance criteria
- [tech-docs.md](./tech-docs.md) — placement decision, file-impact tree
- [delivery.md](./delivery.md) — the executable checklist
- [learnings.md](./learnings.md) — Knowledge Capture running log
