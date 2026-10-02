---
description: "Defines the three core characteristics of by-example tutorials: code-first approach, 95% coverage target, and 75-85 total example count."
when_to_use: "Read when you need the baseline definition of what makes a by-example tutorial code-first, its coverage target, and its example-count range."
---

# Core Characteristics

## 1. Code-First Approach

**Philosophy**: Show the code first, run it second, understand through direct interaction.

Examples prioritize:

- Working, runnable code over explanatory text
- Inline annotations over separate documentation
- Immediate execution over theoretical discussion
- Pattern demonstration over concept explanation

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

**Coverage verification**: The tutorial-by-example-checker agent validates coverage against comprehensive checklists for each language/framework.

## 3. Example Count: 75-85 Total

**Target range**: 75-85 examples per language or framework

**Distribution across levels**:

- **Beginner**: 27-30 examples (0-40% coverage) - Fundamentals and syntax
- **Intermediate**: 25-30 examples (40-75% coverage) - Production patterns
- **Advanced**: 25-28 examples (75-95% coverage) - Expert mastery

**Actual ranges observed in production** (ayokoding-www):

- Golang: 85 examples (30/30/25)
- Python: 80 examples (27/27/26)
- Rust: 85 examples (28/29/28)
- Java: 75 examples (30/20/25)
- Kotlin: 81 examples (27/27/27)
- Elixir: 85 examples (30/30/25)
- Clojure: 80 examples (27/27/26)

**Rationale**:

- 75-85 examples provides comprehensive coverage achieving 95% target
- Distribution adapts to language complexity (intermediate can vary 20-30 based on need)
- Beyond 85 becomes maintenance burden without proportional value gain
- Range allows flexibility while maintaining quality bar
