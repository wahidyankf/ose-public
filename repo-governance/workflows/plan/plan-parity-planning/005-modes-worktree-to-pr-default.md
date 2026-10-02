---
description: The repo-wide default delivery mode for the plan documents this workflow authors, plus the bare-repo parity-target exception.
when_to_use: Use when delivering the authored plan documents under the repo-wide default review-before-merge mode.
---

# `worktree-to-pr` (Default)

Same worktree provisioning as `worktree-to-origin-main`, but commit to a branch
`plan/<objective-slug>` and push that branch. Create a PR per repo with `gh pr create` only if no
open PR for that branch exists yet; otherwise push to the existing PR branch:

The `plan/<objective-slug>` branch name and worktree basename are identical across corresponding
repositories. Probe ownership first; reuse an existing identity only with same-delivery proof.

```bash
# Check for existing PR
gh pr list --head plan/<objective-slug>

# Create if none exists
gh pr create --title "plan: <objective> parity" --body "..." --draft
```

This is the repo-wide default (see
[AGENTS.md §Git Workflow §Delivery Mode](../../../../AGENTS.md#delivery-mode)): a formal review step
happens before plans land on `main`, mirroring the same rationale for the sibling per-plan
`## Delivery Mode` field these plans separately declare (see
[Relationship to Each Repo's Own `## Delivery Mode`](./006-relationship-to-delivery-mode.md#relationship-to-each-repos-own--delivery-mode)
below).

**Note on bare-repo parity targets**: When a bare repo is a parity target, propagation to it can be
delivered EITHER as a draft PR OR as a direct push to its `main`, both through a worktree. The
delivery mode is the caller's per-run choice, independent of this workflow's own `worktree-to-pr`
default, so selecting `worktree-to-origin-main` for a bare target is a first-class choice, not a
deviation. Bareness is a per-invocation property of a specific clone, not a fixed attribute of a
repository's name — verify with `git worktree list` (look for the `(bare)` marker) rather than
assuming from this document which repos are bare today. Whichever repos are bare have no primary
checkout, so the two `main-to-*` modes (`main-to-origin-main`, `main-to-pr`) are unavailable for
them — every mutation against a bare target flows through a worktree, per the
[Bare-Repo Base-Worktree Landing Method](../../../development/workflow/bare-repo-landing-method.md).
The grilling in Step 3 MUST surface the delivery-mode choice explicitly and record the invoker's
decision before proceeding.
