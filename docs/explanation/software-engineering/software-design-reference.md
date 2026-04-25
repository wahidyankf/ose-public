---
title: Software Design Reference
description: Cross-reference to authoritative software design and coding standards documentation
category: explanation
subcategory: software
tags:
  - programming
  - software-design
  - coding-standards
  - cross-reference
principles_implemented:
  - explicit-over-implicit
  - documentation-first
created: 2026-01-25
---

# Software Design Reference

**Cross-reference to authoritative software design and coding standards documentation.**

## Purpose

This document establishes the separation between:

- **Governance conventions** (governance/conventions/) - Cross-language, repository-wide rules
- **Software design documentation** (docs/explanation/software-engineering/) - Language-specific, framework-specific, architecture-specific guidance

## Authoritative Sources

### Architecture Patterns

**Location**: [docs/explanation/software-engineering/architecture/](./architecture/README.md)

**Prerequisite Knowledge**: All architecture documentation assumes completion of corresponding AyoKoding learning paths. These are OSE Platform-specific standards, not educational tutorials.

- **[C4 Architecture Model](./architecture/c4-architecture-model/README.md)** - System visualization
  - **Prerequisite**: [AyoKoding C4 Architecture Model](../../../apps/ayokoding-web/content/en/learn/software-engineering/architecture/c4-architecture-model/)
- **[Domain-Driven Design](./architecture/domain-driven-design-ddd/README.md)** - Strategic and tactical patterns
  - **Prerequisite**: [AyoKoding Domain-Driven Design](../../../apps/ayokoding-web/content/en/learn/software-engineering/architecture/domain-driven-design-ddd/)
- **[Finite State Machines](./architecture/finite-state-machine-fsm/README.md)** - State management
  - **Prerequisite**: [AyoKoding Finite State Machines](../../../apps/ayokoding-web/content/en/learn/software-engineering/architecture/finite-state-machine-fsm/)

### Development Practices

**Location**: [docs/explanation/software-engineering/development/](./development/README.md)

**Prerequisite Knowledge**: All development practice documentation assumes completion of corresponding AyoKoding learning paths. These are OSE Platform-specific standards, not educational tutorials.

- **[Test-Driven Development](./development/test-driven-development-tdd/README.md)** - TDD methodology
  - **Prerequisite**: [AyoKoding Test-Driven Development](../../../apps/ayokoding-web/content/en/learn/software-engineering/development/test-driven-development-tdd/)
- **[Behavior-Driven Development](./development/behavior-driven-development-bdd/README.md)** - BDD with Gherkin
  - **Prerequisite**: [AyoKoding Behavior-Driven Development](../../../apps/ayokoding-web/content/en/learn/software-engineering/development/behavior-driven-development-bdd/)

### Language-Specific Coding Standards

**Location**: [docs/explanation/software-engineering/programming-languages/](./programming-languages/README.md)

Each language directory contains:

- **Idioms** - Language-specific patterns and conventions
- **Best Practices** - Clean code standards
- **Anti-Patterns** - Common mistakes to avoid

Languages covered:

- **[Java](./programming-languages/java/README.md)** - Modern Java (17+)
- **[TypeScript](./programming-languages/typescript/README.md)** - Frontend and Node.js
- **[Go](./programming-languages/golang/README.md)** - CLI tools and infrastructure
- **[Python](./programming-languages/python/README.md)** - Data processing and AI/ML
- **[Elixir](./programming-languages/elixir/README.md)** - Real-time systems

### Framework-Specific Standards

**Location**: [docs/explanation/software-engineering/platform-web/](./platform-web/README.md)

Frameworks covered:

- **[Spring Boot (JVM)](./platform-web/tools/jvm-spring-boot/README.md)** - REST APIs and microservices
- **[Phoenix (Elixir)](./platform-web/tools/elixir-phoenix/README.md)** - Real-time applications
- **[React (TypeScript)](./platform-web/tools/fe-react/README.md)** - Interactive UIs

## Separation of Concerns

### Governance Conventions

**What**: Repository-wide rules that apply across all languages and contexts

**Examples**:

- File naming patterns
- Linking standards
- Diagram accessibility
- Emoji usage
- Documentation organization (Diataxis)

**Authority**: Layer 2 of six-layer governance hierarchy

### Software Design Documentation

**What**: Language-specific, framework-specific, architecture-specific technical guidance

**Examples**:

- Java record usage vs traditional classes
- TypeScript type narrowing patterns
- Spring Boot auto-configuration best practices
- React hook usage patterns
- DDD aggregate boundaries

**Authority**: Authoritative technical reference, cited by agents and developers

## Content Separation: Style Guides vs. Educational Content

### Programming Language Documentation Separation

Software design documentation in `docs/explanation/software-engineering/` contains **repository-specific style guides**, NOT educational content. Educational content lives in AyoKoding.

**See**: [Programming Language Documentation Separation Convention](../../../governance/conventions/structure/programming-language-docs-separation.md) for complete separation rules.

