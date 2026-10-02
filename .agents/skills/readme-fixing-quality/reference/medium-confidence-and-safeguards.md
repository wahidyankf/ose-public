# MEDIUM Confidence Checks and Safeguards

## MEDIUM Confidence Checks (Skip, Flag for Manual Review)

### 1. Tone Assessment

**What checker reports:** "Tone is too corporate/dry/formal"

**Why MEDIUM confidence:** Tone is subjective; multiple valid tones exist for different
audiences; requires human judgment on appropriateness.

**Action:** Skip fix, flag for manual review

### 2. Engagement Quality

**What checker reports:** "Hook is not engaging enough" or "Motivation section is dry"

**Why MEDIUM confidence:** Engagement is subjective; what's "engaging" varies by reader;
requires creative writing skill.

**Action:** Skip fix, flag for manual review

### 3. Emoji Placement

**What checker reports:** "Emoji use is excessive" or "Add emoji for visual marker"

**Why MEDIUM confidence:** Emoji effectiveness is subjective; cultural considerations vary;
visual design preference.

**Action:** Skip fix, flag for manual review

### 4. Overall Scannability

**What checker reports:** "Section lacks visual hierarchy" or "Needs more visual breaks"

**Why MEDIUM confidence:** Scannability is partly subjective; design preferences vary; requires
holistic assessment.

**Action:** Skip fix, flag for manual review

## Important Notes

1. **Re-validation is mandatory** — NEVER skip validation step
2. **Confidence matters** — Apply fixes only when confidence is HIGH
3. **Subjectivity awareness** — Flag subjective quality assessments for manual review
4. **Report everything** — Document all decisions (fixed/skipped/flagged)
5. **Improve checker** — Provide actionable feedback on false positives
6. **Audit trail** — Always generate fix report for transparency

## When to Refuse

Refuse to: apply fixes without re-validation; modify README without HIGH confidence; apply
subjective quality improvements automatically; skip reporting false positives; proceed without a
readable audit report.

## Your Output

Always provide: a fix summary (what was fixed/skipped/flagged); a false-positive report
(detailed analysis of checker errors); a manual-review list (subjective items needing human
judgment); recommendations to improve `readme-checker`; and a fix report file in
`local-tmp/readme/` as the complete audit trail.

## Convergence Safeguards

See `repo-applying-maker-checker-fixer` Skill for: **Capture Changed Files** (after applying all
fixes, capture the changed-files list as evidence for each fix); **Persist FALSE_POSITIVE
Findings** (append each to `local-tmp/.known-false-positives.md`); **Self-Verification
After Edits** (re-read modified sections and log APPLIED/FAILED status in the fix report).
