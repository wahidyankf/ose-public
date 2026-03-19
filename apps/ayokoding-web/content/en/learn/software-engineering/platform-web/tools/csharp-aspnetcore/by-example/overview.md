---
title: "Overview"
weight: 10000000
date: 2026-03-19T00:00:00+07:00
draft: false
description: "Learn ASP.NET Core 8 through 80 production-ready annotated examples covering minimal APIs, routing, authentication, EF Core, testing, and deployment - achieving 95% framework mastery"
tags: ["aspnetcore", "csharp", "dotnet", "web-framework", "tutorial", "by-example", "examples", "code-first"]
---

## Want to Master ASP.NET Core Through Working Code?

This guide teaches you ASP.NET Core 8 through **80 production-ready code examples** rather than lengthy explanations. If you are an experienced developer switching to .NET, or want to deepen your framework mastery, you will build intuition through actual working patterns.

## What Is By-Example Learning?

By-example learning is a **code-first approach** where you learn concepts through annotated, working examples rather than narrative explanations. Each example shows:

1. **What the code does** - Brief explanation of the ASP.NET Core concept
2. **How it works** - A focused, heavily commented code example
3. **Why it matters** - A pattern summary highlighting the key takeaway

This approach works best when you already understand programming fundamentals. You learn ASP.NET Core's idioms, patterns, and best practices by studying real code rather than theoretical descriptions.

## What Is ASP.NET Core?

ASP.NET Core is a **cross-platform, high-performance web framework for .NET** that prioritizes developer productivity and application reliability. Key distinctions:

- **Not legacy ASP.NET**: ASP.NET Core is a complete rewrite - lightweight, modular, and cross-platform
- **Minimal APIs first**: .NET 6+ introduced a concise, function-based API model without ceremony
- **Unified pipeline**: A single middleware pipeline handles HTTP, WebSockets, and gRPC
- **Dependency injection built-in**: First-class DI container is central to the framework design
- **Cloud-native**: Designed for containers, microservices, and cloud deployment from day one
- **High performance**: Consistently ranks at the top of TechEmpower benchmarks

## Learning Path

```mermaid
graph TD
  A["Beginner<br/>Core ASP.NET Core Concepts<br/>Examples 1-27"] --> B["Intermediate<br/>Production Patterns<br/>Examples 28-55"]
  B --> C["Advanced<br/>Scale and Operations<br/>Examples 56-80"]
  D["0%<br/>No ASP.NET Core Knowledge"] -.-> A
  C -.-> E["95%<br/>Framework Mastery"]

  style A fill:#0173B2,color:#fff
  style B fill:#DE8F05,color:#fff
  style C fill:#029E73,color:#fff
  style D fill:#CC78BC,color:#fff
  style E fill:#029E73,color:#fff
```

## Coverage Philosophy: 95% Through 80 Examples

The **95% coverage** means you will understand ASP.NET Core deeply enough to build production systems with confidence. It does not mean you will know every edge case or advanced feature - those come with experience.

The 80 examples are organized progressively:

- **Beginner (Examples 1-27)**: Foundation concepts (minimal APIs, routing, path and query params, JSON, model binding, validation, middleware, error handling, logging, configuration, DI basics)
- **Intermediate (Examples 28-55)**: Production patterns (controllers, filters, JWT and cookie auth, authorization policies, EF Core, file upload, CORS, WebSockets, SignalR, testing, health checks, background services, caching, rate limiting)
- **Advanced (Examples 56-80)**: Scale and operations (custom middleware, output caching, response compression, gRPC, OpenTelemetry, metrics, Kestrel, Docker, API versioning, OpenAPI, global error handling, custom DI)

Together, these examples cover **95% of what you will use** in production ASP.NET Core applications.

## What Is Covered

### Core Web Framework Concepts

- **Minimal APIs**: Route handlers, endpoint filters, route groups, typed results
- **Routing**: Pattern matching, constraints, HTTP verb mapping, route parameters
- **Request/Response**: Model binding, validation, content negotiation, status codes
- **Middleware Pipeline**: Built-in middleware, custom middleware, pipeline ordering

### Security

