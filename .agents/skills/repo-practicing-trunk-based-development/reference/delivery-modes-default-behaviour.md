# Trunk-Based Development — Delivery Modes: Default Behaviour

## Default Behaviour

**Work happens on short-lived branches that integrate into `main` continuously.** TBD's defining tenet is avoiding _long-lived_ branches, not avoiding branches: a short-lived branch reviewed via PR is a recognized TBD flavor, and it is this repo's default (`worktree-to-pr`). Direct commit to `main` has no executable path in `ose-public` (`main` is branch-protected against direct pushes, including for admins). The private sibling also prohibits `worktree-to-origin-main`; it retains only explicitly declared `main-to-origin-main`, and only for stateful IaC needing the primary checkout's real secrets/local state or CI-IaC changing its own pipeline, runner, or toolchain provisioning where PR self-validation is circular — see [When a Direct-Push Mode Is Appropriate](./delivery-modes-direct-push.md#when-a-direct-push-mode-is-appropriate).

**Standard workflow** (the default `worktree-to-pr` mode):

```bash
# 1. Provision a disposable worktree on a plan-scoped branch
git worktree add worktrees/<plan-identifier> -b <plan-identifier>
cd worktrees/<plan-identifier>

# 2. Make changes
# (edit files)

# 3. Commit frequently
git add [files]
git commit -m "feat(component): add feature X"

# 4. Push to the plan branch and open a draft PR
git push origin <plan-identifier>
gh pr create --draft --base main

# 5. Repeat steps 2-4; drive exact-current-head/base PR CI and applicable surface gates green,
#    then merge once the hardened preconditions hold ([AI] by default)
```

Under a declared direct-push mode the same loop applies without steps 1 and 4 — commit on `main` and
`git push origin main`.

> **Reading the examples below**: later examples in this document focus on their own topic (commit
> granularity, feature flags, branch lifespan) and write the push as `git push origin <plan-branch>`.
> Substitute `git push origin main` when a direct-push mode is the declared Delivery Mode. The push
> target follows the mode; it is never the point the example is making.

**AI agents assume `worktree-to-pr` by default** unless a plan or invocation explicitly selects another delivery mode. Resolve the mode by three-tier precedence: invocation argument > plan `## Delivery Mode` field > repo default.
