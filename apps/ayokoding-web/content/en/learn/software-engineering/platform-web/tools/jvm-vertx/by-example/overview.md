---
title: "Overview"
weight: 10000000
date: 2026-03-19T00:00:00+07:00
draft: false
description: "Learn Eclipse Vert.x through 80 production-ready annotated examples covering verticles, HTTP routing, reactive patterns, clustering, and deployment - achieving 95% framework mastery"
tags: ["vertx", "java", "reactive", "web-framework", "tutorial", "by-example", "examples", "code-first"]
---

## Want to Master Vert.x Through Working Code?

This guide teaches you Eclipse Vert.x through **80 production-ready code examples** rather than lengthy explanations. If you are an experienced developer switching to Vert.x, or want to deepen your reactive JVM skills, you will build intuition through actual working patterns.

## What Is By-Example Learning?

By-example learning is a **code-first approach** where you learn concepts through annotated, working examples rather than narrative explanations. Each example shows:

1. **What the code does** - Brief explanation of the Vert.x concept
2. **How it works** - A focused, heavily commented code example
3. **Why it matters** - A pattern summary highlighting the key takeaway

This approach works best when you already understand programming fundamentals. You learn Vert.x idioms, patterns, and best practices by studying real code rather than theoretical descriptions.

## What Is Eclipse Vert.x?

Vert.x is a **polyglot toolkit for building reactive applications on the JVM**. Key distinctions:

- **Not a framework**: Vert.x is a toolkit—opinionated about reactivity, unopinionated about architecture
- **Event-loop driven**: A small number of threads handle millions of concurrent connections via non-blocking I/O
- **Polyglot**: First-class support for Java, Kotlin, Groovy, JavaScript, Ruby, and Scala
- **Composable**: Mix verticles, event bus, and web router freely—use only what you need
- **Production-grade**: Used at scale by Red Hat, Deutsche Telekom, and other enterprises

## Learning Path

```mermaid
graph TD
  A["Beginner<br/>Core Vert.x Concepts<br/>Examples 1-27"] --> B["Intermediate<br/>Production Patterns<br/>Examples 28-55"]
  B --> C["Advanced<br/>Scale and Resilience<br/>Examples 56-80"]
  D["0%<br/>No Vert.x Knowledge"] -.-> A
  C -.-> E["95%<br/>Framework Mastery"]

  style A fill:#0173B2,color:#fff
  style B fill:#DE8F05,color:#fff
  style C fill:#029E73,color:#fff
  style D fill:#CC78BC,color:#fff
  style E fill:#029E73,color:#fff
```

## Coverage Philosophy: 95% Through 80 Examples

The **95% coverage** means you will understand Vert.x deeply enough to build production systems with confidence. It does not mean you will know every edge case or advanced API—those come with experience.

The 80 examples are organized progressively:

- **Beginner (Examples 1-27)**: Foundation concepts (verticles, HTTP server, routing, request/response, JSON, path params, query params, request body, static files, templates, error handling, event bus basics, configuration, logging)
- **Intermediate (Examples 28-55)**: Production patterns (event bus advanced, Web Router advanced, JWT auth, OAuth2, CORS, file upload, WebSocket, SQL client, reactive patterns, testing, circuit breaker, health checks, sub-routers, middleware chain)
- **Advanced (Examples 56-80)**: Scale and resilience (clustering, HA, service discovery, Micrometer metrics, distributed tracing, gRPC, GraalVM native image, streaming, backpressure, custom codec, worker verticles, shared data, SSL/TLS, Docker deployment, production configuration)

Together, these examples cover **95% of what you will use** in production Vert.x applications.

## What's Covered

### Core Vert.x Concepts

- **Verticles**: Standard, worker, and multi-threaded verticles; deployment options; lifecycle hooks
- **Event Loop**: Non-blocking programming model; golden rule (never block the event loop); thread model
- **Event Bus**: Publish/subscribe, point-to-point, request/reply; local and clustered event bus
- **Futures and Promises**: Composing async operations; `compose`, `onSuccess`, `onFailure`, `all`, `any`

### HTTP and Web

- **HTTP Server**: Creating servers; request/response; status codes; headers; chunked responses
- **Vert.x Web Router**: Route matching; path/query params; body handling; middleware handlers
- **Static Files and Templates**: Static file serving; Handlebars/Thymeleaf templates
- **WebSocket**: Upgrading connections; sending/receiving frames; broadcast patterns
- **File Upload**: Multipart form handling; file persistence; upload validation

