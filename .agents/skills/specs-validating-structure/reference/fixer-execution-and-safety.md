# Fixer Mechanics: Execution Pattern, Report Format, and Safety Rules

## Execution Pattern

1. Read audit report — parse "Folders validated" and findings by criticality/confidence.
2. Verify scope — every fix targets only files within the validated folders.
3. Filter by mode — see `repo-applying-maker-checker-fixer` Skill for the full
   lax/normal/strict/ocd logic.
4. Sort by priority: P0 (CRITICAL/HIGH confidence) → P1 (CRITICAL/MEDIUM) → P2 (HIGH/HIGH) → etc.
5. Re-validate each finding — confirm the issue still exists before fixing.
6. Apply — Edit for Markdown, `rtk git mv` via Bash for renames, and use non-delegated
   `specs structure validate`/`specs counts validate` or `md internal-link validate` evidence for structural
   and broken-link fixes.
7. Post-fix verify — read the modified file to confirm the fix is correct.
8. Generate the fix report.
9. Scope-intersect changed files with delegated predicates and return
   `updated-lifecycle-evidence`; invalidate only intersecting entries.

## Fix Report Format

```markdown
# Specs Fix Report

**Source Audit**: {audit-report-path}
**Folders scoped**: {list from audit report}
**Timestamp**: YYYY-MM-DD--HH-MM UTC+7
**Mode**: {mode}

## Summary

| Action                      | Count |
| --------------------------- | ----- |
| Fixed                       | N     |
| Skipped (below threshold)   | N     |
| Skipped (MEDIUM confidence) | N     |
| Skipped (FALSE_POSITIVE)    | N     |
| Failed                      | N     |
| Requires Review             | N     |

## Changes Applied

### Fix 1: {Brief description}

**Finding**: [CRITICAL] {original finding}
**Action**: Updated scenario count in README from 76 to 78
**File**: `specs/apps/organiclever/be/behaviours/README.md`
**Verified**: Yes — count now matches actual feature files
```

## Safety Rules

Always re-validate before applying any fix. Never modify files outside the validated folder list
from the audit report. Never delete feature files — only rename or modify content. Never modify
`.feature` scenario content — only structural fixes (file names, READMEs). Preserve git history —
use `git mv` for renames. Skip uncertain fixes — MEDIUM confidence logs and skips unless mode is
strict/ocd. FALSE_POSITIVE carry-forward maintained in
`local-tmp/.known-false-positives.md`. Adoption gaps and tree-shape migrations are never
auto-fixed regardless of mode.

## Capture Changed Files for Scoped Re-validation

After applying all fixes: `git diff --name-only HEAD`. Include in the fix report under
`## Changed Files (for Scoped Re-validation)` so the next checker run can scope to exactly what
changed.
