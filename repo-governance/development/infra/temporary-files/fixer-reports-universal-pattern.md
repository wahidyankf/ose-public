---
description: The shared fixer-report naming, audit-fix pairing, and content structure fixers follow.
when_to_use: Use when a fixer agent generates its fix report.
---

# Report File Naming Standard — Fixer Reports (Universal Pattern)

Continues [Report File Naming Standard — Repository Audit and Link Validation Reports](./report-file-naming-early-report-types.md).

**Agents**: All fixer agents (repo-workflow-fixer, content-fixer, tutorial-by-example-fixer, content-fixer, tutorial-in-the-field-fixer, apps-ayokoding-www-link-fixer, docs-tutorial-fixer, docs-software-engineering-separation-fixer, content-fixer, readme-fixer, docs-fixer, specs-fixer, harness-fixer)

**Pattern**: `{agent-family}__{uuid-chain}__{YYYY-MM-DD--HH-MM}__fix.md`

**Universal Structure**: All fixer agents follow the same report structure:

**Naming Convention**:

- Replaces `__audit` suffix with `__fix` suffix
- **CRITICAL**: Uses SAME uuid-chain AND timestamp as source audit report
- This creates clear audit-fix report pairing for traceability

**Report Pairing Examples**:

| Agent Family    | Audit Report                                                | Fix Report                                                |
| --------------- | ----------------------------------------------------------- | --------------------------------------------------------- |
| repo-rules      | `repo-rules__a1b2c3__2025-12-14--20-45__audit.md`           | `repo-rules__a1b2c3__2025-12-14--20-45__fix.md`           |
| ayokoding-web   | `ayokoding-web__d4e5f6__2025-12-14--15-30__audit.md`        | `ayokoding-web__d4e5f6__2025-12-14--15-30__fix.md`        |
| ose-web-content | `ose-web-content__g7h8i9__2025-12-14--16-00__audit.md`      | `ose-web-content__g7h8i9__2025-12-14--16-00__fix.md`      |
| docs-tutorial   | `docs-tutorial__a1b2c3_d4e5f6__2025-12-14--10-15__audit.md` | `docs-tutorial__a1b2c3_d4e5f6__2025-12-14--10-15__fix.md` |
| readme          | `readme__b2c3d4__2025-12-14--09-45__audit.md`               | `readme__b2c3d4__2025-12-14--09-45__fix.md`               |
| docs            | `docs__c3d4e5__2025-12-15--10-00__validation.md`            | `docs__c3d4e5__2025-12-15--10-00__fix.md`                 |
| plan            | `plan__d4e5f6__2025-12-15--11-30__validation.md`            | `plan__d4e5f6__2025-12-15--11-30__fix.md`                 |

**Why Same UUID and Timestamp?**

- UUID chain enables exact matching of audit to fix report
- Timestamp enables chronological tracking
- Audit trail shows what was detected vs what was fixed
- Supports debugging (compare checker findings vs fixer actions)

**Universal Content Structure**:

All fixer reports include these sections:

1. **Validation Summary**:
   - Total findings processed from audit report
   - Fixes applied (HIGH confidence count)
   - False positives detected (count)
   - Needs manual review (MEDIUM confidence count)

2. **Fixes Applied**:
   - Detailed list of HIGH confidence fixes
   - What was changed in each file
   - Re-validation results confirming issue
   - Confidence level reasoning

3. **False Positives Detected**:
   - Checker findings that re-validation disproved
   - Why checker was wrong (detection logic flaw)
   - Actionable recommendations to improve checker
   - Example code showing correct validation approach

4. **Needs Manual Review**:
   - MEDIUM confidence items requiring human judgment
   - Why automated fix was skipped (subjective/ambiguous/risky)
   - Action required from user

5. **Recommendations for Checker**:
   - Improvements based on false positives
   - Concrete suggestions with example code
   - Impact assessment

6. **Files Modified**:
   - Complete list of files changed during fix application
   - Total count for summary

**Confidence Levels**: All fixers use universal three-level system (HIGH/MEDIUM/FALSE_POSITIVE). See [Fixer Confidence Levels Convention](../../quality/fixer-confidence-levels.md) for complete criteria.

**Workflow**:

1. Checker generates audit report
2. User reviews audit report
3. User invokes fixer
4. Fixer reads audit report, re-validates findings
5. Fixer applies HIGH confidence fixes automatically
6. Fixer generates fix report with same timestamp as audit

**Retention**: Keep alongside audit reports for complete audit trail. Provides transparency on automated fixes vs manual review items vs false positives.
