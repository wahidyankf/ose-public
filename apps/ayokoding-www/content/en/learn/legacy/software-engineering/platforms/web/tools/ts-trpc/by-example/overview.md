---
title: "Overview"
weight: 10000000
date: 2026-03-25T00:00:00+07:00
draft: false
description: "Learn tRPC through 80 heavily annotated code examples achieving 95% API coverage - type-safe, end-to-end TypeScript APIs without REST or GraphQL schemas"
tags: ["trpc", "typescript", "api", "tutorial", "by-example"]
---

**Want to learn tRPC through code?** This by-example tutorial provides 80 heavily annotated examples covering 95% of tRPC v11. Master type-safe APIs, routers, procedures, middleware, subscriptions, and production patterns through working code rather than lengthy explanations.

## What Is By-Example Learning?

By-example learning is a **code-first approach** where you learn concepts through annotated, working examples rather than narrative explanations. Each example shows:

1. **What the code does** - Brief explanation of the tRPC concept
2. **How it works** - A focused, heavily commented code example
3. **Key Takeaway** - A pattern summary highlighting the key takeaway
4. **Why It Matters** - Production context, when to use, deeper significance

This approach works best when you already understand TypeScript and have some API development experience. You learn tRPC's router model, procedure system, and React Query integration by studying real code rather than theoretical descriptions.

## What Is tRPC?

tRPC is a **TypeScript-first framework for building type-safe APIs** that eliminates the need for REST endpoint documentation or GraphQL schemas. Key distinctions:

- **End-to-end type safety**: Your TypeScript types flow from backend to frontend without codegen steps
- **No schema definition**: Define procedures directly in TypeScript; types infer automatically
- **React Query integration**: First-class hooks for data fetching, caching, and mutations
- **Framework agnostic**: Works with Express, Fastify, Next.js, Nuxt, and standalone servers
- **Zero runtime overhead**: All type magic happens at compile time; runtime is thin adapters

## Learning Path

```mermaid
graph TD
  accTitle: Learning Path
  accDescr: Graph with 5 nodes and 4 connections. Nodes: Beginner Core tRPC Concepts Examples 1-28, Intermediate Production Patterns Examples 29-55, Advanced Expert Mastery Examples 56-80, 0 No tRPC Knowledge, 95 Framework Mastery. Connections: Beginner Core tRPC Concepts Examples 1-28 to Intermediate Production Patterns Examples 29-55, Intermediate Production Patterns Examples 29-55 to Advanced Expert Mastery Examples 56-80, 0 No tRPC Knowledge to Beginner Core tRPC Concepts Examples 1-28, Advanced Expert Mastery Examples 56-80 to 95 Framework Mastery.
  A["Beginner<br/>Core tRPC Concepts<br/>Examples 1-28"] --> B["Intermediate<br/>Production Patterns<br/>Examples 29-55"]
  B --> C["Advanced<br/>Expert Mastery<br/>Examples 56-80"]
  D["0%<br/>No tRPC Knowledge"] -.-> A
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

The **95% coverage** means you understand tRPC deeply enough to build production APIs with confidence. It does not mean you will know every edge case or advanced optimization—those come with experience.

The 80 examples are organized progressively:

- **Beginner (Examples 1-28)**: Foundation concepts (initTRPC, routers, query procedures, mutation procedures, input validation with Zod, context, error handling, output types, middleware)
- **Intermediate (Examples 29-55)**: Production patterns (nested routers, auth middleware, subscriptions, React Query hooks, optimistic updates, infinite queries, batching, SSR, error formatting)
- **Advanced (Examples 56-80)**: Expert mastery (custom links, WebSocket transport, testing with createCaller, integration testing, Next.js App Router, performance optimization, type inference utilities, migration patterns)

Together, these examples cover **95% of what you will use** in production tRPC applications.

## Annotation Density: 1-2.25 Comments Per Code Line

**CRITICAL**: All examples maintain **1-2.25 comment lines per code line PER EXAMPLE** to ensure deep understanding.

**What this means**:

- Simple lines get 1 annotation explaining purpose or result
- Complex lines get 2+ annotations explaining behavior, types, and side effects
- Use `// =>` notation to show expected values, outputs, or state changes

