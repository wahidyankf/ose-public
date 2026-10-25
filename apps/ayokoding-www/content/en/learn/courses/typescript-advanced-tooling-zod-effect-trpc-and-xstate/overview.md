---
title: "Overview"
date: 2026-10-25T00:00:00+07:00
draft: false
weight: 1
---

## Prerequisites

- **Prior topics**: [Just Enough TypeScript](../just-enough-typescript/learning/overview.md) (generics,
  unions, and modules -- every worked example in this course is TypeScript);
  [Frontend Essentials](../frontend-essentials/learning/overview.md) (forms, fetch calls, and UI
  state -- the problems these four libraries solve). Every worked example is TypeScript using
  Zod, Effect, tRPC, or XState patterns, so both priors earn their place from the first page.
- **Tools & environment**: Node.js with the pinned TypeScript toolchain (the harness runs every
  example with Node and no network; tRPC examples wire an in-process client directly to its
  server router); a text editor. No package installs are needed: the runnable models are
  dependency-free TypeScript that mirrors each library's behavior as data, and the lesson text
  maps each model line to the real library construct it stands for.
- **Assumed knowledge**: basic TypeScript generics and union types.

## Why this exists -- the big idea

**The problem before the solution**: TypeScript's compiler cannot see a network boundary, an
error path, or a UI's valid states. JSON arrives as `unknown` and is cast on faith; functions
throw errors their signatures never mention; client and server types drift until a renamed
field breaks production; UI flows hide in boolean flags where every combination is reachable
and half of them are nonsense. The language's own type features (taught in `type-systems`)
cannot close these gaps because they live outside the compiler's view: at the wire, in the
failure channel, across the network, and in the event flow.

**The one idea worth keeping if you forget everything else**: if a boundary can fail (a
network call, a JSON payload, a UI flow), make its valid shapes and transitions something
the type checker can check. Zod makes the payload's shape checkable, Effect makes the
error channel checkable, tRPC makes the API contract checkable, and XState makes the UI's
valid transitions checkable. Four libraries, one discipline: push the check to the place
where the failure lives, and let the types carry the proof everywhere else.

This course is **deliberately a tooling course, not a language course**. Language-level
type theory lives in `type-systems`; object-oriented patterns live in
`object-oriented-design-and-patterns`. This course assumes both and spends its pages on
four specific, widely used libraries: runtime validation with Zod, typed effects and
errors with Effect, end-to-end typed APIs with tRPC, and explicit state machines with
XState. The sixteen concepts below are the whole vocabulary; every example names the ones
it exercises, and the drilling page makes you use each one twice.

## How this course is organized

- **[Learning](./learning/overview.md)** -- 48 worked examples in nine themes, each a
  runnable TypeScript model with its exact recorded output:
  - **Theme A -- [Zod Schemas and Inference](./learning/theme-a-zod-schemas-and-inference.md)**
    (Examples 1-5) -- schema as single source of truth, nesting, modifiers, composition,
    discriminated unions.
  - **Theme B -- [Parsing Untrusted Input](./learning/theme-b-parsing-untrusted-input.md)**
    (Examples 6-10) -- safeParse versus parse, JSON boundaries, indexed arrays, coercion,
    branded types.
  - **Theme C -- [Effect's Typed Errors](./learning/theme-c-effect-s-typed-errors.md)**
    (Examples 11-15) -- typed error channel, error unions, catch by tag, fail versus
    defect, nullable and throwing edges.
  - **Theme D -- [Effect Composition and Dependencies](./learning/theme-d-effect-composition-and-dependencies.md)**
    (Examples 16-21) -- chaining, joining, retry budgets, injected services, test layers,
    scoped resources.
  - **Theme E -- [tRPC Procedures and Routers](./learning/theme-e-trpc-procedures-and-routers.md)**
    (Examples 22-27) -- procedures, validated inputs, typed mutations, router merges,
    middleware context, in-process callers.
  - **Theme F -- [End-to-End Type Inference](./learning/theme-f-end-to-end-type-inference.md)**
    (Examples 28-33) -- derived client types, drift as compile errors, shared schemas,
    optimistic updates, batching, typed procedure errors.
  - **Theme G -- [XState Machines and Transitions](./learning/theme-g-xstate-machines-and-transitions.md)**
    (Examples 34-38) -- explicit machines, guards, entry and exit actions, rejected moves,
    fetch lifecycles.
  - **Theme H -- [State Charts (Nested and Parallel)](./learning/theme-h-state-charts-nested-and-parallel.md)**
    (Examples 39-43) -- nesting, parallel regions, history, invoked services, a checkout
    chart.
  - **Theme I -- [Choosing and Combining the Four Tools](./learning/theme-i-choosing-and-combining-the-four-tools.md)**
    (Examples 44-48) -- schema-guarded procedures, effects inside procedures,
    machine-driven calls, the selection matrix, testing seams.
  - **[Capstone](./learning/capstone/overview.md)** -- a small typed order-submission flow
    (a Zod-validated input schema, an Effect pipeline with typed errors, a tRPC procedure
    exposing it end to end, and an XState machine driving the submission UI) with its own
    runnable model and recorded trace.

- **[Drilling](./drilling/overview.md)** -- recall questions, applied composition problems,
  five hands-on katas, a self-check checklist, and design trade-off prompts.

## What this course is not

Language-level type theory (generics, variance, conditional types as a subject) lives in
`type-systems`; this course uses those features without teaching them. Finite-state
concepts in the abstract live in `object-oriented-design-and-patterns`, which mentions
state machines generically; this course teaches the XState library specifically. No
example performs a real network call: tRPC examples wire an in-process client directly
to its server router.
