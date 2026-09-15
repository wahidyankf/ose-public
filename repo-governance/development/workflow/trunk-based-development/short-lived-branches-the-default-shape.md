---
description: The worktree-to-pr branch workflow example, the other cases branches are used for, and the branch lifespan rules.
when_to_use: Use when creating a short-lived plan branch, or checking whether a branch has outlived its acceptable lifespan.
---

# Short-Lived Branches (the Default Shape)

Under the repo-wide `worktree-to-pr` default, a short-lived plan branch is the norm for every plan in
`ose-public` -- direct commit to `main`
(`worktree-to-origin-main`, `main-to-origin-main`) is not a routine alternative here.
The private sibling also prohibits `worktree-to-origin-main`; only explicitly declared
`main-to-origin-main` survives there for named stateful IaC or CI-IaC self-validation circularity -- see
[Direct-Push Modes Remain Available Where the Topology Supports Them](./why-draft-and-direct-push-modes.md#direct-push-modes-remain-available-where-the-topology-supports-them)
below.

Branches are also used, as they always have been, for:

- **External contribution**: Outside contributor submitting a PR (fork-based, not a plan branch).
- **Regulatory requirement**: Compliance mandates review before merge.
- **Pair/mob programming**: Collaborating on a branch before merging.

**Branch workflow**:

```bash
# Create short-lived plan branch inside a worktree
git worktree add worktrees/feature-user-login -b feature-user-login
cd worktrees/feature-user-login

# Make changes
# ... edit files ...
git commit -m "feat(auth): implement login endpoint"

# Push frequently
git push origin feature-user-login

# Open the PR as a draft immediately
gh pr create --draft --base main --title "feat(auth): implement login endpoint"

# Drive exact-current-head/base PR CI and applicable surface gates green

# When the done-definition is met, flip to ready and merge once the hardened
# preconditions hold -- [AI] by default, [HUMAN] only where a plan says so
# (squash or rebase merge -- never a local `git merge`, to preserve linear history):
gh pr ready

# After merge, remove the worktree
git worktree remove worktrees/feature-user-login
```

**Branch lifespan rules**:

- PASS: **< 1 day**: Ideal - merge same day you created it
- **1-2 days**: Acceptable maximum
- FAIL: **> 2 days**: Too long - branch is stale, rebase or abandon
