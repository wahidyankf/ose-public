---
title: "Overview"
weight: 10000000
date: 2026-03-19T00:00:00+07:00
draft: false
description: "Learn the TypeScript Effect library through 80 production-ready annotated examples covering Effect type basics, error handling, dependency injection, concurrency, streaming, and production patterns"
tags: ["effect", "typescript", "functional-programming", "tutorial", "by-example", "overview"]
---

## Want to Master Effect Through Working Code?

This guide teaches you the TypeScript **Effect library** through **80 production-ready code examples** rather than lengthy explanations. If you're an experienced developer who wants to write safer, more composable TypeScript, you'll build intuition through actual working patterns.

## What Is By-Example Learning?

By-example learning is a **code-first approach** where you learn concepts through annotated, working examples rather than narrative explanations. Each example shows:

1. **What the code does** - Brief explanation of the Effect concept
2. **How it works** - A focused, heavily commented code example
3. **Why it matters** - A pattern summary highlighting the production value

This approach works best when you already understand TypeScript and programming fundamentals. You learn Effect's idioms, patterns, and best practices by studying real code rather than theoretical descriptions.

## What Is Effect?

Effect is a **functional effect system for TypeScript** — not a web framework, not a testing library, not an ORM. It is a foundational toolkit for writing programs that handle errors, dependencies, concurrency, and resources in a principled, composable way.

Key distinctions:

- **Not a framework**: Effect does not handle HTTP routing or HTML rendering. It manages program logic, data flow, and side effects.
- **Type-safe errors**: Errors appear in the type signature as `Effect<Success, Error, Requirements>` — the compiler forces you to handle them.
- **Dependency injection built in**: Services and dependencies are declared as types and resolved at runtime via Layers.
- **Structured concurrency**: Fibers give you lightweight concurrency with automatic resource cleanup and interruption.
- **Composable by design**: Everything is a value you can combine, transform, retry, trace, or test.

Effect 3.x (the current major version) unified the ecosystem into a single `effect` npm package. It works in Node.js, Bun, Deno, and modern browsers.

## Learning Path

