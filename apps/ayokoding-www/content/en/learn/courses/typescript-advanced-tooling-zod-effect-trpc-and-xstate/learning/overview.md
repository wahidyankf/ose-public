---
title: "Learning Overview"
date: 2026-10-25T00:00:00+07:00
draft: false
weight: 1
---

Forty-eight worked examples in nine themes take the reader from the first Zod
schema to a tested four-tool order flow. Each example pairs a short explanation
with a runnable TypeScript model, its exact recorded output, and the concept
tags it exercises: read the idea, run the model, check the transcript. Theme A
(Examples 1-5) derives types from schemas; Theme B (Examples 6-10) parses
untrusted input at boundaries; Theme C (Examples 11-15) types Effect's errors;
Theme D (Examples 16-21) composes effects and injects dependencies; Theme E
(Examples 22-27) builds tRPC procedures and routers; Theme F (Examples 28-33)
shares types end to end; Theme G (Examples 34-38) models UI flows as machines;
Theme H (Examples 39-43) scales machines into state charts; Theme I (Examples
44-48) chooses and combines the four tools. The
[capstone](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/capstone/overview)
assembles a typed order-submission flow from the same four tools with the same
testing seams.

## How to read an example

Every example follows the same five-part shape: the number and concept tags, a
short explanation naming the real library construct, an optional diagram of the
idea, the heavily commented model, and the key takeaway. Each model runs on the
pinned Node.js toolchain with no network and no dependencies, against no
fixtures beyond its own source file, so every printed value on these pages is a
genuine, captured transcript, never a fabricated one. The models stand in for
the real libraries' behavior as data: where the text names a construct
(`z.infer`, `Effect.gen`, `createCallerFactory`, `createActor`), that construct
is the production behaviour the library provides for real; the model resolves
the same inputs to the same verdicts the library would compute. Each theme ends
with a pointer to the next, so the forty-eight examples form one path rather
than nine islands: schemas validate, effects type failure, procedures route,
inference shares, machines gate, charts scale, and selection chooses.

## Concept coverage

Sixteen concepts run through the 48 examples, each exercised by at least two
examples so no idea appears only once: co-01 schema-as-single-source-of-truth
(Examples 1-5, 10, 23, 30, 44); co-02 parse-dont-validate (Examples 5-10, 15);
co-03 typed-error-channel (Examples 11-15, 24, 33, 38); co-04 effect-composition
(Examples 13, 16-18, 21, 32, 42, 45); co-05 dependency-injection-via-effect
(Examples 19, 20, 26); co-06 end-to-end-type-inference (Examples 27-33); co-07
procedure-and-router (Examples 22-27); co-08 state-machine (Examples 34, 37, 38,
46); co-09 state-chart (Examples 39-43); co-10 guard-and-action (Examples 35,
36); co-11 invalid-state-elimination (Examples 37, 43); co-12
library-interoperability (Examples 44-46); co-13 runtime-vs-compile-time-safety
(Examples 7, 14, 47); co-14 migration-cost (Examples 10, 47); co-15
tool-selection (Examples 47, 48); co-16 testing-each-tool (Examples 20, 48). The
concept list and source mapping (the four libraries' documentation and the
pinned Node toolchain) live in the course syllabus.

## Examples by theme

### Theme A: Zod schemas and inference

