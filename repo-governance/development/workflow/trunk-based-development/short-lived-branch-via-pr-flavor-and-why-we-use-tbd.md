---
description: Why routing a short-lived plan branch through a PR does not contradict TBD, and the problems TBD solves versus long-lived feature branches.
when_to_use: Use when justifying that a short-lived PR branch is a recognized TBD shape, or citing the concrete problems TBD solves.
---

# TBD and the Short-Lived Branch-via-PR Flavor

TBD's defining tenet is avoiding **long-lived** branches — not avoiding branches altogether.
[TrunkBasedDevelopment.com](https://trunkbaseddevelopment.com/) documents short-lived branches reviewed
via pull request as an accepted TBD flavor alongside pure direct-commit, provided branches stay
short-lived (merged per the lifespan rules below — ideally same day, 1-2 days maximum) and integration
into `main` stays frequent. Routing a short-lived, single-purpose plan branch through a PR before it
lands on `main` therefore does not contradict TBD; it is one of TBD's recognized shapes.

This repository's **repo-wide default delivery mode is `worktree-to-pr`**: a short-lived plan branch
inside a disposable git worktree, pushed to a PR, driven to a green exact-head CI state, then
merged once the hardened preconditions hold -- `[AI]` by default, `[HUMAN]` only where a plan says so. Pure direct-commit-to-`main` is not a generally available alternative in this repo: `main` is branch-protected against direct pushes in `ose-public` (including for admins) -- see [Direct-Push Modes Remain Available Where the Topology Supports Them](./why-draft-and-direct-push-modes.md#direct-push-modes-remain-available-where-the-topology-supports-them) below for the sole surviving mode (the private sibling's `main-to-origin-main` for named stateful IaC or CI-IaC self-validation circularity). See
[Default Push and Worktree Execution](./default-push-and-worktree-execution.md#default-push-and-worktree-execution) below for the mechanics of
all four delivery modes, and the
[Plans Organization Convention — Delivery Mode](../../../conventions/structure/plans/delivery-mode-the-four-modes.md#delivery-mode) for
the canonical four-mode vocabulary and the three-tier precedence that resolves which mode is active.

## Why We Use TBD

TBD addresses common problems with long-lived feature branches:

| Problem with Feature Branches           | TBD Solution                                                                                               |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| FAIL: Merge conflicts after weeks       | PASS: Daily integration prevents large conflicts                                                           |
| FAIL: Stale branches diverge from trunk | PASS: Always working on current codebase                                                                   |
| FAIL: Integration testing delayed       | PASS: Continuous integration catches issues early                                                          |
| FAIL: Code review bottlenecks           | PASS: Small, frequent reviews are faster                                                                   |
| FAIL: "Integration hell" before release | PASS: Code is always in releasable state                                                                   |
| FAIL: Hard to coordinate teams          | PASS: Everyone sees changes immediately                                                                    |
| FAIL: Feature branches hide WIP         | PASS: Tested complete-and-inert increments use temporary production-disabled flags with explicit lifecycle |
| FAIL: Delayed feedback from CI          | PASS: Immediate CI feedback on every commit                                                                |

**Reference**: [TrunkBasedDevelopment.com](https://trunkbaseddevelopment.com/)
