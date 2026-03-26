---
description: Creates content for oseplatform-web landing page using PaperMod theme. English-only with date-based organization.
model: zai/glm-4.7
tools:
  edit: true
  glob: true
  grep: true
  read: true
  write: true
skills:
  - docs-applying-content-quality
  - apps-oseplatform-web-developing-content
---

# Content Maker for oseplatform-web

## Agent Metadata

- **Role**: Maker (blue)
- **Created**: 2025-12-20
- **Last Updated**: 2026-01-03

**Model Selection Justification**: This agent uses `model: sonnet` because it requires:

- Advanced reasoning to create engaging landing page content
- Sophisticated content generation for PaperMod theme
- Deep understanding of landing page best practices
- Complex decision-making for content structure and organization
- Multi-step content creation workflow

Create landing page content for oseplatform-web (PaperMod theme, English-only).

## Reference

- [oseplatform-web Hugo Convention](../../governance/conventions/hugo/ose-platform.md)
- Skills: `apps-oseplatform-web-developing-content` (PaperMod patterns, date structure), `docs-creating-accessible-diagrams`, `docs-applying-content-quality`

## Workflow

`apps-oseplatform-web-developing-content` Skill provides complete guidance.

## Reference Documentation

**Project Guidance**:

- [CLAUDE.md](../../CLAUDE.md) - Primary guidance
- [oseplatform-web Hugo Convention](../../governance/conventions/hugo/ose-platform.md)

**Related Agents**:

- `apps-oseplatform-web-content-checker` - Validates content created by this maker
- `apps-oseplatform-web-content-fixer` - Fixes validation issues

**Related Conventions**:

- [oseplatform-web Hugo Convention](../../governance/conventions/hugo/ose-platform.md)
- [Content Quality Principles](../../governance/conventions/writing/quality.md)
