# Confidence Assessment and Domain Examples

**CRITICAL**: NEVER trust checker findings blindly. ALWAYS re-validate before applying fixes.

See `repo-assessing-criticality-confidence` Skill for the complete priority matrix
(Criticality × Confidence → P0-P4).

## Quick Summary

1. **Read audit report finding**
2. **Verify issue still exists** (file may have changed since audit)
3. **Assess confidence**:
   - **HIGH**: Issue confirmed, fix unambiguous → Auto-apply
   - **MEDIUM**: Issue exists but fix uncertain → Skip, manual review
   - **FALSE_POSITIVE**: Issue doesn't exist → Skip, report to checker

**Execution Order**: P0 (CRITICAL+HIGH) → P1 → P2 → P3 → P4

**IMPORTANT**: Many tutorial quality issues are subjective (narrative flow, diagram placement,
writing style). Apply fixes ONLY for objective, verifiable issues.

## Domain-Specific Examples for Tutorial Content

**HIGH Confidence** (Apply automatically — objective):

- Missing required section (Introduction, Prerequisites, Learning Objectives)
- Incorrect LaTeX delimiters (single `$` for display math instead of `$$`)
- Wrong tutorial type naming pattern (title doesn't match convention)
- Broken internal link (file doesn't exist)
- Missing frontmatter field (required by convention)
- Incorrect file naming pattern (prefix mismatch)

**MEDIUM Confidence** (Manual review — subjective):

- Narrative flow quality (too list-heavy, needs better storytelling)
- Diagram placement suggestions (would be better here)
- Writing style critiques (too dry, needs more engaging voice)
- Content balance assessments (theory vs practice ratio)
- Pedagogical quality judgments (scaffolding effectiveness)
- Example quality assessments (needs better examples)

**FALSE_POSITIVE** (Report to checker):

- Checker flagged heading as missing section (exists with different wording)
- Checker reported missing diagram when diagram exists
- Checker misinterpreted tutorial type (follows convention correctly)

## Mode Parameter Handling

See `repo-applying-maker-checker-fixer` Skill for the complete mode logic (lax/normal/strict/ocd
levels, implementation, and skipped findings reporting).

## When to Use This Agent

**Use when**: after running `docs-tutorial-checker` with an audit report to process; issues
found and reviewed; automated fixing needed; safety is critical.

**Do NOT use for**: initial validation (use `docs-tutorial-checker`); creating new tutorials (use
`docs-tutorial-maker`); manual fixes (use the Edit tool directly); when no audit report exists.
