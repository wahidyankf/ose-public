---
description: "Distinguishes universal from customizable content elements, sets content-density ratios, and defines the validation process across creation, publishing, and post-publishing."
when_to_use: "Use when deciding whether a piece of content should be identical across languages or language-specific, sizing a section relative to the Beginner tutorial, or running the validation pipeline."
---

# Language Consistency, Density, and Validation

## Language-Agnostic vs. Language-Specific

### Universal Elements (Same Across All Languages)

These MUST be identical:

- Directory structure and file names
- Coverage percentages (0-5%, 5-30%, 0-60%, 60-85%, 85-95%)
- Diátaxis categorization (tutorials, how-to, explanation, reference)
- Pedagogical patterns (front hook, learning path, prerequisites)
- Quality requirements (color palette, runnable code)
- Weight numbering (level-based system: level 5 folder uses 10002, level 6 content uses 100000+, level 7 content uses 1000000+ with resets per parent)
- Frontmatter structure (title, date, draft, description, weight)

### Customizable Elements (Adapt Per Language)

These vary by language:

- **Number of how-to guides**: 12-18 based on language complexity
- **Specific topics**:
  - Go: goroutines, channels, interfaces
  - Python: GIL, decorators, comprehensions
  - Java: JVM, threads, generics
  - Rust: ownership, lifetimes, borrowing
  - TypeScript: type system, generics, decorators
- **Philosophy sections**: Language design principles
- **Ecosystem tools**:
  - Go: modules, go fmt
  - Python: pip, venv, poetry
  - Java: Maven, Gradle, JUnit
- **Paradigm emphasis**:
  - Go: concurrent programming
  - Python: multi-paradigm flexibility
  - Java: object-oriented design
  - Rust: memory safety
  - Clojure: functional programming

## Content Density Patterns

From benchmark analysis:

- **Quick Start = 40-50% of Beginner length**: Enables rapid exploration without overwhelming
- **Intermediate = 60-80% of Beginner length**: Assumes foundation, focuses on production patterns
- **Cookbook = 2-3x Beginner length**: Comprehensive reference with many recipes
- **How-to guides average 300-400 lines**: Focused, actionable solutions
- **Best practices ≈ Anti-patterns length**: Balanced positive/negative examples

**Rationale:** These ratios have proven effective across three languages with different complexities.

## Validation Process

### During Creation

Content creators MUST:

1. **Use apps-ayokoding-www-general-maker or apps-ayokoding-www-by-example-maker agent** for initial content creation
2. **Follow this standard exactly** (don't improvise structure)
3. **Test all code examples** (ensure they run)
4. **Verify factual accuracy** (check documentation, official sources)
5. **Use color-blind friendly palette** (never red/green/yellow)

### Before Publishing

Content MUST pass:

1. **apps-ayokoding-www-general-checker** or **apps-ayokoding-www-by-example-checker** validation (quality principles)
2. **apps-ayokoding-www-facts-checker** verification (factual correctness)
3. **apps-ayokoding-www-link-checker** validation (all links work)
4. **Manual review** (pedagogical effectiveness, clarity)

### Post-Publishing

Monitor and maintain:

1. **Quarterly fact checks** (verify versions, syntax still current)
2. **User feedback** (address confusion, gaps)
3. **Update for language evolution** (new versions, deprecated features)
