---
title: "Overview"
weight: 10000000
date: 2026-03-19T00:00:00+07:00
draft: false
description: "Learn F# Giraffe through 80+ production-ready annotated examples covering HttpHandlers, routing, authentication, database access, testing, and deployment - achieving 95% framework mastery"
tags: ["giraffe", "fsharp", "web-framework", "tutorial", "by-example", "examples", "code-first"]
---

## Want to Master Giraffe Through Working Code?

This guide teaches you F# Giraffe through **80 production-ready code examples** rather than lengthy explanations. If you're an experienced developer adopting F# for web development, or a .NET developer moving from C# ASP.NET to functional F#, you'll build intuition through actual working patterns.

## What Is By-Example Learning?

By-example learning is a **code-first approach** where you learn concepts through annotated, working examples rather than narrative explanations. Each example shows:

1. **What the code does** - Brief explanation of the Giraffe concept
2. **How it works** - A focused, heavily commented code example
3. **Why it matters** - A pattern summary highlighting the key takeaway

This approach works best when you already understand programming fundamentals. You learn Giraffe's idioms, patterns, and best practices by studying real code rather than theoretical descriptions.

## What Is F# Giraffe?

Giraffe is a **functional ASP.NET Core web framework for F#** that embraces functional programming as a first-class design principle. Key distinctions:

- **Not MVC**: Giraffe composes HTTP handlers as pure functions rather than controller classes
- **Functional first**: The `HttpHandler` type (`HttpFunc -> HttpContext -> Task<HttpContext option>`) enables composable pipelines
- **ASP.NET Core native**: Runs on Kestrel, uses all ASP.NET Core middleware, DI, and hosting APIs
- **Type-safe routing**: Pattern matching on routes eliminates runtime errors from URL mismatches
- **F# idiomatic**: Discriminated unions, computation expressions, and immutable records feel natural

## Learning Path

```mermaid
graph TD
  A["Beginner<br/>Core Giraffe Concepts<br/>Examples 1-27"] --> B["Intermediate<br/>Production Patterns<br/>Examples 28-55"]
  B --> C["Advanced<br/>Scale and Operations<br/>Examples 56-80"]
  D["0%<br/>No Giraffe Knowledge"] -.-> A
  C -.-> E["95%<br/>Framework Mastery"]

  style A fill:#0173B2,color:#fff
  style B fill:#DE8F05,color:#fff
  style C fill:#029E73,color:#fff
  style D fill:#CC78BC,color:#fff
  style E fill:#029E73,color:#fff
```

## Coverage Philosophy: 95% Through 80 Examples

The **95% coverage** means you'll understand Giraffe deeply enough to build production systems with confidence. It does not mean you'll know every edge case or advanced feature - those come with experience.

The 80 examples are organized progressively:

- **Beginner (Examples 1-27)**: Foundation concepts (HttpHandler, routing, responses, model binding, ViewEngine, error handling, logging, configuration)
- **Intermediate (Examples 28-55)**: Production patterns (composition operators, authentication, authorization, DI, database, file upload, WebSocket, testing, streaming, CORS)
- **Advanced (Examples 56-80)**: Scale and operations (custom computation expressions, middleware deep dive, SignalR, health checks, metrics, OpenTelemetry, caching, API versioning, Docker, Kestrel tuning, rate limiting)

Together, these examples cover **95% of what you'll use** in production Giraffe applications.

## What's Covered

### Core Framework Concepts

- **HttpHandler type**: The fundamental `HttpFunc -> HttpContext -> Task<HttpContext option>` composition unit
- **Routing**: `choose`, `route`, `routef`, `routeStartsWith`, `subRoute`, path/query parameter extraction
- **Responses**: `text`, `json`, `htmlView`, `setStatusCode`, `redirectTo`, `setHttpHeader`, content negotiation
- **Request model binding**: `bindJson`, `bindForm`, `bindQueryString`, `tryBindJson`, `tryBindForm`
- **Giraffe ViewEngine**: Strongly-typed HTML DSL using F# discriminated unions and computation expressions

### Middleware and Composition

