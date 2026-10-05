---
description: PASS and FAIL examples of the default worktree-to-pr flow versus an unauthorized direct push.
when_to_use: Use when checking whether a specific delivery transcript correctly used the default mode.
---

# Examples — Default and Direct-Push Selection

## PASS: Correct behaviour — default worktree-to-pr

```
Plan executor: Delivering governance convention update via the default mode.

  git worktree add worktrees/git-push-default-update -b git-push-default-update
  cd worktrees/git-push-default-update
  git add repo-governance/development/workflow/git-push-default.md
  git commit -m "feat(governance): update git push default convention"
  git push origin git-push-default-update
  gh pr create --draft --base main --title "feat(governance): update git push default convention"

Draft PR opened. Iterating until the done-definition is met, then merging once the hardened
preconditions hold -- `[AI]` by default; `[HUMAN]` only where this plan opts into that gate.
```

## FAIL: Incorrect behaviour — pushing directly without an explicit mode selection

```
Plan executor: Committing governance convention.

  git add repo-governance/development/workflow/git-push-default.md
  git commit -m "feat(governance): add git push default convention"
  git push origin main

Done. Convention is now on main.
```

No `## Delivery Mode` field and no invocation argument selected a direct-push mode. The default is
`worktree-to-pr`; pushing straight to `origin main` here is wrong.
