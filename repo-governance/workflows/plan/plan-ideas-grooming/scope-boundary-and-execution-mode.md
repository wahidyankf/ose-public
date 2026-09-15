---
description: The hard plans/ideas/**-only write scope this workflow never exceeds, who orchestrates it, and its unconditional worktree-to-pr delivery mode.
when_to_use: Use when checking whether an output belongs in this workflow's scope, or who runs it and under what delivery mode.
---

# Scope Boundary (Hard) and Execution Mode

## Scope Boundary (Hard)

This workflow's write scope is strictly `plans/ideas/**` in each processed repo — the idea files
themselves, their quadrant subfolders, and the `## Grooming Log` / `> Last groomed:` lines it
appends to that folder's own `README.md`. It **never** creates, moves, renames into, or otherwise
writes any file under `plans/backlog/` or `plans/in-progress/` in any repo, in any of its ten
steps, under any `delivery-mode`. Promoting a groomed, ripe idea into a full backlog plan is a
categorically separate action, performed only through [`plan-planning`](../plan-planning.md) per
[Promoting a Two-Pager](../../../conventions/structure/plans/promoting-ideas-and-worked-examples.md), invoked explicitly and
separately by a maintainer or another workflow — `plan-ideas-grooming` never invokes it and never
performs a promotion itself, even when a surviving idea looks obviously ready. If a step's output
would require writing outside `plans/ideas/**`, that output is out of scope for this workflow:
stop and log it as a follow-up recommendation in the grooming log instead of writing it.

## Execution Mode

**Direct Orchestration** — the calling context (the top-level assistant session that received the
"Groom plans/ideas/ in …" request, or the recurrence trigger noticing the threshold) is the
orchestrator. It resolves the `repos` input to a concrete set of git checkouts, reads every
target repo's `plans/ideas/` tree directly via `Read`/`Glob`/`Bash`, performs the merge/split,
residency, reshape, provenance, classification, and link-rewrite steps below itself (this is
mechanical file reorganization work, not a task that benefits from delegating to a specialized
content-authoring agent), and commits/pushes per the resolved `delivery-mode`. There is no
dedicated `plan-ideas-grooming` delegated agent — the procedure lives entirely in this workflow
document, matching the pattern [`plan-execution`](../plan-execution.md) uses for its own
orchestrator-run steps.

Every git delivery under this workflow's `worktree-to-pr` default — unconditional, no override —
runs exact-head/base PR CI and one clean current-head `pr-leak-review` before the change lands, per
[Plans Organization Convention §Per-Repository Delivery Mode
Restrictions](../../../conventions/structure/plans/per-repository-delivery-mode-restrictions.md#per-repository-delivery-mode-restrictions-hard-rule):
`main` is branch-protected against direct pushes in `ose-public`, so the historical
`plans/**`-only **plan-docs-only carve-out**
([`plan-planning`](../plan-planning/plan-docs-only-carve-out.md))
that once let this workflow push directly to each processed repo's own `main` with no PR gate
is retired there — a plan-docs-only change in `ose-public` uses `worktree-to-pr` like
any other change. The carve-out survives, narrowed, only in the private sibling as an
infrastructure-as-code exception — but this workflow's write scope is strictly `plans/ideas/**`
(see the Scope Boundary above), which is never infrastructure-as-code work, so no invocation of this
workflow can ever qualify for it. There is no override.
