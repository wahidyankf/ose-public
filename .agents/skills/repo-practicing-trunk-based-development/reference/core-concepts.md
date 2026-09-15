# Trunk-Based Development — Core Concepts

## What is Trunk Based Development?

**Trunk Based Development (TBD)** is a git workflow where:

- **All work converges on `main`** (the "trunk") — one integration target, no long-lived parallel lines
- **Small, frequent commits** integrated continuously, many times a day
- **Short-lived branches** - single-purpose, landed within 1-2 days; TBD forbids _long-lived_ branches, not branches
- **Feature flags** for complete-and-inert increments of incomplete behaviour, so nothing needs an
  open branch to stay hidden and every merged state remains production-deployable
- **Continuous integration** enabled by that frequent landing

In this repo the default shape is `worktree-to-pr`: a short-lived plan branch in a disposable
worktree, pushed to a draft PR, merged once the hardened preconditions hold. Committing straight to
`main` is the `worktree-to-origin-main` / `main-to-origin-main` modes — neither has an executable
path in `ose-public` (`main` is branch-protected, including for admins); only a
private-sibling plan retains `main-to-origin-main`, explicitly declared and limited to exactly two
categories: stateful IaC needing the primary checkout's real secrets/local state, or CI-IaC
changing its own pipeline, runner, or toolchain provisioning where PR self-validation is circular. See
[When a Direct-Push Mode Is Appropriate](./delivery-modes-direct-push.md#when-a-direct-push-mode-is-appropriate) for the
full detail.

## Why TBD?

**Benefits**:

- **Reduced merge conflicts**: Small commits integrate continuously
- **Faster feedback**: Changes visible immediately
- **Simpler workflow**: No complex branching strategies
- **Better collaboration**: Everyone works on latest code
- **Easier rollback**: Small commits easier to revert than large branches

**Tradeoffs**:

- **Requires discipline**: Commits must be small and safe
- **Needs feature flags**: Keep incomplete behaviour complete-and-inert behind temporary
  production-disabled flags, with both paths tested and rollout, rollback, and removal recorded
- **Depends on CI/CD**: Automated tests prevent breakage
- **Cultural shift**: Teams used to long-lived branches must adapt
