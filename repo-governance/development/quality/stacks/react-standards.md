---
description: >-
  Fixes React stack choices: function components with typed props, hooks and accessibility lint rules, state in its
  narrowest home with server data in a query cache, logic outside components, tests written as a user acts, and no
  secret or sensitive data in client code or persistent browser storage.
when_to_use: >-
  Use when building, structuring, or reviewing React components, hooks, state, or component tests, when rendering raw
  HTML or keeping tokens in the browser, or when choosing a store, query, or form library.
---

# React Standards

This standard is canonical for React and holds only the choices React leaves open; a skill for building React interfaces
defers here.

It implements [Pure Functions](../../../principles/software-engineering/pure-functions.md),
[Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md),
[Accessibility First](../../../principles/content/accessibility-first.md), and
[Simplicity Over Complexity](../../../principles/general/simplicity-over-complexity.md). Typing follows
[TypeScript Standards](typescript-standards.md), interfaces follow [Accessibility](../../frontend/accessibility.md)
and [Design Tokens](../../frontend/design-tokens.md), and a Next.js application adds
[Next.js Standards](nextjs-standards.md).

## Version

New work targets the current stable major line, pinned as
[Native-First Toolchain](../../workflow/native-first-toolchain.md) requires, unless the framework it runs on records the
major, as Next.js Standards does. Crossing a major is a planned change.

## Components

- **Function components only.** The one class is an error boundary, which React offers only in that form; a small shared
  one wraps each region that can fail, so a failure shows a fallback, not a blank page.
- **Props are explicitly typed** with a named type. Mutually exclusive variants are a discriminated union, never a
  cluster of optional flags.
- **Rendering is pure.** Output comes from props and state, neither is mutated, and the DOM is never changed by hand.
  Derivable values are computed during render, not copied into state.
- **Hooks follow the rules of hooks:** called unconditionally at the top of a component or custom hook, named with the
  `use` prefix, and given complete dependency lists. An effect synchronizes with one external system and cleans up what
  it starts.
- **List keys are stable identifiers,** never positions in a list that can reorder.
- **Code is grouped by feature.** Each feature holds its components, hooks, and domain functions.
- **Logic stays outside components.** Domain rules live in plain functions, per
  [Functional Core, Imperative Shell](../../pattern/functional-core-imperative-shell-web.md). A custom hook adapts them to
  components and maps domain errors to messages a user can act on. Components are the presentation adapter
  [Application Shapes](../../pattern/hexagonal-architecture/dependency-rule-app-type-specializations-and-related.md) describes.

## State

State lives in the narrowest home that serves it:

1. **One component:** local state, or a reducer when transitions are complex.
2. **A parent and near children:** lifted to the parent and passed as props.
3. **Owned by a server:** a query cache, which owns fetching, caching, invalidation, and loading and error states.
4. **Client state across a distant tree:** context for rarely changing values, and the adopter's chosen store, a store
   library or context with reducers, for frequent or complex updates.

Server data is never copied into component or global state, where it goes stale beside the cache.

## Security

- Raw HTML is rendered only after sanitisation, and escaped rendering is used wherever it serves.
- No secret or sensitive data sits in client code, a client bundle, or persistent browser storage, since the browser
  discloses all three to anyone who opens it. An access token is held in session storage, and a refresh token only in an
  httpOnly cookie.

## Tests

A component test renders the component and acts as a user does: it finds elements by role, label, or visible text,
drives them with simulated user events, and asserts on what appears. It never inspects internal state, instance methods,
or class names. Each interactive component's tests include an automated accessibility check, which never replaces the
manual [Release Check](../../frontend/accessibility.md). Layers and test-first work follow
[Test Boundaries and Gates](../../behaviour-driven-development.md) and
[Test-Driven Development](../../workflow/test-driven-development.md).

## Gates

Beyond the TypeScript gates, lint enables the rules of hooks, exhaustive effect dependencies, and JSX accessibility
rules, failing at the threshold [Lint Strictness](../cross-language-lint-strictness.md) sets.

## Modules

1. [Library Decisions](react-standards/library-decisions.md)

## Enforcement

An adopter enforces the lint rules and the accessibility check in its own gates. Review applies state placement, the
security rules, and keeps logic outside components.
