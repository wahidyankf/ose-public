---
description: Why a hardcoded absolute path to a repo's primary checkout silently resolves to stale content instead of the worktree's in-progress copy, and how to verify it before running.
when_to_use: Use before running any delivery-checklist command that reads from an absolute path into a repo the same plan is also modifying.
---

# Absolute Source Paths in Delivery-Checklist Commands (Same-Repo Worktree vs. Primary Checkout)

A related but distinct failure mode: a delivery-checklist command can hardcode a fully-qualified
**absolute** path to a repo's **primary checkout** (e.g. `/Users/<you>/ose-public/apps/ose-www/...`)
when it should point at that same repo's **worktree** copy
(`/Users/<you>/ose-public/worktrees/<plan-id>/apps/ose-www/...`). Unlike the relative-path case
above, this is not a nesting-depth arithmetic error — the path is syntactically valid and resolves
to a real, existing file, just the stale one on `main` instead of the branch's in-progress copy.
This makes it dangerous: a `cp`/`diff` command sourcing from the wrong checkout does not error, it
silently succeeds with stale content.

This surfaced concretely in a multi-repo `worktree-to-pr` plan's own Phase 3 sibling-propagation `cp`
commands (verbatim text written into `delivery.md` itself, not a live agent misread): the source
path omitted the `worktrees/<plan-id>/` segment, so the first propagation copy silently pulled
pre-Phase-1 content. It was caught only because the sibling's subsequent test run showed fewer new
tests than expected — a downstream symptom, not a copy-time error.

Before running ANY command in a delivery checklist that reads from an absolute path into a repo this
plan is also modifying, verify the path includes the worktree segment for the branch actually being
worked, and — when in doubt — confirm with `git -C <path> rev-parse HEAD` that the resolved
directory is at the commit you expect, not `main`.
