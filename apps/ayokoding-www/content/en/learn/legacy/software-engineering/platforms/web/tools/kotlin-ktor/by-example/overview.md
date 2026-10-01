---
title: "Overview"
weight: 10000000
date: 2026-03-19T00:00:00+07:00
draft: false
description: "Learn Kotlin Ktor through 80+ production-ready annotated examples covering routing, JSON, authentication, WebSocket, database, testing, and deployment - achieving 95% framework mastery"
tags: ["ktor", "kotlin", "web-framework", "tutorial", "by-example", "examples", "code-first"]
---

## Want to Master Ktor Through Working Code?

This guide teaches you Kotlin Ktor through **80 production-ready code examples** rather than lengthy explanations. If you are an experienced developer switching to Ktor, or want to deepen your framework mastery, you will build intuition through actual working patterns.

## What Is By-Example Learning?

By-example learning is a **code-first approach** where you learn concepts through annotated, working examples rather than narrative explanations. Each example shows:

1. **What the code does** - Brief explanation of the Ktor concept
2. **How it works** - A focused, heavily commented code example
3. **Why it matters** - A pattern summary highlighting the key takeaway

This approach works best when you already understand programming fundamentals and Kotlin basics. You learn Ktor's idioms, patterns, and best practices by studying real code rather than theoretical descriptions.

## What Is Kotlin Ktor?

Ktor is an **asynchronous web framework for Kotlin** built by JetBrains that prioritizes flexibility, lightweight footprint, and coroutine-native concurrency. Key distinctions:

- **Not Spring**: Ktor is minimal and explicit; Spring Boot does heavy auto-configuration by convention
- **Coroutine-native**: Every handler is a suspend function; concurrency uses structured Kotlin coroutines, not thread pools
- **Plugin-based**: Features like JSON serialization, authentication, and sessions are opt-in plugins installed explicitly
- **Embedded server**: Runs as a library inside your application; no container deployment required
- **Type-safe routing**: Routes use Kotlin DSL with type-safe parameter extraction via `TypedRoute` or path parameters
- **Both client and server**: Same framework provides `HttpClient` for making outbound HTTP requests

## Learning Path

