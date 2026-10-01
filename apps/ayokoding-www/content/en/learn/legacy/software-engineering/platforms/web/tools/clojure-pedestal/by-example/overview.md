---
title: "Overview"
weight: 10000000
date: 2026-03-19T00:00:00+07:00
draft: false
description: "Learn Clojure Pedestal through 80 production-ready annotated examples covering service maps, routing, interceptors, authentication, and deployment - achieving 95% framework mastery"
tags: ["pedestal", "clojure", "web-framework", "tutorial", "by-example", "examples", "code-first"]
---

## Want to Master Pedestal Through Working Code?

This guide teaches you Clojure Pedestal through **80 production-ready code examples** rather than lengthy explanations. If you're an experienced developer switching to Pedestal, or want to deepen your framework mastery, you'll build intuition through actual working patterns.

## What Is By-Example Learning?

By-example learning is a **code-first approach** where you learn concepts through annotated, working examples rather than narrative explanations. Each example shows:

1. **What the code does** - Brief explanation of the Pedestal concept
2. **How it works** - A focused, heavily commented code example
3. **Why it matters** - A pattern summary highlighting the key takeaway

This approach works best when you already understand programming fundamentals. You learn Pedestal's idioms, patterns, and best practices by studying real code rather than theoretical descriptions.

## What Is Clojure Pedestal?

Pedestal is a **web framework for Clojure** that centers everything on a single powerful abstraction: the **interceptor**. Key distinctions:

- **Not Ring/Compojure**: Pedestal goes beyond Ring middleware stacks with bidirectional interceptor chains that allow error handling in context
- **Data-driven**: Service configuration is a plain Clojure map, making services composable and testable without starting a real server
- **Interceptor-first**: Every concern (auth, logging, parsing, routing) becomes an interceptor with enter/leave/error stages
- **Immutable context**: The request context map flows through the chain, never mutated in place - pure Clojure philosophy
- **Multiple transports**: HTTP/1.1, HTTP/2, WebSocket, and Server-Sent Events with the same interceptor model

## Learning Path

