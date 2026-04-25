---
title: Libraries and Frameworks
description: Documentation on libraries and frameworks for building scalable applications across different technology stacks
category: explanation
subcategory: platform-web
tags:
  - libraries
  - frameworks
  - spring-boot
  - phoenix
  - react
  - index
created: 2026-01-25
---

# Libraries and Frameworks

**Understanding-oriented documentation** on libraries and frameworks used across different technology stacks in the open-sharia-enterprise platform.

## Overview

**The Framework Jungle**: Modern applications rely on frameworks and libraries to accelerate development. Each stack (JVM, Elixir, TypeScript) has its own ecosystem of tools, each with unique conventions, patterns, and best practices. Spring Boot's auto-configuration, Phoenix's channel abstraction, and React's component lifecycle all require deep understanding to use effectively.

**Curated Framework Guidance**: We provide comprehensive documentation for the key frameworks and libraries in our platform. Learn not just how to use them, but how to use them idiomatically, avoid common pitfalls, and integrate them into our architecture.

This directory contains framework and library documentation organized by technology stack. Each framework has comprehensive coverage of patterns, best practices, and antipatterns.

## Purpose

Understanding framework-specific patterns and best practices helps developers:

- Use frameworks idiomatically and effectively
- Avoid common integration pitfalls
- Maintain consistency across applications
- Leverage framework capabilities fully
- Make informed architectural decisions

## Authoritative Status

**This documentation is the authoritative reference** for framework-specific usage standards in the open-sharia-enterprise platform.

All applications using the frameworks documented here MUST follow the patterns and practices defined in this directory.

**For AI Agents**: Reference this documentation as the source of truth for:

- Framework-specific patterns and idioms
- Integration with platform architecture
- Configuration best practices
- Common framework antipatterns
- Testing approaches

<!-- TODO: Software Design Reference - Create governance documentation for software design principles -->

**Language Standards**: Also follow language-specific standards from [prog-lang](../programming-languages/README.md).

## Documentation Structure

### Technology Stacks

Each stack directory contains documentation for frameworks and libraries specific to that ecosystem:

```
platform-web/
└── tools/
    ├── jvm-spring-boot/     # Spring Boot framework (Java/Kotlin)
    ├── jvm-spring/          # Spring Framework (Java/Kotlin)
    ├── elixir-phoenix/      # Phoenix framework (Elixir)
    ├── fe-react/            # React library (TypeScript)
    └── fe-nextjs/           # Next.js framework (TypeScript)
```

### Document Organization

Each framework directory typically contains:

- **README.md** - Framework overview and version information
- **Patterns** - Common patterns and best practices
- **Integration** - How it integrates with platform architecture
- **Configuration** - Setup and configuration guidelines
- **Antipatterns** - Common mistakes to avoid

## Available Frameworks

### 🍃 [Spring Boot (JVM)](./tools/jvm-spring-boot/README.md)

**Modern Java application framework for building production-ready services**

Spring Boot is the primary backend framework for building REST APIs, domain services, and microservices. It provides auto-configuration, embedded servers, production-ready features, and seamless integration with the Spring ecosystem.

**Current Version**: Spring Boot 3.3+ (Java 17+ baseline, Java 21+ recommended, Jakarta EE 10)

**Use Spring Boot when you need:**

- Production-ready REST APIs with minimal configuration
- Integration with Spring Data, Spring Security, Spring Cloud
- Enterprise features (transactions, scheduling, caching)
- Convention-over-configuration approach
- Comprehensive monitoring and metrics

**Comprehensive Documentation Coverage**:

- **[Framework Overview](./tools/jvm-spring-boot/README.md)** - Version strategy, architecture integration, getting started
- **[Idioms](tools/jvm-spring-boot/idioms.md)** - Framework-specific patterns (auto-configuration, DI, profiles)
- **[Best Practices](tools/jvm-spring-boot/best-practices.md)** - Production standards (project structure, error handling, testing)
- **[Anti-Patterns](tools/jvm-spring-boot/anti-patterns.md)** - Common mistakes to avoid
- **[Configuration](tools/jvm-spring-boot/configuration.md)** - Environment management, properties, profiles
- **[Dependency Injection](tools/jvm-spring-boot/dependency-injection.md)** - IoC container, bean scopes, lifecycle
- **[REST APIs](tools/jvm-spring-boot/rest-apis.md)** - RESTful services, validation, exception handling
- **[Data Access](tools/jvm-spring-boot/data-access.md)** - Spring Data JPA, repositories, transactions
- **[Security](tools/jvm-spring-boot/security.md)** - Spring Security, OAuth2, JWT, method security
- **[Testing](tools/jvm-spring-boot/testing.md)** - Unit, integration, slice tests, TestContainers
- **[Observability](tools/jvm-spring-boot/observability.md)** - Actuator, metrics, health checks, tracing
- **[Performance](tools/jvm-spring-boot/performance.md)** - Optimization, caching, async processing
- **[Domain-Driven Design](tools/jvm-spring-boot/domain-driven-design.md)** - DDD tactical patterns with Spring
- **[Functional Programming](tools/jvm-spring-boot/functional-programming.md)** - FP patterns, immutability
- **[Version Migration](tools/jvm-spring-boot/version-migration.md)** - Spring Boot 2.x to 3.x upgrade guide

