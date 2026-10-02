---
description: "Defines what the By-Concept convention covers and explicitly does not cover, and where it applies across the repository."
when_to_use: "Read when determining whether a question about By-Concept tutorials is answered by this convention or a different one."
---

# Scope

**Universal Application**: This convention applies to **all by-concept tutorial content** across the repository:

- **apps/ayokoding-www/content/** - Canonical location for programming language tutorials (Java, Golang, Python, etc.)
- **apps/ose-www/content/** - Platform tutorials using by-concept approach
- **Any other location** - By-concept tutorials regardless of directory

**Implementation Notes**: While these standards apply universally, platform-specific details (frontmatter, weights, navigation) are covered in site-specific skills.

## What This Convention Covers

- **By Concept tutorial structure** - 40-60 narrative-driven sections achieving 95% coverage
- **Target audience** - Comprehensive learners preferring narrative explanations
- **Code annotation** - 1.0-2.25 comment density per code block with `// =>` notation
- **Section organization** - Concept hierarchy (not numbered examples)
- **Coverage distribution** - 0-40% (beginner), 40-75% (intermediate), 75-95% (advanced)
- **Diagram standards** - 30-50 total diagrams using accessible color palette
- **Section structure** - Intro, narrative, code, takeaway, why it matters

## What This Convention Does NOT Cover

- **General tutorial standards** - Covered in [Tutorials Convention](../general.md)
- **Tutorial naming** - Covered in [Tutorial Naming Convention](../naming.md)
- **Code quality** - Source code standards in development conventions
- **Tutorial validation** - Covered by content-checker agent