```mermaid
graph TD
  accTitle: Learning Path
  accDescr: Graph with 5 nodes and 4 connections. Nodes: Beginner Core Pedestal Concepts Examples 1-27, Intermediate Production Patterns Examples 28-55, Advanced Scale & Resilience Examples 56-80, 0 No Pedestal Knowledge, 95 Framework Mastery. Connections: Beginner Core Pedestal Concepts Examples 1-27 to Intermediate Production Patterns Examples 28-55, Intermediate Production Patterns Examples 28-55 to Advanced Scale & Resilience Examples 56-80, 0 No Pedestal Knowledge to Beginner Core Pedestal Concepts Examples 1-27, Advanced Scale & Resilience Examples 56-80 to 95 Framework Mastery.
  A["Beginner<br/>Core Pedestal<br/>Concepts<br/>Examples 1-27"] --> B["Intermediate<br/>Production Patterns<br/>Examples 28-55"]
  B --> C["Advanced<br/>Scale & Resilience<br/>Examples 56-80"]
  D["0%<br/>No Pedestal<br/>Knowledge"] -.-> A
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

The **95% coverage** means you'll understand Pedestal deeply enough to build production systems with confidence. It doesn't mean you'll know every edge case or advanced feature - those come with experience.

The 80 examples are organized progressively:

- **Beginner (Examples 1-27)**: Foundation concepts (service map, routing, interceptors, request/response, params, JSON, error handling, logging, configuration)
- **Intermediate (Examples 28-55)**: Production patterns (interceptor chains, custom interceptors, auth, database, SSE, WebSocket, testing, CORS, async, streaming)
- **Advanced (Examples 56-80)**: Scale and resilience (interceptor composition, metrics, tracing, circuit breaker, caching, API versioning, Component/Integrant, Docker, production JVM tuning)

Together, these examples cover **95% of what you'll use** in production Pedestal applications.

## What's Covered

### Core Web Framework Concepts

- **Service Map**: The central data structure configuring routes, interceptors, host, port, and server type
- **Routing**: Table routes (explicit, named), terse routes (shorthand), hierarchical routing, HTTP verb dispatch
- **Request/Response**: The context map (`request`, `response`), params, headers, body coercion
- **Content Negotiation**: Built-in `io.pedestal.http.content-negotiation` interceptor, Accept header handling

### Interceptors

- **Interceptor Anatomy**: `:enter`, `:leave`, `:error` keys, the context map contract
- **Built-in Interceptors**: `io.pedestal.http.body-params`, `io.pedestal.http.ring-middlewares`, CORS
- **Custom Interceptors**: Writing pure interceptor maps with `interceptor/interceptor`
- **Interceptor Chains**: How Pedestal builds, executes, and short-circuits chains
- **Async Interceptors**: Returning `core.async` channels from enter/leave

### Data & Persistence

- **next.jdbc Integration**: Connection pools with HikariCP, query helpers, transaction management
- **Connection Pooling**: `next.jdbc.connection/pool` with Pedestal lifecycle
- **Migrations**: Migratus or Flyway integration patterns
- **Query Patterns**: `jdbc/execute!`, `jdbc/execute-one!`, `jdbc/with-transaction`

### Security & Authentication

- **Session-Based Auth**: Cookie sessions, login/logout interceptors
- **Token Auth**: JWT verification interceptor, `Authorization` header parsing
- **Authorization**: Role-based interceptors, short-circuit with `assoc :response`
- **CORS**: `io.pedestal.http.cors` built-in support

### Testing & Quality

- **`io.pedestal.test`**: `response-for` test helper, testing without a live server
- **Unit Testing Interceptors**: Testing enter/leave functions in isolation
- **Integration Testing**: Starting/stopping service in tests with `with-server`

### Production & Operations

- **Deployment**: Uberjar with `lein-uberjar`, Docker multi-stage builds
- **Configuration**: Environment-based config with `aero` or `cprop`
- **Observability**: Metrics with `iambrol/pedestal-metrics`, structured logging
- **JVM Tuning**: G1GC flags, heap sizing, container-aware JVM options

## What's NOT Covered

We exclude topics that belong in specialized tutorials:

- **Detailed Clojure syntax**: Master Clojure first through language tutorials
- **Advanced DevOps**: Kubernetes, service mesh, complex deployment pipelines
- **Database internals**: Deep PostgreSQL query planning, advanced SQL optimization
- **ClojureScript/frontend**: Reagent, re-frame, shadow-cljs (frontend-specific tutorials)
- **Pedestal internals**: How the servlet container integration works at the byte level

For these topics, see dedicated tutorials and framework documentation.

## How to Use This Guide

### 1. Choose Your Starting Point

- **New to Pedestal?** Start with Beginner (Example 1)
- **Framework experience** (Ring/Compojure, Spring, Django)? Start with Intermediate (Example 21)
- **Building a specific feature?** Search for relevant example topic

### 2. Read the Example

Each example has five parts:

- **Explanation** (2-3 sentences): What Pedestal concept, why it exists, when to use it
- **Diagram** (optional): Mermaid diagram for complex flows or data structures
- **Code** (with heavy comments): Working Clojure code showing the pattern
- **Key Takeaway** (1-2 sentences): Distilled essence of the pattern
- **Why It Matters** (50-100 words): Production relevance and real-world impact

### 3. Run the Code

Create a test project and run each example:

```bash
lein new pedestal-service my-app
cd my-app
# Paste example code into src/my_app/service.clj
lein run
```

### 4. Modify and Experiment

Change variable names, add interceptors, break things on purpose. Experiment builds intuition faster than reading.

### 5. Reference as Needed

Use this guide as a reference when building features. Search for relevant examples and adapt patterns to your code.

## Relationship to Other Tutorial Types

| Tutorial Type               | Approach                     | Coverage            | Best For                      |
| --------------------------- | ---------------------------- | ------------------- | ----------------------------- |
| **By Example** (this guide) | Code-first, 80 examples      | 95% breadth         | Learning framework idioms     |
| **Quick Start**             | Project-based, hands-on      | 5-30% touchpoints   | Getting something working     |
| **By Concept**              | Narrative, explanation-first | 0-95% comprehensive | Understanding concepts deeply |
| **Cookbook**                | Recipe-based                 | Problem-specific    | Solving specific problems     |

## Prerequisites

### Required

- **Clojure fundamentals**: Basic syntax, sequences, maps, functions, namespaces
- **Web development**: HTTP basics, REST concepts, JSON
- **Programming experience**: You've built applications before in another language

### Recommended

- **Ring knowledge**: Understanding Ring's request/response maps helps map concepts
- **Leiningen or deps.edn**: Build tool familiarity for project management
- **Relational databases**: SQL basics, schema design for database examples

### Not Required

- **Pedestal experience**: This guide assumes you're new to the framework
- **Clojure expertise**: Intermediate Clojure knowledge is sufficient
- **Erlang/OTP**: Pedestal runs on standard JVM, not BEAM

## Code Annotation Convention

All code examples use `;; =>` notation:

```clojure
(def x 10)               ;; => x is 10 (Long)
(str "hello " "world")   ;; => Returns "hello world" (String)
                          ;; => str concatenates all args as strings
