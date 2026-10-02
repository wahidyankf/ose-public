# Convergence Safeguards

Checker agents re-run against the same content across maker-checker-fixer iterations. Without these
safeguards, non-deterministic checks (especially web-backed ones) can flip-flop findings and the
cycle never converges. Every checker agent applies all five safeguards below.

## Known False Positive Skip List

**Before beginning validation, load the skip list**:

- **File**: `local-tmp/.known-false-positives.md`
- If the file exists, read its contents and reference it during ALL validation steps
- Before reporting any finding, check whether it matches an entry using the stable key:
  `[category] | [file] | [brief-description]`
- **If matched**: log as `[PREVIOUSLY ACCEPTED FALSE_POSITIVE — skipped]` in the informational
  section. Do NOT count it in the findings total.

## Re-validation Mode (Scoped Scan)

When a UUID chain exists from a previous iteration (multi-part chain like `abc123_def456`):

1. Check for a `## Changed Files (for Scoped Re-validation)` section in the latest fix report
2. **If found**: run validation only on the CHANGED files listed. Skip unchanged files entirely.
3. **If not found**: run a full scan as normal

## Cached Verification (Iterations 2+)

On re-validation iterations (multi-part UUID chain):

1. Read the iteration 1 audit report's verification results
2. For findings marked resolved/verified-correct in iteration 1: carry forward as
   `[cached from iteration 1]`. Do NOT re-run the check (especially web-backed lookups).
3. For findings that were flagged and then fixed: re-verify ONLY those specific findings
4. For NEW content introduced by fixer edits: verify normally

This prevents non-deterministic results (e.g. WebSearch, timing-sensitive checks) from generating
new findings on unchanged content.

## Escalation After Repeated Disagreements

If a finding was flagged in iteration N, marked FALSE_POSITIVE by the fixer, and re-flagged in
iteration N+2:

- Mark it as `[ESCALATED — manual review required]` instead of a countable finding
- Do NOT count it in the findings total

## Convergence Target

A quality gate runs at most three cycles, per the
[Quality Gate Contract](../../../../repo-governance/development/workflow/quality-gate-contract.md); blocking rows left
after the last cycle make its verdict `FAIL`, never another cycle.
