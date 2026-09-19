---
description: Where this workflow runs from, and the two non-default delivery modes for the plan documents it authors — main-to-origin-main and worktree-to-origin-main.
when_to_use: Use when determining the anchor repo for a run, or choosing a direct-push delivery mode for the plan documents themselves.
---

# Invocation Point

This workflow runs from the anchor repo — whichever repo in the parity set the invoker is
currently working in. The other repos are sibling repos discovered relative to the anchor. The
workflow discovers sibling repo paths from the invoker's environment (absolute paths, a shared
parent directory, or an explicit `repos` input). When paths are ambiguous, the first grilling
round confirms them before any repo is accessed.

All steps treat every target repo identically regardless of which repo anchors the run. The
anchor repo has no special authority over other repos' plans.

## `main-to-origin-main`

Author plans directly in the `main` working tree of each repo. Commit and push to `origin main`
of each repo. Use when worktrees are not needed and direct main-branch access is acceptable for
all repos in the parity set. **Unavailable for any bare-repo parity target** — bareness is a
per-invocation property of a specific clone, not a fixed attribute of a repository's name; verify
with `git worktree list` rather than assuming from this document which repos are bare today. A bare
repo has no `main` working tree to author directly in. See
[Note on bare-repo parity targets](./modes-worktree-to-pr-default.md#worktree-to-pr-default) below for the worktree-based
alternative and the full rationale.

## `worktree-to-origin-main`

Author plans in a worktree per repo. If the invoker is not already in a worktree when the
workflow starts, provision one for each target repo:

```bash
# Per repo: from repo root
git worktree add worktrees/<objective-slug> main
cd worktrees/<objective-slug>
./hippo run --class transactional --resource-tier standard --disk-path . -- npm install
npm run doctor -- --fix
```

Use the same `<objective-slug>` basename in every target repository. Before creation, probe all
targets and record the common identity; do not silently choose a repo-specific suffix when one name
is unavailable. Follow
[Cross-Repository Parity Identity](../../../development/workflow/cross-repository-parity-identity.md).

Worktrees land at `worktrees/<objective-slug>/` per the
[Worktree Path Convention](../../../conventions/structure/worktree-path.md). The two-step toolchain
initialization (guarded `npm install`, then transactional `npm run doctor -- --fix`) is required per
the
[Worktree Toolchain Initialization](../../../development/workflow/worktree-setup.md)
practice. Commit in the worktree branch, push to `origin main` of each repo, then remove the
worktree after delivery.
