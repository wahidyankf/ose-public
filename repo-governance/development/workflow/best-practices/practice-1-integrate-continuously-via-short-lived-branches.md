---
description: Keep every branch short-lived and single-purpose; TBD forbids long-lived branches, not branches.
when_to_use: Use when starting a plan branch, to confirm it will integrate within a day or two rather than living long-term.
---

# Practice 1: Integrate Continuously via Short-Lived Branches

**Principle**: keep every branch short-lived and single-purpose. TBD forbids _long-lived_ branches, not branches — a plan branch that opens, integrates, and is deleted within a day or two is exactly the shape TBD wants.

**Good Example:**

```bash
# Default: short-lived plan branch in a disposable worktree
git worktree add worktrees/add-email-validation -b add-email-validation
# ... edit files ...
npm test
git commit -m "feat(auth): add email validation"
git push origin add-email-validation
gh pr create --draft --base main
# Review cycle + CI, then merge once the preconditions hold; branch deleted
```

**Also correct — a declared direct-push mode for a trivial private-sibling infrastructure-as-code
change** (the one repo where this mode has an executable path; `main` is branch-protected,
including for admins, in `ose-public` — see [Plans Organization Convention
§Per-Repository Delivery Mode
Restrictions (HARD RULE)](../../../conventions/structure/plans/per-repository-delivery-mode-restrictions.md#per-repository-delivery-mode-restrictions-hard-rule)):

```bash
# <private-sibling> plan declares `## Delivery Mode: main-to-origin-main` for a single Terraform tag fix
git commit -m "fix(infra): correct a resource tag"
git push origin main
```

**Bad Example:**

```bash
# A branch that outlives its purpose (DO NOT DO THIS)
git checkout -b feature/big-redesign
# ... three weeks of commits, never integrated ...
# Diverges from main; the merge becomes a project of its own
```

**Rationale:**

- Frequent integration is what TBD protects — the branch's _lifespan_ is the risk, not its existence
- The PR is where review and the hardened merge preconditions attach
- Temporary production-disabled flags let internally complete, tested increments integrate without
  keeping a branch open; their rollout, rollback, and removal remain explicit
- Long-lived branches produce exactly the merge conflicts TBD exists to prevent