- **Authentication**: JWT bearer tokens, cookie authentication, API keys
- **Authorization**: Policy-based, role-based, resource-based authorization
- **Data Protection**: Token generation, cookie encryption, HTTPS enforcement

### Data Access

- **EF Core Basics**: DbContext, migrations, CRUD operations, LINQ queries
- **Advanced EF Core**: Relationships, transactions, raw SQL, connection resiliency
- **Caching**: In-memory cache, distributed cache (Redis), response caching

### Real-Time and Communication

- **WebSockets**: Raw WebSocket handling
- **SignalR**: Hubs, typed clients, groups, connection management
- **gRPC**: Service definition, server streaming, client streaming

### Testing and Quality

- **Integration Testing**: WebApplicationFactory, HTTP client testing
- **Unit Testing**: Service isolation, mocking dependencies
- **Health Checks**: Built-in checks, custom health indicators, readiness/liveness probes

### Production and Operations

- **Deployment**: Docker containerization, environment configuration, Kestrel tuning
- **Observability**: OpenTelemetry tracing, metrics, structured logging with Serilog
- **Performance**: Output caching, response compression, rate limiting
- **API Design**: Versioning, OpenAPI/Swagger, problem details

## What Is NOT Covered

We exclude topics that belong in specialized tutorials:

- **Detailed C# syntax**: Master C# first through language tutorials
- **Blazor**: Server-side and WASM rendering (separate tutorial path)
- **Razor Pages / MVC Views**: HTML templating with cshtml (API-focused guide)
- **Advanced DevOps**: Kubernetes, Helm charts, complex CI/CD pipelines
- **Database internals**: Deep SQL Server or PostgreSQL optimization
- **Framework internals**: How Kestrel processes connections, thread pool details

For these topics, see dedicated tutorials and framework documentation.

## How to Use This Guide

### 1. Choose Your Starting Point

- **New to ASP.NET Core?** Start with Beginner (Example 1)
- **Framework experience** (Spring, Django, Rails)? Start with Intermediate (Example 28)
- **Building a specific feature?** Search for relevant example topics

### 2. Read the Example

Each example has five parts:

- **Brief explanation** (2-3 sentences): What concept, why it exists, when to use it
- **Optional diagram**: Mermaid diagram for complex flow or architecture
- **Code** (with heavy comments): Working C# code showing the pattern
- **Key Takeaway** (1-2 sentences): Distilled essence of the pattern
- **Why It Matters** (50-100 words): Production relevance and real-world impact

### 3. Run the Code

Create a test project and run each example:

```bash
dotnet new web -n MyApp
cd MyApp
# Paste example code into Program.cs
dotnet run
```

### 4. Modify and Experiment

Change variable names, add features, break things on purpose. Experiment builds intuition faster than reading.

### 5. Reference as Needed

Use this guide as a reference when building features. Search for relevant examples and adapt patterns to your code.

## Relationship to Other Tutorial Types

| Tutorial Type               | Approach                       | Coverage          | Best For                       |
| --------------------------- | ------------------------------ | ----------------- | ------------------------------ |
| **By Example** (this guide) | Code-first, 80 examples        | 90% breadth       | Learning framework idioms      |
| **Quick Start**             | Project-based, hands-on        | 5-30% touchpoints | Getting something working fast |
| **By Concept**              | Narrative, explanation-first   | 0-95% progressive | Understanding concepts deeply  |
| **Cookbook**                | Recipe-based, problem-solution | Problem-specific  | Solving specific problems      |

## Prerequisites

### Required

- **C# fundamentals**: Basic syntax, classes, interfaces, async/await, LINQ
- **Web development**: HTTP basics, REST principles, JSON
- **Programming experience**: You have built applications before in another language

### Recommended

- **.NET toolchain**: dotnet CLI, understanding of projects and solutions
- **Relational databases**: SQL basics, schema design
- **Git**: Version control for managing code

### Not Required

- **ASP.NET Core experience**: This guide assumes you are new to the framework
- **C# expertise**: We assume intermediate C# knowledge
- **Azure/cloud experience**: Not necessary, though helpful

## Learning Strategies

### For Java Spring Developers Switching to ASP.NET Core