```mermaid
graph TD
  accTitle: Learning Path
  accDescr: Graph with 5 nodes and 4 connections. Nodes: Beginner Core Ktor Concepts Examples 1-27, Intermediate Production Patterns Examples 28-55, Advanced Scale and Operations Examples 56-80, 0 No Ktor Knowledge, 95 Framework Mastery. Connections: Beginner Core Ktor Concepts Examples 1-27 to Intermediate Production Patterns Examples 28-55, Intermediate Production Patterns Examples 28-55 to Advanced Scale and Operations Examples 56-80, 0 No Ktor Knowledge to Beginner Core Ktor Concepts Examples 1-27, Advanced Scale and Operations Examples 56-80 to 95 Framework Mastery.
  A["Beginner<br/>Core Ktor Concepts<br/>Examples 1-27"] --> B["Intermediate<br/>Production Patterns<br/>Examples 28-55"]
  B --> C["Advanced<br/>Scale and Operations<br/>Examples 56-80"]
  D["0%<br/>No Ktor Knowledge"] -.-> A
  C -.-> E["95%<br/>Framework Mastery"]

  classDef pal-0173B2 fill:#0173B2,stroke:#000000,color:#FFFFFF
  class A pal-0173B2
  classDef pal-DE8F05 fill:#DE8F05,stroke:#000000,color:#000000
  class B pal-DE8F05
  classDef pal-029E73 fill:#029E73,stroke:#000000,color:#000000
  class C pal-029E73
  classDef pal-CC78BC fill:#CC78BC,stroke:#000000,color:#000000
  class D pal-CC78BC
  class E pal-029E73
  classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

## Coverage Philosophy: 95% Through 80 Examples

The **95% coverage** means you will understand Ktor deeply enough to build production systems with confidence. It does not mean you will know every edge case or advanced feature - those come with experience.

The 80 examples are organized progressively:

- **Beginner (Examples 1-27)**: Foundation concepts (embedded server, routing, request/response, JSON, status pages, static files, templates, headers, cookies, logging, CORS)
- **Intermediate (Examples 28-55)**: Production patterns (authentication, sessions, database with Exposed, plugins, WebSocket, testing, custom plugins, configuration, file upload, dependency injection)
- **Advanced (Examples 56-80)**: Scale and operations (custom plugin development, metrics, distributed tracing, SSL/TLS, HTTP/2, Ktor client, coroutine patterns, rate limiting, caching, API versioning, Docker, production configuration)

Together, these examples cover **95% of what you will use** in production Ktor applications.

## What Is Covered

### Core Web Framework Concepts

- **Embedded Server**: Starting Ktor with Netty, CIO, Jetty engine selection and configuration
- **Routing DSL**: Route groups, path parameters, query parameters, nested routing
- **Request Handling**: Reading body, headers, query params, form data, multipart uploads
- **Response Building**: Responding with text, JSON, HTML, status codes, custom headers
- **Content Negotiation**: Automatic JSON serialization with kotlinx.serialization and Gson
- **Status Pages**: Centralized exception handling and HTTP error responses

### Plugins and Middleware

- **Plugin Architecture**: Installing plugins via `install()`, configuring plugin options
- **Built-in Plugins**: CORS, compression, caching headers, default headers, call logging
- **Custom Plugins**: Creating reusable `ApplicationPlugin` and `RouteScopedPlugin`
- **Interceptors**: Request and response pipeline interception for cross-cutting concerns

### Authentication and Security

- **Basic Auth**: Username/password authentication with `authenticate` route blocks
- **JWT Authentication**: Bearer token validation, claims extraction, token generation
- **Session Auth**: Cookie-based sessions, session serialization, session storage
- **OAuth Integration**: OAuth2 with Google, GitHub via `OAuthServerSettings`
- **Form Auth**: HTML form login with credential validation

### Data and Persistence

- **Exposed ORM**: Kotlin's Exposed library for type-safe SQL queries
- **Database Config**: HikariCP connection pooling, transaction management
- **CRUD Operations**: Insert, select, update, delete with Exposed DSL and DAO API
- **Migrations**: Database schema migrations with Flyway integration

### Real-Time and Async

- **WebSocket**: Full-duplex communication with `webSocket {}` handler
- **Server-Sent Events**: Streaming responses with `respondTextWriter` for SSE
- **Coroutine Patterns**: Structured concurrency, `async`/`await`, channel-based streaming
- **Background Jobs**: Launching coroutines from route handlers safely

### Testing

- **testApplication**: Integration testing with `testApplication {}` builder
- **MockEngine**: Mocking `HttpClient` responses in unit tests
- **Assertions**: Asserting status codes, response bodies, headers
- **Test Fixtures**: Reusable test application setup and database seeding

### Production and Operations

- **Configuration (HOCON)**: `application.conf` with environment variable substitution
- **Deployment**: Fat JAR packaging, Docker containerization with multi-stage builds
- **Metrics**: Micrometer integration with Prometheus endpoint
- **Distributed Tracing**: OpenTelemetry span creation and propagation
- **SSL/TLS**: HTTPS configuration with keystore and Let's Encrypt certificates
- **Graceful Shutdown**: Stopping server cleanly on SIGTERM with coroutine cancellation

## What Is NOT Covered

We exclude topics that belong in specialized tutorials:

- **Detailed Kotlin syntax**: Master Kotlin first through language tutorials
- **Coroutines deep dive**: Ktor assumes coroutine familiarity; see Kotlin coroutines tutorials
- **Advanced DevOps**: Kubernetes, Terraform, complex multi-region deployments
- **Database internals**: Deep PostgreSQL query planning, advanced SQL optimization
- **Framework internals**: How Ktor's pipeline processes requests internally
- **gRPC with Ktor**: Uses different dependencies; see dedicated gRPC tutorials

For these topics, see dedicated tutorials and framework documentation.

## How to Use This Guide

### 1. Choose Your Starting Point

- **New to Ktor?** Start with Beginner (Example 1)
- **Framework experience** (Spring, Django, Rails)? Start with Intermediate (Example 28)
- **Building a specific feature?** Search for relevant example topic

### 2. Read the Example

Each example has five parts:

- **Brief Explanation** (2-3 sentences): What Ktor concept, why it exists, when to use it
- **Optional Diagram**: Mermaid diagram when concept relationships are complex
- **Code** (with heavy comments): Working Kotlin code showing the pattern
- **Key Takeaway** (1-2 sentences): Distilled essence of the pattern
- **Why It Matters** (50-100 words): Production context and real-world significance

### 3. Run the Code

Create a test project and run each example:

```bash
# Create new Ktor project with Gradle
mkdir ktor-examples && cd ktor-examples
gradle init --type kotlin-application
# Add Ktor dependencies to build.gradle.kts
# Paste example code into src/main/kotlin/Application.kt
./gradlew run
```

### 4. Modify and Experiment

Change variable names, add features, break things on purpose. Experiment builds intuition faster than reading.

### 5. Reference as Needed

Use this guide as a reference when building features. Search for relevant examples and adapt patterns to your code.

## Relationship to Other Tutorial Types

| Tutorial Type               | Approach                       | Coverage            | Best For                       | Why Different                       |
| --------------------------- | ------------------------------ | ------------------- | ------------------------------ | ----------------------------------- |
| **By Example** (this guide) | Code-first, 80 examples        | 95% breadth         | Learning framework idioms      | Emphasizes patterns through code    |
| **Quick Start**             | Project-based, hands-on        | 5-30% touchpoints   | Getting something working fast | Linear project flow, minimal theory |
| **Beginner Tutorial**       | Narrative, explanation-first   | 0-60% comprehensive | Understanding concepts deeply  | Detailed explanations, slower pace  |
| **Cookbook**                | Recipe-based, problem-solution | Problem-specific    | Solving specific problems      | Quick solutions, minimal context    |

## Prerequisites

### Required

- **Kotlin fundamentals**: Data classes, extension functions, lambdas, null safety
- **Coroutines basics**: `suspend` functions, `launch`, `async`, coroutine scope concepts
- **Web development**: HTTP basics, REST, JSON, HTML fundamentals
- **Programming experience**: You have built applications before in another language

### Recommended

- **Gradle build system**: Kotlin DSL build files, dependency management
- **Relational databases**: SQL basics, schema design, transactions
- **Docker**: Container basics for deployment examples

### Not Required

- **Ktor experience**: This guide assumes you are new to the framework
- **Spring or Java EE experience**: Not necessary, but helpful for context
- **Advanced Kotlin**: Generics, reified types (explained when used)

## Learning Strategies

### For Spring Boot Developers Switching to Ktor

Spring Boot developers will find Ktor intentionally minimal. Embrace explicit configuration:

- **Map Spring concepts**: Controllers become route handlers; `@Component` beans become constructor-injected classes; `@Autowired` becomes Koin/manual DI
- **Understand coroutine concurrency**: Replace thread-per-request mental model with coroutine suspension
- **Learn plugin installation**: Where Spring uses annotations and classpath scanning, Ktor uses explicit `install()`
- **Recommended path**: Examples 1-10 (Ktor basics) → Examples 28-35 (Auth patterns) → Examples 40-45 (Database)

### For Node.js Developers Switching to Ktor

Ktor's async model resembles Node.js but uses coroutines rather than an event loop:

- **Understand coroutine suspension**: Similar to async/await in JavaScript but with structured concurrency guarantees
- **Compare plugin installation**: Ktor plugins resemble Express middleware but installed via DSL
- **Learn Kotlin type safety**: Strong typing eliminates runtime type errors common in JavaScript
- **Recommended path**: Examples 1-15 (Ktor server and routing) → Examples 50-55 (WebSocket, coroutine patterns)

### For Python/FastAPI Developers Switching to Ktor

Both FastAPI and Ktor embrace async-first design:

- **Map decorators to DSL**: FastAPI's `@app.get("/path")` becomes `get("/path") { ... }` in Ktor routing
- **Compare Pydantic to data classes**: Kotlin data classes with kotlinx.serialization replace Pydantic models
- **Understand JVM startup cost**: Ktor starts slower than FastAPI but handles more concurrent requests
- **Recommended path**: Examples 1-12 (Routing and JSON) → Examples 28-40 (Auth and database)

### For Go/Gin Developers Switching to Ktor

Go and Ktor share minimalist philosophy but differ in concurrency model:

- **Coroutines vs goroutines**: Both are lightweight but Ktor uses structured concurrency with explicit scope
- **Plugin vs middleware**: Ktor plugins resemble Gin middleware but installed declaratively
- **Type safety over interfaces**: Kotlin's sealed classes and data classes give richer types than Go interfaces
- **Recommended path**: Examples 1-15 (Server basics) → Examples 48-55 (WebSocket, coroutines)

## Structure of Each Example

All examples follow a consistent 5-part format:

````
### Example N: Descriptive Title

2-3 sentence explanation of the concept.

[Optional Mermaid diagram]

```kotlin
// Heavily annotated code example
// showing the Ktor pattern in action
// => annotations show values, states, outputs
````

