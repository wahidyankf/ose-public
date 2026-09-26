---
description: "Defines what must stay consistent vs vary across languages, summarizes the production-validated numeric standards, and lists the principles this convention implements."
when_to_use: "Read when creating by-example tutorials for a new language, to know what must match across languages and what is allowed to vary, plus the target numbers to hit."
---

# Cross-Language Consistency, Standards Summary, and Principles

## Cross-Language Consistency

When creating by-example tutorials for multiple languages:

**Maintain consistency in**:

- Overall structure (overview + 3 levels)
- Example count range (75-85)
- Coverage target (95%)
- Five-part example format
- Self-containment rules
- Comment annotation patterns

**Allow variation in**:

- Language-specific idioms and patterns
- Framework-specific features
- Standard library organization
- Testing approaches
- Tooling and ecosystem

## Production-Validated Standards Summary

This convention reflects standards validated by **7 production languages** (75-85 examples each) on ayokoding-www:

**Example Count**: 75-85 total (refined from initial 75-85 target)

- Beginner: 27-30 examples
- Intermediate: 20-30 examples (varies by language complexity)
- Advanced: 25-28 examples

**Diagram Density**: 30-50 total diagrams per language

- Beginner: 7-11 diagrams (25-37% of examples)
- Intermediate: 8-17 diagrams (30-60% of examples)
- Advanced: 10-24 diagrams (40-86% of examples)

**Annotation Density**: 1.0-2.25 comments per code line PER EXAMPLE

- Measured per individual example, not file average
- Production average: 1.8-2.2 across languages
- Example: 7 code lines with 15 comment lines = 2.14 density

**Why It Matters Length**: 50-100 words (2-3 sentences)

- Production examples: 62-78 words
- Active voice, production-focused, specific to concept

**Five-Part Structure**: Mandatory in all examples

1. Brief explanation (2-3 sentences)
2. Mermaid diagram (when appropriate, 30-50% of examples)
3. Heavily annotated code (1.0-2.25 density per example)
4. Key takeaway (1-2 sentences)
5. Why it matters (50-100 words)

**Production languages validated**: Golang (85), Python (80), Rust (85), Java (75), Kotlin (81), Elixir (85), Clojure (80)

## Principles Implemented/Respected

This convention implements and respects:

- **[Automation Over Manual](../../../principles/software-engineering/automation-over-manual.md)**: Automated validation via apps-ayokoding-www-by-example-checker agent
- **[Progressive Disclosure](../../../principles/content/progressive-disclosure.md)**: Content organized in complexity levels (beginner/intermediate/advanced)
- **[Accessibility First](../../../principles/content/accessibility-first.md)**: Color-blind friendly diagrams and accessible formatting
- **[Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md)**: Self-contained examples with explicit imports and clear context
