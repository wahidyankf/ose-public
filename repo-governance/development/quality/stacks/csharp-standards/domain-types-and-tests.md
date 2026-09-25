---
description: >-
  Fixes the C# shapes for value objects, identifiers, aggregates, and ports, the architecture test holding the layer
  rule, and how C# tests are written, asserted, and measured.
when_to_use: >-
  Use when modelling a C# domain type or port, or when writing, structuring, or measuring the tests of a C# project.
---

# Domain Types and Tests

## Domain Types

Layering follows [Hexagonal Architecture](../../../pattern/hexagonal-architecture.md) and
[Functional Core, Imperative Shell](../../../pattern/functional-core-imperative-shell-web.md). Inside it:

| Concept      | C# shape                                                                                           |
| ------------ | -------------------------------------------------------------------------------------------------- |
| value object | a `sealed record`, or a small `readonly record struct`, validated at construction, with no setter  |
| identifier   | a `readonly record struct` over the raw key, one type per entity, so mixed-up keys fail to compile |
| aggregate    | created only through a static factory, with private setters and invariants checked in its methods  |
| port         | an interface in an inner project, implemented in an adapter project                                |

An inner project references no web or data-access package, so a leaking import fails the build. An architecture test
asserts the same dependency rule in the test run, so a forbidden dependency that arrives another way also fails.

## Tests

- One test framework serves every test project, with a single-case form and a parameterised form, and an asynchronous
  test returns `Task`.
- One assertion style serves the whole solution, so every failure message reads the same way.
- Coverage is collected in the unit run that gates, as
  [Test Boundaries and Gates](../../../behaviour-driven-development.md) requires. Any floor is recorded under
  [Layers and Adapters](../../../behaviour-driven-development.md).
- Work proceeds test-first under [Test-Driven Development](../../../workflow/test-driven-development.md).

The adopter records its test framework, assertion library, analyzer set, validation library, and architecture-test tool
once per solution, selected as Dependency Selection requires.

Example: xUnit's `[Fact]` and `[Theory]` attributes, Coverlet collecting coverage in the unit run, and ArchUnitNET
asserting the dependency rule.
