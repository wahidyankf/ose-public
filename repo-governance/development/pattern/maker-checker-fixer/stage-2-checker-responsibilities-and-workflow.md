---
description: "The checker's responsibilities and criticality categorization."
when_to_use: "Use when implementing checker responsibilities."
---

# Stage 2: Checker — Responsibilities and Workflow

**Key Responsibilities**:

- PASS: Validate content against conventions
- PASS: Generate audit reports with specific line numbers
- PASS: Categorize issues by criticality (CRITICAL/HIGH/MEDIUM/LOW)
- PASS: Provide actionable recommendations
- PASS: Do NOT modify files being checked

**Criticality Categorization** (see [Criticality Levels Convention](../../quality/criticality-levels.md)):

Checkers categorize findings by **importance/urgency**:

- **CRITICAL** - Breaks functionality, blocks users (must fix before publication)
- **HIGH** - Significant quality degradation, convention violations (should fix)
- **MEDIUM** - Minor quality issues, style inconsistencies (fix when convenient)
- **LOW** - Suggestions, optional improvements (consider for future)

**Report Format**: Findings grouped by criticality in standardized sections with emoji indicators for accessibility.

**When to Use**: Need to **validate content quality** before publication or after maker changes

**Example Workflow**:

```markdown
User: "Check the new TypeScript tutorial for quality issues"

Checker Agent (content-checker):

1. Reads content/en/learn/swe/programming-languages/typescript/generics.md
2. Validates frontmatter (date format, required fields, weight ordering)
3. Checks content structure (heading hierarchy, link format)
4. Validates Next.js content conventions (link format, frontmatter)
5. Checks content quality (alt text, accessible colors, etc.)
6. Generates audit report: local-tmp/ayokoding-web/ayokoding-web**2025-12-14--20-45**audit.md
7. Reports findings in conversation (summary only)
8. Does NOT modify the tutorial file
```
