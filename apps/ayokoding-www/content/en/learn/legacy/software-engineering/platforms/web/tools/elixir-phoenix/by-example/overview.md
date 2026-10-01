---
title: "Overview"
weight: 10000000
date: 2025-12-25T16:18:56+07:00
draft: false
description: "Learn Elixir Phoenix through 80+ production-ready annotated examples covering routing, LiveView, authentication, and deployment - achieving 95% framework mastery"
tags: ["phoenix", "elixir", "web-framework", "tutorial", "by-example", "examples", "code-first"]
---

## Want to Master Phoenix Through Working Code?

This guide teaches you Elixir Phoenix through **80+ production-ready code examples** rather than lengthy explanations. If you're an experienced developer switching to Phoenix, or want to deepen your framework mastery, you'll build intuition through actual working patterns.

## What Is By-Example Learning?

By-example learning is a **code-first approach** where you learn concepts through annotated, working examples rather than narrative explanations. Each example shows:

1. **What the code does** - Brief explanation of the Phoenix concept
2. **How it works** - A focused, heavily commented code example
3. **Why it matters** - A pattern summary highlighting the key takeaway

This approach works best when you already understand programming fundamentals. You learn Phoenix's idioms, patterns, and best practices by studying real code rather than theoretical descriptions.

## What Is Elixir Phoenix?

Phoenix is a **web framework for Elixir** that prioritizes developer productivity and application reliability. Key distinctions:

- **Not Rails**: Phoenix is more explicit and performant than Rails, designed for Erlang's BEAM VM
- **Real-time first**: Built-in support for WebSockets, channels, and live updates (LiveView)
- **Functional**: Leverages Elixir's functional paradigm for safer, more maintainable code
- **Fault-tolerant**: Supervision trees and process isolation provide resilience by default
- **Modern**: Phoenix 1.7+ includes verified routes, function components, and unified HEEx templates

## Learning Path

