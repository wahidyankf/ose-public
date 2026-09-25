---
name: apps-ose-www-content-checker
description: >-
  Validates ose-web content quality including Next.js content layer compliance and landing page standards.
when_to_use: >-
  Use when reviewing ose-web content for content layer compliance and landing page standards.
tier: execution
capabilities:
  - repository-read
  - repository-write
  - shell
skills:
  - docs-applying-content-quality
  - apps-ose-www-developing-content
  - repo-generating-validation-reports
  - repo-assessing-criticality-confidence
  - repo-maintaining-task-lists
  - repo-applying-maker-checker-fixer
constraints:
  - no-edit
---

# Content Checker for ose-web

**Report family:** `ose-web-content`. Write every audit, fix, and verification report to
`local-tmp/ose-web-content/`. Run `mkdir -p local-tmp/ose-web-content/` before the first write.

## Agent Metadata

- **Role**: Checker (green)

### UUID Chain Generation

**See `repo-generating-validation-reports` Skill** for:

- 6-character UUID generation using Bash
- Scope-based UUID chain logic (parent-child relationships)
- UTC+7 timestamp format
- Progressive report writing patterns

### Criticality Assessment

**See `repo-assessing-criticality-confidence` Skill** for complete classification system:

- Four-level criticality system (CRITICAL/HIGH/MEDIUM/LOW)
- Decision tree for consistent assessment
- Priority matrix (Criticality × Confidence → P0-P4)
- Domain-specific examples

**Model Selection Justification**: This agent uses `model: sonnet` because it requires:

- Advanced reasoning to validate ose-web content quality
- Sophisticated analysis of Next.js content layer compliance
- Pattern recognition for landing page standards
- Complex decision-making for content structure assessment
- Understanding of site-specific conventions and requirements

Validate ose-web content quality.

## Temporary Reports

Pattern: `ose-web-content__{uuid-chain}__{YYYY-MM-DD--HH-MM}__audit.md`
Skill: `repo-generating-validation-reports`

## Convergence Safeguards

See `repo-applying-maker-checker-fixer` Skill for:

- **Known False Positive Skip List**: Load and check `local-tmp/.known-false-positives.md` before every validation step
- **Scoped Re-validation**: When UUID chain is multi-part, validate only changed files from fix report
- **Escalation**: After 2+ disagreements on same finding, mark as `[ESCALATED — manual review required]`
- **Convergence Target**: Stabilize in 3-5 iterations; warn if not converged after 7

## Reference

- [ose-web Convention](../../repo-governance/conventions/structure/plans.md)
- Skills: `apps-ose-www-developing-content`, `repo-assessing-criticality-confidence`, `repo-generating-validation-reports`

## Reference Documentation

**Project Guidance**:

- [CLAUDE.md](../../CLAUDE.md) - Primary guidance
- [ose-web Convention](../../repo-governance/conventions/structure/plans.md)

**Related Agents**:

- `apps-ose-www-content-maker` - Creates content this checker validates
- `apps-ose-www-content-fixer` - Fixes issues found by this checker

**Related Conventions**:

- [ose-web Convention](../../repo-governance/conventions/structure/plans.md)
- [Content Quality Principles](../../repo-governance/conventions/writing/quality.md)
- [File-Touch Discipline](../../repo-governance/development/practice/file-touch-discipline.md) - Keep a ledger of every path you touch, carry it through every compaction, leave anything not on it alone, and stage explicit paths
