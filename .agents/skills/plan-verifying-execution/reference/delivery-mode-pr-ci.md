# Delivery Mode and PR-CI Verification (Step 5i)

## 2. Delivery Mode and PR-CI Verification (Step 5i — MANDATORY)

After the Knowledge Capture blocking gate (Step 5h), verify that execution actually matched the
plan's resolved
[Delivery Mode](../../../../repo-governance/conventions/structure/plans/delivery-mode-the-four-modes.md#delivery-mode).
For `*-to-pr` modes this replaces the plain-`main` assumption baked into Step 5d (Archival) and Step
5e (Worktree) above: archival lands **inside the delivering PR**, and completion does not require the
PR to be merged.

### What to Validate

1. **Resolved mode matches actual execution** — confirm the mode declared in `delivery.md` (or the
   tier-3 default `worktree-to-pr` if undeclared) matches what actually happened: worktree vs.
   primary-checkout work location, and PR vs. direct-push integration target. A mismatch: **HIGH**
   finding.
2. **For `worktree-to-pr` / `main-to-pr`**:
   - **PR exists** and targets `main` from the plan's branch. Missing: **CRITICAL**.
   - **Exact-head/base PR CI is green** — `.github/workflows/pr-quality-gate.yml`'s `Quality gate`
     matches the current head SHA and base. Missing, stale, pending, or failed: **CRITICAL**.
   - **Leak review passes** — one authenticated `ose-pr-leak-review:v1` record reports `pass` for
     that head. Missing, stale, failed, or findings-bearing evidence: **CRITICAL**. A head-changing
     fix requires one new pass, never a clean streak.
   - **Semantic review is optional** — no review record is a valid default. If the user explicitly
     requested `pr-review` or `pr-review-quality-gate`, verify it ran at the PR boundary and every resulting
     conversation is resolved. An unrequested semantic-review step: **HIGH**.
   - **Applicable finite surface gates pass** — missing or failed UI/API/other reachable-behaviour
     evidence is **CRITICAL**; a genuinely unreachable surface requires an explicit exemption.
   - **Archival-in-PR present** — the archival commit (`git mv` to `plans/done/` + README updates) is
     part of the delivering PR's own commit history, not deferred to a separate post-merge commit.
     N/A for repos where the plan folder is not tracked. Missing or post-merge-deferred archival on an
     applicable repo: **HIGH**.
   - **Completion does not require merge** — do NOT file a finding solely because the PR is still
     open/unmerged; a green, archival-committed PR awaiting its merge is the correct
     terminal state for this mode.
3. **For `worktree-to-origin-main` / `main-to-origin-main`**: confirm no PR evidence is expected and
   that the final push landed directly on
   `origin main` with CI green — this reuses Step 5d/5e's existing plain-`main` checks unchanged.