- **Composition operators**: `>=>` (fish operator) for sequential handler chaining
- **`choose` combinator**: Short-circuit routing with ordered handler selection
- **`warbler`**: Deferred handler construction for per-request logic
- **Custom HttpHandlers**: Building reusable middleware as composable functions
- **ASP.NET Core middleware**: Using `UseMiddleware`, `Use`, and `Run` alongside Giraffe

### Authentication and Authorization

- **JWT Bearer authentication**: Token validation, claims extraction, protected routes
- **Cookie authentication**: Session-based login, sign-in/sign-out, persistent sessions
- **`requiresAuthentication`**: Built-in Giraffe authorization handler
- **`requiresRole` and `requiresClaim`**: Fine-grained authorization handlers
- **Custom authorization**: Policy-based access control via ASP.NET Core authorization

### Data and Persistence

- **Dapper integration**: Lightweight SQL mapping with F# records and option types
- **Entity Framework Core**: Code-first with F# types, migrations, async queries
- **Repository pattern**: F# interfaces and DI for testable data access
- **Async workflows**: `task {}` computation expressions for non-blocking I/O

### Testing

- **Microsoft.AspNetCore.TestHost**: In-process integration testing
- **xUnit with F#**: Test organization, fixtures, and assertions
- **Handler unit testing**: Testing pure `HttpHandler` functions directly
- **Property-based testing**: FsCheck for invariant verification

### Production and Operations

- **Deployment**: .NET publish, Docker containerization, environment configuration
- **Observability**: Health checks, metrics (EventCounters), OpenTelemetry tracing
- **Performance**: Response caching, output caching, streaming responses
- **Resilience**: Rate limiting, Polly for retry/circuit breaker, graceful shutdown

## What's NOT Covered

We exclude topics that belong in specialized tutorials:

- **F# language fundamentals**: Master F# basics (pattern matching, computation expressions, type system) first through language tutorials
- **ASP.NET Core internals**: Kestrel internals, hosting model internals, request pipeline implementation details
- **Database-specific features**: Deep SQL optimization, PostgreSQL internals, complex schema design
- **Infrastructure**: Kubernetes, Terraform, cloud provider-specific deployment
- **Framework internals**: How Giraffe's HttpHandler machinery works under the hood

For these topics, see dedicated tutorials and official documentation.

## How to Use This Guide

### 1. Choose Your Starting Point

- **New to Giraffe?** Start with Beginner (Example 1)
- **Framework experience** (Express, Gin, Phoenix)? Start with Intermediate (Example 28)
- **Building a specific feature?** Search for the relevant example topic

### 2. Read the Example

Each example has five parts:

- **Explanation** (2-3 sentences): What Giraffe concept, why it exists, when to use it
- **Diagram** (optional): Mermaid diagram when visualizing flow improves understanding
- **Code** (with heavy annotations): Working F# code showing the pattern with `// =>` annotations
- **Key Takeaway** (1-2 sentences): Distilled essence of the pattern
- **Why It Matters** (50-100 words): Production context and impact

### 3. Run the Code

Create a minimal Giraffe project and run each example:

```bash
dotnet new web -lang F# -n GiraffeExamples
cd GiraffeExamples
dotnet add package Giraffe
# Paste example code, then:
dotnet run
```

### 4. Modify and Experiment

Change handler logic, add routes, break things on purpose. Experiment builds intuition faster than reading.

### 5. Reference as Needed

Use this guide as a reference when building features. Search for relevant examples and adapt patterns to your code.

## Relationship to Other Tutorial Types

| Tutorial Type               | Approach                     | Coverage          | Best For                      |
| --------------------------- | ---------------------------- | ----------------- | ----------------------------- |
| **By Example** (this guide) | Code-first, 80 examples      | 95% breadth       | Learning framework idioms     |
| **Quick Start**             | Project-based, hands-on      | 5-30% touchpoints | Getting something working     |
| **By Concept**              | Narrative, explanation-first | 0-95% depth       | Understanding concepts deeply |

## Prerequisites

### Required

