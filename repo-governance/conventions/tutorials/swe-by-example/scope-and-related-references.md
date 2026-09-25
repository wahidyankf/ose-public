---
description: "States what by-example convention covers and does not cover, and links to related documentation, agents, workflows, and agent skills."
when_to_use: "Read when you need to confirm whether a topic falls inside this convention's scope, or need links to the related agents/workflows/skills that implement it."
---

# Scope and Related References

## Scope

**Universal Application**: This convention applies to **all by-example tutorial content** across the repository:

- **apps/ayokoding-www/content/** - Canonical location for programming language tutorials (Java, Golang, Python, etc.)
- **apps/ose-www/content/** - Platform tutorials using by-example approach
- **Any other location** - By-example tutorials regardless of directory

**Implementation Notes**: While these standards apply universally, platform-specific details (frontmatter, weights, navigation) are covered in site-specific skills.

### What This Convention Covers

- **By Example tutorial structure** - 75-85 heavily annotated code examples achieving 95% coverage
- **Target audience** - Experienced developers switching languages (code-first learning)
- **Example annotation** - 1.0-2.25 comment density per example with `// =>` notation
- **Code organization** - Sequential numbering (1-85) across beginner/intermediate/advanced
- **Example selection** - 95% coverage target (core syntax to production patterns)
- **Diagram standards** - 30-50 total diagrams using accessible color palette
- **Five-part structure** - Explanation, diagram, code, takeaway, why it matters

### What This Convention Does NOT Cover

- **General tutorial standards** - Covered in [Tutorials Convention](../general.md)
- **Tutorial naming** - Covered in [Tutorial Naming Convention](../naming.md)
- **Code quality** - Source code standards in development conventions
- **Tutorial validation** - Covered by apps-ayokoding-www-by-example-checker agent

## Related Documentation

- [Tutorial Naming Convention](../naming.md): Tutorial type definitions and naming standards
- [Content Quality Principles](../../writing/quality.md): General content quality standards
- [Diagrams Convention](../../formatting/diagrams.md): Mermaid diagram standards
- [Color Accessibility Convention](../../formatting/color-accessibility.md): Color-blind friendly palette
- [Diátaxis Framework](../../structure/diataxis-framework.md): Tutorial categorization framework

## Related Agents

- [apps-ayokoding-www-by-example-maker](../../../../.agents/agents/apps-ayokoding-www-by-example-maker.md) — Creates by-example content
- [apps-ayokoding-www-by-example-checker](../../../../.agents/agents/apps-ayokoding-www-by-example-checker.md) — Validates by-example standards
- [apps-ayokoding-www-by-example-fixer](../../../../.agents/agents/apps-ayokoding-www-by-example-fixer.md) — Applies validated fixes

## Related Workflows

- [ayokoding-web-swe-by-example-quality-gate](../../../workflows/ayokoding-web/ayokoding-web-swe-by-example-quality-gate.md) — Quality assurance workflow for by-example tutorials

## Related agent skills

- [docs-creating-by-example-tutorials](../../../../.agents/skills/docs-creating-by-example-tutorials/SKILL.md) — Skill package for creating by-example tutorials
