---
description: PASS and FAIL examples of maintaining linear history before a push, and a PASS example of proactively fixing a preexisting delivery-mode mismatch.
when_to_use: Use when checking whether a push sequence kept linear history, or whether a preexisting checklist mismatch was fixed rather than deferred.
---

# Examples — Linear History and Proactive Fixes

## PASS: Correct linear history before push

```bash
# Remote moved forward — rebase first
git pull --rebase origin <target-branch>
# Read the incoming diff and reconcile its impact; rerun invalidated checks
git push origin <target-branch>
```

The middle step follows the [Integration Diff Review Convention](../integration-diff-review.md);
the pull and push alone do not make this example pass.

## FAIL: Merge commit created on push

```bash
# Wrong — creates merge commit
git pull origin <target-branch>       # produces merge commit
git push origin <target-branch>       # pushes linear-history violation
```

Use `--rebase` instead.

## PASS: Proactive fix of preexisting mismatch

While executing Plan A, the plan-execution workflow reads `plans/in-progress/feature-x/delivery.md` and
finds:

```markdown
- [x] Implement feature
- [ ] [HUMAN] Commit and push to origin main ← no ## Delivery Mode field; default worktree-to-pr applies
```

Correct behaviour: retag the step `[AI]`, route it through the default `worktree-to-pr` flow (branch,
PR, exact-current-head/base `quality-gate`, `[AI]` merge once the hardened preconditions hold), and
include the fix in the same commit as the plan work.
