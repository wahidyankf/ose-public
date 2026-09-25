---
description: >-
  Fixes the F# baseline: a mandatory formatter, explicit dependency-ordered compilation, warnings and incomplete matches
  as errors, a functional core, and the F# shapes for domain types and failures, leaving framework choice to the
  adopter.
when_to_use: >-
  Use when creating, configuring, or reviewing an F# project, or when ordering its compile list, modelling a domain or a
  failure in F#, or choosing its web or test framework.
---

# F# Standards

This standard is canonical for F# on .NET. It holds the choices F# and the SDK leave open, and an F# programming skill
defers here for each rule it applies.

It implements [Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md),
[Immutability](../../../principles/software-engineering/immutability.md), [Pure Functions](../../../principles/software-engineering/pure-functions.md), and
[Automation Over Manual](../../../principles/software-engineering/automation-over-manual.md). SDK version files, tool manifests, and
lockfiles follow [Native-First Toolchain](../../workflow/native-first-toolchain.md) and
[Reproducibility](../../../principles/software-engineering/reproducibility.md).

## Gates

- **Formatting:** the formatter runs in check mode with committed settings and fails on any unformatted file. Example:
  Fantomas as a local tool, run with `--check`.
- **Warnings:** every project sets `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`.
- **Nullable interop:** every project sets `<Nullable>enable</Nullable>`, so a null from a .NET API is reported. This
  needs a compiler with nullness checking; where the toolchain lacks it, the gate is recorded pending.
- **Incomplete matches:** a warning for an unhandled case is fixed by handling the case, never by `#nowarn`.

Each project file declares its target framework, these settings, and its project references. Any other suppression takes
the narrowest scope and states its reason, as [Lint Strictness](../cross-language-lint-strictness.md) requires.

## Compile Order Is the Dependency Direction

Every `.fsproj` lists its files explicitly: shared contracts and domain types first, then domain and application logic,
then adapters after the abstractions they implement, and the entry point last. A file sees only what the files above it
define, so the compiler checks this order as a dependency rule. A recursive module or an `and` group is a question for
review. Test projects follow the same order.

## Functional Core

Domain and application decisions are pure functions returning typed values. The filesystem, processes, the clock, and
the network stay in the shell and reach the core as functions passed in, as
[Functional Core, Imperative Shell](../../pattern/functional-core-imperative-shell-web.md) requires. Pure functions are
tested directly, and an invariant every valid input must keep also gets a property-based test.

Domain state uses no classes, inheritance, or `mutable` fields. A `mutable` binding appears only on a measured hot path,
citing its measurement.

## Domain Types

| Concept              | F# shape                                                                                        |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| closed set of states | a discriminated union, never strings, booleans, or status codes                                 |
| data                 | an immutable record                                                                             |
| identifier           | a single-case union; where a rule constrains it, a private case and `create` returning `Result` |
| domain event         | a case of an event union                                                                        |
| aggregate            | a pure function of state and command returning `Result` of new state and events                 |

Domain code holds no `obj`. Time and new identifiers arrive as arguments. A match over a domain union names every case
and uses no wildcard, so a new case breaks each match that must handle it. Values and functions are `camelCase`; types,
modules, union cases, and record fields are `PascalCase`; a public function declares its parameter and return types.

## Failures

- An expected failure is `Result<'T, 'Error>` with a union of named error cases, never a string or an exception.
- Absence is `Option<'T>`; domain code never returns `null`.
- An exception marks an unexpected infrastructure fault. It is handled at the shell, and rethrown with `reraise ()` so
  its stack trace survives.

## Adopter Decision

The adopter records each choice that applies:

| Decision       | Option                                            | Gains                                  | Costs                                 |
| -------------- | ------------------------------------------------- | -------------------------------------- | ------------------------------------- |
| web framework  | a minimal functional layer, such as Giraffe       | handlers compose as plain functions    | routing conventions assembled by hand |
|                | an opinionated layer built on one, such as Saturn | routing and defaults arrive ready-made | more framework idiom to learn         |
| test framework | an F#-native one, such as Expecto                 | tests are composable values            | fewer runner integrations             |
|                | xUnit or NUnit                                    | tooling shared with C# projects        | attribute-style tests                 |

## Enforcement

The formatter check and the compiler settings enforce the gates in the adopter's own build, hooks, and pipeline. Review
applies compile order, domain shapes, and failure types. Test layers and coverage follow
[Test Boundaries and Gates](../../behaviour-driven-development.md), and work proceeds under
[Test-Driven Development](../../workflow/test-driven-development.md).
