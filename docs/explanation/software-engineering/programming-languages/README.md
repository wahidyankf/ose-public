---
title: Programming Languages
description: Language-specific idioms, best practices, and antipatterns
category: explanation
subcategory: prog-lang
tags:
  - programming-languages
  - idioms
  - best-practices
  - antipatterns
  - index
created: 2026-01-20
---

# Programming Languages

Use this area to understand why a language is used here and which standards apply before you change code. It is written to help an early-career engineer find a safe starting point without asking a product partner to decode implementation jargon.

## Overview

Each language has its own ideas about structure, errors, state, and testing. A useful pattern in TypeScript can be awkward or unsafe in Rust or F#. These guides explain the local conventions so a reader can make choices that fit both the language and this repository.

This directory contains documentation on programming languages used throughout the platform. Active languages use one of two documentation patterns:

**Three-Document Pattern** (TypeScript):

1. **Idioms** - Language-specific patterns, conventions, and idiomatic code styles
2. **Best Practices** - Proven approaches for writing clean, maintainable code
3. **Antipatterns** - Common mistakes and pitfalls to avoid

**Domain-Specific Standards Pattern** (Rust, F#, C#, Java):

Multiple domain-focused standards files covering specific areas (testing, security, concurrency, etc.) as separate documents rather than three consolidated files. See each language's README for their specific document structure.

## Quick Decision: Which Language for My Task?

| Task                                     | Recommended Language | Start With                                                                                                             |
| ---------------------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| REST API backend                         | F#/Giraffe           | See the F# guidance and the relevant app README                                                                        |
| Frontend web application                 | TypeScript           | [TypeScript Standards](./typescript/README.md) — TypeScript development for frontend applications and Node.js services |
| CLI tool for repository automation       | F#                   | See Rhino (F#)                                                                                                         |
| Infrastructure tooling                   | F#                   | See existing CLI tools                                                                                                 |
| Real-time updates and WebSocket handling | TypeScript           | [TypeScript Standards](./typescript/README.md) — TypeScript development for frontend applications and Node.js services |
| Complex domain logic with DDD            | F#                   | See language-specific README files                                                                                     |
| Enterprise API with .NET interop         | C#/F#                | See c-sharp/ and f-sharp/ README files                                                                                 |
| LMS backend (ose-lms-be only)            | Java/Spring Boot     | [Java Standards](./java/README.md) — active for the LMS backend only; not the default for new backends                 |

**Platform Guidance**:

- **TypeScript**: Active for frontend applications, including Next.js sites
- **F#**: Active for REST API backends (organiclever-be, ose-be) and CLI tooling (Rhino, crane-cli — Content Retrieval And Normalization Engine)
- **Rust**: Retained for the AyoKoding Rust course content standards only; no active platform app (Rhino was ported to F# 2026-08-30)
- **C#**: Retained for potential .NET interop with F#
- **Java**: Active for the LMS backend (ose-lms-be) only — not the default for new backends, which remain F#

## Purpose

Understanding language-specific idioms and patterns helps developers:

- Write code that follows established conventions
- Leverage language features effectively
- Avoid common pitfalls and mistakes
- Maintain consistency across the codebase
- Onboard new team members efficiently

## Authoritative Status

**This documentation is the authoritative reference** for language-specific coding standards in the open-sharia-enterprise platform.

All code written in the languages documented here MUST follow the standards, patterns, and practices defined in this directory.

**For AI Agents**: Reference these documents as the source of truth for:

- Language idioms and conventions
- Coding best practices
- Common antipatterns to avoid
- Framework integration patterns
- Testing approaches

**Skills Available**:

- `programming-typescript` - TypeScript standards procedure
- `programming-fsharp` - F# standards procedure
- `programming-csharp` - C# standards procedure
- `programming-java` - Java standards procedure

<!-- TODO: Software Design Reference - Create governance documentation for software design principles -->

### Language Coverage

Each language directory contains a README.md (language overview and version info) plus either:

**Three-Document Pattern** (TypeScript):

```
[language-name]/
├── README.md              # Language overview and version info
├── idioms.md              # Language-specific idioms
├── best-practices.md      # Best practices
└── antipatterns.md        # Common antipatterns
```

**Domain-Specific Standards Pattern** (Rust, F#, C#, Java):

```
[language-name]/
├── README.md                  # Language overview and version info
├── coding-standards.md        # General coding standards
├── testing-standards.md       # Testing standards
├── security-standards.md      # Security standards
└── [domain]-standards.md      # Additional domain-specific files
```

### Document Categories

**Idioms** focus on:

- Language-specific patterns and conventions
- Effective use of language features
- Standard library usage patterns
- Ecosystem conventions
- Community-established norms

**Best Practices** cover:

- Code organization and structure
- Naming conventions
- Error handling approaches
- Testing strategies
- Performance considerations
- Security practices

**Antipatterns** identify:

- Common mistakes and misuses
- Performance pitfalls
- Security vulnerabilities
- Maintainability issues
- Anti-idiomatic code patterns

### 💠 [C#](./c-sharp/README.md) — C# development with ASP.NET Core, Entity Framework Core, and functional patterns

**C# development with ASP.NET Core, Entity Framework Core, and functional patterns**

C# is a versatile, type-safe language on the .NET ecosystem. These standards guide C# development with ASP.NET Core, applying functional patterns through records, pattern matching, and nullable reference types.

**Use C# when you need:**

- Enterprise backend APIs (ASP.NET Core)
- Database-driven applications (Entity Framework Core)
- High-performance services with async/await and Channels
- Domain modeling with records and sealed class hierarchies
- .NET interop with F# components

### 🔷 [F#](./f-sharp/README.md) — F# development with functional-first programming, railway-oriented error handling, and Giraffe

**F# development with functional-first programming, railway-oriented error handling, and Giraffe**

F# is a functional-first .NET language where immutability is the default and discriminated unions enable type-driven domain modeling. crane-cli (Content Retrieval And Normalization Engine) is built in F#.

**Use F# when you need:**

- Making invalid domain states unrepresentable via the type system
- Railway-oriented programming with Result types
- Functional microservices with Giraffe or Saturn
- Pure computation engines with units of measure
- Content pipeline tooling (PDF-to-Markdown conversion, crane-cli)

### ☕ [Java](./java/README.md) — Java development with Spring Boot for the LMS backend

**Java development with Spring Boot for the LMS backend**

Java is active for exactly one project — `ose-lms-be`, the Learning Management System backend — because the LMS targets an ecosystem where Spring Boot is the incumbent. It is not the default for new backends; that remains F#. Introducing Java elsewhere needs its own recorded decision.

**Use Java when you need:**

- The LMS backend, where Spring Boot is the incumbent ecosystem choice

### 🦀 [Rust](./rust/README.md) — Rust development with ownership-based memory safety, zero-cost abstractions, and Axum

**Rust development with ownership-based memory safety, zero-cost abstractions, and Axum**

Rust guarantees memory safety and fearless concurrency without a garbage collector, making it ideal for high-performance, security-critical systems. No platform app currently uses Rust — Rhino, its last user, was ported to F# 2026-08-30 — but these standards remain active for the AyoKoding Rust course content under `apps/ayokoding-www/content/`.

**Use Rust when you need:**

- Memory-safe, high-performance backend services
- WebAssembly targets for browser-based computation
- System-level services with no GC pauses
- Infrastructure tooling with single binary distribution

### 💙 [TypeScript](./typescript/README.md) — TypeScript development for frontend applications and Node.js services

**TypeScript development for frontend applications and Node.js services**

TypeScript is used for frontend web applications (Next.js) and tRPC backends. TypeScript's type system brings safety to JavaScript ecosystem development.

**Use TypeScript when you need:**

- Frontend web applications (React, Next.js)
- Node.js backend services
- Type-safe JavaScript ecosystem development
- Full-stack web development

### Language Selection Criteria

Before proposing a language change for an existing component, read
[Rhino: Rust to F# Rewrite — Measured Outcome](./retired-in-tree-rhino-rust-to-fsharp-benchmark.md) — the
durable, measured comparison record from the one rewrite this platform has actually carried through
end to end, including the regressions it found.

Languages in this documentation are chosen based on:

**Technical Fit**:

- Type safety and correctness guarantees
- Performance characteristics
- Ecosystem maturity
- Tooling support

**Development Practices**:

- Alignment with functional programming principles
- Support for immutability and pure functions
- Testing and maintainability
- Community best practices

**Platform Integration**:

- Nx monorepo compatibility
- CI/CD pipeline integration
- Deployment and containerization
- Observability and monitoring

### Current Language Usage

| Language       | Primary Use Cases                              | Status                                                        |
| -------------- | ---------------------------------------------- | ------------------------------------------------------------- |
| **C#**         | Enterprise APIs, .NET interop with F#          | 📋 Retained — .NET interop                                    |
| **F#**         | REST API backends, CLI tools, content pipeline | ✅ Active — organiclever-be, ose-be, Rhino, crane-cli         |
| **Java**       | LMS backend (Spring Boot)                      | ✅ Active — ose-lms-be only; not the default for new backends |
| **Rust**       | AyoKoding course content standards             | 📋 Retained — no active app (Rhino ported to F# 2026-08-30)   |
| **TypeScript** | Frontend applications, tRPC backends           | ✅ Active — all Next.js apps                                  |

**Legend**: ✅ Active (in use in ose-public) | 📋 Retained (standards documented; not yet used in active apps)

### For Backend Developers

1. **F# backends** - See [organiclever-be](../../../../apps/organiclever-be/README.md) and [ose-be](../../../../apps/ose-be/README.md) for active examples
2. **Apply Rust standards** - [Rust Standards](./rust/README.md) — Rust development with ownership-based memory safety, zero-cost abstractions, and Axum
3. **Hexagonal DDD** - [DDD + Hexagonal In Practice](../architecture/ddd-hexagonal-in-practice/README.md)
4. **For F#/C# standards** - See language-specific README files

### For Full-Stack Developers

1. Learn backend (F#) and frontend (TypeScript) idioms
2. Understand language-specific testing approaches
3. Apply consistent patterns across languages
4. Practice polyglot development

### For New Team Members

1. Read idioms document for your primary language
2. Review best practices for code standards
3. Study antipatterns to avoid common mistakes
4. Cross-reference with repository conventions

## Complementary Documentation

This language documentation complements other areas:

- **[Development Practices](../development/README.md)** - TDD, BDD, testing strategies
- **[Architecture](../architecture/README.md)** - C4 model, DDD patterns
- **[Functional Programming](../../../../repo-governance/development/pattern/functional-programming.md)** - Cross-language FP principles
- **[Code Quality Standards](../../../../repo-governance/development/quality/code.md)** - Quality requirements
- **[Monorepo Structure](../../../reference/monorepo-structure.md)** - Project organization

## Principles Reflected in Language Documentation

All language documentation follows the repository's core principles:

**Simplicity Over Complexity**:

- Prefer simple, clear code over clever solutions
- Use language features appropriately, not excessively
- Favor readability over premature optimization

**Explicit Over Implicit**:

- Make dependencies and behaviour explicit
- Avoid magic and hidden complexity
- Use clear, descriptive naming

**Immutability First**:

- Prefer immutable data structures
- Use functional programming patterns
- Minimize mutable state

**Security by Design**:

- Follow language-specific security best practices
- Validate inputs at system boundaries
- Apply principle of least privilege

### Adding a New Language

To document a new language:

1. Create directory: `docs/explanation/software-engineering/programming-languages/[language-name]/`
2. Create README.md with language overview
3. Create three core documents:
   - `idioms.md`
   - `best-practices.md`
   - `antipatterns.md`
4. Update this README.md with language section
5. Cross-reference with relevant documentation

### Updating Existing Documentation

- Keep content current with language evolution
- Cite authoritative sources (official docs, style guides)
- Include code examples from the platform when possible
- Mark deprecated patterns and suggest modern alternatives
- Keep content aligned with language evolution

## Related Documentation

- **[Software Design Index](../README.md)** - Parent software design documentation
- **[Architecture](../architecture/README.md)** - C4 and DDD documentation
- **[Development Practices](../development/README.md)** - TDD and BDD documentation
- **[Explanation Documentation Index](../../README.md)** - All conceptual documentation
- **[Monorepo Structure](../../../reference/monorepo-structure.md)** - Project organization
- **[Code Quality Standards](../../../../repo-governance/development/quality/code.md)** - Quality requirements
