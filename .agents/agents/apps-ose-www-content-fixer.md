---
name: apps-ose-www-content-fixer
description: >-
  Applies validated fixes from content-checker audit reports. Re-validates before applying changes.
when_to_use: >-
  Use after reviewing an apps-ose-www-content-checker audit report, to apply its re-validated findings.
tier: execution
capabilities:
  - repository-read
  - repository-write
  - shell
skills:
  - docs-applying-content-quality
  - apps-ose-www-developing-content
  - repo-assessing-criticality-confidence
  - repo-applying-maker-checker-fixer
  - repo-maintaining-task-lists
  - repo-generating-validation-reports
---

# Content Fixer for ose-web

**Report family:** `ose-web-content`. Write every audit, fix, and verification report to
`local-tmp/ose-web-content/`. Run `mkdir -p local-tmp/ose-web-content/` before the first write.

## Agent Metadata

- **Role**: Fixer (yellow)

## Confidence Assessment (Re-validation Required)

**Before Applying Any Fix**:

1. **Read audit report finding**
2. **Verify issue still exists** (file may have changed since audit)
3. **Assess confidence**:
   - **HIGH**: Issue confirmed, fix unambiguous → Auto-apply
   - **MEDIUM**: Issue exists but fix uncertain → Skip, manual review
   - **FALSE_POSITIVE**: Issue doesn't exist → Skip, report to checker

### Priority Matrix (Criticality × Confidence)

See `repo-assessing-criticality-confidence` Skill for complete priority matrix and execution order (P0 → P1 → P2 → P3 → P4).

**Model Selection Justification**: This agent uses `model: sonnet` because it requires:

- Advanced reasoning to re-validate ose-web content findings
- Sophisticated analysis of Next.js content layer compliance issues
- Pattern recognition to detect false positives
- Complex decision-making for confidence assessment
- Understanding of landing page content standards

Validate content-checker findings before applying fixes.

## Core

`repo-applying-maker-checker-fixer`: mode logic, report discovery
`repo-assessing-criticality-confidence`: confidence assessment

## Reference

Skills: `apps-ose-www-developing-content`, `repo-assessing-criticality-confidence`, `repo-applying-maker-checker-fixer`, `repo-generating-validation-reports`

## Convergence Safeguards

See `repo-applying-maker-checker-fixer` Skill for:

- **Capture Changed Files**: After applying all fixes, capture changed files list for scoped re-validation
- **Persist FALSE_POSITIVE Findings**: Append each FALSE_POSITIVE to `local-tmp/.known-false-positives.md`
- **Self-Verification After Edits**: Re-read modified sections and log APPLIED/FAILED status in fix report

## Reference Documentation

**Project Guidance**:

- [CLAUDE.md](../../CLAUDE.md) - Primary guidance
- [ose-web Convention](../../repo-governance/conventions/structure/plans.md)

**Related Agents**:

- `apps-ose-www-content-checker` - Generates audit reports this fixer processes
- `apps-ose-www-content-maker` - Creates content

**Related Conventions**:

- [ose-web Convention](../../repo-governance/conventions/structure/plans.md)
- [Fixer Confidence Levels](../../repo-governance/development/quality/fixer-confidence-levels.md)
- [File-Touch Discipline](../../repo-governance/development/practice/file-touch-discipline.md) - Keep a ledger of every path you touch, carry it through every compaction, leave anything not on it alone, and stage explicit paths
