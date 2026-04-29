---
title: "Overview"
weight: 10000000
date: 2026-04-29T00:00:00+07:00
draft: false
description: "Learn XState v5 through 80 production-ready annotated examples covering state machines, actors, statecharts, invocations, React integration, testing, and advanced patterns"
tags: ["xstate", "typescript", "state-machines", "statecharts", "actors", "tutorial", "by-example", "overview"]
---

## Want to Master XState Through Working Code?

This guide teaches XState v5 through 80 self-contained, heavily annotated code examples. Each example runs as-is and includes enough commentary to explain not just what the code does, but why it is structured that way. If you already know TypeScript and want to understand state machines without wading through pages of theory before touching code, this is your path.

The examples progress from a single two-state toggle machine all the way to actor-based concurrent systems, React integration, snapshot-based testing, and production patterns used in real applications. You read code, you run code, you modify code — that is the entire method.

## What Is By-Example Learning?

By-example learning is a code-first approach. Each entry in this series is a self-contained, runnable program that demonstrates exactly one concept. Every example follows a consistent five-part structure:

1. **Brief explanation** — one to three sentences describing what the example demonstrates
2. **Optional diagram** — a Mermaid diagram when concept relationships benefit from visualization
3. **Heavily annotated code** — the working program with `// =>` comments documenting values, states, and side effects at each step
4. **Key takeaway** — one or two sentences summarizing the lesson
5. **Why it matters** — fifty to one hundred words connecting the pattern to real-world usage

This structure means you can skim the annotation layer for fast review or read every comment for deep understanding. Both modes work.

## What Is XState v5?

XState is a TypeScript-first library for building stateful logic using **state machines** and the **Actor Model**. A state machine makes every valid state your application can be in explicit, and defines exactly which events cause transitions between states. The Actor Model extends this to concurrent systems where independent actors communicate by passing messages.

Several distinctions matter before you write a single line:

- XState is **not a UI library**. It has no opinion on how you render. The `@xstate/react` package provides hooks, but the machine itself is framework-agnostic.
- XState is **not just a store**. Stores hold data and let you update it. XState holds data _and_ enforces which updates are legal given the current state — that constraint is the core value.
- XState v5 **removed the `interpret` function** in favour of `createActor`. You create an actor from a machine, start it, and send events to it.
- XState v5 **replaced `Machine()`** with `createMachine()`. The new function has a cleaner TypeScript-first API.
- XState v5 **replaced inline `invoke` strings** with typed creator functions: `fromPromise`, `fromCallback`, and `fromObservable`. Each clearly expresses the async shape of the invocation.
- XState v5 **introduced `setup()`** for defining types, actors, actions, and guards once, then referencing them by string key inside `createMachine`. This is the recommended pattern for full TypeScript inference.

## Learning Path

```mermaid
graph TD
  A["Beginner&#10;Core State Machines&#10;Examples 1-27"] --> B["Intermediate&#10;Actors, React, Testing&#10;Examples 28-54"]
  B --> C["Advanced&#10;Complex Patterns&#10;Examples 55-80"]
  D["0%&#10;No XState Knowledge"] -.-> A
  C -.-> E["95%&#10;XState Mastery"]

  style A fill:#0173B2,stroke:#000,color:#fff
  style B fill:#DE8F05,stroke:#000,color:#fff
  style C fill:#029E73,stroke:#000,color:#fff
  style D fill:#CC78BC,stroke:#000,color:#fff
  style E fill:#029E73,stroke:#000,color:#fff
```

_Accessible color palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC. All colors meet WCAG AA contrast standards and are color-blind friendly._

## Coverage Philosophy: 95% Through 80 Examples

The eighty examples are grouped into three tiers that each build on the previous:

**Beginner (Examples 1–27)** covers the vocabulary every XState program relies on: creating machines, defining states and transitions, guards, actions, context, events, delayed transitions, hierarchical states, parallel states, final states, and history states. By example 27 you can build complete standalone state machines for any synchronous workflow.

**Intermediate (Examples 28–54)** covers the async and reactive layer: invoking promises with `fromPromise`, invoking callbacks with `fromCallback`, invoking observables with `fromObservable`, spawning child machines as actors, sending messages between actors with `sendTo`, reading the actor system, React integration with `useMachine` and `useSelector`, and snapshot-based testing.

