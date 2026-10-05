# Delivery Mode (Mandatory — Applies to ALL Plans)

Every plan resolves to exactly one **delivery mode** before execution begins, declared alongside
its `## Worktree` work-location section. That section names a worktree for worktree modes or the
primary checkout for main modes; delivery mode also fixes the integration target and merge authority.

**The four modes** (full table and precedence algorithm: [Plans Organization Convention §Delivery Mode](../../../../repo-governance/conventions/structure/plans/delivery-mode-the-four-modes.md#delivery-mode)):

- **`worktree-to-pr`** — **the default** when no mode is otherwise specified. Work in `worktrees/<plan-identifier>/`, draft PR opened against `main`, `[AI]` merges once the hardened preconditions hold (a `[HUMAN]` merge gate applies only where the plan's own step says so).
- **`worktree-to-origin-main`** — work in the worktree, direct push to `origin main`, `[AI]` pushes directly.
- **`main-to-origin-main`** — primary checkout (no worktree), direct push to `origin main`, `[AI]` pushes directly.
- **`main-to-pr`** — primary checkout (no worktree), PR opened against `main`, `[AI]` merges once the hardened preconditions hold (a `[HUMAN]` merge gate applies only where the plan's own step says so).

**Per-Repository Delivery Mode Restrictions (HARD RULE)**: the two direct-push modes above are not
selectable here. `main` is branch-protected (including for admins) in `ose-public`,
so neither direct-push mode has an executable path — `worktree-to-pr` is
**mandatory**, not merely the safest default. See [Plans
Organization Convention §Per-Repository Delivery Mode Restrictions (HARD RULE)](../../../../repo-governance/conventions/structure/plans/per-repository-delivery-mode-restrictions.md#per-repository-delivery-mode-restrictions-hard-rule)
for the rule and enforcement detail.

**Declare it explicitly**: `## Delivery Mode: worktree-to-pr`, placed immediately alongside the
`## Worktree` declaration. In `ose-public`, an invocation argument naming any other mode is invalid;
an invocation-selected branch is valid only inside the declared designated worktree and cannot
bypass it. The broader four-mode vocabulary exists for documentation, not as an
availability grant here. An unmarked plan resolves to the tier-3 default (`worktree-to-pr`).

**Every PR uses exact-head/base CI**: for `worktree-to-pr` and `main-to-pr`, the delivery checklist
requires the `Quality gate` from `.github/workflows/pr-quality-gate.yml` for the PR's exact current
head and base, one authenticated clean current-head `pr-leak-review`, plus applicable finite surface
gates. Broad semantic review is absent by default. Include
[`pr-review`](../../../../repo-governance/workflows/quality/pr-review.md) or
[`pr-review-quality-gate`](../../../../repo-governance/workflows/quality/pr-review-quality-gate.md) only when the user
explicitly requested it, and place it at that PR delivery boundary. The merge remains outside the
done-boundary and `[AI]` merges once hardened preconditions hold.

**Invalid values are a finding, never silently coerced**: a delivery-mode value that is not one of the four modes above is a `plan-checker` HIGH finding, not a silent fallback to the default.