```mermaid
graph TD
  accTitle: Learning Path
  accDescr: Graph with 5 nodes and 4 connections. Nodes: Beginner Core Effect Concepts Examples 1-27, Intermediate Services, Streams, Scheduling Examples 28-55, Advanced Fibers, Metrics and Production Examples 56-80, 0 No Effect Knowledge, 95 Effect Mastery. Connections: Beginner Core Effect Concepts Examples 1-27 to Intermediate Services, Streams, Scheduling Examples 28-55, Intermediate Services, Streams, Scheduling Examples 28-55 to Advanced Fibers, Metrics and Production Examples 56-80, 0 No Effect Knowledge to Beginner Core Effect Concepts Examples 1-27, Advanced Fibers, Metrics and Production Examples 56-80 to 95 Effect Mastery.
  A["Beginner<br/>Core Effect Concepts<br/>Examples 1-27"] --> B["Intermediate<br/>Services, Streams,<br/>Scheduling<br/>Examples 28-55"]
  B --> C["Advanced<br/>Fibers, Metrics and<br/>Production<br/>Examples 56-80"]
  D["0%<br/>No Effect Knowledge"] -.-> A
  C -.-> E["95%<br/>Effect Mastery"]

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

The **95% coverage** means you'll understand Effect deeply enough to build production systems confidently. It does not mean you'll know every edge case — those come with experience.

The 80 examples are organized progressively:

- **Beginner (Examples 1-27)**: Core Effect type, creating and running effects, pipelines, error handling, generators, Option/Either, basic services, Duration, Exit, Cause
- **Intermediate (Examples 28-55)**: Layer composition, Context/Tag, Scope/Resource, concurrency, scheduling, Ref, Queue, PubSub, Schema, HTTP client, testing, Config, logging, Stream basics
- **Advanced (Examples 56-80)**: Fiber lifecycle, FiberRef, advanced concurrency, Stream channels, Schema transformations, batching with RequestResolver, Metric, tracing, custom Runtime, production patterns

Together, these examples cover **95% of what you'll use** in production Effect applications.

## What's Covered

### Core Effect Type and Execution

- **Effect type**: `Effect<Success, Error, Requirements>` — the three type parameters
- **Creating effects**: `Effect.succeed`, `Effect.fail`, `Effect.sync`, `Effect.promise`, `Effect.try`
- **Running effects**: `Effect.runSync`, `Effect.runPromise`, `Effect.runSyncExit`, `Effect.runPromiseExit`
- **Pipelines**: `pipe`, `Effect.map`, `Effect.flatMap`, `Effect.tap`, `Effect.andThen`

### Error Handling

- **Typed errors**: Errors as values, `Data.TaggedError`, discriminated unions
- **Recovery**: `Effect.catchAll`, `Effect.catchTag`, `Effect.catchIf`, `Effect.orElse`
- **Retry**: `Effect.retry` with `Schedule`
- **Cause**: `Cause.die`, `Cause.fail`, `Cause.interrupt` — understanding failure modes
- **Exit**: `Exit.succeed`, `Exit.fail`, `Exit.interrupt` — representing outcomes as values

### Generators and Async Style

- **Effect.gen**: Generator-based async/await style for Effect pipelines
- **yield\***: Unwrapping effects inside generators
- **Combining generators with services**: Ergonomic dependency injection in generators

### Data Types

- **Option**: `Option.some`, `Option.none`, integration with Effect
- **Either**: `Either.right`, `Either.left`, lifting into Effect
- **Chunk**: Efficient immutable arrays for streaming
- **Duration**: Type-safe time values for scheduling and timeouts

### Services and Dependency Injection

- **Context.Tag**: Declaring services as types
- **Layer**: Building, combining, and providing service implementations
- **Layer composition**: Sequential (`Layer.provideMerge`), parallel (`Layer.merge`), scoped
- **Testing**: Replacing live services with test implementations

### Concurrency and Resources

- **Effect.all**: Run effects concurrently or sequentially
- **Fiber**: Lightweight concurrent processes with `Fiber.fork`, `Fiber.join`, `Fiber.interrupt`
- **Scope**: Lifecycle management for resources (database connections, file handles)
- **Resource** (`Effect.acquireRelease`): Safe resource acquisition with guaranteed cleanup

### State and Coordination

- **Ref**: Mutable references with atomic update semantics
- **SynchronizedRef**: Ref with effectful updates
- **Queue**: Bounded and unbounded concurrent queues
- **PubSub**: Topic-based message broadcasting

### Scheduling

- **Schedule**: Composable retry and repeat policies
- **Schedule.recurs**: Fixed repetition
- **Schedule.exponential**: Exponential backoff
- **Schedule.spaced**: Fixed delay between executions
- **Schedule.compose**: Combining schedules

### Schema and Validation

- **Schema.decode**: Parse and validate unknown data
- **Schema.encode**: Serialize typed data
- **Schema definitions**: Struct, Union, Array, Literal, and custom schemas
- **Schema transformations**: `Schema.transform`, `Schema.transformOrFail`
- **Schema filters**: `Schema.filter` for custom validation rules

### Observability

- **Effect.log**: Structured logging with log levels
- **Effect.withSpan**: Distributed tracing spans
- **Metric**: Counters, histograms, and gauges
- **FiberRef**: Fiber-local state for request correlation IDs

### Advanced Patterns

- **Effect.request / RequestResolver**: Automatic request batching and deduplication
- **Stream**: Lazy, composable data streams with backpressure
- **Channel**: Low-level bidirectional communication primitive
- **Custom Runtime**: Configuring logging, tracing, and services for production

## What's NOT Covered

We exclude topics that belong in specialized tutorials:

- **TypeScript language internals**: Master TypeScript first through language tutorials
- **HTTP server frameworks**: Effect-based HTTP servers (e.g., `@effect/platform` HTTP) are touched in Advanced but not the focus
- **Database integrations**: ORMs and query builders built on Effect are separate topics
- **Frontend UI**: Effect works in the browser but React/Vue integration is out of scope
- **Effect internals**: Fiber scheduler internals, memory model, and runtime implementation details

For these topics, see the official Effect documentation and ecosystem packages.

## How to Use This Guide

### 1. Set Up Your Environment

```bash
mkdir effect-tutorial && cd effect-tutorial
npm init -y
npm install effect
npm install -D typescript tsx @types/node
npx tsc --init --strict true --target ES2022 --module NodeNext --moduleResolution NodeNext
```

### 2. Run Each Example

Each example is self-contained. Save it to a `.ts` file and run:

```bash
npx tsx example.ts
```

### 3. Read the Example Structure

Each example has five parts:

- **Brief explanation** (2-3 sentences): What Effect concept, why it exists, when to use it
- **Optional diagram**: Mermaid diagram when concept relationships benefit from visualization
- **Code** (with heavy comments): Working TypeScript showing the pattern with `// =>` annotations
- **Key Takeaway** (1-2 sentences): Distilled essence of the pattern
- **Why It Matters** (50-100 words): Production rationale and real-world significance