**Example**:

```typescript
// server.ts
import { initTRPC } from "@trpc/server"; // => Import tRPC core factory function

const t = initTRPC.create(); // => Creates tRPC instance with default config
// => t exposes router(), procedure, and middleware builders

const appRouter = t.router({
  // => router() groups procedures under a namespace
  hello: t.procedure // => Define a procedure named "hello"
    .query(() => "Hello, tRPC!"), // => .query() marks this as a read-only GET-style operation
  // => Returns string "Hello, tRPC!" with full TypeScript inference
});

export type AppRouter = typeof appRouter; // => Export inferred router type for client use
// => Client imports this type (not value) for end-to-end type safety
```

This density ensures each example is self-contained and fully comprehensible without external documentation.

## Structure of Each Example

All examples follow a consistent five-part format:

````
### Example N: Descriptive Title

2-3 sentence explanation of the concept.

```typescript
// Heavily annotated code example
// showing the tRPC pattern in action
````

**Key Takeaway**: 1-2 sentence summary.

**Why It Matters**: 50-100 words explaining significance in production applications.

````

**Code annotations**:

- `// =>` shows expected output, type inference, or results
- Inline comments explain what each line does and why
- Variable names are self-documenting
- Type annotations make data flow explicit

## What's Covered

### Core tRPC Concepts

- **Router Setup**: `initTRPC`, `t.router()`, `t.procedure`, AppRouter type export
- **Query Procedures**: Read-only operations, input validation, return types
- **Mutation Procedures**: Write operations, side effects, input/output schemas
- **Input Validation**: Zod schemas, optional inputs, complex types
- **Context**: Request context creation, typed context, middleware context augmentation

### Type Safety System

- **Type Inference**: End-to-end inference from server to client
- **Input Types**: Zod-based runtime validation with TypeScript inference
- **Output Types**: Explicit output schemas, type narrowing
- **Error Types**: TRPCError types, custom error codes
- **Router Types**: AppRouter type export, inferRouterInputs/inferRouterOutputs

### Procedure Patterns

- **Middleware**: Procedure middleware, context augmentation, auth guards
- **Chaining**: `.use()` for middleware composition
- **Protected Procedures**: Reusable procedure bases with auth
- **Rate Limiting**: Request throttling in middleware

### React Query Integration

- **useQuery**: Data fetching with caching and refetching
- **useMutation**: Write operations with loading/error states
- **useUtils**: Cache invalidation and optimistic updates
- **useInfiniteQuery**: Cursor-based pagination
- **Batching**: Automatic request batching

### Advanced Features

- **Subscriptions**: WebSocket-based real-time updates
- **Custom Links**: Middleware in the HTTP transport layer
- **SSR Integration**: `createServerSideHelpers` for Next.js SSR
- **App Router**: Next.js 13+ App Router patterns

### Production Patterns

- **Testing**: `createCaller` for unit testing, integration test patterns
- **Monorepo**: Shared type packages, workspace patterns
- **Error Formatting**: Custom error formatting for production
- **Performance**: Batching, deduplication, caching strategies
- **Migration**: Gradual tRPC adoption into existing codebases

## What's NOT Covered

We exclude topics that belong in specialized tutorials:

- **Advanced Zod**: Deep Zod validation patterns (covered in Zod tutorial)
- **Advanced React Query**: Deep React Query features unrelated to tRPC
- **Database Integrations**: Prisma, Drizzle ORM patterns (separate tutorials)
- **Authentication Libraries**: NextAuth, Auth.js deep dives
- **Deployment Infrastructure**: Docker, Kubernetes, Vercel configuration
- **WebSocket Servers**: Raw WebSocket implementation details

