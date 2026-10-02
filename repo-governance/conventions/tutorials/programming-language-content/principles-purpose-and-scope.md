---
description: "Explains the core principles behind the Programming Language Content Standard, why it exists, and exactly which content and locations it applies to."
when_to_use: "Use when you need to understand why this standard exists, what it guarantees, or whether a given piece of content falls inside its scope."
---

# Principles, Purpose, and Scope

## Principles Implemented/Respected

This convention implements the following core principles:

- **[Progressive Disclosure](../../../principles/content/progressive-disclosure.md)**: Coverage levels (0-5%, 5-30%, 0-60%, 60-85%, 85-95%) implement gradual complexity layering, allowing learners to build knowledge incrementally without overwhelming them with advanced concepts too early.
- **[Accessibility First](../../../principles/content/accessibility-first.md)**: Standardized structure aids diverse learners with predictable navigation, color-blind friendly palettes in all diagrams, and WCAG-compliant content formatting.
- **[Simplicity Over Complexity](../../../principles/general/simplicity-over-complexity.md)**: Flat directory structure with consistent file naming across all languages, avoiding nested hierarchies that add cognitive overhead.
- **[Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md)**: Clear coverage percentages define scope boundaries, explicit quality metrics provide objective benchmarks, and documented standards eliminate guesswork.

## Purpose

This convention ensures:

- **Consistency**: Learners encounter familiar structure across all languages
- **Completeness**: Clear definition of what "done" means for a language
- **Quality**: Measurable standards for content depth and pedagogical effectiveness
- **Scalability**: Proven template works across paradigms (procedural, OOP, functional, concurrent)
- **Predictability**: Teams can estimate effort for new language additions

## Scope

This convention applies to:

- **All programming language tutorial content** across the repository:
  - **ayokoding-www** (`apps/ayokoding-www/content/[lang]/learn/swe/programming-languages/[language]/`) - canonical location
  - **Any other location** where programming language tutorials exist
- Includes: tutorials (foundational, by-concept, by-example, cookbook), how-to guides, best practices, anti-patterns
- Enforced by: `content-checker`, `tutorial-by-example-checker`, `apps-ayokoding-www-general-maker`, `apps-ayokoding-www-by-example-maker`, `content-checker` agents

**Implementation Notes**: While the Full Set Tutorial Package architecture applies universally, implementation details (frontmatter, weight values, navigation) are documented in the Content Requirements section below.
