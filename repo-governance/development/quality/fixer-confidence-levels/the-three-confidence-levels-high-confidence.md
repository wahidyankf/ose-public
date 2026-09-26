---
description: "HIGH_CONFIDENCE: apply the fix automatically."
when_to_use: "Use when deciding whether a finding is HIGH_CONFIDENCE."
---

# HIGH_CONFIDENCE → Apply Fix Automatically

**Criteria:**

- Re-validation clearly confirms the issue exists
- Issue is OBJECTIVE and verifiable (not subjective judgment)
- No ambiguity in detection
- Fix is straightforward and safe
- Low risk of unintended consequences
- Context is clear and fix applies universally

**Decision:** Apply fix automatically without user confirmation.

**Examples Across Domains:**

**repo-workflow-fixer:**

- Missing `when_to_use` field verified by re-reading frontmatter
- Broken internal link verified by checking file doesn't exist at target path
- Wrong field value verified by comparing actual vs expected value
- File naming convention violation verified by checking filename against the kebab-case pattern

**apps-ayokoding-www-general-fixer:**

- Missing `draft: false` field verified by re-reading frontmatter
- Wrong date format verified by regex pattern match (missing UTC+7 timezone)
- Weight field error verified for \_index.md (should be 1, found 10)
- Relative link in navigation content verified (should use absolute with language prefix)

**docs-tutorial-fixer:**

- Missing required section verified by section heading search (Introduction, Prerequisites)
- Incorrect LaTeX delimiter verified by pattern match (single `$` on own line for display math)
- Wrong tutorial type naming verified against convention patterns

**apps-ose-www-content-fixer:**

- Missing required frontmatter field verified (title, date, draft)
- Wrong date format verified by regex (missing timezone)
- Missing cover.alt verified when cover.image exists
- Multiple H1 headings verified by counting (should be only 1)

**readme-fixer:**

- Paragraph exceeding 5 lines verified by objective line count
- Acronym without context verified by context search (missing expansion/explanation)
- Broken internal link verified by file existence check
- Format errors verified by structural analysis (heading hierarchy violations)

**docs-fixer:**

- Broken command syntax verified by WebFetch of official documentation
- Incorrect version number verified by checking package registry (npm, PyPI)
- Wrong API method verified by WebFetch of current API docs
- LaTeX delimiter error verified by pattern match (single `$` on own line for display math)
- Diagram color accessibility violation verified against accessible palette

**docs-fixer:**

- Missing required section verified by heading search (Introduction, Requirements, Technical Documentation)
- Broken internal link to codebase file verified by file existence check
- Format violation verified (frontmatter YAML, acceptance criteria format)
- Naming convention violation verified (a `done/` folder name doesn't match `YYYY-MM-DD__identifier`, or a `backlog/`/`in-progress/` folder carries a date prefix)
- File structure mismatch verified (single-file vs multi-file convention)

**Common Pattern:** HIGH confidence issues are **objective, measurable, and verifiable** - they either exist or they don't.
