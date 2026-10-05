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
  `ose-public` always uses a short-lived `worktree-to-pr` branch.

## Working on `main` Directly

> This subsection describes TBD's classic direct-commit-to-trunk shape — one of the two direct-push
> delivery modes named in this repo's vocabulary (`worktree-to-origin-main`, `main-to-origin-main`).
> This repository's own **repo-wide default** is the short-lived-branch-via-PR shape (`worktree-to-pr`)
> — see [Default Push and Worktree Execution](./default-push-and-worktree-execution.md#default-push-and-worktree-execution) below.
>
> **Per-repository restriction (independent of the shape described here)**: in `ose-public`,
> `main` is branch-protected against direct pushes — including for admins — so
> **neither direct-push mode has an executable path there at all**. See
> [Plans Organization Convention §Per-Repository Delivery Mode Restrictions](../../../conventions/structure/plans/per-repository-delivery-mode-restrictions.md#per-repository-delivery-mode-restrictions-hard-rule)
> for the full rule.

Committing directly to `main` is therefore **not executable in this repo** — it is retained as
illustrative TBD vocabulary only, and no example workflow is given.
