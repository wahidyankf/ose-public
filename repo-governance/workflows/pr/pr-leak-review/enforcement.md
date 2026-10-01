---
description: "Makes the leak review a mechanical precondition through a commit-by-commit screen, hosted checks, and the required leak-review status, and records this repository's adopter decisions."
when_to_use: "Use when wiring or tracing the leak review's screen, hosted checks, and required status."
---

# Enforcement

A precondition stated only in prose is a convention someone forgets. The leak review is enforced in
three layers; each fails closed.

## The Screen

[`scripts/public-safety/`](../../../../scripts/public-safety/README.md) runs as the
`public-safety-range` gate on the pre-push hook, bound to the pushed updates with fallback
`refs/remotes/origin/main`, and on every PR's base..head range. It screens the range commit by
commit: each commit's added lines at the line numbers they occupy, its file names, its message, and
the ref names. A merge contributes what it resolved beyond the automatic merge. Content the range
did not add is not screened again, so the screen binds from adoption onward. Its shapes include
absolute home paths (`/Users`, `/home`, and Windows `Users` directories), private addresses, and
internal hostnames, beside a credential scanner. The `public-safety-tree` gate still screens the
whole tree beside it.

The screen matches shapes; the review reads context. Neither replaces the other.

## Hosted Checks

- **Range screen.** `pr-quality-gate.yml`'s repository-policy job replays the pull-request surface,
  `public-safety-range` included, over the PR's base..head, because a local hook can be skipped and a
  hosted check cannot. It reports through the required `Quality gate` check.
- **Record check.** [`pr-leak-review.yml`](../../../../.github/workflows/pr-leak-review.yml) runs
  [`scripts/leak-review/record-status.sh`](../../../../scripts/leak-review/README.md) when the PR
  changes and when a review is submitted, edited, or dismissed. It publishes the `leak-review`
  commit status on the live head: `success` only when the repository owner's latest undismissed
  review on that head carries a `pass` record with every count zero. Posting the record turns it
  green without a new commit.

Both are required on `main` through branch protection. A waiver of other gates never covers either.

## Adopter Decisions

- **Record marker:** `ose-pr-leak-review`, which never changes.
- **Reviewer identity:** the repository owner.
- **Required checks:** `Quality gate` (range screen) and the `leak-review` commit status.
- **Integration path:** pull request, under mandatory `worktree-to-pr`.
