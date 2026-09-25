---
description: >-
  Fixes ASP.NET Core stack choices on top of the .NET language baseline: validated options that fail at startup,
  validated requests and typed results, deliberate service lifetimes, pooled outbound HTTP clients, and in-process host
  tests for the request pipeline.
when_to_use: >-
  Use when building, configuring, or reviewing an ASP.NET Core application in C# or F#, or when binding its options,
  validating its requests, choosing a service lifetime, or testing through its host.
---

# ASP.NET Core Standards

This standard is canonical for ASP.NET Core and holds only the choices the framework leaves open. It inherits the
standard of the .NET language the project is written in, [C# Standards](csharp-standards.md) or
[F# Standards](fsharp-standards.md), whose gates, runtime line, build defaults, and failure rules apply unchanged. An
ASP.NET Core framework skill defers here for each rule it applies, and a functional layer built on the framework, such
as [Giraffe Standards](giraffe-standards.md), adds its own rules on top.

It implements [Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md),
Fail Closed, and [Reproducibility](../../../principles/software-engineering/reproducibility.md).

## Gates

ASP.NET Core adds no gate of its own; the language standard's gates run over framework code too. The framework's version
follows the runtime line that standard fixes.

## Type and Boundary Safety

[Type and Boundary Safety](../code/type-and-boundary-safety.md) owns the rule; in ASP.NET Core it maps as follows.

- **Options are validated at startup.** Each settings group binds to one
  [options](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/configuration/options) type, validated by data
  annotations or a validator class, and registered with validation on start, so an invalid value stops the host rather
  than failing on first use. Code reads settings through that type, never by string key.
- **Requests are validated before the handler decides.** Bound request models pass the framework's built-in validation,
  or the validation library the adopter records, before any business logic runs, and a failure becomes a standard
  problem-details response.
- **Responses are typed.** A minimal API endpoint returns
  [typed results](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis/responses), declaring the
  union of results it can produce, so the compiler checks each return and the published description stays accurate.

## Request Pipeline

These rules follow the framework's
[best practices](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/best-practices).

- **The request context stays on its request.** The HTTP context is never stored in a field or used from another thread
  or after the request ends; work handed off copies the values it needs.
- **Service lifetimes are deliberate.** A singleton never holds a scoped service. A background service creates a scope
  for each unit of work and resolves scoped services inside it.
- **Outbound HTTP uses the client factory.** Clients come from the framework's client factory, typed per upstream
  service, never constructed per request, which exhausts sockets, nor held as one static instance, which misses DNS
  changes.
- **Middleware order is declared once.** The pipeline is assembled in one composition root, in an order a reader can
  check against the framework's documented sequence, as
  [Composition Roots and Test Adapters](../../pattern/hexagonal-architecture.md) requires.
- **Endpoints only translate.** An endpoint, controller, or handler binds input, calls one application function, and
  maps its result; it holds no business rule.

## Tests

Layers follow [Test Boundaries and Gates](../../behaviour-driven-development.md). Application logic is unit-tested
without the host. A test that runs the request pipeline starts the application in-process through the framework's
[integration test host](https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests), lives in its own test
project, and is an integration test.

- Only outbound adapters are replaced in the test host's service registration; routing, binding, validation,
  authorization, and serialization run as in production.
- A database test runs against the real provider, or an in-memory relational database where the adopter records that
  choice, never against a non-relational in-memory stand-in, which skips constraints and translation.
- Each authorization policy gets a test in which a caller lacking it is refused.

What coverage measures follows [Meaningful Coverage](../testing/meaningful-coverage.md); the host's startup wiring and
generated contract code are named exclusions when no test layer can reach them usefully.

## Documentation

An HTTP contract follows [OpenAPI Contract First](../../pattern/openapi-contract-first.md). A description the
framework generates from endpoints is checked against the authored contract, never published in its place.

## Enforcement

The language standard's compiler, analyzer, and formatter gates enforce in the adopter's own build, hooks, and pipeline,
and a startup test proves invalid options stop the host. Review applies lifetimes, client creation, context handling,
and endpoint thinness.