### Data and Persistence

- **Vert.x SQL Client**: Reactive PostgreSQL client; parameterized queries; connection pools
- **JSON Handling**: `JsonObject`, `JsonArray`; serialization; codec registration; type mapping
- **Shared Data**: `SharedData`; `LocalMap`; `AsyncMap`; distributed locks

### Security

- **JWT Authentication**: Token generation; route protection; claims extraction
- **OAuth2**: Authorization code flow; token introspection; provider configuration
- **CORS**: Cross-origin policy; preflight handling; allowed origins/headers/methods
- **SSL/TLS**: HTTPS server configuration; certificate handling; mutual TLS

### Testing and Quality

- **Vert.x Unit**: `VertxExtension` for JUnit 5; async test helpers; `TestContext`
- **Integration Testing**: Deploying verticles in tests; real HTTP via WebClient
- **Circuit Breaker**: Half-open state; fallback handlers; metrics integration

### Production and Operations

- **Health Checks**: Liveness/readiness probes; custom procedures; HTTP endpoint exposure
- **Metrics**: Micrometer integration; Prometheus scraping; JVM metrics
- **Distributed Tracing**: OpenTelemetry integration; span propagation; trace sampling
- **Clustering**: Hazelcast cluster manager; distributed event bus; cluster-wide shared data
- **Docker Deployment**: Fat JAR packaging; container configuration; environment variable injection

## What's NOT Covered

We exclude topics that belong in specialized tutorials:

- **Detailed Java syntax**: Master Java fundamentals first through language tutorials
- **Advanced DevOps**: Kubernetes operators, infrastructure-as-code, complex CI/CD pipelines
- **Database internals**: Deep PostgreSQL query planning, advanced replication setups
- **BEAM vs JVM comparison**: Language runtime internals belong in platform comparison guides
- **Framework internals**: How Vert.x schedules event loop threads, Netty internals

For these topics, see dedicated tutorials and framework documentation.

## How to Use This Guide

### 1. Choose Your Starting Point

- **New to Vert.x?** Start with Beginner (Example 1)
- **Framework experience** (Spring Boot, Node.js, Netty)? Start with Intermediate (Example 28)
- **Building a specific feature?** Search for the relevant example topic

### 2. Read the Example

Each example has five parts:

- **Explanation** (2-3 sentences): What Vert.x concept, why it exists, when to use it
- **Diagram** (optional): Visual flow for complex concepts
- **Code** (with heavy comments): Working Java code showing the pattern
- **Key Takeaway** (1-2 sentences): Distilled essence of the pattern
- **Why It Matters** (50-100 words): Production relevance and design rationale

### 3. Run the Code

Create a Vert.x project and run each example:

```bash
# Maven starter
mvn archetype:generate \
  -DarchetypeGroupId=io.vertx \
  -DarchetypeArtifactId=vertx-maven-archetype \
  -DarchetypeVersion=RELEASE

cd my-vertx-project
mvn compile exec:java
```

### 4. Modify and Experiment

Change handler logic, add routes, break things on purpose. Experimentation builds intuition faster than reading.

### 5. Reference as Needed

Use this guide as a reference when building features. Search for relevant examples and adapt patterns to your code.

## Relationship to Other Tutorial Types

| Tutorial Type               | Approach                       | Coverage                   | Best For                       | Why Different                       |
| --------------------------- | ------------------------------ | -------------------------- | ------------------------------ | ----------------------------------- |
| **By Example** (this guide) | Code-first, 80 examples        | 95% breadth                | Learning framework idioms      | Emphasizes patterns through code    |
| **Quick Start**             | Project-based, hands-on        | 5-30% touchpoints          | Getting something working fast | Linear project flow, minimal theory |
| **Beginner Tutorial**       | Narrative, explanation-first   | 0-60% comprehensive        | Understanding concepts deeply  | Detailed explanations, slower pace  |
| **Intermediate Tutorial**   | Problem-solving, practical     | 60-85% production patterns | Building real features         | Focus on common problems            |
| **Advanced Tutorial**       | Specialized topics, deep dives | 85-95% expert mastery      | Optimizing, scaling, internals | Advanced edge cases                 |
| **Cookbook**                | Recipe-based, problem-solution | Problem-specific           | Solving specific problems      | Quick solutions, minimal context    |

## Prerequisites

### Required

- **Java fundamentals**: Classes, interfaces, generics, lambdas, streams
- **Web development**: HTTP basics, REST concepts, JSON
- **Programming experience**: You have built applications before in another language

