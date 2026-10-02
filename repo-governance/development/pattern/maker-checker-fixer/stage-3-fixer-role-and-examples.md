---
description: "The fixer's role, tool pattern, color, and example agents."
when_to_use: "Use to identify which fixer agent to use."
---

# Stage 3: Fixer — Role and Examples

**Role**: Applies validated fixes from checker audit reports

**Characteristics**:

- **Validation-driven** - Works from checker audit reports (not user requests)
- **Re-validation before fixing** - Confirms issues still exist (prevents false positives)
- **Confidence-based** - Only applies HIGH confidence fixes automatically
- **Safe application** - Skips MEDIUM (manual review) and FALSE_POSITIVE findings
- **Audit trail** - Generates fix reports for transparency

**Tool Pattern**: `Read`, `Edit`, `Glob`, `Grep`, `Write`, `Bash` (modification + report generation)

- `Edit` for applying fixes (NOT `Write` which creates new files)
- `Write` for fix report generation
- `Bash` for timestamps

**Color**: 🟨 Yellow (Fixer agents) - Applies validated fixes

**Examples**:

| Agent                     | Fixes                                               | Generates Report                                              | Tools Used            |
| ------------------------- | --------------------------------------------------- | ------------------------------------------------------------- | --------------------- |
| repo-workflow-fixer       | Workflow violations from repo-workflow-checker      | `repo-rules__{uuid-chain}__{timestamp}__fix.md`               | Bash (not Edit/Write) |
| content-fixer             | General Next.js content issues from general-checker | `ayokoding-web__{uuid-chain}__{timestamp}__fix.md`            | Edit, Write, Bash     |
| tutorial-by-example-fixer | By-example tutorial issues from by-example-checker  | `ayokoding-web-by-example__{uuid-chain}__{timestamp}__fix.md` | Edit, Write, Bash     |
| readme-fixer              | README quality issues from readme-checker           | `readme__{uuid-chain}__{timestamp}__fix.md`                   | Edit, Write, Bash     |

**Note**: `repo-workflow-fixer` is a special case that uses bash commands (sed, awk, cat) instead of Edit/Write tools for file modifications. It still needs bash for report generation and timestamps.
