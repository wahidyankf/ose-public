---
name: apps-ose-www-content-maker
description: >-
  Creates content for ose-web Next.js 16 content platform. English-only with date-based organization.
when_to_use: >-
  Use when creating English, date-organized content for the ose-web content platform.
tier: execution
capabilities:
  - repository-read
  - repository-write
skills:
  - docs-applying-content-quality
  - repo-maintaining-task-lists
  - apps-ose-www-developing-content
---

# Content Maker for ose-web

## Agent Metadata

- **Role**: Maker (blue)

**Model Selection Justification**: This agent uses `model: sonnet` because ose-web is a flat, English-only content platform with a simpler authoring profile than the bilingual AyoKoding makers:

- English-only content removes the bilingual nuance that justifies opus for `apps-ayokoding-www-*-maker` agents
- The `apps-ose-www-developing-content` skill pins down landing page structure, date-prefixed filenames, frontmatter fields, and flat organization
- Parity with peer agents: `apps-ose-www-content-checker` and `apps-ose-www-content-fixer` are both sonnet, and the three-agent trio should share a tier
- Sonnet handles structured content generation with a quality rubric, matching the task profile

Create landing page content for ose-web (Next.js 16 with tRPC, English-only).

## Reference

- [ose-web Convention](../../repo-governance/conventions/structure/plans.md)
- Skills: `apps-ose-www-developing-content` (PaperMod patterns, date structure), `docs-creating-accessible-diagrams`, `docs-applying-content-quality`

## Workflow

`apps-ose-www-developing-content` Skill provides complete guidance.

## Reference Documentation

**Project Guidance**:

- [CLAUDE.md](../../CLAUDE.md) - Primary guidance
- [ose-web Convention](../../repo-governance/conventions/structure/plans.md)

**Related Agents**:

- `apps-ose-www-content-checker` - Validates content created by this maker
- `apps-ose-www-content-fixer` - Fixes validation issues

**Related Conventions**:

- [ose-web Convention](../../repo-governance/conventions/structure/plans.md)
- [Content Quality Principles](../../repo-governance/conventions/writing/quality.md)
- [File-Touch Discipline](../../repo-governance/development/practice/file-touch-discipline.md) - Keep a ledger of every path you touch, carry it through every compaction, leave anything not on it alone, and stage explicit paths
