---
description: Authors the mature-core plan per repo via plan-maker, with the required handoff prompt including delivery-mode instructions.
when_to_use: Use when authoring each repo's plan after both grills close, to build the plan-maker handoff correctly.
---

# Step 6 — Plan Authoring (One Plan Per Repo)

Author a mature-core plan (`README.md`, `brd.md`, `prd.md`, `delivery.md`, `learnings.md`, plus
exactly one technical form: `tech-docs.md` or mapped `tech-docs/`) in each target repo per the
[Plans Organization Convention](../../../conventions/structure/plans.md).

**Stage-aware folder naming**:

- `stage=in-progress` → `plans/in-progress/<objective-slug>/` (no date prefix)
- `stage=backlog` → `plans/backlog/<objective-slug>/` (no date prefix)

**Agent**: `plan-maker` (invoked per repo via the Agent tool)

Provide a self-contained handoff prompt per repo covering:

1. Objective (verbatim from input)
2. Resolved decisions from Steps 3 and 5 (the full deviation matrix with recorded decisions)
3. Research findings from Step 4 (cited) — or note that research was skipped
4. This repo's specific deviations and their justifications
5. Confirmed plan folder path (per stage above)
6. Cross-links to the sibling plans in the other repos (even if those plans are not yet
   authored — use the expected paths)
7. Delivery mode (from `mode` input) — this governs how the **plan document** itself is delivered
   (see [Modes](./004-invocation-point-and-modes-overview.md) above), distinct from the plan's own `## Delivery Mode` declaration below
8. **Instruction for `plan-maker`** to declare this repo's own
   [`## Delivery Mode`](../../../conventions/structure/plans/delivery-mode-the-four-modes.md#delivery-mode) field in the authored
   plan — the four-mode vocabulary (`worktree-to-pr` default, `worktree-to-origin-main`,
   `main-to-origin-main`, `main-to-pr`) governing that plan's own future execution, resolved
   independently per repo through the standard three-tier precedence (invocation argument > plan
   field > default) and recorded as its own deviation-matrix row when it diverges from sibling
   repos. For a bare-repo target (bareness is per-invocation — verify with `git worktree list`,
   never assume from a fixed repo list), the two `main-to-*` values are
   unavailable — see
   [Plans Organization Convention §Delivery Mode](../../../conventions/structure/plans/delivery-mode-the-four-modes.md#delivery-mode)
   for the authoritative restriction, which governs this field independently of the restriction
   [Modes](./004-invocation-point-and-modes-overview.md) above places on this workflow's own 3-value vocabulary. A repo whose plan
   resolves to a `*-to-pr` mode additionally requires exact-head/base PR CI, one clean current-head
   [`pr-leak-review`](../../quality/pr-leak-review.md), and applicable surface gates during execution.
9. **Cross-repository parity identity record** — objective slug, common worktree basename, and the
   corresponding short-lived branch mapping for every target repository. Instruct `plan-maker` to
   reproduce the same record in each plan's `## Worktree` section, using `not applicable` only where
   the repo's resolved mode has no worktree or short-lived branch.

**Continues in** [Step 6 — Plan Authoring (Required Contents)](./013-step-6-plan-authoring-required-contents.md).