**Critical Rule**: docs/explanation/ content **MUST NOT duplicate** AyoKoding educational content. Style guides focus exclusively on OSE Platform-specific conventions.

**Relationship Pattern**:

- **AyoKoding content** (`apps/ayokoding-web/content/en/learn/`) = Educational foundation (0-95% language coverage, by-example tutorials, in-the-field production guides)
- **Docs/explanation content** (`docs/explanation/software-engineering/`) = OSE Platform style guides (repository-specific naming, framework choices, architecture patterns)

### Specific Prerequisites

The following `docs/explanation/` content assumes readers have completed the corresponding AyoKoding learning paths:

| Advanced Reference (docs/explanation/)                                       | Prerequisite Learning (ayokoding-web)                                                                                                                                   |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [programming-languages/java/](./programming-languages/java/)                 | [learn/software-engineering/programming-languages/java/](../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/java/)                 |
| [programming-languages/golang/](./programming-languages/golang/)             | [learn/software-engineering/programming-languages/golang/](../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/golang/)             |
| [programming-languages/elixir/](./programming-languages/elixir/)             | [learn/software-engineering/programming-languages/elixir/](../../../apps/ayokoding-web/content/en/learn/software-engineering/programming-languages/elixir/)             |
| [platform-web/tools/jvm-spring/](./platform-web/tools/jvm-spring/)           | [learn/software-engineering/platform-web/tools/jvm-spring/](../../../apps/ayokoding-web/content/en/learn/software-engineering/platform-web/tools/jvm-spring/)           |
| [platform-web/tools/jvm-spring-boot/](./platform-web/tools/jvm-spring-boot/) | [learn/software-engineering/platform-web/tools/jvm-spring-boot/](../../../apps/ayokoding-web/content/en/learn/software-engineering/platform-web/tools/jvm-spring-boot/) |

### Content Types and Scope

**AyoKoding Educational Content** (apps/ayokoding-web/) - Generic programming knowledge:

- **Initial Setup** - Environment configuration, IDE setup
- **Quick Start** - First programs, hello world
- **By Example** - 75-85 annotated code examples (0-95% language coverage)
- **In the Field** - 20-40 production implementation guides
- **Overview** - Language/framework survey and features

**OSE Platform Style Guides** (docs/explanation/) - Repository-specific standards:

- **Coding Standards** - OSE Platform naming conventions, patterns
- **API Standards** - OSE Platform interface design rules
- **DDD Standards** - OSE Platform domain modeling patterns
- **Security Standards** - OSE Platform security requirements
- **Performance Standards** - OSE Platform optimization guidelines

**Key Difference**: AyoKoding teaches languages/frameworks generically; docs/explanation/ defines how to use them in OSE Platform specifically.

### Validation

The `docs-software-engineering-separation-checker` agent validates:

- Prerequisite statements exist in docs/explanation READMEs (referencing AyoKoding)
- No duplication between docs/explanation and AyoKoding educational content
- Style guides focus on repository-specific conventions only
- AyoKoding learning paths are complete (required prerequisite content exists)
- Cross-references follow Programming Language Documentation Separation Convention

## For AI Agents

When writing code or making architectural decisions:

1. **Follow language-specific standards** from docs/explanation/software-engineering/programming-languages/[language]/
2. **Apply framework patterns** from docs/explanation/software-engineering/platform-web/[framework]/
3. **Use architecture models** from docs/explanation/software-engineering/architecture/
4. **Apply development practices** from docs/explanation/software-engineering/development/
5. **Comply with repository conventions** from governance/conventions/

Skills available for quick reference:

- `swe-programming-java` - Java coding standards
- `swe-programming-typescript` - TypeScript coding standards
- `swe-programming-golang` - Go coding standards
- `swe-programming-python` - Python coding standards
- `swe-programming-elixir` - Elixir coding standards

## Validation

The `repo-rules-checker` agent validates:

- Cross-references between governance and software docs
- Principle alignment in software documentation
- File naming convention adherence
- Document structure consistency

## Principles Implemented/Respected

This document implements/respects the following core principles:

- **[Explicit Over Implicit](../../../governance/principles/software-engineering/explicit-over-implicit.md)**: By establishing clear separation between governance conventions and software design documentation, this document makes it explicit where to find authoritative guidance. No guessing whether standards live in governance/ or docs/explanation/software-engineering/ - the boundary is defined.

- **[Documentation First](../../../governance/principles/content/documentation-first.md)**: By creating a clear reference structure pointing to authoritative software design documentation, this document ensures documentation exists and is discoverable. AI agents and developers have explicit paths to language-specific standards, architecture patterns, and framework guidance.

## Related Documentation

- **[Programming Languages Overview](./programming-languages/README.md)** - Language comparison and selection
- **[Architecture Overview](./architecture/README.md)** - Architecture patterns
- **[Functional Programming Principles](../../../governance/development/pattern/functional-programming.md)** - Cross-language FP guidance
