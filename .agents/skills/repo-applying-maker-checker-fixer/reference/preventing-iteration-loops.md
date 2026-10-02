# Maker-Checker-Fixer — Preventing Iteration Loops

Without explicit mechanisms to track accepted decisions, checker-fixer workflows can enter infinite or very long iteration loops. Four structural safeguards prevent this:

## 1. FALSE_POSITIVE Persistence (`.known-false-positives.md`)

**Problem**: Checker re-flags the same accepted FALSE_POSITIVE findings every iteration — no memory of previous decisions.

**Solution**: Fixer writes all accepted FALSE_POSITIVE findings to `local-tmp/.known-false-positives.md`. Checker reads this file at the start of every run and skips matching entries.

**Checker behaviour**: Match findings using stable key `[category] | [file] | [brief-description]`. If matched, log as `[PREVIOUSLY ACCEPTED FALSE_POSITIVE — skipped]`, do NOT count in findings total.

**Fixer behaviour**: After every fix run, append each FALSE_POSITIVE to `.known-false-positives.md`:

```bash
cat >> local-tmp/.known-false-positives.md << 'EOF'
## FALSE_POSITIVE: [category] | [file] | [brief-description]

**Accepted**: [YYYY-MM-DD--HH-MM]
**Category**: [finding category]
**File**: [path/to/file.md]
**Finding**: [Brief description]
**Reason**: [Why accepted as false positive]

---
EOF
```

## 2. Scoped Re-validation (Changed Files Only)

**Problem**: Full-repo scan on every iteration re-validates all ~265 software documentation files even when fixer only changed 3-4 agent files.

**Solution**: Fixer captures changed files after applying fixes:

```bash
git diff --name-only HEAD
```

Includes list in fix report under `## Changed Files (for Scoped Re-validation)`. Checker in re-validation mode (multi-part UUID chain like `abc123_def456`) runs Step 8 only on changed files.

## 3. Self-Verification After Bash Edits

**Problem**: `sed -i` exits 0 even when pattern doesn't match. Fixer logs "fixed" for non-applied changes. Next checker re-flags. Infinite loop.

**Solution**: Verify after every bash edit:

```bash
sed -i 's/old-pattern/new-pattern/' file.md
grep -q "new-pattern" file.md || echo "WARNING: sed pattern did not match — fix NOT applied"
```

Log as **FAILED (not applied)** if verification fails. For multi-line reformatting, use Python (not sed) — `sed` silently fails on multi-line patterns.

## 4. Escalation After 2+ Iteration Disagreements

If checker and fixer disagree on the same finding for 2+ iterations, escalate to maker:

1. Fixer marks finding as `ESCALATED` (not FALSE_POSITIVE, not applied)
2. Notify user: "This finding has been re-flagged after a FALSE_POSITIVE acceptance. Manual review required."
3. Maker resolves the root ambiguity in the relevant convention or agent

**Cycle ceiling**: A quality gate runs at most three cycles, per the [Quality Gate Contract](../../../../repo-governance/development/workflow/quality-gate-contract.md); a gate still finding blocking rows after its last cycle returns `FAIL`, never another cycle.

**Implementation status**: All checker agents implement safeguards 1-2 (skip list + scoped re-validation). Agents with WebSearch/WebFetch also implement cached factual verification. All fixer agents implement changed files capture, FALSE_POSITIVE persistence, and self-verification. Every quality gate takes its `max-cycles` bound, its termination rules, and its advisory verdict from the [Quality Gate Contract](../../../../repo-governance/development/workflow/quality-gate-contract.md); these safeguards never add a cycle or another input.
