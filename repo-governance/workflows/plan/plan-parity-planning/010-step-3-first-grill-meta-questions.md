---
description: The four mandatory meta-questions every First Grill session must surface — bare-repo delivery mode, rationale-doc location, repo-specific constraints, and research-needed.
when_to_use: Use when closing out the First Grill, to confirm every mandatory meta-question was asked and recorded.
---

# Step 3 — First Grill (Mandatory Meta-Questions)

**Continues from** [Step 3 — First Grill](./009-step-3-first-grill.md).

**Mandatory meta-questions** (surface these explicitly regardless of mode):

1. If any bare repo with no primary checkout — verify with `git worktree list`, never assume from a
   fixed repo list — is in the parity set: "The bare-repo sync convention allows EITHER a draft PR OR a direct push to
   `<repo>:main`, both delivered through a worktree since the target has no primary checkout to work
   in directly — that per-destination choice is not settled by this workflow's own `worktree-to-pr`
   default, so it must be chosen explicitly. The selected parity mode implies {draft PR | direct push
   to main}. Please confirm the delivery mode for `<repo>`."
   Options: (A) Direct push to `main` via a worktree (`worktree-to-origin-main`). (B) Draft PR
   (`worktree-to-pr`). `main-to-origin-main` is never offered here — it requires a primary checkout
   the bare target does not have. Record the chosen mode.
2. Rationale doc location per repo (where does `<objective-slug>-parity-decisions.md` live in
   each repo?).
3. Any repo-specific constraint flagged in Step 2 that forces a deviation.
4. Research-needed flag: are there external claims (harness/vendor conventions, library/tool
   behaviour, prior art) that require verification before authoring the plans?

**Output**: A fully resolved deviation matrix. Every row has a recorded decision and — for
deviations — a recorded justification. Research-needed flag recorded. This matrix is the source
of truth for all authoring in Step 6.

**On invoker abandonment**: Terminate workflow with status `fail`. Partial grilling produces no
value; do not author plans with unresolved matrix rows.