**Advanced (Examples 55–80)** covers patterns that appear in production codebases: actor registration and lookup, deep actor hierarchies, event forwarding, model-based testing, persisting and restoring state, input actors, custom actor logic, performance patterns, and orchestrating multi-machine systems.

## What's Covered

### Core Machine Concepts

How `createMachine` and `setup` define the complete shape of a machine, including its context type, event union, and actor types.

### States and Transitions

Atomic states, compound (hierarchical) states, parallel states, final states, and history states. How events trigger transitions and how default transitions work.

### Guards and Actions

Inline guards vs named guards defined in `setup`. Entry actions, exit actions, transition actions, and `assign` for updating context. Pure actions vs side-effect actions.

### Context and Events

Typed context with initial values, strongly typed event unions, and how `assign` merges partial context updates. Dynamic context from machine input.

### Invocations

- `fromPromise` — invoke an async function, handle resolution and rejection
- `fromCallback` — invoke a callback-based subscription, handle teardown
- `fromObservable` — invoke an observable stream, handle completion
- Child machines — invoke another machine as a service, communicate via events

### Actor Model

Spawning actors with `spawn`, referencing actors by `ActorRef`, sending targeted messages with `sendTo`, reading the actor system registry, and building actor hierarchies.

### React Integration

`useMachine` for local component state, `useSelector` for subscribing to specific slices of actor state, lifting actor logic out of components for testability, and sharing actors across component trees.

### Testing

Creating actors with `createActor` in tests, sending events programmatically, asserting on `getSnapshot()`, testing guard and action side effects, and snapshot-based regression testing.

### Production Patterns

Actor registration by ID, persisting snapshots to storage and rehydrating machines, passing input to machines via `createActor({ input })`, composing machines for feature-level encapsulation, and error boundary patterns.

## What's NOT Covered

- **XState Visualizer internals** — the Stately editor and its serialization format are outside the scope of this series
- **Non-TypeScript usage** — all examples use TypeScript; plain JavaScript adaptation is left to the reader
- **XState server package** — `@xstate/store` and server-side actor execution are not covered
- **XState Inspector setup** — browser DevTools integration is a separate tooling concern

## Setup

```bash
mkdir xstate-tutorial && cd xstate-tutorial
npm init -y
npm install xstate
npm install -D typescript tsx @types/node
npx tsc --init --strict true --target ES2022 --module NodeNext --moduleResolution NodeNext
# For React examples (intermediate+):
npm install react react-dom @xstate/react
npm install -D @types/react @types/react-dom
```

All beginner examples run with `tsx`:

```bash
npx tsx example-01.ts
```

React examples require a bundler such as Vite. The intermediate section includes a minimal Vite + React setup example before the first React integration example.

## How to Use This Guide

Run each example with `tsx <filename>`. Read the `// =>` annotations alongside the code — they show variable values, actor snapshots, and output at each step so you do not need to mentally trace execution.

Each example is self-contained. You do not need to read them in order, though the progression is intentional. The beginner tier assumes no prior XState knowledge. The intermediate tier assumes the beginner tier. The advanced tier assumes both.

Modify every example you read. Change an event name. Add a guard. Remove a state. Breaking things and fixing them is faster than reading the same example twice.

## Prerequisites

- TypeScript generics at the level of `<T>` type parameters and conditional types
- `async`/`await` and `Promise` chains for the invocation examples
- React hooks (`useState`, `useEffect`, `useRef`) for the React integration examples in the intermediate tier

If you are comfortable with those three areas, you have everything needed to work through all eighty examples.

## Ready to Start?

- [Beginner — Examples 1–27](/en/learn/software-engineering/platform-web/tools/ts-xstate/by-example/beginner) — Core state machines, states, transitions, guards, actions, context
- [Intermediate — Examples 28–54](/en/learn/software-engineering/platform-web/tools/ts-xstate/by-example/intermediate) — Actors, React, async invocations, testing
- [Advanced — Examples 55–80](/en/learn/software-engineering/platform-web/tools/ts-xstate/by-example/advanced) — Production patterns, persistence, orchestration
