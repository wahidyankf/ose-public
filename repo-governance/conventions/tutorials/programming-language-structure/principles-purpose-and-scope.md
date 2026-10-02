---
description: Core principles, purpose, and applicability scope for the programming language tutorial structure convention.
when_to_use: Use when you need the rationale, goals, or applicability boundaries behind the programming language tutorial structure convention.
---

# Principles, Purpose, and Scope

## Principles Implemented/Respected

This convention implements the following core principles:

- **[Progressive Disclosure](../../../principles/content/progressive-disclosure.md)**: Dual-path structure allows learners to choose their entry point based on experience level. By-concept path for gradual learning, by-example path for rapid exploration.
- **[Accessibility First](../../../principles/content/accessibility-first.md)**: Multiple learning paths serve diverse learning styles - narrative-driven for methodical learners, code-first for experienced developers.
- **[Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md)**: Clear directory structure makes learning path choices obvious. Foundational tutorials at root signal prerequisite status.

## Purpose

This convention ensures:

- **Consistent Structure**: All programming languages follow same Full Set Tutorial Package organization
- **Learner Choice**: Multiple entry points serve different experience levels and learning styles
- **Clear Navigation**: Directory structure signals learning path differences
- **Complete Education**: All 5 components required for complete language content
- **Pedagogical Clarity**: Foundational content (Initial Setup, Quick Start) remains accessible at tutorials root level

## Scope

**Applies to:**

- **All programming language tutorial structures** across the repository:
  - **ayokoding-www** (`apps/ayokoding-www/content/[lang]/learn/software-engineering/programming-language/[language]/tutorials/`) - canonical location
  - **Any other location** where programming language tutorials are organized
- Languages: Java, Elixir, Golang, Kotlin, Python, Rust (and future additions)

**Enforced by:**

- `content-checker` (validates by-concept structure)
- `tutorial-by-example-checker` (validates by-example structure)
- `docs-tutorial-checker` (validates docs/ tutorial quality)

**Implementation Notes**: The Full Set Tutorial Package structure is universal. Platform-specific details (weight values, frontmatter, navigation) are covered in site-specific skills.
