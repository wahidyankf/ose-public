---
title: "Repo Practicing Trunk Based Development"
---

# Repo Practicing Trunk Based Development

- [SKILL](./SKILL.md) — Trunk Based Development workflow - all development on main branch with small frequent commits, minimal branching, and continuous integration. Covers when branches are justified (exceptional cases only), commit patterns, feature flag usage for incomplete work, environment branch rules (deployment only), and AI agent default behaviour (the repo-wide default delivery mode is `worktree-to-pr` -- a short-lived plan branch in a disposable worktree pushed to a draft PR; direct push to main has no executable path in ose-public, main is branch-protected including for admins, and only the private sibling retains `main-to-origin-main` in exactly two categories: stateful IaC needing the primary checkout's real secrets/local state, or CI-IaC changing its own pipeline, runner, or toolchain provisioning where PR self-validation is circular). Essential for understanding repository git workflow and keeping branches short-lived
- [Reference](./reference/README.md) — commit patterns, delivery modes, and branch-lifetime detail broken out from SKILL.md