For these topics, see dedicated tutorials and framework documentation.

## Prerequisites

### Required

- **TypeScript**: Intermediate level (generics, utility types, type inference)
- **Node.js**: Basic familiarity (modules, async/await)
- **API concepts**: REST or GraphQL experience helpful
- **Programming experience**: You have built APIs or full-stack apps before

### Recommended

- **React**: For the React Query integration examples
- **Zod**: Basic familiarity with schema validation
- **Express or Next.js**: For framework integration examples

### Not Required

- **tRPC experience**: This guide assumes you are new to tRPC
- **GraphQL**: Not necessary; tRPC replaces it, not extends it
- **gRPC**: Different technology; no overlap needed

## Getting Started

Before starting the examples, set up a minimal tRPC project:

```bash
npm create t3-app@latest my-trpc-app
# Select TypeScript, tRPC, and choose your framework
cd my-trpc-app
npm install
npm run dev
````

Or set up manually:

```bash
mkdir trpc-examples && cd trpc-examples
npm init -y
npm install @trpc/server @trpc/client zod
npm install -D typescript @types/node ts-node
```

## How to Use This Guide

### 1. Choose Your Starting Point

- **New to tRPC?** Start with Beginner (Example 1)
- **Know REST/GraphQL?** Start with Beginner—tRPC differs enough to warrant starting fresh
- **Building specific feature?** Search for relevant example topic

### 2. Read the Example

Each example has five parts:

- **Explanation** (2-3 sentences): What tRPC concept, why it exists, when to use it
- **Code** (heavily commented): Working TypeScript code showing the pattern
- **Key Takeaway** (1-2 sentences): Distilled essence of the pattern
- **Why It Matters** (50-100 words): Production context and deeper significance

### 3. Run the Code

Most examples are standalone TypeScript modules you can run with ts-node:

```bash
npx ts-node example.ts
```

### 4. Modify and Experiment

Change procedure names, add new fields, break things on purpose. Experimentation builds intuition faster than reading.

### 5. Reference as Needed

Use this guide as a reference when building features. Search for relevant examples and adapt patterns to your code.

## Ready to Start?

Choose your learning path:

- **Beginner** - Start here if new to tRPC. Build foundation understanding through 28 core examples.
- **Intermediate** - Jump here if you know tRPC basics. Master production patterns through 27 examples.
- **Advanced** - Expert mastery through 25 advanced examples covering performance, testing, and integration.

Or jump to specific topics by searching for relevant example keywords (router, procedure, middleware, subscription, React Query, testing, Next.js, etc.).

## Examples by Level

### Beginner (Examples 1–28)

- [Example 1: Creating a tRPC Instance with initTRPC](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/beginner#example-1-creating-a-trpc-instance-with-inittrpc)
- [Example 2: Query Procedure - Reading Data](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/beginner#example-2-query-procedure---reading-data)
- [Example 3: Mutation Procedure - Writing Data](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/beginner#example-3-mutation-procedure---writing-data)
- [Example 4: Input Validation with Zod](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/beginner#example-4-input-validation-with-zod)
- [Example 5: Optional and Default Input Fields](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/beginner#example-5-optional-and-default-input-fields)
- [Example 6: Returning Structured Data with Type Inference](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/beginner#example-6-returning-structured-data-with-type-inference)
- [Example 7: Creating and Using Context](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/beginner#example-7-creating-and-using-context)
- [Example 8: Database Connection in Context](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/beginner#example-8-database-connection-in-context)
- [Example 9: Accessing Context in Procedures](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/beginner#example-9-accessing-context-in-procedures)
- [Example 10: Throwing TRPCError](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/beginner#example-10-throwing-trpcerror)
- [Example 11: TRPCError Codes Reference](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/beginner#example-11-trpcerror-codes-reference)
- [Example 12: Handling Validation Errors from Zod](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/beginner#example-12-handling-validation-errors-from-zod)
- [Example 13: Explicit Output Types with Zod](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/beginner#example-13-explicit-output-types-with-zod)
- [Example 14: Inferring Input and Output Types](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/beginner#example-14-inferring-input-and-output-types)
- [Example 15: Union and Discriminated Union Returns](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/beginner#example-15-union-and-discriminated-union-returns)
- [Example 16: Creating a Reusable Base Procedure](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/beginner#example-16-creating-a-reusable-base-procedure)
- [Example 17: Middleware for Logging](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/beginner#example-17-middleware-for-logging)
- [Example 18: Middleware for Request Timing and Metrics](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/beginner#example-18-middleware-for-request-timing-and-metrics)
- [Example 19: Chaining Multiple Middleware](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/beginner#example-19-chaining-multiple-middleware)
- [Example 20: Context Augmentation in Middleware](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/beginner#example-20-context-augmentation-in-middleware)
- [Example 21: Async Query Procedures](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/beginner#example-21-async-query-procedures)
- [Example 22: Async Mutations with Error Handling](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/beginner#example-22-async-mutations-with-error-handling)
- [Example 23: Complex Nested Input Schemas](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/beginner#example-23-complex-nested-input-schemas)
- [Example 24: Array Input Validation](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/beginner#example-24-array-input-validation)
- [Example 25: Enum and Literal Input Types](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/beginner#example-25-enum-and-literal-input-types)
- [Example 26: Modular Router Composition](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/beginner#example-26-modular-router-composition)
- [Example 27: Router Merging Patterns](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/beginner#example-27-router-merging-patterns)
- [Example 28: Type-Safe Procedure Paths](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/beginner#example-28-type-safe-procedure-paths)

### Intermediate (Examples 29–55)

- [Example 29: Deeply Nested Router Architecture](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/intermediate#example-29-deeply-nested-router-architecture)
- [Example 30: Middleware with Context Narrowing](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/intermediate#example-30-middleware-with-context-narrowing)
- [Example 31: Rate Limiting Middleware](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/intermediate#example-31-rate-limiting-middleware)
- [Example 32: Basic Subscription with Observable](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/intermediate#example-32-basic-subscription-with-observable)
- [Example 33: Subscription with Filtering and State](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/intermediate#example-33-subscription-with-filtering-and-state)
- [Example 34: Setting Up the tRPC React Client](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/intermediate#example-34-setting-up-the-trpc-react-client)
- [Example 35: useQuery for Data Fetching](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/intermediate#example-35-usequery-for-data-fetching)
- [Example 36: useMutation for Write Operations](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/intermediate#example-36-usemutation-for-write-operations)
- [Example 37: Cache Invalidation with useUtils](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/intermediate#example-37-cache-invalidation-with-useutils)
- [Example 38: Optimistic Updates](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/intermediate#example-38-optimistic-updates)
- [Example 39: Infinite Queries for Pagination](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/intermediate#example-39-infinite-queries-for-pagination)
- [Example 40: Custom Error Formatter](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/intermediate#example-40-custom-error-formatter)
- [Example 41: Error Handling in Middleware](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/intermediate#example-41-error-handling-in-middleware)
- [Example 42: Server-Side Data Fetching with createServerSideHelpers](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/intermediate#example-42-server-side-data-fetching-with-createserversidehelpers)
- [Example 43: Next.js App Router Integration Pattern](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/intermediate#example-43-nextjs-app-router-integration-pattern)
- [Example 44: Request Batching Configuration](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/intermediate#example-44-request-batching-configuration)
- [Example 45: Query Deduplication](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/intermediate#example-45-query-deduplication)
- [Example 46: Transform and Preprocess Inputs](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/intermediate#example-46-transform-and-preprocess-inputs)
- [Example 47: Discriminated Union Inputs](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/intermediate#example-47-discriminated-union-inputs)
- [Example 48: Tenant Isolation Middleware](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/intermediate#example-48-tenant-isolation-middleware)
- [Example 49: Audit Logging Middleware](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/intermediate#example-49-audit-logging-middleware)
- [Example 50: Cursor-Based Pagination on the Server](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/intermediate#example-50-cursor-based-pagination-on-the-server)
- [Example 51: Procedure Composition with Input Merging](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/intermediate#example-51-procedure-composition-with-input-merging)
- [Example 52: Conditional Procedure Logic Based on Context](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/intermediate#example-52-conditional-procedure-logic-based-on-context)
- [Example 53: Procedure Middleware for Caching Hints](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/intermediate#example-53-procedure-middleware-for-caching-hints)
- [Example 54: Batch Mutations](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/intermediate#example-54-batch-mutations)
- [Example 55: Health Check and Readiness Procedures](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/intermediate#example-55-health-check-and-readiness-procedures)

### Advanced (Examples 56–80)

- [Example 56: Custom Terminating Link](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/advanced#example-56-custom-terminating-link)
- [Example 57: Retry Link with Exponential Backoff](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/advanced#example-57-retry-link-with-exponential-backoff)
- [Example 58: Logging Link for Request Inspection](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/advanced#example-58-logging-link-for-request-inspection)
- [Example 59: WebSocket Link Setup for Subscriptions](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/advanced#example-59-websocket-link-setup-for-subscriptions)
- [Example 60: useSubscription React Hook](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/advanced#example-60-usesubscription-react-hook)
- [Example 61: Unit Testing with createCaller](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/advanced#example-61-unit-testing-with-createcaller)
- [Example 62: Integration Testing with HTTP](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/advanced#example-62-integration-testing-with-http)
- [Example 63: Mocking Context for Authorization Tests](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/advanced#example-63-mocking-context-for-authorization-tests)
- [Example 64: tRPC Route Handler for App Router](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/advanced#example-64-trpc-route-handler-for-app-router)
- [Example 65: Server Actions with tRPC Validation](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/advanced#example-65-server-actions-with-trpc-validation)
- [Example 66: Shared Types Between Server and Client in Next.js](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/advanced#example-66-shared-types-between-server-and-client-in-nextjs)
- [Example 67: Response Transformer with Superjson](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/advanced#example-67-response-transformer-with-superjson)
- [Example 68: Deferred Queries with `enabled` Flag](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/advanced#example-68-deferred-queries-with-enabled-flag)
- [Example 69: Prefetching on Hover](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/advanced#example-69-prefetching-on-hover)
- [Example 70: Advanced Type Inference Patterns](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/advanced#example-70-advanced-type-inference-patterns)
- [Example 71: Procedure Type Guards and Narrowing](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/advanced#example-71-procedure-type-guards-and-narrowing)
- [Example 72: Gradual Migration from REST to tRPC](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/advanced#example-72-gradual-migration-from-rest-to-trpc)
- [Example 73: Calling tRPC from Non-React Clients](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/advanced#example-73-calling-trpc-from-non-react-clients)
- [Example 74: OpenAPI Compatibility Layer](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/advanced#example-74-openapi-compatibility-layer)
- [Example 75: Procedure Factories for DRY CRUD](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/advanced#example-75-procedure-factories-for-dry-crud)
- [Example 76: Event-Driven Architecture with tRPC Subscriptions](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/advanced#example-76-event-driven-architecture-with-trpc-subscriptions)
- [Example 77: Middleware for Request Context Enrichment](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/advanced#example-77-middleware-for-request-context-enrichment)
- [Example 78: Type-Safe Error Boundaries with tRPC](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/advanced#example-78-type-safe-error-boundaries-with-trpc)
- [Example 79: Monorepo Package Structure for tRPC](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/advanced#example-79-monorepo-package-structure-for-trpc)
- [Example 80: Performance Profiling and Optimization](/en/learn/software-engineering/platforms/web/tools/ts-trpc/by-example/advanced#example-80-performance-profiling-and-optimization)