### 4. Modify and Experiment

Change type parameters, swap error types, add retry policies. Breaking things intentionally builds intuition faster than reading.

### 5. Reference as Needed

Use this guide as a reference when building features. Search for relevant examples and adapt patterns to your code.

## Relationship to Other Tutorial Types

| Tutorial Type               | Approach                       | Coverage          | Best For                      |
| --------------------------- | ------------------------------ | ----------------- | ----------------------------- |
| **By Example** (this guide) | Code-first, 80 examples        | 95% breadth       | Learning Effect idioms        |
| **Quick Start**             | Project-based, hands-on        | 5-30% touchpoints | Getting something working     |
| **Beginner Tutorial**       | Narrative, explanation-first   | 0-60% coverage    | Understanding concepts deeply |
| **Cookbook**                | Recipe-based, problem-solution | Problem-specific  | Solving specific problems     |

## Prerequisites

### Required

- **TypeScript fundamentals**: Types, generics, async/await, union types, discriminated unions
- **Programming experience**: You have built applications in at least one language
- **Node.js basics**: Module system, npm, running scripts

### Recommended

- **Functional programming concepts**: Pure functions, immutability, function composition
- **Promise/async experience**: Understanding JavaScript's async model helps contrast with Effect's approach

### Not Required

- **Effect experience**: This guide assumes you are new to the library
- **Category theory**: You do not need to know monads or functors by name

## Structure of Each Example

All examples follow a consistent format:

````
### Example N: Descriptive Title

2-3 sentence explanation of the concept.

[Optional Mermaid diagram]

```typescript
// Heavily annotated code example
// showing the Effect pattern in action
// => annotations show values and outputs
````

**Key Takeaway**: 1-2 sentence summary.

**Why It Matters**: 50-100 words on production significance.

```

**Code annotations**:

- `// =>` shows expected output or computed value
- Inline comments explain what each line does and why
- Variable names are self-documenting

**Mermaid diagrams** appear when visualizing flow or type relationships improves understanding. Color palette:

- Blue #0173B2 - Primary elements
- Orange #DE8F05 - Secondary / decisions
- Teal #029E73 - Success / completion
- Purple #CC78BC - Alternative states
- Brown #CA9161 - Neutral elements

## Ready to Start?

Choose your learning path:

