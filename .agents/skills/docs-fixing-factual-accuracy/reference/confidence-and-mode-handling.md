# Confidence Assessment, Priority Execution, and Mode Handling

**CRITICAL**: NEVER trust checker findings blindly. ALWAYS re-validate before applying fixes.

See `repo-assessing-criticality-confidence` Skill for the complete priority matrix
(Criticality × Confidence → P0-P4) and execution order guidance.

## Quick Summary

1. **Read audit report finding**
2. **Verify issue still exists** (file may have changed since audit)
3. **Assess confidence**:
   - **HIGH**: Issue confirmed, fix unambiguous → Auto-apply
   - **MEDIUM**: Issue exists but fix uncertain → Skip, manual review
   - **FALSE_POSITIVE**: Issue doesn't exist → Skip, report to checker

**Execution Order**: P0 (CRITICAL+HIGH) → P1 → P2 → P3 → P4

## Maker-Checker-Fixer Pattern

**See `repo-applying-maker-checker-fixer` Skill**:

- Maker creates/updates content
- Checker validates and generates audit
- User reviews audit findings
- Fixer applies validated fixes with confidence levels

## Criticality and Confidence

**Criticality Levels**: See `repo-assessing-criticality-confidence` Skill for the complete
four-level system (CRITICAL/HIGH/MEDIUM/LOW) indicating importance/urgency of findings.

**Confidence Levels**: See
[Fixer Confidence Levels Convention](../../../../repo-governance/development/quality/fixer-confidence-levels.md)
for the universal three-level system:

- **HIGH_CONFIDENCE** → Apply fix automatically (objective, verifiable issues)
- **MEDIUM_CONFIDENCE** → Skip, flag for manual review (subjective, ambiguous, risky)
- **FALSE_POSITIVE** → Skip, report to improve checker (re-validation disproves issue)

**Priority Execution**: See
[Fixer Confidence Levels - Integration](../../../../repo-governance/development/quality/fixer-confidence-levels/integration-with-criticality-levels-orthogonal-dimensions-and-decision-matrix.md)
for how criticality + confidence determine fix order (P0-P4).

## Domain-Specific Confidence Examples

**HIGH Confidence** (Apply automatically):

- Broken command syntax verified by checker's cited sources in audit report
- Incorrect version number verified by checker's registry findings
- Wrong API method verified by checker's documentation review
- Broken internal link verified by checking file doesn't exist at target path
- Mathematical LaTeX error verified by pattern match (single `$` on own line)
- Diagram color accessibility violation verified against accessible palette

**MEDIUM Confidence** (Manual review):

- Contradiction that may be context-dependent (HTTP for local, HTTPS for production)
- Outdated information where "outdated" is subjective or requires judgment
- Content duplication where duplication may be intentional for clarity
- Narrative flow issues or writing style critiques (subjective quality)
- Terminology inconsistency where both terms are technically correct

**FALSE_POSITIVE** (Report to checker):

- Checker flagged correct LaTeX as incorrect (misunderstood syntax)
- Checker reported missing field that actually exists in frontmatter
- Checker flagged valid command as broken (used wrong verification source)
- Checker misinterpreted accessible diagram colors as inaccessible
- Checker reported contradiction but statements apply to different contexts

## Mode Parameter Handling

See `repo-applying-maker-checker-fixer` Skill for the complete mode logic (lax/normal/strict/all
levels, implementation, and skipped findings reporting).

## When to Use This Agent

**Use when**: after running `docs-checker` with an audit report to process; issues found and
reviewed; automated fixing needed; safety is critical.

**Do NOT use for**: initial validation (use `docs-checker`); content creation (use `docs-maker`);
manual fixes (use the Edit tool directly); when no audit report exists.
