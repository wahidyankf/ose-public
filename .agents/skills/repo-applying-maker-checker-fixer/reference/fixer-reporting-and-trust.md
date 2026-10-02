# Maker-Checker-Fixer — Fix Report Structure and Trust Model

## Fix Report Structure

```markdown
# Fix Report: {Agent Name}

**Status**: In Progress / Complete
**Source Audit**: {path to audit report}
**Timestamp**: {YYYY-MM-DD--HH-MM UTC+7}
**UUID Chain**: {uuid-chain}
**Mode**: {lax/normal/strict/all}

---

## Fixes Applied

### Fix 1: {Title}

**Status**: ✅ APPLIED / ⏭️ SKIPPED
**Criticality**: {CRITICAL/HIGH/MEDIUM/LOW}
**Confidence**: {HIGH/MEDIUM/FALSE_POSITIVE}
**File**: {path}

**Issue**: {description}

**Changes Applied**: {before → after}

**Tool Used**: {Edit/Bash sed/etc}

---

## Skipped Findings

### {Reason for skipping}

**Count**: X findings

1. {File} - {Issue} - {Reason}

---

## Summary

**Fixes Applied**: X
**Fixes Skipped**: Y (Z MEDIUM_CONFIDENCE, W FALSE_POSITIVE)
**Skipped by Mode**: M (below mode threshold)

**Status**: Complete
**Completed**: {timestamp}
```

**Progressive Writing**: Write findings as they're processed, not buffered to end.

## Fixer Workflow Step 6: Trust Model — Checker Verifies, Fixer Applies

**Key Principle**: Fixer trusts checker's verification work (separation of concerns).

**Why Fixers Don't Have Web Tools**:

1. **Separation of Concerns**: Checker does expensive web verification once
2. **Performance**: Avoid duplicate web requests
3. **Clear Responsibility**: Checker = research/verification, Fixer = application
4. **Audit Trail**: Checker documents all sources in audit report
5. **Trust Model**: Fixer trusts checker's documented verification

**How Fixer Re-validates Without Web Access**:

- Read audit report and extract checker's documented sources
- Analyze checker's cited URLs, registry data, API docs
- Apply pattern matching for known error types
- Perform file-based checks (syntax, format, consistency)
- Conservative approach: When in doubt → MEDIUM confidence

**When Fixer Doubts a Finding**:

- Classify as MEDIUM or FALSE_POSITIVE (don't apply)
- Document reasoning in fix report
- Provide actionable feedback for checker improvement
- Flag for manual review

**Example Workflow**:

```markdown
User: "Apply fixes from latest ayokoding-web audit"

Fixer:

1. Auto-detects latest: local-tmp/ayokoding-web/ayokoding-web**2025-12-14--20-45**audit.md
2. Parses findings (25 issues)
3. Re-validates each finding:
   - 18 findings → HIGH confidence (apply)
   - 4 findings → MEDIUM confidence (skip, manual review)
   - 3 findings → FALSE_POSITIVE (skip, report for checker improvement)
4. Applies 18 fixes
5. Generates fix report: local-tmp/ayokoding-web/ayokoding-web**2025-12-14--20-45**fix.md
6. Summary: 18 fixed, 4 manual review, 3 false positives
```
