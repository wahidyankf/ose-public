---
title: Libraries and Frameworks
description: Documentation on libraries and frameworks for building scalable applications
category: explanation
subcategory: platform-web
tags:
  - libraries
  - frameworks
  - react
  - nextjs
  - axum
  - index
created: 2026-01-25
---

# Libraries and Frameworks

Choose this area when you are deciding how a web experience will be built or need the conventions for the framework already in use. It connects the product experience to the technical practices that keep it maintainable.

## Overview

Modern web frameworks make many choices for a team, but those choices still need to fit the product and the repository. The guides here explain the supported frontend stack, its trade-offs, and the patterns that help it stay approachable as it grows.

## Purpose

Understanding framework-specific patterns and best practices helps developers:

- Use frameworks idiomatically and effectively
- Avoid common integration pitfalls
- Maintain consistency across applications
- Leverage framework capabilities fully
- Make informed architectural decisions

## Authoritative Status

**This documentation is the authoritative reference** for framework-specific usage standards in the open-sharia-enterprise platform.

**Language Standards**: Also follow language-specific standards from [prog-lang](../programming-languages/README.md).

## Documentation Structure

### Technology Stacks

- **[Tools Index](tools/README.md) — All web development frameworks and tools organized by technology stack**

Each stack directory contains documentation for frameworks and libraries specific to that ecosystem:

```
platform-web/
└── tools/
    ├── fe-react/            # React library (TypeScript)
    └── fe-nextjs/           # Next.js framework (TypeScript)
```

## Available Frameworks

### ⚛️ [React (TypeScript)](./tools/fe-react/README.md)

**Component-based library for building user interfaces**

React is the primary frontend library for building interactive, maintainable user interfaces. Combined with TypeScript, it provides strong typing, excellent tooling, and a rich ecosystem of libraries.

**Use React when you need:**

- Declarative, component-based UI development
- Strong TypeScript integration and type safety
- Rich ecosystem (Next.js, Remix, testing libraries)
- Server-side rendering and static generation
- Modern frontend tooling and developer experience

### 🔺 [Next.js (TypeScript)](./tools/fe-nextjs/README.md)

**Full-stack React framework for production web applications**

Next.js is the primary framework for OSE Platform web applications. It provides App Router capabilities and server-side rendering.

**Use Next.js when you need:**

- Full-stack TypeScript web applications
- App Router with React Server Components
- Static generation and server-side rendering
- A framework-level home for routing, rendering, and data access decisions

## How Frameworks Fit into the Platform

### Framework Selection Criteria

Frameworks in this documentation are chosen based on:

**Technical Excellence**:

- Production maturity and stability
- Performance characteristics
- Ecosystem quality and community support
- Documentation and learning resources

**Platform Alignment**:

- Alignment with functional programming principles
- Support for domain-driven design patterns
- Integration with Nx monorepo architecture
- Deployment and observability capabilities

### Current Framework Usage

| Framework   | Technology Stack | Primary Use Cases                 | Status    |
| ----------- | ---------------- | --------------------------------- | --------- |
| **Next.js** | TypeScript       | All OSE web applications          | ✅ Active |
| **React**   | TypeScript       | Web applications, interactive UIs | ✅ Active |

**Legend**: ✅ Active (in production) | 📋 Planned (documentation ready, not yet implemented)

## Complementary Documentation

This framework documentation connects with:

- **[Programming Languages](../programming-languages/README.md)** - Language-specific idioms (TypeScript, Rust, Go, F#)
- **[Architecture](../architecture/README.md)** - C4 model, DDD patterns
- **[Development Practices](../development/README.md)** - TDD, BDD, testing strategies
- **[Functional Programming](../../../../repo-governance/development/pattern/functional-programming.md)** - FP principles
- **[Monorepo Structure](../../../reference/monorepo-structure.md)** - Project organization

## Principles Reflected in Framework Documentation

All framework documentation follows the repository's core principles:

**Simplicity Over Complexity**:

- Use framework features appropriately, not excessively
- Prefer simple, clear configurations
- Avoid over-engineering and premature abstraction

**Explicit Over Implicit**:

- Make framework behaviour explicit
- Avoid magic and hidden complexity
- Document framework conventions clearly

**Functional Programming First**:

- Leverage functional patterns in frameworks
- Prefer immutability where possible
- Use pure functions for business logic

**Security by Design**:

- Follow framework security best practices
- Configure security features explicitly
- Apply defense-in-depth principles

## Related Documentation

- **[Software Design Index](../README.md)** - Parent software design documentation
- **[Programming Languages](../programming-languages/README.md)** - Language-specific documentation
- **[Architecture](../architecture/README.md)** - Architecture patterns and models
- **[Development Practices](../development/README.md)** - Development methodologies
- **[Monorepo Structure](../../../reference/monorepo-structure.md)** - Nx workspace organization

- [Web Development Tools and Frameworks](./tools/README.md) — Find the web framework guidance used by open-sharia-enterprise