- [Worked Example 1: First Zod Schema](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/theme-a-zod-schemas-and-inference#worked-example-1-first-zod-schema) -- one field list drives the check and the type.
- [Worked Example 2: Nested Object Schema](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/theme-a-zod-schemas-and-inference#worked-example-2-nested-object-schema) -- dotted paths point at the failing leaf.
- [Worked Example 3: Optional, Default, Refine](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/theme-a-zod-schemas-and-inference#worked-example-3-optional-default-refine) -- absence, filling, and content rules.
- [Worked Example 4: Schema Composition](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/theme-a-zod-schemas-and-inference#worked-example-4-schema-composition) -- extend grows, merge joins, neither mutates.
- [Worked Example 5: Discriminated Union](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/theme-a-zod-schemas-and-inference#worked-example-5-discriminated-union) -- the tag routes, the boundary rejects.

### Theme B: parsing untrusted input

- [Worked Example 6: safeParse Versus parse](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/theme-b-parsing-untrusted-input#worked-example-6-safeparse-versus-parse) -- values for the expected, throws for the impossible.
- [Worked Example 7: JSON Boundary](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/theme-b-parsing-untrusted-input#worked-example-7-json-boundary) -- the wire is lying until the schema says otherwise.
- [Worked Example 8: Array of Records](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/theme-b-parsing-untrusted-input#worked-example-8-array-of-records) -- every bad item named by index.
- [Worked Example 9: Coerce and Transform](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/theme-b-parsing-untrusted-input#worked-example-9-coerce-and-transform) -- wire shapes in, domain shapes out.
- [Worked Example 10: Branded Types](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/theme-b-parsing-untrusted-input#worked-example-10-branded-types) -- same-shaped strings, incompatible types.

### Theme C: Effect's typed errors

- [Worked Example 11: First Typed Error](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/theme-c-effect-s-typed-errors#worked-example-11-first-typed-error) -- the signature advertises the failure.
- [Worked Example 12: Error Union](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/theme-c-effect-s-typed-errors#worked-example-12-error-union) -- every failure mode listed up front.
- [Worked Example 13: Catch by Tag](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/theme-c-effect-s-typed-errors#worked-example-13-catch-by-tag) -- one error recovers, the other passes through.
- [Worked Example 14: Fail Versus Defect](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/theme-c-effect-s-typed-errors#worked-example-14-fail-versus-defect) -- values for failures, defects for bugs.
- [Worked Example 15: Nullable and Throwing Edges](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/theme-c-effect-s-typed-errors#worked-example-15-nullable-and-throwing-edges) -- one gate per untyped edge.

### Theme D: Effect composition and dependencies

- [Worked Example 16: Chain With andThen](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/theme-d-effect-composition-and-dependencies#worked-example-16-chain-with-andthen) -- the first failure stops the pipeline.
- [Worked Example 17: Join With all](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/theme-d-effect-composition-and-dependencies#worked-example-17-join-with-all) -- independent results pair into one.
- [Worked Example 18: Retry With Budget](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/theme-d-effect-composition-and-dependencies#worked-example-18-retry-with-budget) -- policy as data, not hand-rolled loops.
- [Worked Example 19: Inject the Clock](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/theme-d-effect-composition-and-dependencies#worked-example-19-inject-the-clock) -- dependencies as arguments.
- [Worked Example 20: Test Layer Swap](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/theme-d-effect-composition-and-dependencies#worked-example-20-test-layer-swap) -- same logic, production and test layers.
- [Worked Example 21: Scoped Resources](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/theme-d-effect-composition-and-dependencies#worked-example-21-scoped-resources) -- release in reverse, leaks at zero.

### Theme E: tRPC procedures and routers

- [Worked Example 22: First Query Procedure](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/theme-e-trpc-procedures-and-routers#worked-example-22-first-query-procedure) -- the unit of a typed call.
- [Worked Example 23: Validated Procedure Input](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/theme-e-trpc-procedures-and-routers#worked-example-23-validated-procedure-input) -- the schema runs before the handler.
- [Worked Example 24: Mutation and Typed Error](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/theme-e-trpc-procedures-and-routers#worked-example-24-mutation-and-typed-error) -- conflicts carry tags, not status codes.
- [Worked Example 25: Router Composition](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/theme-e-trpc-procedures-and-routers#worked-example-25-router-composition) -- domains merge, clashes refuse.
- [Worked Example 26: Middleware and Context](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/theme-e-trpc-procedures-and-routers#worked-example-26-middleware-and-context) -- auth once, context everywhere.
- [Worked Example 27: In-Process Caller](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/theme-e-trpc-procedures-and-routers#worked-example-27-in-process-caller) -- the router tested with no network.

### Theme F: end-to-end type inference

- [Worked Example 28: Derive Client Types](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/theme-f-end-to-end-type-inference#worked-example-28-derive-client-types) -- the router type read on both sides.
- [Worked Example 29: Server Change Breaks Client](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/theme-f-end-to-end-type-inference#worked-example-29-server-change-breaks-client) -- renames break builds, not production.
- [Worked Example 30: Shared Schema Across Wire](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/theme-f-end-to-end-type-inference#worked-example-30-shared-schema-across-wire) -- courtesy on the client, security on the server.
- [Worked Example 31: Optimistic Update Shape](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/theme-f-end-to-end-type-inference#worked-example-31-optimistic-update-shape) -- the guess wears the reply's type.
- [Worked Example 32: Batched Loader](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/theme-f-end-to-end-type-inference#worked-example-32-batched-loader) -- N keys, one round trip.
- [Worked Example 33: Typed Procedure Errors](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/theme-f-end-to-end-type-inference#worked-example-33-typed-procedure-errors) -- every failure renders its recovery.

### Theme G: XState machines and transitions

- [Worked Example 34: First Toggle Machine](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/theme-g-xstate-machines-and-transitions#worked-example-34-first-toggle-machine) -- states named, moves tabled.
- [Worked Example 35: Guarded Transition](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/theme-g-xstate-machines-and-transitions#worked-example-35-guarded-transition) -- conditions on the edge, not in the handler.
- [Worked Example 36: Entry and Exit Actions](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/theme-g-xstate-machines-and-transitions#worked-example-36-entry-and-exit-actions) -- edges own setup and teardown.
- [Worked Example 37: Impossible Move Rejected](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/theme-g-xstate-machines-and-transitions#worked-example-37-impossible-move-rejected) -- illegal moves named, never performed.
- [Worked Example 38: Fetch Lifecycle Machine](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/theme-g-xstate-machines-and-transitions#worked-example-38-fetch-lifecycle-machine) -- loading and failure as states.

### Theme H: state charts (nested and parallel)

- [Worked Example 39: Nested States](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/theme-h-state-charts-nested-and-parallel#worked-example-39-nested-states) -- children specialize, the parent generalizes.
- [Worked Example 40: Parallel Regions](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/theme-h-state-charts-nested-and-parallel#worked-example-40-parallel-regions) -- orthogonal concerns, side by side.
- [Worked Example 41: History State](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/theme-h-state-charts-nested-and-parallel#worked-example-41-history-state) -- interruptions resume, never restart.
- [Worked Example 42: Invoked Service](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/theme-h-state-charts-nested-and-parallel#worked-example-42-invoked-service) -- async answers become states.
- [Worked Example 43: Checkout State Chart](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/theme-h-state-charts-nested-and-parallel#worked-example-43-checkout-state-chart) -- money moves once, in order.

### Theme I: choosing and combining the four tools

- [Worked Example 44: Zod Guards tRPC](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/theme-i-choosing-and-combining-the-four-tools#worked-example-44-zod-guards-trpc) -- the schema is the lock on the procedure's door.
- [Worked Example 45: Effect Inside Procedure](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/theme-i-choosing-and-combining-the-four-tools#worked-example-45-effect-inside-procedure) -- fallible logic, typed to the edge.
- [Worked Example 46: Machine Drives Procedures](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/theme-i-choosing-and-combining-the-four-tools#worked-example-46-machine-drives-procedures) -- the UI state gates the network.
- [Worked Example 47: Selection Matrix](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/theme-i-choosing-and-combining-the-four-tools#worked-example-47-selection-matrix) -- name the gap, take its tool.
- [Worked Example 48: Testing Each Tool](/en/learn/courses/typescript-advanced-tooling-zod-effect-trpc-and-xstate/learning/theme-i-choosing-and-combining-the-four-tools#worked-example-48-testing-each-tool) -- the seam decides the test.

## References

- Zod documentation -- [Zod](https://zod.dev) (schemas, `z.infer`, `safeParse`, coercion, brands, and discriminated unions re-verified there at writing time)
- Effect documentation -- [Effect](https://effect.website) (`Effect.gen`, `Effect.andThen`, `Effect.all`, `Effect.catchTag`, `Effect.retry`, Layers, and scopes re-verified there at writing time)
- tRPC documentation -- [tRPC](https://trpc.io) (procedures, input validation, routers, middleware, `createCallerFactory`, and inferred types re-verified there at writing time)
- XState documentation -- [XState](https://stately.ai/docs) (machines, guards, actions, actors, parallel and history states, and invoked services re-verified there at writing time)
- Pinned toolchain -- Node.js 24 with the pinned TypeScript toolchain (the runtime every model in this course runs under; version-specific behaviour follows the toolchain pin)

---

← Previous: [Overview](../overview.md) · Next: [Theme A: Zod Schemas and Inference](./theme-a-zod-schemas-and-inference.md) →
