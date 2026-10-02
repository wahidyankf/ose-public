---
description: Distinguishes this workflow's own plan-document delivery mode from each authored plan's separately-declared, independently-resolved execution Delivery Mode.
when_to_use: Use when confused about which "delivery mode" a decision refers to — the plan document's or the plan's own future execution.
---

# Relationship to Each Repo's Own `## Delivery Mode`

The three modes above govern how THIS workflow delivers the **plan documents** it authors — a
planning-phase concern. They are distinct from the
[Plans Organization Convention §Delivery Mode](../../../conventions/structure/plans/delivery-mode-the-four-modes.md#delivery-mode)
field (`worktree-to-pr`, `worktree-to-origin-main`, `main-to-origin-main`, `main-to-pr`) that each
authored plan separately declares for its own **future execution** by
[plan-execution](../plan-execution.md) — an execution-phase concern layered on top of whichever mode
delivered the plan document itself.

Because this workflow produces one independent plan document per repo, each repo's own
`## Delivery Mode` is resolved independently, per that repo's own plan and its own
`## Worktree`/`## Delivery Mode` declaration, using the standard three-tier precedence (invocation
argument > plan field > `worktree-to-pr` default). Repos in the same parity set are free to diverge
here — for example, whichever repo is currently bare may resolve to `worktree-to-origin-main` (the
only direct-push mode a bare repo can use — `main-to-origin-main` needs a primary checkout a bare
repo does not have) while `ose-public` resolves to `worktree-to-pr` — exactly like any other per-repo
deviation this
workflow grills and records in the deviation matrix (Step 2). See Step 6 item 8 in
[Plan Authoring](./012-step-6-plan-authoring.md) for how `plan-maker` receives this
instruction per repo.
