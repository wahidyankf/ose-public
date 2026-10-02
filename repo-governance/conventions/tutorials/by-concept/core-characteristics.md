---
description: "Defines the concept-driven approach, 95% coverage target, and 40-60 section count that characterize By-Concept tutorials."
when_to_use: "Read when scoping how many sections a By-Concept tutorial needs and what coverage percentage it must achieve."
---

# Core Characteristics

## 1. Concept-Driven Approach

**Philosophy**: Explain the concept first, then illustrate with heavily annotated code.

Sections prioritize:

- Conceptual understanding before code
- Narrative explanations of WHY and HOW
- Multiple code examples per concept showing variations
- Progressive building from simple to complex

## 2. Coverage Target: 95%

**What 95% means**: Depth and breadth of language/framework features needed for production work.

**Included in 95%**:

- Core syntax and semantics
- Standard library essentials
- Production patterns and best practices
- Common frameworks and tools
- Modern language features
- Testing and debugging
- Concurrency and parallelism
- Error handling patterns
- Performance considerations

**Excluded from 95% (the remaining 5%)**:

- Rare edge cases
- Framework internals and source code
- Specialized libraries outside standard use
- Language implementation details
- Platform-specific advanced features
- Deprecated features

**Coverage verification**: The content-checker agent validates coverage against comprehensive checklists for each language/framework.

## 3. Section Count: 40-60 Total

**Target range**: 40-60 concept sections per language or framework

**Distribution across levels**:

- **Beginner**: 15-25 sections (0-40% coverage) - Fundamentals and core concepts
- **Intermediate**: 12-20 sections (40-75% coverage) - Production patterns
- **Advanced**: 10-20 sections (75-95% coverage) - Expert mastery

**Actual ranges observed in production** (ayokoding-www):

- Golang: 60 sections (20/21/19)
- Python: 42 sections (20/12/10)
- Rust: 49 sections (19/15/15)
- Java: 50 sections (18/15/17)
- Kotlin: 49 sections (18/16/15)
- Elixir: 53 sections (23/16/14)
- Clojure: 43 sections (18/12/13)
- Dart: 49 sections (17/19/13)

**Rationale**:

- 40-60 sections provides comprehensive coverage achieving 95% target
- Distribution adapts to language complexity (advanced can vary 10-20 based on depth)
- Fewer sections than by-example (40-60 vs 75-85) because concepts group related features
- Each section covers more ground than individual examples