**Key Features**:

- **Auto-Configuration** - Intelligent defaults based on classpath and properties
- **Embedded Servers** - Tomcat, Jetty, Undertow for standalone deployment
- **Starter Dependencies** - Curated dependency sets (spring-boot-starter-web, -data-jpa, -security)
- **Production Metrics** - Actuator endpoints for health, metrics, and monitoring
- **Spring Ecosystem** - Seamless integration with Spring Data, Security, Cloud, Batch

**Architecture Integration**:

Spring Boot applications in the platform follow Domain-Driven Design principles with functional core/imperative shell separation. Services coordinate pure domain logic with side effects (persistence, events, external APIs).

**Quick Start**:

1. Review [Spring Boot README](./tools/jvm-spring-boot/README.md) for version strategy and architecture
2. Study [Idioms](tools/jvm-spring-boot/idioms.md) for framework patterns
3. Follow [Best Practices](tools/jvm-spring-boot/best-practices.md) for production standards
4. Apply consistent implementation patterns
5. Apply [Java coding standards](../programming-languages/java/README.md) for language-specific idioms

### 🔥 [Phoenix (Elixir)](./tools/elixir-phoenix/README.md)

**High-performance web framework built on the Erlang VM**

Phoenix is a web framework for building scalable, fault-tolerant real-time applications. It leverages Elixir's concurrency model and the battle-tested Erlang VM for handling millions of concurrent connections.

**Use Phoenix when you need:**

- Real-time features (WebSockets, channels, presence)
- Massive concurrency with low latency
- Fault-tolerant, self-healing systems
- Functional programming with immutability
- Productive development with hot code reloading

### ⚛️ [React (TypeScript)](./tools/fe-react/README.md)

**Component-based library for building user interfaces**

React is the primary frontend library for building interactive, maintainable user interfaces. Combined with TypeScript, it provides strong typing, excellent tooling, and a rich ecosystem of libraries.

**Use React when you need:**

- Declarative, component-based UI development
- Strong TypeScript integration and type safety
- Rich ecosystem (Next.js, Remix, testing libraries)
- Server-side rendering and static generation
- Modern frontend tooling and developer experience

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

**Developer Experience**:

- Clear conventions and best practices
- Quality tooling and IDE support
- Testing and debugging capabilities
- Active maintenance and updates

### Current Framework Usage

| Framework       | Technology Stack | Primary Use Cases                            | Status     |
| --------------- | ---------------- | -------------------------------------------- | ---------- |
| **Spring Boot** | JVM (Java)       | REST APIs, domain services, microservices    | 📋 Planned |
| **Phoenix**     | Elixir           | Real-time features, high-concurrency systems | 📋 Planned |
| **React**       | TypeScript       | Web applications, interactive UIs            | 📋 Planned |

**Legend**: ✅ Active (in production) | 📋 Planned (documentation ready, not yet implemented)

## Learning Paths

### For Backend Developers

1. **Java/Spring Boot path**:
   - Read [Spring Boot Overview](./tools/jvm-spring-boot/README.md)
   - Study Spring Boot patterns and best practices
   - Integrate with DDD patterns from [Architecture docs](../architecture/README.md)
   - Apply [Java idioms](../programming-languages/java/README.md)

2. **Elixir/Phoenix path**:
   - Read [Phoenix Overview](./tools/elixir-phoenix/README.md)
   - Study Phoenix channels and real-time patterns
   - Learn Elixir functional patterns
   - Understand BEAM VM concurrency model

### For Frontend Developers

1. **React/TypeScript path**:
   - Read [React Overview](./tools/fe-react/README.md)
   - Study React component patterns
   - Apply [TypeScript idioms](../programming-languages/typescript/README.md) (when available)
   - Learn state management approaches

### For Full-Stack Developers

1. Master both backend framework (Spring Boot or Phoenix)
2. Master frontend framework (React)
3. Understand API design and integration patterns
4. Practice end-to-end feature implementation

## Complementary Documentation

This framework documentation connects with:

- **[Programming Languages](../programming-languages/README.md)** - Language-specific idioms (Java, Elixir, TypeScript)
- **[Architecture](../architecture/README.md)** - C4 model, DDD patterns
- **[Development Practices](../development/README.md)** - TDD, BDD, testing strategies
- **[Functional Programming](../../../../governance/development/pattern/functional-programming.md)** - FP principles
- **[Monorepo Structure](../../../reference/monorepo-structure.md)** - Project organization

## Principles Reflected in Framework Documentation

All framework documentation follows the repository's core principles:

**Simplicity Over Complexity**:

- Use framework features appropriately, not excessively
- Prefer simple, clear configurations
- Avoid over-engineering and premature abstraction

**Explicit Over Implicit**:

- Make framework behavior explicit
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