**Key Takeaway**: 1-2 sentence summary.

**Why It Matters**: 50-100 words explaining production significance.

```

**Code annotations**:

- `// =>` shows expected output or result value
- Inline comments explain what each line does and WHY
- Variable names are self-documenting
- Multiple code blocks used for before/after comparisons

**Mermaid diagrams** appear when visualizing flow or architecture improves understanding. The color-blind friendly palette used throughout:

- Blue #0173B2 - Primary elements
- Orange #DE8F05 - Secondary elements, decisions
- Teal #029E73 - Success paths, validation
- Purple #CC78BC - Special states, alternatives
- Brown #CA9161 - Neutral elements

## Ready to Start?

Choose your learning path:

- **[Beginner](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/beginner)** - Start here if new to Ktor. Build foundation understanding through 27 core examples covering embedded server, routing, JSON, and essential plugins.
- **[Intermediate](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/intermediate)** - Jump here if you know Ktor basics. Master production patterns through 28 examples covering authentication, database, WebSocket, and testing.
- **[Advanced](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/advanced)** - Expert mastery through 25 advanced examples covering custom plugins, metrics, tracing, SSL, coroutine patterns, and Docker deployment.
```

## Examples by Level

### Beginner (Examples 1–27)

- [Example 1: Minimal Embedded Server](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/beginner#example-1-minimal-embedded-server)
- [Example 2: Application Module Pattern](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/beginner#example-2-application-module-pattern)
- [Example 3: Engine Selection and Configuration](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/beginner#example-3-engine-selection-and-configuration)
- [Example 4: Basic Route Definitions](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/beginner#example-4-basic-route-definitions)
- [Example 5: Route Parameters and Query Strings](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/beginner#example-5-route-parameters-and-query-strings)
- [Example 6: Route Groups and Nested Routes](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/beginner#example-6-route-groups-and-nested-routes)
- [Example 7: Route Extensions and Separate Files](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/beginner#example-7-route-extensions-and-separate-files)
- [Example 8: Reading Request Bodies](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/beginner#example-8-reading-request-bodies)
- [Example 9: Response Building](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/beginner#example-9-response-building)
- [Example 10: Installing Content Negotiation with kotlinx.serialization](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/beginner#example-10-installing-content-negotiation-with-kotlinxserialization)
- [Example 11: JSON Response Customization](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/beginner#example-11-json-response-customization)
- [Example 12: StatusPages Plugin for Centralized Error Handling](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/beginner#example-12-statuspages-plugin-for-centralized-error-handling)
- [Example 13: Custom HTTP Status Handling](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/beginner#example-13-custom-http-status-handling)
- [Example 14: Serving Static Files](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/beginner#example-14-serving-static-files)
- [Example 15: FreeMarker Templates](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/beginner#example-15-freemarker-templates)
- [Example 16: Thymeleaf Templates](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/beginner#example-16-thymeleaf-templates)
- [Example 17: Reading and Writing Headers](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/beginner#example-17-reading-and-writing-headers)
- [Example 18: Cookies](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/beginner#example-18-cookies)
- [Example 19: CallLogging Plugin](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/beginner#example-19-calllogging-plugin)
- [Example 20: Structured Logging with Logback](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/beginner#example-20-structured-logging-with-logback)
- [Example 21: CORS Plugin Configuration](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/beginner#example-21-cors-plugin-configuration)
- [Example 22: CORS for Development vs Production](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/beginner#example-22-cors-for-development-vs-production)
- [Example 23: DefaultHeaders Plugin](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/beginner#example-23-defaultheaders-plugin)
- [Example 24: Compression Plugin](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/beginner#example-24-compression-plugin)
- [Example 25: Request Validation Plugin](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/beginner#example-25-request-validation-plugin)
- [Example 26: Forwarded Headers Behind a Proxy](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/beginner#example-26-forwarded-headers-behind-a-proxy)
- [Example 27: Caching Headers and Conditional Requests](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/beginner#example-27-caching-headers-and-conditional-requests)

### Intermediate (Examples 28–55)

- [Example 28: Basic Authentication](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/intermediate#example-28-basic-authentication)
- [Example 29: JWT Authentication](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/intermediate#example-29-jwt-authentication)
- [Example 30: Session-Based Authentication](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/intermediate#example-30-session-based-authentication)
- [Example 31: OAuth2 Authentication with GitHub](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/intermediate#example-31-oauth2-authentication-with-github)
- [Example 32: Exposed ORM Basic Setup](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/intermediate#example-32-exposed-orm-basic-setup)
- [Example 33: Exposed CRUD Operations](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/intermediate#example-33-exposed-crud-operations)
- [Example 34: Basic WebSocket Handler](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/intermediate#example-34-basic-websocket-handler)
- [Example 35: WebSocket with Session State](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/intermediate#example-35-websocket-with-session-state)
- [Example 36: testApplication for Integration Testing](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/intermediate#example-36-testapplication-for-integration-testing)
- [Example 37: Testing Authentication Endpoints](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/intermediate#example-37-testing-authentication-endpoints)
- [Example 38: Creating a Custom Application Plugin](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/intermediate#example-38-creating-a-custom-application-plugin)
- [Example 39: Route-Scoped Plugin](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/intermediate#example-39-route-scoped-plugin)
- [Example 40: HOCON Configuration with application.conf](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/intermediate#example-40-hocon-configuration-with-applicationconf)
- [Example 41: Multipart File Upload](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/intermediate#example-41-multipart-file-upload)
- [Example 42: Koin Dependency Injection Setup](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/intermediate#example-42-koin-dependency-injection-setup)
- [Example 43: Koin Testing Strategy](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/intermediate#example-43-koin-testing-strategy)
- [Example 44: Type-Safe Routing with Resources](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/intermediate#example-44-type-safe-routing-with-resources)
- [Example 45: API Versioning Strategies](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/intermediate#example-45-api-versioning-strategies)
- [Example 46: Structured Error Responses](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/intermediate#example-46-structured-error-responses)
- [Example 47: Background Coroutines from Route Handlers](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/intermediate#example-47-background-coroutines-from-route-handlers)
- [Example 48: Polymorphic Serialization](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/intermediate#example-48-polymorphic-serialization)
- [Example 49: Pipeline Interception](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/intermediate#example-49-pipeline-interception)
- [Example 50: Health Check and Readiness Endpoints](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/intermediate#example-50-health-check-and-readiness-endpoints)
- [Example 51: Server-Sent Events (SSE)](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/intermediate#example-51-server-sent-events-sse)
- [Example 52: Call ID and Distributed Tracing Basics](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/intermediate#example-52-call-id-and-distributed-tracing-basics)
- [Example 53: Graceful Shutdown](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/intermediate#example-53-graceful-shutdown)
- [Example 54: Pagination Pattern](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/intermediate#example-54-pagination-pattern)
- [Example 55: Compression and Chunked Response](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/intermediate#example-55-compression-and-chunked-response)

### Advanced (Examples 56–80)

- [Example 56: Advanced Plugin with Pipeline Phases](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/advanced#example-56-advanced-plugin-with-pipeline-phases)
- [Example 57: Plugin Composition and Ordering](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/advanced#example-57-plugin-composition-and-ordering)
- [Example 58: Micrometer Metrics Integration](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/advanced#example-58-micrometer-metrics-integration)
- [Example 59: Custom Timers and Histograms](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/advanced#example-59-custom-timers-and-histograms)
- [Example 60: OpenTelemetry Distributed Tracing](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/advanced#example-60-opentelemetry-distributed-tracing)
- [Example 61: HTTPS Configuration with SSL/TLS](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/advanced#example-61-https-configuration-with-ssltls)
- [Example 62: HTTP/2 with Ktor](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/advanced#example-62-http2-with-ktor)
- [Example 63: Ktor Client for Outbound HTTP](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/advanced#example-63-ktor-client-for-outbound-http)
- [Example 64: HTTP Client Retry and Error Handling](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/advanced#example-64-http-client-retry-and-error-handling)
- [Example 65: Structured Concurrency for Parallel Operations](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/advanced#example-65-structured-concurrency-for-parallel-operations)
- [Example 66: Flow-Based Streaming with Coroutines](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/advanced#example-66-flow-based-streaming-with-coroutines)
- [Example 67: In-Memory Caching with Cache4k](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/advanced#example-67-in-memory-caching-with-cache4k)
- [Example 68: Production Rate Limiting with Redis](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/advanced#example-68-production-rate-limiting-with-redis)
- [Example 69: Production Docker Configuration](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/advanced#example-69-production-docker-configuration)
- [Example 70: Environment-Based Configuration for Production](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/advanced#example-70-environment-based-configuration-for-production)
- [Example 71: Multi-Provider Authentication](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/advanced#example-71-multi-provider-authentication)
- [Example 72: Database Transactions and Rollback](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/advanced#example-72-database-transactions-and-rollback)
- [Example 73: Contract Testing with MockEngine](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/advanced#example-73-contract-testing-with-mockengine)
- [Example 74: Connection Pool Tuning and Monitoring](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/advanced#example-74-connection-pool-tuning-and-monitoring)
- [Example 75: Security Headers](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/advanced#example-75-security-headers)
- [Example 76: WebSocket with Binary Protocol](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/advanced#example-76-websocket-with-binary-protocol)
- [Example 77: Flyway Database Migrations](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/advanced#example-77-flyway-database-migrations)
- [Example 78: Coroutine Dispatcher Configuration](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/advanced#example-78-coroutine-dispatcher-configuration)
- [Example 79: Application Lifecycle Hooks](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/advanced#example-79-application-lifecycle-hooks)
- [Example 80: Production Monitoring Dashboard Summary](/en/learn/software-engineering/platforms/web/tools/kotlin-ktor/by-example/advanced#example-80-production-monitoring-dashboard-summary)