You know Spring but are new to .NET. Focus on mental model mapping:

- **Map annotations to attributes**: Spring's `@GetMapping` becomes `[HttpGet]`; `@RestController` maps to minimal API handlers or `[ApiController]` classes
- **DI is built-in**: ASP.NET Core's DI works similarly to Spring but without annotation scanning; see Examples 17-18
- **Middleware vs filters**: ASP.NET Core middleware is similar to Spring's servlet filters; see Examples 10-14
- **EF Core vs JPA/Hibernate**: Code-first migrations and LINQ vs schema-first and JPQL; see Examples 28-35
- **Recommended path**: Examples 1-10 (Core minimal APIs) → Examples 28-38 (EF Core) → Examples 39-45 (Auth)

### For Python Django/FastAPI Developers Switching to ASP.NET Core

Phoenix's typed approach differs significantly from Python's dynamic typing:

- **Strong typing everywhere**: C#'s type system catches errors at compile time that Python finds at runtime; embrace record types and generics
- **async/await patterns**: C# async is syntactically similar to Python but semantically different (no GIL); see Examples 15-16
- **DI container**: Similar to FastAPI's `Depends()` system but more explicit; see Examples 17-18
- **EF Core vs Django ORM**: Different migration and query patterns; EF Core is code-first by default
- **Recommended path**: Examples 1-12 (HTTP basics) → Examples 17-20 (DI and configuration) → Examples 28-38 (EF Core)

### For Node.js/Express Developers Switching to ASP.NET Core

The middleware model is familiar, but C# types change everything:

- **Middleware pipeline is similar**: ASP.NET Core middleware chains like Express middleware; ordering matters the same way
- **Typed route handlers**: Route parameters require explicit types vs JavaScript's dynamic params object
- **Dependency injection**: More structured than Node.js patterns; no module-level singletons
- **Recommended path**: Examples 1-15 (Minimal APIs and middleware) → Examples 39-45 (JWT auth) → Examples 56-65 (Advanced patterns)

### For Complete Framework Beginners

You know C# but are new to web development:

- **Learn HTTP first**: Understand request-response, status codes, and headers before diving into the framework
- **Follow sequential order**: Read Examples 1-80 in order; each builds on previous concepts
- **Run every example**: Create a test project and verify each example works as shown
- **Build small projects**: After Beginner, build a simple CRUD API to consolidate learning
- **Recommended path**: Examples 1-27 (Beginner) → Build a CRUD API → Examples 28-55 (Intermediate) → Add auth and database → Examples 56-80 (Advanced)

## Structure of Each Example

All examples follow a consistent 5-part format:

```
### Example N: Descriptive Title

2-3 sentence explanation of the concept.

[Optional Mermaid diagram]

```csharp
// Heavily annotated code example
// showing the ASP.NET Core pattern in action
```

**Key Takeaway**: 1-2 sentence summary.

**Why It Matters**: 50-100 words on production relevance.
```

**Code annotations**:

- `// =>` shows expected output or result values
- Inline comments explain what each line does and why
- Variable names are self-documenting

**Mermaid diagrams** appear when visualizing flow or architecture improves understanding. The color-blind friendly palette used throughout:

- Blue #0173B2 - Primary elements
- Orange #DE8F05 - Decisions, warnings
- Teal #029E73 - Success, validation
- Purple #CC78BC - Special states
- Brown #CA9161 - Neutral elements

## Ready to Start?

Choose your learning path:

- **[Beginner](/en/learn/software-engineering/platform-web/tools/csharp-aspnetcore/by-example/beginner)** - Start here if new to ASP.NET Core. Build foundation understanding through 27 core examples.
- **[Intermediate](/en/learn/software-engineering/platform-web/tools/csharp-aspnetcore/by-example/intermediate)** - Jump here if you know the basics. Master production patterns through 28 examples.
- **[Advanced](/en/learn/software-engineering/platform-web/tools/csharp-aspnetcore/by-example/advanced)** - Expert mastery through 25 advanced examples covering scale, performance, and operations.

Or jump to specific topics by searching for relevant example keywords (routing, authentication, EF Core, testing, deployment, gRPC, SignalR, etc.).
