---
description: Documents the retired plan-docs-only direct-push carve-out for historical context, and how it survives narrowed in the private sibling.
when_to_use: Use when researching why a plans/**-only change used to skip worktree-to-pr, or when working in the private sibling and checking whether the narrowed carve-out still applies.
---

# The Plan-Docs-Only Carve-Out (Superseded — Retired in ose-public)

**This carve-out is retired in `ose-public`**: `main` is
branch-protected against direct pushes (including for admins), so a plan-docs-only change here uses
`worktree-to-pr` like any other change, since there is
no direct-push path left to carve out of. The private sibling permits only explicitly declared
`main-to-origin-main` for named stateful IaC or CI-IaC self-validation-circularity work — not a
plan-docs-only carve-out — see
[Plans Organization Convention §Per-Repository Delivery Mode Restrictions](../../../conventions/structure/plans/per-repository-delivery-mode-restrictions.md#per-repository-delivery-mode-restrictions-hard-rule)
for the current binding rule. The historical description below is kept for context.

A change touching **only** `plans/**`, with no `apps/` or `libs/` code, previously could push direct
to `main`. This **plan-docs-only** carve-out stood on its own footing as a general convention: such a
change ships no runtime behaviour. The retired rationale predated the current rule that broad
semantic review is explicit-only for every PR; exact-head PR CI and the focused leak review still
apply to plan-only PRs.

It is stated here in its own right and is **not** derived from DD-11 of any individual plan, which
disclaims being a general precedent.

**Reconciling with the `main-to-origin-main` content restriction**: [Plans Organization Convention —
Delivery Mode](../../../conventions/structure/plans/delivery-mode-the-four-modes.md#delivery-mode) restricts `main-to-origin-main` to
an `.md`-only change set or explicit user go-ahead. Plan-folder pushes are `.md`-only in the ordinary
case, so this carve-out is that condition's plan-authoring-time instance — no separate justification
is needed. When a plan-docs-only push carries a **non-markdown** evidence artifact (a CSV baseline, a
screenshot, a raw log capture), the carve-out alone no longer covers it: fall back to the restriction's
second condition (explicit user go-ahead) or to `worktree-to-pr`.
