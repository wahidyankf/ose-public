---
description: States when a delivery unit integrates, when incomplete behaviour requires a temporary flag, and how the worktree-to-pr default binds.
when_to_use: Use when deciding when a unit should integrate, whether incomplete behaviour needs a flag, or how the worktree-to-pr default applies.
---

# Delivery-Unit Integration Timing, Temporary Flags, and worktree-to-pr Binding

## Merge at Delivery Boundaries — Not Every Phase, and Not One Batch

Integrate each delivery unit as its **delivery boundary** is reached. Under `*-to-pr`, open and
merge the unit's PR after its prerequisites pass. Under a permitted direct mode, land it at its
direct-push checkpoint. Never integrate at every intermediate phase or hold ready units for a
plan-end batch.

Both failure modes cost something different. Opening a PR per phase spends PR CI and integration overhead on
scaffolding the next phase rewrites, and the review cannot judge intent that only lands two phases
later. Holding PRs for a batch merge serialises work the DAG already declared independent, and grows
the divergence each PR must reconcile against `main`.

Grouping **dependent** phases into one delivery unit is not batching. The prohibition targets
holding **independent, already-open** PRs — never the decision to review a dependent chain as one
complete thought.

The **merge actor** follows the inverted default in
[Plans Organization Convention §Delivery Mode](../../../conventions/structure/plans/delivery-mode-the-four-modes.md#delivery-mode):
`[AI]` merges once the hardened preconditions hold, and `[HUMAN]` applies **only** where a plan's
own step states that gate explicitly.

## Temporary Flags for Incomplete Behaviour

Incomplete behaviour reaches `main` only as a **complete-and-inert** increment behind a temporary
feature flag disabled in production by default rather than waiting on a long-lived branch. Every
exact resulting `main` state must be safe to deploy to production immediately. The enabled and
disabled paths must both pass; flagging never excuses a broken or internally incomplete increment.

- **Complete behaviour**: complete user-reachable behaviour may be active without a flag. Record why
  the resulting state is safe; no exemption vocabulary applies.
- **Removal**: every temporary flag introduced carries a named **flag removal step** in the plan's final
  phase. A flag with no removal step is an unbounded commitment, not a rollout mechanism.
- **Lifecycle**: the introducing delivery unit records enabled/disabled tests, rollout, rollback,
  and removal. Missing lifecycle evidence makes the unit unready to merge.

## How the `worktree-to-pr` Default Binds at Each Plan Path

The default binds differently depending on what is being done:

- **Creating or updating a plan** binds it as a **design obligation**. Resolve the repository's
  permitted delivery mode before delivering the authoring edit: `ose-public` uses `worktree-to-pr`
  exclusively; the private sibling also uses it except for explicitly declared `main-to-origin-main` in
  exactly two categories — stateful IaC needing the primary checkout's real secrets/local state, or
  CI-IaC changing its own pipeline, runner, or toolchain provisioning where PR self-validation is
  circular. `worktree-to-origin-main` remains unavailable in both repositories. The plan's phases
  MUST be authored around
  natural cohesive seams so they group into **independently production-deployable delivery units**,
  with each unit's boundary named in the `### Delivery Boundaries` table. LOC and file counts never
  define the grouping.
  A plan that genuinely cannot be decomposed that way records **why** in its chosen technical form — the
  constraint is documented, not silently absorbed.
- **Executing a plan** binds it as the actual delivery route: worktree → PR, per the
  delivery-unit-to-PR mapping above.
