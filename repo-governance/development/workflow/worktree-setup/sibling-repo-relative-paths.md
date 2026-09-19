---
description: Why a naive ../sibling-repo path breaks from inside a worktree, and the correct nesting-adjusted relative path for a multi-repo worktree-to-pr plan.
when_to_use: Use when authoring or reviewing a multi-repo delivery-checklist command that references a sibling repo with a relative path.
---

# Sibling-Repo Relative Paths From Inside a Worktree (Multi-Repo Plans)

A delivery checklist command that references a sibling repo with a relative path (e.g.
`../private-sibling/apps/ose-www`) resolves correctly only from each repo's **root checkout**. Plan
execution runs inside a **worktree** (`ose-public/worktrees/<plan-id>/`), which is two directory
levels deeper than the repo root, so a naively-written `../private-sibling` resolves to a nonexistent
path. If the sibling repo's own work also happens inside a matching worktree (the common case for
a multi-repo `worktree-to-pr` plan), the correct relative path has to account for BOTH the local and
the sibling's worktree nesting:

```bash
# WRONG from inside ose-public/worktrees/<plan-id>/: resolves outside the checkout entirely
../<private-sibling>/apps/ose-www

# CORRECT: 3 levels up (out of the plan folder, out of worktrees/, out of ose-public/),
# then into the sibling's OWN worktree for the same plan
../../../<private-sibling>/worktrees/<plan-id>/apps/ose-www
```

Author (or review) multi-repo delivery-checklist commands with this nesting in mind before running
them, rather than discovering the wrong path mid-execution.
