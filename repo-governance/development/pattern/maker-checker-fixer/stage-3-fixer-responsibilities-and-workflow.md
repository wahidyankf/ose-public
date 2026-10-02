---
description: "The fixer's responsibilities and priority-based execution."
when_to_use: "Use when determining fix priority."
---

# Stage 3: Fixer — Responsibilities and Workflow

**Key Responsibilities**:

- PASS: Read audit reports from checker agents
- PASS: Re-validate each finding before applying fix
- PASS: Apply HIGH confidence fixes automatically (priority-based)
- PASS: Skip MEDIUM confidence (needs manual review)
- PASS: Report FALSE_POSITIVE findings for checker improvement
- PASS: Generate comprehensive fix reports

**Priority-Based Execution** (see [Fixer Confidence Levels Convention - Integration](../../quality/fixer-confidence-levels/integration-with-criticality-levels-orthogonal-dimensions-and-decision-matrix.md)):

Fixers combine **criticality** (importance) with **confidence** (certainty) to determine priority:

| Priority         | Criticality × Confidence         | Action                               |
| ---------------- | -------------------------------- | ------------------------------------ |
| **P0** (Blocker) | CRITICAL + HIGH                  | Auto-fix immediately, block if fails |
| **P1** (Urgent)  | HIGH + HIGH OR CRITICAL + MEDIUM | Auto-fix or urgent review            |
| **P2** (Normal)  | MEDIUM + HIGH OR HIGH + MEDIUM   | Auto-fix (if approved) or review     |
| **P3-P4** (Low)  | LOW combinations                 | Suggestions only                     |

**Execution Order**: P0 → P1 → P2 → P3-P4 ensures critical issues fixed before deployment proceeds.

**When to Use**: After checker identifies issues and user approves fixing them

**Example Workflow**:

```markdown
User: "Apply fixes from the latest ayokoding-web audit report"

Fixer Agent (content-fixer):

1. Auto-detects latest: local-tmp/ayokoding-web/ayokoding-web**2025-12-14--20-45**audit.md
2. Parses findings (25 issues found)
3. Re-validates each finding:
   - 18 findings → HIGH confidence (apply fixes)
   - 4 findings → MEDIUM confidence (skip, flag for manual review)
   - 3 findings → FALSE_POSITIVE (skip, report to improve checker)
4. Applies 18 fixes (missing fields, wrong values, format errors)
5. Generates fix report: local-tmp/ayokoding-web/ayokoding-web**2025-12-14--20-45**fix.md
6. Reports summary: 18 fixed, 4 manual review needed, 3 false positives detected
```