```mermaid
graph TD
  accTitle: Learning Path
  accDescr: Graph with 5 nodes and 4 connections. Nodes: Beginner Core Phoenix Concepts Examples 1-25, Intermediate Production Patterns Examples 26-50, Advanced Scale & Resilience Examples 51-80, 0 No Phoenix Knowledge, 95 Framework Mastery. Connections: Beginner Core Phoenix Concepts Examples 1-25 to Intermediate Production Patterns Examples 26-50, Intermediate Production Patterns Examples 26-50 to Advanced Scale & Resilience Examples 51-80, 0 No Phoenix Knowledge to Beginner Core Phoenix Concepts Examples 1-25, Advanced Scale & Resilience Examples 51-80 to 95 Framework Mastery.
  A["Beginner<br/>Core Phoenix<br/>Concepts<br/>Examples 1-25"] --> B["Intermediate<br/>Production Patterns<br/>Examples 26-50"]
  B --> C["Advanced<br/>Scale & Resilience<br/>Examples 51-80"]
  D["0%<br/>No Phoenix Knowledge"] -.-> A
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

## Coverage Philosophy: 95% Through 80+ Examples

The **95% coverage** means you'll understand Phoenix deeply enough to build production systems with confidence. It doesn't mean you'll know every edge case or advanced feature—those come with experience.

The 80 examples are organized progressively:

- **Beginner (Examples 1-25)**: Foundation concepts (routing, controllers, LiveView basics, Ecto fundamentals, forms, components)
- **Intermediate (Examples 26-50)**: Production patterns (advanced LiveView, real-time features, authentication, testing, APIs)
- **Advanced (Examples 51-80)**: Scale and resilience (database optimization, performance, deployment, monitoring, distributed systems)

Together, these examples cover **95% of what you'll use** in production Phoenix applications.

## What's Covered

### Core Web Framework Concepts

- **Routing & HTTP**: Router pipelines, verified routes (~p sigil), REST resource definitions, controller actions
- **Templates & Views**: HEEx syntax, function components, slots, layout inheritance
- **Request/Response**: Conn manipulation, params handling, content negotiation, status codes
- **Plugs & Middleware**: Custom plugs, pipeline composition, authorization middleware

### Real-Time & LiveView

- **LiveView Lifecycle**: Mount, render, handle_event, handle_params, socket assigns
- **LiveView Components**: Stateful vs function components, slots, event handling
- **LiveView Features**: Streams for efficient list updates, async operations, uploads, JS interop
- **Phoenix Channels**: Real-time bidirectional communication, presence tracking, PubSub

### Data & Persistence

- **Ecto Basics**: Schemas, migrations, changesets, validation, CRUD operations
- **Query Language**: Pipe-based queries, associations, preloading, aggregations
- **Advanced Patterns**: Transactions, multi-tenancy, polymorphic associations, custom types
- **Database**: PostgreSQL features, query optimization, connection pooling

### Security & Authentication

- **Session-Based Auth**: Login flows, password hashing, session management
- **Token-Based Auth**: JWT tokens, API authentication, token refresh
- **Authorization**: Role-based access control, permission checks, policy modules
- **Third-Party Auth**: OAuth2 integration, social login (Google, GitHub)

### Testing & Quality

- **Unit & Integration Tests**: ConnCase, LiveView testing, mocking external services
- **Test Fixtures**: ExMachina factories, database seeds, test data
- **Code Quality**: Testing patterns, assertion helpers, debugging techniques

### Production & Operations

- **Deployment**: Mix releases, Docker containerization, environment configuration
- **Observability**: Health checks, metrics collection (Telemetry), error tracking, structured logging
- **Performance**: Query optimization, caching strategies, background jobs (Oban), LiveDashboard
- **Resilience**: Rate limiting, circuit breakers, graceful shutdown, distributed Phoenix

## What's NOT Covered

We exclude topics that belong in specialized tutorials:

- **Detailed Elixir syntax**: Master Elixir first through language tutorials
- **Advanced DevOps**: Kubernetes, infrastructure-as-code, complex deployments
- **Database-specific features**: Deep PostgreSQL internals, advanced SQL optimization
- **Language internals**: BEAM scheduler details, memory management, Erlang distribution protocols
- **Framework internals**: How Phoenix processes requests internally, supervision tree architecture

For these topics, see dedicated tutorials and framework documentation.

## How to Use This Guide

### 1. **Choose Your Starting Point**

- **New to Phoenix?** Start with Beginner (Example 1)
- **Framework experience** (Rails, Django, Spring)? Start with Intermediate (Example 21)
- **Building specific feature?** Search for relevant example topic

### 2. **Read the Example**

Each example has three parts:

- **Explanation** (2-3 sentences): What Phoenix concept, why it exists, when to use it
- **Code** (with heavy comments): Working Elixir code showing the pattern
- **Key Takeaway** (1-2 sentences): Distilled essence of the pattern

### 3. **Run the Code**

Create a test project and run each example:

```bash
mix phx.new my_app --no-ecto
cd my_app
# Paste example code
iex -S mix phx.server
```

### 4. **Modify and Experiment**

Change variable names, add features, break things on purpose. Experiment builds intuition faster than reading.

### 5. **Reference as Needed**

Use this guide as a reference when building features. Search for relevant examples and adapt patterns to your code.

## Relationship to Other Tutorial Types

| Tutorial Type               | Approach                       | Coverage                   | Best For                       | Why Different                       |
| --------------------------- | ------------------------------ | -------------------------- | ------------------------------ | ----------------------------------- |
| **By Example** (this guide) | Code-first, 60+ examples       | 90% breadth                | Learning framework idioms      | Emphasizes patterns through code    |
| **Quick Start**             | Project-based, hands-on        | 5-30% touchpoints          | Getting something working fast | Linear project flow, minimal theory |
| **Beginner Tutorial**       | Narrative, explanation-first   | 0-60% comprehensive        | Understanding concepts deeply  | Detailed explanations, slower pace  |
| **Intermediate Tutorial**   | Problem-solving, practical     | 60-85% production patterns | Building real features         | Focus on common problems            |
| **Advanced Tutorial**       | Specialized topics, deep dives | 85-95% expert mastery      | Optimizing, scaling, internals | Advanced edge cases                 |
| **Cookbook**                | Recipe-based, problem-solution | Problem-specific           | Solving specific problems      | Quick solutions, minimal context    |

## Prerequisites

### Required

- **Elixir fundamentals**: Basic syntax, pipe operator, pattern matching, functional concepts
- **Web development**: HTTP basics, HTML, CSS, JavaScript fundamentals
- **Programming experience**: You've built applications before in another language

### Recommended

- **Erlang/OTP knowledge**: Processes, message passing, supervision basics
- **Relational databases**: SQL basics, schema design, join concepts
- **Git**: Version control for managing code

### Not Required

- **Phoenix experience**: This guide assumes you're new to the framework
- **Elixir expertise**: We assume beginner-to-intermediate Elixir knowledge
- **Web framework experience**: Not necessary, but helpful

## Learning Strategies

Different developer backgrounds benefit from customized learning paths through Phoenix. Choose the strategy matching your experience:

### For Elixir Developers New to Phoenix

You know Elixir but haven't used Phoenix. Focus on understanding Phoenix conventions and web patterns:

- **Start with routing and controllers** (Examples 1-5) - Understand request-response cycle before diving into LiveView
- **Master LiveView early** (Examples 10-15) - Phoenix's LiveView is unique; grasp its stateful nature and socket assigns
- **Focus on contexts** (Examples 8-12) - Phoenix contexts define boundaries; understand context design for clean architecture
- **Leverage Ecto knowledge** - If you know Ecto, Examples 16-20 reinforce query patterns and changesets in Phoenix context
- **Recommended path**: Examples 1-25 (Beginner) → 30-35 (Authentication) → 40-45 (Real-time patterns)

### For Ruby/Rails Developers Switching to Phoenix

Phoenix borrows concepts from Rails but differs in fundamental ways. Focus on understanding functional paradigm shifts:

- **Map MVC to Phoenix** - Controllers similar but functional; views are function components (not classes); models are Ecto schemas (not ActiveRecord)
- **Understand contexts vs Rails models** - Phoenix contexts explicitly define boundaries; Rails uses implicit model associations
- **Learn pattern matching** - Replaces conditional logic common in Rails controllers; see Examples 3-7 for Phoenix patterns
- **Grasp LiveView vs Hotwire** - LiveView is server-rendered interactivity (similar to Hotwire) but more powerful; see Examples 10-15
- **Focus on immutability** - Elixir's immutable data structures require different mental model than Rails' mutable ActiveRecord objects
- **Recommended path**: Examples 1-10 (Phoenix fundamentals) → Examples 20-25 (Ecto vs ActiveRecord) → Examples 30-40 (LiveView patterns)

### For Python/Django Developers Switching to Phoenix

Phoenix's architecture resembles Django but with functional programming at its core:

- **Map Django concepts** - Phoenix contexts similar to Django apps; Ecto schemas similar to Django models; templates use similar syntax
- **Understand functional programming** - Immutable data and pattern matching replace Python's imperative style
- **Learn process-based concurrency** - BEAM's lightweight processes different from Django's threading/async views; see Examples 50-55
- **Compare Ecto to Django ORM** - Ecto uses changesets for validation (separate from schemas); Django combines them in models
- **Focus on LiveView** - Server-rendered interactivity without JavaScript complexity; see Examples 10-20
- **Recommended path**: Examples 1-15 (Core Phoenix) → Examples 20-30 (Ecto patterns) → Examples 35-45 (LiveView vs Django templates)

### For Node.js Developers Switching to Phoenix

Phoenix's concurrency model and functional approach differ significantly from Node.js:

- **Understand process concurrency** - BEAM's lightweight processes replace Node.js event loop; see Examples 50-60 for GenServer patterns
- **Learn LiveView vs React/Vue** - Server-rendered interactivity eliminates need for client-side frameworks; see Examples 10-25
- **Grasp functional patterns** - Elixir's immutability and pattern matching replace JavaScript's imperative/functional hybrid
- **Compare Ecto to Sequelize/Prisma** - Different query building approach; Ecto more composable via pipe operator
- **Focus on Channels** - Similar to Socket.io but integrated into Phoenix; see Examples 45-50
- **Recommended path**: Examples 1-10 (Phoenix basics) → Examples 10-20 (LiveView) → Examples 45-55 (Channels and real-time)

### For Complete Framework Beginners

You're new to Elixir, Phoenix, and web frameworks. Take a methodical, sequential approach:

- **Master Elixir first** - Complete Elixir fundamentals (pattern matching, pipe operator, functions, modules) before starting Phoenix
- **Learn OTP basics** - Understand GenServer, Supervisor, process communication for Phoenix's fault tolerance (Examples 55-60 show this)
- **Follow sequential order** - Read Examples 1-80 in order; each builds on previous concepts and Phoenix conventions
- **Run every example** - Don't just read; run Phoenix generators (`mix phx.gen.html`, `mix phx.gen.live`) to see idiomatic code
- **Build small projects** - After Beginner examples, build a simple CRUD app with LiveView to consolidate learning
- **Recommended path**: Elixir fundamentals → OTP basics → Examples 1-25 (Beginner) → Build simple LiveView app → Examples 26-50 (Intermediate) → Build real-time feature → Examples 51-80 (Advanced)

## Structure of Each Example

All examples follow a consistent 5-part format:

````
### Example N: Descriptive Title

2-3 sentence explanation of the concept.

```elixir
# Heavily annotated code example
# showing the Phoenix pattern in action
````

