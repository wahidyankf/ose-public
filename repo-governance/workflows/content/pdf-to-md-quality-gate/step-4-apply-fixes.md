---
description: "Step 4: invokes pdf-to-md-fixer to apply validated fixes by mode, including the confidence-downgrade rules that force MEDIUM_CONFIDENCE (manual review) instead of auto-apply."
when_to_use: "Use when implementing or debugging the fix-application step, or when determining whether a fix should be auto-applied or downgraded for manual review."
---

# 4. Apply Fixes (Sequential, Conditional)

Apply validated fixes from the checker audit report.

**Agent**: `pdf-to-md-fixer`

- **Args**: `report: {step2.outputs.pdf-to-md-report-N}, pdf-file: {input.pdf-file},
md-file: {input.md-file}, mode: {input.mode},
delegated-gate-ids: {step0.outputs.delegated-gate-ids},
lifecycle-evidence: {step0.outputs.lifecycle-evidence}`
- **Output**: `{pdf-to-md-fix-report-N}`, `{updated-lifecycle-evidence}` after intersecting changed
  files with delegated scopes
- **Condition**: Threshold-level findings > 0 from step 3

**Fix scope by mode**:

- **lax**: Fix CRITICAL only (skip HIGH/MEDIUM/LOW)
- **normal**: Fix CRITICAL + HIGH (skip MEDIUM/LOW)
- **strict**: Fix CRITICAL + HIGH + MEDIUM (skip LOW)
- **ocd**: Fix all levels

**Success criteria**: Fixer completes; fix report generated.

**On failure**: Log errors; proceed to step 5 (Re-validate).

**Notes**:

- Fixer re-validates each finding before applying (prevents false positives)
- HIGH_CONFIDENCE fixes applied automatically
- MEDIUM_CONFIDENCE fixes skipped (flagged for manual review)
- FALSE_POSITIVE findings persisted to `local-tmp/.known-false-positives.md`
- Fix report includes changed sections list for scoped re-validation
- A skipped fixer carries Step 0 lifecycle evidence forward unchanged

**Confidence Downgrade Rules**:

The fixer MUST downgrade an originally-`HIGH_CONFIDENCE` finding to `MEDIUM_CONFIDENCE`
(and therefore skip auto-application) when any of these conditions hold at fix time:

- **Wide-scope structural restructure** — the fix would mechanically alter more than 10 occurrences
  of the same structural pattern (e.g. changing list nesting depth across many controls,
  re-numbering hundreds of sub-items). Wide-scope mechanical changes carry cascading-side-effect
  risk that warrants per-occurrence human review.
- **Out-of-locus edits** — the fix would touch document regions outside the audit finding's
  `location_md` field. The audit located one problem; the fix should not silently expand its blast
  radius.
- **Conflicting concurrent finding** — a different audit finding's expected fix would touch the
  same span, and the two fixes might collide.

Downgraded findings appear in the fix report under **Skipped (MEDIUM_CONFIDENCE)** with the
downgrade reason cited. See [pdf-to-md-fixer agent definition](../../../../.agents/agents/pdf-to-md-fixer.md)
for the binding rule.
