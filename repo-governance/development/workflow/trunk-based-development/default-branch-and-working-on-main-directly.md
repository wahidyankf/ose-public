---
description: The trunk is main with no develop/release/hotfix branches, and the classic direct-commit-to-trunk shape (not executable in ose-public).
when_to_use: Use when explaining why there is no develop/release/hotfix branch, or when illustrating the classic direct-commit-to-main TBD shape.
---

# Default Branch and Working on Main Directly

## Default Branch: `main`

- **The trunk is `main`**: All development happens on `main` branch
- **No `develop` branch**: We don't use GitFlow or similar multi-branch strategies
- **No release branches**: Releases are tagged commits on `main`
- **No long-lived hotfix branches**: Hotfixes use the repository's resolved delivery mode.
  `ose-public` always uses a short-lived `worktree-to-pr` branch; the private sibling does too unless an
  explicitly declared `main-to-origin-main` change qualifies as stateful IaC or circular CI-IaC.

## Working on `main` Directly

> This subsection describes TBD's classic direct-commit-to-trunk shape — one of the two direct-push
> delivery modes named in this repo's vocabulary (`worktree-to-origin-main`, `main-to-origin-main`).
> This repository's own **repo-wide default** is the short-lived-branch-via-PR shape (`worktree-to-pr`)
> — see [Default Push and Worktree Execution](./default-push-and-worktree-execution.md#default-push-and-worktree-execution) below.
>
> **Per-repository restriction (independent of the shape described here)**: in `ose-public`,
> `main` is branch-protected against direct pushes — including for admins — so
> **neither direct-push mode has an executable path there at all**. In
> the private sibling, `worktree-to-origin-main` is also unavailable. Only explicitly declared
> `main-to-origin-main` remains, and only for stateful IaC needing the primary checkout's real
> secrets/local state or CI-IaC changing its own pipeline, runner, or toolchain provisioning where
> PR self-validation is circular. See
> [Plans Organization Convention §Per-Repository Delivery Mode Restrictions](../../../conventions/structure/plans/per-repository-delivery-mode-restrictions.md#per-repository-delivery-mode-restrictions-hard-rule)
> for the full rule. The PASS example immediately below is therefore **not executable in this repo
> (`ose-public`)** — it is retained as illustrative TBD vocabulary and remains genuinely runnable only
> as the private sibling's `main-to-origin-main` for one of those two named categories.

PASS (only for explicitly declared, eligible private-sibling `main-to-origin-main` work — never in
`ose-public`): **You may commit directly to `main` only when**:

- The work is stateful IaC needing the primary checkout's real secrets/local state, or CI-IaC whose
  pipeline, runner, or toolchain provisioning makes PR self-validation circular.
- The plan explicitly declares `main-to-origin-main` and records `## Worktree` as
  `Not applicable (N/A)`.
- The change is small, understood, locally gated, and safe to integrate immediately.

**Example workflow**:

```bash
# <private-sibling> stateful-IaC plan explicitly declares main-to-origin-main and Worktree: N/A
git switch main
git pull --rebase origin main

# Update one Terraform resource using primary-checkout credentials and local state
# ... edit infra/prod/terraform/main.tf ...

# Run the plan's complete local IaC quality gate without printing secrets
# ... validate, plan, and inspect the intended state change ...

# Commit and push the eligible private change directly to main
git add infra/prod/terraform/main.tf
git commit -m "fix(infra): correct Terraform resource state"
git push origin main

# CI runs automatically
# Change is now visible to the private repository team
```