**Key Takeaway**: 1-2 sentence summary.

```

**Code annotations**:

- `# =>` shows expected output or result
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

- **[Beginner](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/beginner)** - Start here if new to Phoenix. Build foundation understanding through 25 core examples.
- **[Intermediate](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/intermediate)** - Jump here if you know Phoenix basics. Master production patterns through 25 examples.
- **[Advanced](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/advanced)** - Expert mastery through 30 advanced examples covering scale, performance, and resilience.

Or jump to specific topics by searching for relevant example keywords (routing, authentication, LiveView, testing, deployment, etc.).
```

## Examples by Level

### Beginner (Examples 1–25)

- [Example 1: Phoenix Application Starter](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/beginner#example-1-phoenix-application-starter)
- [Example 2: Routing Basics](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/beginner#example-2-routing-basics)
- [Example 3: Controllers and Actions](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/beginner#example-3-controllers-and-actions)
- [Example 4: Plugs - Request Transformation](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/beginner#example-4-plugs---request-transformation)
- [Example 5: Templates and Layouts](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/beginner#example-5-templates-and-layouts)
- [Example 6: Static Assets Pipeline](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/beginner#example-6-static-assets-pipeline)
- [Example 7: First LiveView Component](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/beginner#example-7-first-liveview-component)
- [Example 8: LiveView Events](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/beginner#example-8-liveview-events)
- [Example 9: LiveView Navigation](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/beginner#example-9-liveview-navigation)
- [Example 10: LiveView Components](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/beginner#example-10-liveview-components)
- [Example 11: Schema and Migrations](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/beginner#example-11-schema-and-migrations)
- [Example 12: Ecto Queries](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/beginner#example-12-ecto-queries)
- [Example 13: Changesets and Validation](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/beginner#example-13-changesets-and-validation)
- [Example 14: Associations - One-to-Many](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/beginner#example-14-associations---one-to-many)
- [Example 15: CRUD Operations](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/beginner#example-15-crud-operations)
- [Example 16: LiveView Forms](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/beginner#example-16-liveview-forms)
- [Example 17: Form Validation Feedback](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/beginner#example-17-form-validation-feedback)
- [Example 18: File Uploads in LiveView](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/beginner#example-18-file-uploads-in-liveview)
- [Example 19: Multi-Step Forms](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/beginner#example-19-multi-step-forms)
- [Example 20: JSON API Endpoints](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/beginner#example-20-json-api-endpoints)
- [Example 21: Nested Resources and Scoped Routes](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/beginner#example-21-nested-resources-and-scoped-routes)
- [Example 22: Error Handling and Custom Error Pages](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/beginner#example-22-error-handling-and-custom-error-pages)
- [Example 23: Flash Messages for User Feedback](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/beginner#example-23-flash-messages-for-user-feedback)
- [Example 24: Query Parameters and Filtering](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/beginner#example-24-query-parameters-and-filtering)
- [Example 25: Content Negotiation - HTML vs JSON](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/beginner#example-25-content-negotiation---html-vs-json)

### Intermediate (Examples 26–50)

- [Example 26: LiveView Streams](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/intermediate#example-26-liveview-streams)
- [Example 27: Async Operations with Loading States](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/intermediate#example-27-async-operations-with-loading-states)
- [Example 28: LiveView File Uploads with External Storage](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/intermediate#example-28-liveview-file-uploads-with-external-storage)
- [Example 29: Stateful Live Components](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/intermediate#example-29-stateful-live-components)
- [Example 30: LiveView JS Interop with Phoenix.LiveView.JS](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/intermediate#example-30-liveview-js-interop-with-phoenixliveviewjs)
- [Example 31: Optimistic UI Updates with Rollback](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/intermediate#example-31-optimistic-ui-updates-with-rollback)
- [Example 32: Phoenix Channels - Basic Communication](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/intermediate#example-32-phoenix-channels---basic-communication)
- [Example 33: PubSub for LiveView Updates](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/intermediate#example-33-pubsub-for-liveview-updates)
- [Example 34: Presence Tracking](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/intermediate#example-34-presence-tracking)
- [Example 35: Channel Authentication](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/intermediate#example-35-channel-authentication)
- [Example 36: Channel Testing](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/intermediate#example-36-channel-testing)
- [Example 37: Session-Based Authentication](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/intermediate#example-37-session-based-authentication)
- [Example 38: Password Hashing and Reset](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/intermediate#example-38-password-hashing-and-reset)
- [Example 39: Role-Based Access Control](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/intermediate#example-39-role-based-access-control)
- [Example 40: JWT Token Authentication for APIs](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/intermediate#example-40-jwt-token-authentication-for-apis)
- [Example 41: OAuth2 Social Login](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/intermediate#example-41-oauth2-social-login)
- [Example 42: Controller Testing with ConnCase](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/intermediate#example-42-controller-testing-with-conncase)
- [Example 43: LiveView Component Testing](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/intermediate#example-43-liveview-component-testing)
- [Example 44: Test Fixtures with ExMachina](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/intermediate#example-44-test-fixtures-with-exmachina)
- [Example 45: Mocking External Services with Mox](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/intermediate#example-45-mocking-external-services-with-mox)
- [Example 46: API Pagination with Scrivener](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/intermediate#example-46-api-pagination-with-scrivener)
- [Example 47: API Versioning Strategies](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/intermediate#example-47-api-versioning-strategies)
- [Example 48: Rate Limiting per API Key](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/intermediate#example-48-rate-limiting-per-api-key)
- [Example 49: WebSocket Heartbeat and Reconnection](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/intermediate#example-49-websocket-heartbeat-and-reconnection)
- [Example 50: Compression and Response Optimization](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/intermediate#example-50-compression-and-response-optimization)

### Advanced (Examples 51–80)

- [Example 51: Transactions and Concurrency with Ecto.Multi](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/advanced#example-51-transactions-and-concurrency-with-ectomulti)
- [Example 52: Database Constraints and Error Handling](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/advanced#example-52-database-constraints-and-error-handling)
- [Example 53: Polymorphic Associations with many_to_many :through](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/advanced#example-53-polymorphic-associations-with-many_to_many-through)
- [Example 54: Multi-Tenancy with Ecto Query Prefix](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/advanced#example-54-multi-tenancy-with-ecto-query-prefix)
- [Example 55: PostgreSQL Advanced Features in Ecto](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/advanced#example-55-postgresql-advanced-features-in-ecto)
- [Example 56: Query Optimization - N+1 Prevention](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/advanced#example-56-query-optimization---n1-prevention)
- [Example 57: Caching Strategies](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/advanced#example-57-caching-strategies)
- [Example 58: Background Jobs with Oban](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/advanced#example-58-background-jobs-with-oban)
- [Example 59: Phoenix LiveDashboard for Metrics](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/advanced#example-59-phoenix-livedashboard-for-metrics)
- [Example 60: Custom Metrics with Telemetry](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/advanced#example-60-custom-metrics-with-telemetry)
- [Example 61: Mix Releases for Production](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/advanced#example-61-mix-releases-for-production)
- [Example 62: Docker Containerization with Multi-Stage Build](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/advanced#example-62-docker-containerization-with-multi-stage-build)
- [Example 63: Health Checks for Kubernetes](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/advanced#example-63-health-checks-for-kubernetes)
- [Example 64: Graceful Shutdown](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/advanced#example-64-graceful-shutdown)
- [Example 65: Environment Configuration Management](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/advanced#example-65-environment-configuration-management)
- [Example 66: Error Tracking and Structured Logging](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/advanced#example-66-error-tracking-and-structured-logging)
- [Example 67: Rate Limiting with Token Bucket](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/advanced#example-67-rate-limiting-with-token-bucket)
- [Example 68: Distributed Phoenix Clustering](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/advanced#example-68-distributed-phoenix-clustering)
- [Example 69: WebSocket Load Balancing with Sticky Sessions](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/advanced#example-69-websocket-load-balancing-with-sticky-sessions)
- [Example 70: Blue-Green Deployment for Zero-Downtime Releases](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/advanced#example-70-blue-green-deployment-for-zero-downtime-releases)
- [Example 71: Custom Ecto Types for Domain Logic](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/advanced#example-71-custom-ecto-types-for-domain-logic)
- [Example 72: Database Fragments for Advanced Queries](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/advanced#example-72-database-fragments-for-advanced-queries)
- [Example 73: Query Profiling with Telemetry](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/advanced#example-73-query-profiling-with-telemetry)
- [Example 74: Advanced LiveView Performance Optimization](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/advanced#example-74-advanced-liveview-performance-optimization)
- [Example 75: Production Debugging with Observer and LiveDashboard](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/advanced#example-75-production-debugging-with-observer-and-livedashboard)
- [Example 76: Security Best Practices](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/advanced#example-76-security-best-practices)
- [Example 77: WebSocket Connection Pooling](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/advanced#example-77-websocket-connection-pooling)
- [Example 78: GraphQL API with Absinthe](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/advanced#example-78-graphql-api-with-absinthe)
- [Example 79: Event Sourcing Pattern](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/advanced#example-79-event-sourcing-pattern)
- [Example 80: Advanced Testing Strategies](/en/learn/software-engineering/platforms/web/tools/elixir-phoenix/by-example/advanced#example-80-advanced-testing-strategies)