- **[Beginner](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/beginner)** - Start here if new to Effect. Build foundation understanding through 27 core examples.
- **[Intermediate](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/intermediate)** - Jump here if you know Effect basics. Master services, scheduling, and streaming through 28 examples.
- **[Advanced](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/advanced)** - Expert mastery through 25 advanced examples covering fibers, metrics, tracing, and production runtime.
```

## Examples by Level

### Beginner (Examples 1–27)

- [Example 1: Understanding the Effect Type Signature](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/beginner#example-1-understanding-the-effect-type-signature)
- [Example 2: Creating Effects — succeed, fail, sync](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/beginner#example-2-creating-effects--succeed-fail-sync)
- [Example 3: Creating Effects — try, promise, tryPromise](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/beginner#example-3-creating-effects--try-promise-trypromise)
- [Example 4: Running Effects — runSync, runPromise](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/beginner#example-4-running-effects--runsync-runpromise)
- [Example 5: Running Effects — runSyncExit, runPromiseExit](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/beginner#example-5-running-effects--runsyncexit-runpromiseexit)
- [Example 6: pipe and the Pipeline Pattern](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/beginner#example-6-pipe-and-the-pipeline-pattern)
- [Example 7: Effect.map — Transforming Success Values](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/beginner#example-7-effectmap--transforming-success-values)
- [Example 8: Effect.flatMap — Chaining Effects](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/beginner#example-8-effectflatmap--chaining-effects)
- [Example 9: Effect.tap — Side Effects in Pipelines](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/beginner#example-9-effecttap--side-effects-in-pipelines)
- [Example 10: Typed Errors with Data.TaggedError](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/beginner#example-10-typed-errors-with-datataggederror)
- [Example 11: Effect.catchAll — Recovering from All Errors](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/beginner#example-11-effectcatchall--recovering-from-all-errors)
- [Example 12: Effect.catchTag — Handling Specific Error Types](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/beginner#example-12-effectcatchtag--handling-specific-error-types)
- [Example 13: Effect.retry with Schedule](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/beginner#example-13-effectretry-with-schedule)
- [Example 14: Effect.gen — Generator-Based Pipelines](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/beginner#example-14-effectgen--generator-based-pipelines)
- [Example 15: yield\* with Multiple Dependencies in Generators](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/beginner#example-15-yield-with-multiple-dependencies-in-generators)
- [Example 16: Option — Modeling Optional Values](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/beginner#example-16-option--modeling-optional-values)
- [Example 17: Either — Modeling Computations That Can Fail](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/beginner#example-17-either--modeling-computations-that-can-fail)
- [Example 18: Context.Tag — Declaring Services](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/beginner#example-18-contexttag--declaring-services)
- [Example 19: Layer — Providing Service Implementations](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/beginner#example-19-layer--providing-service-implementations)
- [Example 20: Layer Composition Patterns](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/beginner#example-20-layer-composition-patterns)
- [Example 21: Duration — Type-Safe Time Values](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/beginner#example-21-duration--type-safe-time-values)
- [Example 22: Exit — Representing Outcomes as Values](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/beginner#example-22-exit--representing-outcomes-as-values)
- [Example 23: Cause — Understanding Failure Modes](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/beginner#example-23-cause--understanding-failure-modes)
- [Example 24: Effect.all — Sequential and Concurrent Execution](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/beginner#example-24-effectall--sequential-and-concurrent-execution)
- [Example 25: Effect.if, Effect.when, and Effect.unless](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/beginner#example-25-effectif-effectwhen-and-effectunless)
- [Example 26: Effect.timeout and Effect.timeoutFail](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/beginner#example-26-effecttimeout-and-effecttimeoutfail)
- [Example 27: Effect.log — Structured Logging](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/beginner#example-27-effectlog--structured-logging)

### Intermediate (Examples 28–55)

- [Example 28: Scoped Layers — Resource Lifecycle Management](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/intermediate#example-28-scoped-layers--resource-lifecycle-management)
- [Example 29: Layer.provideMerge and Layer.mergeAll](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/intermediate#example-29-layerprovidemerge-and-layermergeall)
- [Example 30: Effect.all Concurrency Modes](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/intermediate#example-30-effectall-concurrency-modes)
- [Example 31: Fiber — Forking and Joining](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/intermediate#example-31-fiber--forking-and-joining)
- [Example 32: Fiber.interrupt and Structured Concurrency](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/intermediate#example-32-fiberinterrupt-and-structured-concurrency)
- [Example 33: Schedule Basics — recurs, spaced, exponential](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/intermediate#example-33-schedule-basics--recurs-spaced-exponential)
- [Example 34: Schedule.repeat — Recurring Effects](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/intermediate#example-34-schedulerepeat--recurring-effects)
- [Example 35: Ref — Mutable State in Effect](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/intermediate#example-35-ref--mutable-state-in-effect)
- [Example 36: Queue — Concurrent Message Passing](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/intermediate#example-36-queue--concurrent-message-passing)
- [Example 37: PubSub — Broadcast Messaging](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/intermediate#example-37-pubsub--broadcast-messaging)
- [Example 38: Schema Basics — Decoding Unknown Data](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/intermediate#example-38-schema-basics--decoding-unknown-data)
- [Example 39: Schema — Encoding, Refinements, and Transformations](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/intermediate#example-39-schema--encoding-refinements-and-transformations)
- [Example 40: TestClock — Controlling Time in Tests](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/intermediate#example-40-testclock--controlling-time-in-tests)
- [Example 41: Providing Test Services with Layer](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/intermediate#example-41-providing-test-services-with-layer)
- [Example 42: HTTP Client with @effect/platform](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/intermediate#example-42-http-client-with-effectplatform)
- [Example 43: Config — Type-Safe Application Configuration](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/intermediate#example-43-config--type-safe-application-configuration)
- [Example 44: Chunk — Efficient Immutable Collections](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/intermediate#example-44-chunk--efficient-immutable-collections)
- [Example 45: Stream — Creating and Running Streams](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/intermediate#example-45-stream--creating-and-running-streams)
- [Example 46: Stream Transformations — map, filter, flatMap](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/intermediate#example-46-stream-transformations--map-filter-flatmap)
- [Example 47: Stream.merge and Stream.zip](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/intermediate#example-47-streammerge-and-streamzip)
- [Example 48: Effect.catchIf and Effect.orElse](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/intermediate#example-48-effectcatchif-and-effectorelse)
- [Example 49: Effect.validateAll and Effect.partition](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/intermediate#example-49-effectvalidateall-and-effectpartition)
- [Example 50: SynchronizedRef — Effectful State Updates](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/intermediate#example-50-synchronizedref--effectful-state-updates)
- [Example 51: Effect.andThen — Simplified Sequential Composition](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/intermediate#example-51-effectandthen--simplified-sequential-composition)
- [Example 52: Effect.ensuring — Guaranteed Cleanup](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/intermediate#example-52-effectensuring--guaranteed-cleanup)
- [Example 53: Effect.memoize — Caching Effect Results](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/intermediate#example-53-effectmemoize--caching-effect-results)
- [Example 54: Effect.race — First to Succeed Wins](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/intermediate#example-54-effectrace--first-to-succeed-wins)
- [Example 55: Effect.acquireUseRelease — Safe Resource Patterns](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/intermediate#example-55-effectacquireuserelease--safe-resource-patterns)

### Advanced (Examples 56–80)

- [Example 56: Fiber Lifecycle — Fork, Supervise, and Await](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/advanced#example-56-fiber-lifecycle--fork-supervise-and-await)
- [Example 57: FiberRef — Fiber-Local State](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/advanced#example-57-fiberref--fiber-local-state)
- [Example 58: Effect.raceAll and Effect.allSettled](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/advanced#example-58-effectraceall-and-effectallsettled)
- [Example 59: Semaphore — Limiting Concurrent Access](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/advanced#example-59-semaphore--limiting-concurrent-access)
- [Example 60: Stream.unfold — Generating Streams from State](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/advanced#example-60-streamunfold--generating-streams-from-state)
- [Example 61: Stream Sinks — Collecting Stream Results](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/advanced#example-61-stream-sinks--collecting-stream-results)
- [Example 62: Stream.groupBy and Stream.chunks](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/advanced#example-62-streamgroupby-and-streamchunks)
- [Example 63: Schema.Brand — Branded Types for Type Safety](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/advanced#example-63-schemabrand--branded-types-for-type-safety)
- [Example 64: Effect.request and RequestResolver — Automatic Batching](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/advanced#example-64-effectrequest-and-requestresolver--automatic-batching)
- [Example 65: Metric — Counters, Histograms, and Gauges](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/advanced#example-65-metric--counters-histograms-and-gauges)
- [Example 66: Effect.withSpan — Distributed Tracing](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/advanced#example-66-effectwithspan--distributed-tracing)
- [Example 67: ManagedRuntime — Production Runtime Configuration](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/advanced#example-67-managedruntime--production-runtime-configuration)
- [Example 68: Runtime Configuration — Logging and Tracing](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/advanced#example-68-runtime-configuration--logging-and-tracing)
- [Example 69: Effect.die and Defects — Unrecoverable Errors](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/advanced#example-69-effectdie-and-defects--unrecoverable-errors)
- [Example 70: Effect.yieldNow and Cooperative Scheduling](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/advanced#example-70-effectyieldnow-and-cooperative-scheduling)
- [Example 71: Graceful Shutdown Pattern](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/advanced#example-71-graceful-shutdown-pattern)
- [Example 72: Circuit Breaker Pattern with Ref and Schedule](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/advanced#example-72-circuit-breaker-pattern-with-ref-and-schedule)
- [Example 73: Effect.withConcurrency — Limiting Global Concurrency](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/advanced#example-73-effectwithconcurrency--limiting-global-concurrency)
- [Example 74: Effect.withSpan and Nested Traces](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/advanced#example-74-effectwithspan-and-nested-traces)
- [Example 75: Stream with External Resources — Reading Files](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/advanced#example-75-stream-with-external-resources--reading-files)
- [Example 76: Effect.promise Interop — Working with Legacy Async Code](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/advanced#example-76-effectpromise-interop--working-with-legacy-async-code)
- [Example 77: Effect.tapDefect — Monitoring for Unexpected Errors](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/advanced#example-77-effecttapdefect--monitoring-for-unexpected-errors)
- [Example 78: Effect.clockWith — Custom Time Sources](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/advanced#example-78-effectclockwith--custom-time-sources)
- [Example 79: Effect.cached — Time-Bounded Memoization](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/advanced#example-79-effectcached--time-bounded-memoization)
- [Example 80: Putting It All Together — A Mini Production Service](/en/learn/software-engineering/platforms/web/tools/ts-effect/by-example/advanced#example-80-putting-it-all-together--a-mini-production-service)
