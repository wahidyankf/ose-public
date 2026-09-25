---
description: >-
  Fixes the Giraffe boundary rules an F# web application adds on top of the F# and ASP.NET Core standards: typed routes,
  strict binding and model validation at the edge, handler pipeline order, one result-to-response mapping, and the
  framework's safe redirect and forgery helpers.
when_to_use: >-
  Use when an F# application records Giraffe as its web framework, or when routing, binding, validating, or responding
  in a Giraffe handler, or reviewing one.
---

# Giraffe Standards

This standard is canonical for Giraffe and applies where the adopter records Giraffe as its web framework under the
[F# Standards](fsharp-standards.md) adopter decision. It inherits F# Standards and
[ASP.NET Core Standards](aspnet-core-standards.md) and restates neither: their gates, compile order, functional core,
failure types, options, lifetimes, and host tests all apply. It holds only the rules at the boundary where Giraffe
handlers meet those two, and a Giraffe framework skill defers here.

It implements [Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md) and
Fail Closed.

## Gates

Giraffe adds no gate of its own.

## Routing

- **Routes are typed.** A route with parameters uses the framework's typed format routes, so each parameter arrives as a
  typed value checked by the route pattern; a handler never splits or parses the path by hand.
- **One routing style per application.** The adopter records whether routes use the framework's own router or its
  [endpoint routing](https://github.com/giraffe-fsharp/Giraffe/blob/master/DOCUMENTATION.md) integration, which hands
  matching, constraints, and endpoint metadata to ASP.NET Core. The two are never mixed in one application.

## Type and Boundary Safety

[Type and Boundary Safety](../code/type-and-boundary-safety.md) owns the rule; in Giraffe it maps as follows.

- **Binding is strict at a trust boundary.** Query and form input binds through the framework's strict binders, which
  return a result and refuse a payload missing a mandatory field, never through the loose binders, which build a value
  from whatever arrived. The [binding documentation](https://giraffe.wiki/docs) lists both families.
- **Bound models are validated before the core.** A body without a strict binder, such as JSON, deserializes into a
  transport type that implements the framework's model-validation interface and passes its validating handler before
  anything else reads it. The validated transport type then converts into the domain type through the domain's own
  constructor, so the core never sees an unchecked value.

## Handler Pipeline

A request's handler chain runs in a fixed order: route, then authentication and authorization, then binding and
validation, then one call into the application core, then one mapping of its result. Composition puts each check ahead
of every handler that depends on it, so a later handler never runs on an unauthorized or unvalidated request.

The mapping from the core's error union to status codes and response bodies is one function per application, applied at
the end of the chain, so each error case becomes a response exactly once, as
[Errors Cross Once](../../pattern/hexagonal-architecture/layer-definitions.md) requires. The match over
the error union names every case, as F# Standards sets.

## Framework Safety Helpers

- A redirect whose target comes from input uses the framework's safe redirect handlers, which validate the target before
  redirecting, never a plain redirect to a supplied address.
- A form that changes state is protected by the framework's forgery-token helpers or the host's equivalent.

Both helper families arrived in a recent release line
([release notes](https://github.com/giraffe-fsharp/Giraffe/releases)); an application on an older line records the
equivalent it uses instead.

## Tests

Layers follow [Test Boundaries and Gates](../../behaviour-driven-development.md). The core is tested as F# Standards
sets. A handler chain runs through the ASP.NET Core integration host as that standard sets, and each routing, binding,
validation, and authorization failure gets its own test that asserts the response. What coverage measures follows
[Meaningful Coverage](../testing/meaningful-coverage.md).

## Documentation

An HTTP contract follows [OpenAPI Contract First](../../pattern/openapi-contract-first.md); the route table and the
contract describe the same operations.

## Enforcement

The F# and ASP.NET Core gates enforce in the adopter's own build, hooks, and pipeline. Review applies typed routes,
strict binding, pipeline order, and the single result mapping.
