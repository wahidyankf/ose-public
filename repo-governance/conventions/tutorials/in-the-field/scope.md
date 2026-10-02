---
description: What the In-the-Field convention covers and does not cover, and where to find the topics it excludes.
when_to_use: Use when you need to confirm whether a question about production guides falls inside this convention's scope.
---

# Scope

**Universal Application**: This convention applies to **all in-the-field tutorial content** across the repository:

- **apps/ayokoding-www/content/** - Canonical location for programming language in-the-field guides (Java, Golang, Python, etc.)
- **apps/ose-www/content/** - Platform in-the-field guides
- **Any other location** - In-the-field tutorials regardless of directory

**Implementation Notes**: While these standards apply universally, platform-specific details (frontmatter, weights, navigation) are covered in site-specific skills.

## What This Convention Covers

- **In-the-field tutorial structure** - 20-40 production guides building on by-example/by-concept
- **Target audience** - Developers with foundational knowledge ready for production patterns
- **Standard library first** - Built-in approaches before frameworks with clear rationale
- **Production code quality** - Error handling, logging, security, configuration
- **Framework introduction** - When and why to adopt industry-standard libraries
- **Guide organization** - Problem-solution format, best practices, trade-offs
- **Topic coverage** - Real-world production scenarios (TDD, Docker/K8s, security, persistence)

## What This Convention Does NOT Cover

- **General tutorial standards** - Covered in [Tutorials Convention](../general.md)
- **Tutorial naming** - Covered in [Tutorial Naming Convention](../naming.md)
- **Code quality** - Source code standards in development conventions
- **Tutorial validation** - Covered by content-checker agent
