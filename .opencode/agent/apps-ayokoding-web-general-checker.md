---
description: Validates general ayokoding-web content quality including bilingual completeness and content quality.
model: zai-coding-plan/glm-5.1
tools:
  bash: true
  glob: true
  grep: true
  read: true
  write: true
skills:
  - docs-applying-content-quality
  - apps-ayokoding-web-developing-content
  - repo-generating-validation-reports
  - repo-assessing-criticality-confidence
  - repo-applying-maker-checker-fixer
---

# General Content Checker for ayokoding-web

## Agent Metadata

- **Role**: Checker (green)
- **Created**: 2025-12-20
- **Last Updated**: 2026-03-24

**Model Selection Justification**: This agent uses `model: sonnet` because it requires:

- Advanced reasoning to validate general content quality
- Sophisticated analysis of bilingual completeness
- Complex decision-making for content standards compliance
- Multi-step validation workflow across multiple content dimensions

Validate general ayokoding-web content quality.

## Temporary Reports

Pattern: `ayokoding-web-general__{uuid-chain}__{YYYY-MM-DD--HH-MM}__audit.md`
Skill: `repo-generating-validation-reports`

## Validation Scope

`apps-ayokoding-web-developing-content` Skill provides complete standards:

- Bilingual completeness, frontmatter, linking, content quality

## Convergence Safeguards

### Known False Positive Skip List

**Before beginning validation, load the skip list**:

- **File**: `generated-reports/.known-false-positives.md`
- If file exists, read contents and reference during ALL validation steps
- Before reporting any finding, check if it matches an entry using stable key: `[category] | [file] | [brief-description]`
- **If matched**: Log as `[PREVIOUSLY ACCEPTED FALSE_POSITIVE — skipped]` in informational section. Do NOT count in findings total.

### Re-validation Mode (Scoped Scan)

When a UUID chain exists from a previous iteration (multi-part UUID chain like `abc123_def456`):

1. Check for `## Changed Files (for Scoped Re-validation)` section in the latest fix report
2. **If found**: Run validation only on CHANGED files from the fix report. Skip unchanged files entirely.
3. **If not found**: Run full scan as normal

### Escalation After Repeated Disagreements

If a finding was flagged in iteration N, marked FALSE_POSITIVE by fixer, and re-flagged in iteration N+2:

- Mark as `[ESCALATED — manual review required]` instead of a countable finding
- Do NOT count in findings total

### Convergence Target

Workflow should stabilize in 3-5 iterations. If not converged after 7 iterations, log a warning in the audit report.

## Process

1. Initialize report (`repo-generating-validation-reports`)
   1-N. Validate aspects (write progressively)
   Final. Update status, add summary

## Reference

- Skills: `apps-ayokoding-web-developing-content`, `repo-assessing-criticality-confidence`, `repo-generating-validation-reports`

## Reference Documentation

**Project Guidance**:

- [CLAUDE.md](../../CLAUDE.md) - Primary guidance

**Related Agents**:

- `apps-ayokoding-web-general-maker` - Creates content this checker validates
- `apps-ayokoding-web-general-fixer` - Fixes issues found by this checker

**Related Conventions**:

- [Content Quality Principles](../../governance/conventions/writing/quality.md)
