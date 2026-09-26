---
name: docs-applying-content-quality
description: Universal markdown content quality standards for active voice, heading hierarchy, accessibility compliance (alt text, WCAG AA contrast, screen reader support), and professional formatting. Essential for all markdown content creation across docs/, web sites, plans/, and repository files. Auto-loads when creating or editing markdown content.
---

# Applying Content Quality Standards

## Quality-Gate Lifecycle Handoff

Checker/fixer invocations may receive `delegated-gate-ids` and `lifecycle-evidence` from
[Lifecycle Validation Ownership](../../../repo-governance/workflows/meta/workflow-identifier/check-fix-lifecycle-validation-ownership.md).
Suppress only predicates matched by an exact gate ID or declared `verifies` relationship; an empty
set suppresses nothing. Checkers return the evidence unchanged. After edits, fixers intersect
changed files with delegated gate scopes and return `updated-lifecycle-evidence`, invalidating only
affected entries. Omitted handoff preserves standalone full behaviour.

## Purpose

This Skill provides comprehensive guidance for applying **universal content quality standards** to all markdown content in the repository. It ensures consistent writing quality, accessibility compliance, and professional presentation across documentation, web sites, planning documents, and root files.

**When to use this Skill:**

- Creating or editing markdown content in docs/
- Writing content for ayokoding-web (Next.js) or ose-web (Next.js)
- Creating planning documents in plans/
- Writing repository root files (README.md, CONTRIBUTING.md, etc.)
- Ensuring accessibility compliance (WCAG AA)
- Reviewing content for quality standards

## Core Quality Principles

See [Writing Style, Heading Hierarchy, and Accessibility](./reference/writing-style-heading-accessibility.md) for active-voice/tone rules, heading nesting requirements, and WCAG AA accessibility standards (alt text, contrast, semantic formatting, screen reader support).

See [Formatting Conventions and Common Mistakes](./reference/formatting-and-common-mistakes.md) for code-block/paragraph/list formatting, the time-estimate labelling rule, the pre-publish quality checklist, and five common mistakes with wrong/right examples.

## References

**Primary Convention**: [Content Quality Principles](../../../repo-governance/conventions/writing/quality.md)

**Related Conventions**:

- [Accessibility First Principle](../../../repo-governance/principles/content/accessibility-first.md) - Foundational accessibility principle
- [No Time Estimates Principle](../../../repo-governance/principles/content/no-time-estimates.md) - Plan documents carry no time estimates; labelled estimates are permitted elsewhere
- [README Quality Convention](../../../repo-governance/conventions/writing/readme-quality.md) - README-specific quality standards
- [Color Accessibility Convention](../../../repo-governance/conventions/formatting/color-accessibility.md) - WCAG color contrast requirements

**Related Skills**:

- `docs-creating-accessible-diagrams` - Accessible Mermaid diagrams with WCAG colors
- `readme-writing-readme-files` - README-specific quality standards
- `docs-applying-diataxis-framework` - Documentation organization framework

---

This Skill packages universal content quality standards for consistent, accessible, professional markdown content across the repository. For comprehensive details, consult the primary convention document.
