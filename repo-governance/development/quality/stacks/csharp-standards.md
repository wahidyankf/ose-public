---
description: >-
  Fixes the C# on .NET baseline: nullable references, analyzers, warnings, and the formatter as failing gates, the
  long-term-support runtime line, shared build files, async and failure defaults, and C# domain and test shapes.
when_to_use: >-
  Use when creating, configuring, or reviewing a C# project on .NET, or when choosing its runtime line, analyzer
  settings, async and failure handling, or the shape of a C# domain type or test.
---

# C# Standards

This standard is canonical for C# on .NET. It holds the choices C# and the SDK leave open, and a C# programming skill
defers here for each rule it applies.

It implements [Automation Over Manual](../../../principles/software-engineering/automation-over-manual.md),
[Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md),
[Immutability](../../../principles/software-engineering/immutability.md), and [Pure Functions](../../../principles/software-engineering/pure-functions.md). SDK
version files, toolchain pins, and lockfiles follow [Native-First Toolchain](../../workflow/native-first-toolchain.md)
and [Reproducibility](../../../principles/software-engineering/reproducibility.md).

## Gates

`Directory.Build.props` at the solution root switches every gate on once, so no project escapes one by omission.

- **Nullable reference types:** `<Nullable>enable</Nullable>`.
- **Analyzers:** the built-in .NET analyzers at a recommended analysis level, with `EnforceCodeStyleInBuild`, plus one
  further analyzer set the adopter records in the same file.
- **Warnings:** `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>` in every build configuration, as
  [Lint Strictness](../cross-language-lint-strictness.md) requires. A warning enforced only in release builds passes every local
  run.
- **Formatting:** `dotnet format --verify-no-changes`, reading a committed `.editorconfig`.

A `#pragma warning disable`, a null-forgiving `!`, and `null!` are waivers: each sits beside a comment saying why it is
safe. A property that must be set is `required` or assigned in the constructor.

## Runtime Line

A new project targets the current .NET long-term-support release. An existing project stays on a supported
long-term-support release and upgrades before its support ends. A short-term-support release is limited to experiments
and internal tooling, since a production service on one upgrades on the shorter cycle or runs unpatched. The adopter
records the release numbers in its SDK version file.

## Build Defaults

- Projects use the SDK-style format only, with implicit usings enabled and any project-wide global usings in one file.
- NuGet Central Package Management is on: `Directory.Packages.props` declares each version once, and project files
  reference packages without one, so two projects cannot drift apart. The pin form follows
  [Dependency Bump Policy](../../workflow/dependency-bump-policy.md).
- Restore, build, test, and publish run through the `dotnet` command line, the same for contributors and the pipeline.

## Language Defaults

- Data without identity, such as a request, a result, or an event, is a `record`, and exposed collections are read-only
  interfaces.
- Namespaces are file-scoped and follow the folder path.
- A monetary amount is `decimal`, never `float` or `double`, whose binary fractions round. Domain and application code
  declares no `object` or `dynamic`, and reads the time through an injected time provider, so a test controls the clock.

## Asynchronous Code

- Nothing blocks on `.Result`, `.Wait()`, or `.GetAwaiter().GetResult()`, which can deadlock, and only an event handler
  is `async void`.
- An asynchronous method's name ends in `Async` and it returns `Task` or `Task<T>`; `ValueTask` is kept to a hot path
  where the method often completes synchronously.
- Library and infrastructure code awaits with `ConfigureAwait(false)`, because it cannot know its caller's
  synchronization context.
- A public asynchronous method accepts a `CancellationToken` and passes it to every input or output call, so work stops
  when its caller gives up. A cancellation exception is caught only at the outermost boundary.

## Failures

- An expected business failure is returned as a result value by default. A broken domain rule inside an aggregate may
  throw a domain exception instead; any other exception signals a broken invariant or an infrastructure fault.
- Every exception type the application defines derives from one base type carrying a stable error code, so a handler
  maps codes rather than messages.
- Entry points guard their arguments with the built-in throw helpers, and input passes schema validation before any
  business logic runs.
- A catch block rethrows, translates, or handles, never discards. A failure becomes a transport response once, as
  [Errors Cross Once](../../pattern/hexagonal-architecture/layer-definitions.md) requires, and an HTTP
  error response uses the standard problem-details shape.

## Modules

1. [Domain Types and Tests](csharp-standards/domain-types-and-tests.md)

## Enforcement

The compiler, the analyzers, and the formatter enforce the gates in the adopter's own build, hooks, and pipeline, and an
architecture test holds the layer rule the module states. Review applies the language, asynchronous, and failure
defaults.