### Recommended

- **Maven or Gradle**: Build tool familiarity for dependency management
- **Relational databases**: SQL basics, schema design, JDBC concepts
- **Async programming**: Basic understanding of callbacks, futures, or promises

### Not Required

- **Vert.x experience**: This guide assumes you are new to the framework
- **Netty knowledge**: Vert.x wraps Netty; you do not need to know Netty internals
- **Reactive Streams**: Helpful context but not required to start

## Learning Strategies

Different developer backgrounds benefit from customized learning paths. Choose the strategy matching your experience:

### For Spring Boot Developers Switching to Vert.x

You know the JVM and HTTP concepts. Focus on the reactive mental model shift:

- **Understand the event loop first** (Examples 1-3) - The single biggest conceptual shift from Spring's thread-per-request model
- **Learn Futures** (Examples 4-5) - Replaces Spring's `@Async` and `CompletableFuture` with composable reactive chains
- **Map annotations to handlers** - Spring `@GetMapping` maps to `router.get("/path", handler)`; no reflection at runtime
- **Recommended path**: Examples 1-10 (core concepts) → Examples 28-35 (advanced routing and auth) → Examples 56-65 (clustering and metrics)

### For Node.js Developers Switching to Vert.x

The event-loop model is familiar. Focus on JVM patterns and type safety:

- **Map callbacks to handlers** - Vert.x handlers are similar to Node.js callbacks but type-safe
- **Learn verticles** (Examples 1-2) - Similar to Node.js modules/services but with isolation and messaging
- **Understand the event bus** (Examples 13-15) - Powerful alternative to Node.js EventEmitter
- **Recommended path**: Examples 1-15 (Vert.x fundamentals) → Examples 28-40 (production patterns) → Examples 56-70 (clustering and native)

### For Java EE/Jakarta EE Developers Switching to Vert.x

You know Java deeply. Focus on non-blocking I/O and reactive composition:

- **Abandon blocking I/O** - No JDBC, no synchronized blocks, no Thread.sleep in event-loop context
- **Learn Vert.x SQL client** (Examples 43-46) - Replaces JDBC with fully async database access
- **Understand deployment** (Examples 1-2) - Verticles replace EJBs/CDI beans; lighter and more explicit
- **Recommended path**: Examples 1-8 (core) → Examples 43-55 (data and testing) → Examples 56-80 (advanced)

### For Complete Framework Beginners

You know Java but have never built a web service. Take a methodical approach:

- **Follow sequential order** - Examples 1-80 in order; each builds on previous concepts
- **Run every example** - Paste code into a project; watch it work before moving on
- **Build small projects** - After Beginner examples, build a simple REST API to consolidate learning
- **Recommended path**: Examples 1-27 (Beginner) → Build simple REST API → Examples 28-55 (Intermediate) → Build authenticated WebSocket service → Examples 56-80 (Advanced)

## Structure of Each Example

All examples follow a consistent 5-part format:

```
### Example N: Descriptive Title

2-3 sentence explanation of the concept.

[Optional Mermaid diagram for complex flows]

```java
// Heavily annotated code example
// showing the Vert.x pattern in action
```

**Key Takeaway**: 1-2 sentence summary.

**Why It Matters**: 50-100 words explaining production relevance.
```

**Code annotations**:

- `// =>` shows expected output or result
- Inline comments explain what each line does
- Variable names are self-documenting

**Mermaid diagrams** appear when visualizing flow or architecture improves understanding. We use a color-blind friendly palette:

- Blue #0173B2 - Primary
- Orange #DE8F05 - Secondary
- Teal #029E73 - Accent
- Purple #CC78BC - Alternative
- Brown #CA9161 - Neutral

## Ready to Start?

Choose your learning path:

- **[Beginner](/en/learn/software-engineering/platform-web/tools/jvm-vertx/by-example/beginner)** - Start here if new to Vert.x. Build foundation understanding through 27 core examples.
- **[Intermediate](/en/learn/software-engineering/platform-web/tools/jvm-vertx/by-example/intermediate)** - Jump here if you know Vert.x basics. Master production patterns through 28 examples.
- **[Advanced](/en/learn/software-engineering/platform-web/tools/jvm-vertx/by-example/advanced)** - Expert mastery through 25 advanced examples covering clustering, metrics, and deployment.

Or jump to specific topics by searching for relevant example keywords (routing, JWT, WebSocket, SQL, clustering, GraalVM, etc.).
