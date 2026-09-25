---
description: >-
  Fixes Next.js stack choices: the App Router with static rendering and server components by default, client components
  only at interactive leaves, server-side fetching with declared caching, validated server actions, route loading and
  error states, and a recorded version line and hosting choice.
when_to_use: >-
  Use when building, structuring, or reviewing a Next.js application's routes, rendering, data fetching, mutations, or
  tests, or when choosing its version line or where it is hosted.
---

# Next.js Standards

This standard is canonical for Next.js and holds only the choices the framework leaves open. Where a component renders
decides what ships to the browser, what can read a secret, and where data is fetched; these rules make the server the
default and the browser the exception.

It implements [Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md),
[Simplicity Over Complexity](../../../principles/general/simplicity-over-complexity.md),
Fail Closed, and
Evidence Over Assertion. It builds on
[React Standards](react-standards.md) and [TypeScript Standards](typescript-standards.md).

## Architecture

- **App Router.** New routes use the App Router; the older router remains only in unmigrated code.
- **Static rendering by default.** A route renders statically unless it reads per-request data, and dynamic rendering is
  never forced where static output serves.
- **Server components by default.** A component becomes a client component only when it needs state, effects, event
  handlers, or a browser interface. The client boundary sits on the smallest interactive leaf, and server-rendered
  content enters a client component as children rather than by import.
- **Layouts stay server components** and fetch nothing specific to one page.
- **Every data-loading segment has a loading state and an error boundary,** so slow data streams behind a fallback and a
  failure stays inside its segment.
- **Route handlers serve callers outside the rendering path,** such as other clients, webhooks, or browser-side
  fetching. A page never calls its own handler for data a server component can read directly.
- **Code is grouped by feature,** and routes import from feature modules.
- **Pages, layouts, actions, and handlers hold no business rules.** They are the presentation adapter
  [Application Shapes](../../pattern/hexagonal-architecture/dependency-rule-app-type-specializations-and-related.md) describes.

## Data

- Data is fetched on the server, in the component that needs it. Independent requests run in parallel.
- Per-request data declares that it is uncached, and cached data declares its revalidation interval or tag. Dynamic data
  never relies on the framework's default, which can change between major versions.
- Mutations run in server actions, and each revalidates the paths or tags whose data it changed.
- Browser-side fetching is kept for data that must refresh in place, through the query cache React Standards requires.

## Server Boundary

- A server action is a publicly reachable endpoint. Each one authenticates, authorizes, and validates its input against
  a schema before any effect, and returns a typed result for an expected failure.
- Secrets and server-only modules are read only in server code. Environment variables pass a schema at startup, which
  fails on an invalid value, and only a value meant for the browser carries the framework's public prefix.

## Performance

Images and fonts go through the framework's image component and font loader, and heavy client components load lazily.
Optimization starts from measured Web Vitals, never from a guess.

## Tests

Core functions and server actions are unit-tested as functions with their boundaries replaced, client components follow
React Standards, and critical journeys run end to end in a real browser. Layers and gates follow
[Test Boundaries and Gates](../../behaviour-driven-development.md), and whether coverage has a floor is recorded under
[Layers and Adapters](../../behaviour-driven-development.md).

## Modules

1. [Version, Hosting, and Examples](nextjs-standards/version-hosting-and-examples.md)

## Enforcement

An adopter's lint gate enforces the mechanical parts, such as the framework's rule against raw image elements. Review
applies rendering modes, client boundaries, cache declarations, and server action validation.
