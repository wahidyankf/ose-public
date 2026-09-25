# Rule 19: Delivery Mode Validation, Part 1 (Step 5m — MANDATORY)

## 19. Delivery Mode Validation (Step 5m — MANDATORY)

Enforces
[Plans Organization Convention §Delivery Mode](../../../../repo-governance/conventions/structure/plans/delivery-mode-the-four-modes.md#delivery-mode):
every plan resolves to exactly one of four modes (`worktree-to-pr` default,
`worktree-to-origin-main`, `main-to-origin-main`, `main-to-pr`) before execution. Sibling to Step 5d
(Worktree Specification) — a worktree is a work location; delivery mode additionally fixes the
integration target and merge authority.

**What to validate**:

1. **Value validity when declared** — a `## Delivery Mode: <value>` declaration must be exactly one
   of the four valid modes; an invalid non-empty value (typo, retired name, free text) is never
   silently coerced to the default — flag it directly.
2. **Absence is not itself a violation** — an unmarked plan resolves to the tier-3 default
   (`worktree-to-pr`); don't flag omission. `plan-maker` always authors the section explicitly (see
   `.agents/agents/plan-maker.md` Step 7) — flag a freshly-authored plan missing it entirely at
   **LOW** (best-practice gap, not correctness defect).
3. **Every PR carries exact-head/base CI** — when the resolved mode produces a PR, `delivery.md`
   requires `.github/workflows/pr-quality-gate.yml`'s `Quality gate` for the exact current head and
   base before merge, one authenticated clean current-head `pr-leak-review`, plus applicable finite
   surface gates. Missing/stale/failed/findings leak evidence blocks merge; a head-changing fix
   requires one new pass, never two. Absence of broad semantic review is valid. A `pr-review` or
   `pr-review-cycle` step is valid only when the user explicitly requested it and it
   appears at that PR delivery boundary.
4. **Merge tagging matches mode** — for `*-to-pr` modes, the final PR-merge step defaults to `[AI]`; a
   `[HUMAN]` tag IS the plan's opt-in into human merge judgment, per
   [Delivery Mode](../../../../repo-governance/conventions/structure/plans/delivery-mode-the-four-modes.md#delivery-mode)
   — the tag itself is the complete declaration, with no separate opt-in field to look for. A
   `[HUMAN]`-tagged merge step under `*-to-pr` is NEVER a defect and MUST NOT be flagged or retagged;
   the only defect is an invalid tag value. For `*-to-origin-main` modes, the final push MUST be
   `[AI]` (never gated behind an unrequested `[HUMAN]` approval — see the PR Step Authorization Check
   in `reference/05-pr-step-authorization-check.md`; its "unsolicited PR step" framing
   applies only to `*-to-origin-main`-mode plans, since a PR step is expected under `*-to-pr` modes).
5. **"Done" is not "merged"** — a `*-to-pr` plan's completion/Gate criteria must not require the PR to
   actually be merged; a green, ready PR awaiting merge is a valid done state. Flag
   conflation.
6. **Archival-in-PR present** — for `*-to-pr` modes (plan folder tracked in-repo), the checklist
   includes an archival step (`git mv` to `plans/done/`, README/index updates) committed **inside the
   delivering PR**, not deferred to a follow-up commit/PR. Missing or deferred archival: flag it. N/A
   for repos where the plan folder is not tracked.
7. **Phase 0 carries no PR/push/review/merge step** — run the Phase 0 detection command from
   `reference/05-pr-step-authorization-check.md` and confirm it returns `0`, under every
   mode including direct-push ones. An unscoped Per-Phase Integration Protocol block is the same
   defect stated once instead of per-phase — flag it too.