- **F# fundamentals**: Functions, pattern matching, discriminated unions, records, computation expressions
- **Web development basics**: HTTP request/response cycle, JSON, REST conventions
- **.NET runtime**: Understanding of .NET Core hosting, `Program.fs` entry point

### Recommended

- **ASP.NET Core familiarity**: Middleware, DI container, configuration system
- **Async programming**: `Task<T>`, `async/await` patterns, or F# `async {}` workflows
- **SQL basics**: For database examples (Dapper/EF Core)

### Not Required

- **Giraffe experience**: This guide assumes you're new to the framework
- **C# ASP.NET experience**: Helpful but not necessary
- **Previous web framework experience**: Not required, but accelerates understanding

## Learning Strategies

### For F# Developers New to Giraffe

You know F# but haven't used Giraffe for web. Focus on understanding how HttpHandlers compose:

- **Master HttpHandler first** (Examples 1-5) - Understand the type signature before everything else
- **Routing and composition** (Examples 6-15) - The `>=>` operator and `choose` combinator define Giraffe's style
- **Recommended path**: Examples 1-27 (Beginner) → Examples 32-40 (Auth) → Examples 45-55 (Testing)

### For C# ASP.NET Core Developers Switching to F#

You know the hosting model but need the functional shift:

- **Understand HttpHandler vs Controller** (Examples 1-5) - Functions replace class methods
- **Composition over inheritance** (Examples 6-10) - `>=>` replaces middleware registration order
- **Immutable models** (Examples 16-20) - F# records replace mutable C# POCOs
- **Recommended path**: Examples 1-15 (Giraffe fundamentals) → Examples 28-35 (F# patterns in production)

### For Node.js/Express Developers

Express middleware conceptually maps to Giraffe's HttpHandler chain:

- **HttpHandler maps to Express middleware** - Both are `(req, res, next) -> unit` style but type-safe
- **`choose` maps to `app.use`** - Route selection in the same ordered-matching fashion
- **`>=>` maps to `next()`** - Chaining handlers explicitly instead of implicitly
- **Recommended path**: Examples 1-10 → Examples 28-35

### For Go/Gin Developers

Gin's handler-based routing closely mirrors Giraffe:

- **HttpHandler maps to `gin.HandlerFunc`** - Both are pure functions, Giraffe adds type safety via `option`
- **`choose` maps to router groups** - Ordered matching with early exit
- **`routef` maps to path parameters** - Type-safe extraction versus `c.Param()`
- **Recommended path**: Examples 1-27 (entire Beginner section) to learn F#-specific idioms

## Structure of Each Example

All examples follow a consistent 5-part format:

```
### Example N: Descriptive Title

2-3 sentence explanation of the concept and when to use it.

[Optional Mermaid diagram for complex flows]

```fsharp
// Heavily annotated code example
// showing the Giraffe pattern in action
// => annotations show values, types, and side effects
```

**Key Takeaway**: 1-2 sentence summary.

**Why It Matters**: 50-100 word production context.
```

**Code annotations**:

- `// =>` shows expected output, values, or inferred types
- Inline comments explain what each line does and why
- Variable names are self-documenting

**Mermaid diagrams** appear when visualizing flow or architecture improves understanding. We use a color-blind friendly palette:

- Blue #0173B2 - Primary
- Orange #DE8F05 - Secondary
- Teal #029E73 - Accent
- Purple #CC78BC - Alternative
- Brown #CA9161 - Neutral

## Ready to Start?

Choose your learning path:

- **[Beginner](/en/learn/software-engineering/platform-web/tools/fsharp-giraffe/by-example/beginner)** - Start here if new to Giraffe. Build foundation understanding through 27 core examples.
- **[Intermediate](/en/learn/software-engineering/platform-web/tools/fsharp-giraffe/by-example/intermediate)** - Jump here if you know Giraffe basics. Master production patterns through 28 examples.
- **[Advanced](/en/learn/software-engineering/platform-web/tools/fsharp-giraffe/by-example/advanced)** - Expert mastery through 25 advanced examples covering scale, performance, and operations.

Or jump to specific topics by searching for relevant example keywords (routing, authentication, testing, deployment, etc.).