(println x)              ;; => Output: 10
```

**Mermaid diagrams** appear when visualizing flow or architecture improves understanding. We use a color-blind friendly palette:

- Blue #0173B2 - Primary
- Orange #DE8F05 - Secondary
- Teal #029E73 - Accent
- Purple #CC78BC - Alternative
- Brown #CA9161 - Neutral

## Ready to Start?

Choose your learning path:

- **[Beginner](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/beginner)** - Start here if new to Pedestal. Build foundation understanding through 27 core examples.
- **[Intermediate](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/intermediate)** - Jump here if you know Pedestal basics. Master production patterns through 28 examples.
- **[Advanced](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/advanced)** - Expert mastery through 25 advanced examples covering scale, performance, and resilience.

Or jump to specific topics by searching for relevant example keywords (routing, interceptors, authentication, testing, deployment, etc.).

## Examples by Level

### Beginner (Examples 1–27)

- [Example 1: Minimal Pedestal Service](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/beginner#example-1-minimal-pedestal-service)
- [Example 2: Service Lifecycle with Start and Stop](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/beginner#example-2-service-lifecycle-with-start-and-stop)
- [Example 3: Development vs Production Service Maps](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/beginner#example-3-development-vs-production-service-maps)
- [Example 4: Table Routes](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/beginner#example-4-table-routes)
- [Example 5: Terse Routes](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/beginner#example-5-terse-routes)
- [Example 6: Query Parameters and Path Parameters](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/beginner#example-6-query-parameters-and-path-parameters)
- [Example 7: HTTP Verbs and RESTful Resources](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/beginner#example-7-http-verbs-and-restful-resources)
- [Example 8: Interceptor Anatomy](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/beginner#example-8-interceptor-anatomy)
- [Example 9: The Context Map](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/beginner#example-9-the-context-map)
- [Example 10: Short-Circuiting the Interceptor Chain](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/beginner#example-10-short-circuiting-the-interceptor-chain)
- [Example 11: Built-in Interceptors](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/beginner#example-11-built-in-interceptors)
- [Example 12: Response Maps](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/beginner#example-12-response-maps)
- [Example 13: Reading Request Headers](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/beginner#example-13-reading-request-headers)
- [Example 14: Serving JSON Responses](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/beginner#example-14-serving-json-responses)
- [Example 15: Content Negotiation](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/beginner#example-15-content-negotiation)
- [Example 16: Serving Static Files](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/beginner#example-16-serving-static-files)
- [Example 17: Basic Error Handling](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/beginner#example-17-basic-error-handling)
- [Example 18: Default 404 and Method Not Allowed](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/beginner#example-18-default-404-and-method-not-allowed)
- [Example 19: Structured Logging with SLF4J](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/beginner#example-19-structured-logging-with-slf4j)
- [Example 20: Environment-Based Configuration](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/beginner#example-20-environment-based-configuration)
- [Example 21: Custom Interceptors with `interceptor/interceptor`](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/beginner#example-21-custom-interceptors-with-interceptorinterceptor)
- [Example 22: Hierarchical Routes with Common Interceptors](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/beginner#example-22-hierarchical-routes-with-common-interceptors)
- [Example 23: URL Generation with `route/url-for`](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/beginner#example-23-url-generation-with-routeurl-for)
- [Example 24: Route Constraints](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/beginner#example-24-route-constraints)
- [Example 25: Router Inspection and Debugging](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/beginner#example-25-router-inspection-and-debugging)
- [Example 26: Helper Functions for Common Responses](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/beginner#example-26-helper-functions-for-common-responses)
- [Example 27: Request Validation with clojure.spec](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/beginner#example-27-request-validation-with-clojurespec)

### Intermediate (Examples 28–55)

- [Example 28: Interceptor Execution Order](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/intermediate#example-28-interceptor-execution-order)
- [Example 29: Manipulating the Interceptor Queue](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/intermediate#example-29-manipulating-the-interceptor-queue)
- [Example 30: Error Propagation Through the Chain](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/intermediate#example-30-error-propagation-through-the-chain)
- [Example 31: Session-Based Authentication](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/intermediate#example-31-session-based-authentication)
- [Example 32: JWT Token Authentication](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/intermediate#example-32-jwt-token-authentication)
- [Example 33: Role-Based Authorization](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/intermediate#example-33-role-based-authorization)
- [Example 34: next.jdbc Connection Pool](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/intermediate#example-34-nextjdbc-connection-pool)
- [Example 35: Basic CRUD with next.jdbc](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/intermediate#example-35-basic-crud-with-nextjdbc)
- [Example 36: Database Transactions](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/intermediate#example-36-database-transactions)
- [Example 37: Basic Server-Sent Events](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/intermediate#example-37-basic-server-sent-events)
- [Example 38: SSE with Database Polling](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/intermediate#example-38-sse-with-database-polling)
- [Example 39: Basic WebSocket Handler](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/intermediate#example-39-basic-websocket-handler)
- [Example 40: Testing with `io.pedestal.test`](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/intermediate#example-40-testing-with-iopedestaltest)
- [Example 41: Testing Interceptors in Isolation](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/intermediate#example-41-testing-interceptors-in-isolation)
- [Example 42: Testing with Mock Dependencies](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/intermediate#example-42-testing-with-mock-dependencies)
- [Example 43: CORS Configuration](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/intermediate#example-43-cors-configuration)
- [Example 44: Async Interceptors with core.async](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/intermediate#example-44-async-interceptors-with-coreasync)
- [Example 45: Streaming Large Responses](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/intermediate#example-45-streaming-large-responses)
- [Example 46: Multipart File Upload Handling](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/intermediate#example-46-multipart-file-upload-handling)
- [Example 47: Database Health Check Interceptor](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/intermediate#example-47-database-health-check-interceptor)
- [Example 48: Custom Content Type Handling](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/intermediate#example-48-custom-content-type-handling)
- [Example 49: Response Caching Interceptor](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/intermediate#example-49-response-caching-interceptor)
- [Example 50: Request ID and Correlation](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/intermediate#example-50-request-id-and-correlation)
- [Example 51: Request Timeout Interceptor](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/intermediate#example-51-request-timeout-interceptor)
- [Example 52: Wrapping Ring Middleware as Interceptors](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/intermediate#example-52-wrapping-ring-middleware-as-interceptors)
- [Example 53: Form POST Handling](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/intermediate#example-53-form-post-handling)
- [Example 54: Pagination Pattern](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/intermediate#example-54-pagination-pattern)
- [Example 55: Input Sanitization Interceptor](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/intermediate#example-55-input-sanitization-interceptor)

### Advanced (Examples 56–80)

- [Example 56: Interceptor Composition with `definterceptorfn`](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/advanced#example-56-interceptor-composition-with-definterceptorfn)
- [Example 57: Middleware Protocol Pattern](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/advanced#example-57-middleware-protocol-pattern)
- [Example 58: Metrics with Micrometer](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/advanced#example-58-metrics-with-micrometer)
- [Example 59: Distributed Tracing with OpenTelemetry](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/advanced#example-59-distributed-tracing-with-opentelemetry)
- [Example 60: Circuit Breaker Pattern](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/advanced#example-60-circuit-breaker-pattern)
- [Example 61: Retry with Exponential Backoff](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/advanced#example-61-retry-with-exponential-backoff)
- [Example 62: Application-Level Caching with Caffeine](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/advanced#example-62-application-level-caching-with-caffeine)
- [Example 63: Distributed Caching with Redis](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/advanced#example-63-distributed-caching-with-redis)
- [Example 64: URL-Based API Versioning](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/advanced#example-64-url-based-api-versioning)
- [Example 65: Header-Based API Versioning](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/advanced#example-65-header-based-api-versioning)
- [Example 66: Pedestal with Stuart Sierra's Component](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/advanced#example-66-pedestal-with-stuart-sierras-component)
- [Example 67: Pedestal with Integrant](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/advanced#example-67-pedestal-with-integrant)
- [Example 68: Uberjar Packaging](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/advanced#example-68-uberjar-packaging)
- [Example 69: Docker Multi-Stage Build](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/advanced#example-69-docker-multi-stage-build)
- [Example 70: JVM Options for Production](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/advanced#example-70-jvm-options-for-production)
- [Example 71: Graceful Shutdown](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/advanced#example-71-graceful-shutdown)
- [Example 72: Property-Based Testing of Interceptors](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/advanced#example-72-property-based-testing-of-interceptors)
- [Example 73: Load Testing with Gatling](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/advanced#example-73-load-testing-with-gatling)
- [Example 74: Security Headers Interceptor](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/advanced#example-74-security-headers-interceptor)
- [Example 75: SQL Injection Prevention](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/advanced#example-75-sql-injection-prevention)
- [Example 76: Route Groups with Versioned Namespaces](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/advanced#example-76-route-groups-with-versioned-namespaces)
- [Example 77: Websocket Rooms and Broadcasting](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/advanced#example-77-websocket-rooms-and-broadcasting)
- [Example 78: REST API for ClojureScript Frontend](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/advanced#example-78-rest-api-for-clojurescript-frontend)
- [Example 79: API Response Envelope for Frontend SDKs](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/advanced#example-79-api-response-envelope-for-frontend-sdks)
- [Example 80: Production Deployment Checklist Pattern](/en/learn/software-engineering/platforms/web/tools/clojure-pedestal/by-example/advanced#example-80-production-deployment-checklist-pattern)
