---
description: >-
  Fixes the Gin boundary rules a Go web service adds on top of the Go standard: binding that returns errors, tagged
  request types, request context never shared with goroutines, explicit trusted proxies and release mode, and router
  tests over an in-memory recorder.
when_to_use: >-
  Use when building, configuring, or reviewing a Go HTTP service written with Gin, or when binding a request, starting
  work from a handler, or testing through the router.
---

# Gin Standards

This standard is canonical for Gin and holds only the rules at the boundary where Gin handlers meet ordinary Go code. It
inherits [Go Standards](golang-standards.md) and restates nothing from it: the Go gates, error forms, interface
placement, goroutine ownership, and context rules all apply. A Gin framework skill defers here.

It implements [Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md) and
Fail Closed.

## Gates

Gin adds no gate of its own.

## Type and Boundary Safety

[Type and Boundary Safety](../code/type-and-boundary-safety.md) owns the rule; in Gin it maps as follows.

- **Request types declare their constraints.** Each request body, query, or path shape is a struct with exported, tagged
  fields whose `binding` tags state what is required and allowed, as the
  [binding documentation](https://gin-gonic.com/en/docs/binding/binding-and-validation/) describes. A handler never
  reads raw parameters one by one to rebuild the same shape.
- **Binding returns its error.** A handler binds with the variants that return an error, never with the ones that abort
  the request themselves, which answer with a plain-text 400 in place of the service's error shape. The handler maps the
  returned error to that shape once.
- **The bound value converts before the core.** The transport struct converts into the domain type through its own
  constructor, so domain code never receives a transport struct.

## Handlers and Concurrency

- **Handlers only translate.** A handler binds, calls one application function, and writes one response; it holds no
  business rule, as [Functional Core, Imperative Shell](../../pattern/functional-core-imperative-shell-web.md) requires.
- **The request context never leaves its handler.** A goroutine started from a handler or middleware never uses the
  framework's request context value, which is reused after the request returns; it receives a
  [copy](https://gin-gonic.com/en/docs/middleware/goroutines-inside-a-middleware/) or only the values it needs, and
  cancellation flows through the standard library context as Go Standards sets.
- **Middleware is registered before the routes it guards.** Middleware added after a route is declared does not apply to
  it, so the router is assembled in one place, middleware first.

## Server Configuration

- **Trusted proxies are explicit.** The router names the proxies allowed to set forwarding headers, or trusts none.
  Trusting every proxy, the framework default, lets any client choose the address the service
  [records for it](https://gin-gonic.com/en/docs/server-config/trusted-proxies/).
- **Release mode in production.** A deployed service runs in the framework's release mode, set explicitly by its
  configuration, since debug mode logs routes and warnings meant for development.

## Tests

Layers follow [Test Boundaries and Gates](../../behaviour-driven-development.md). Application logic is unit-tested as
plain Go. A handler is tested by serving a request through the real router into an in-memory response recorder, with the
framework in test mode, as its [testing guide](https://gin-gonic.com/en/docs/testing/) shows. That test runs the
framework pipeline, so it is an integration test even though it opens no socket. Each binding, validation, and
authorization failure gets its own test asserting the status and error shape. What coverage measures follows
[Meaningful Coverage](../testing/meaningful-coverage.md).

## Documentation

An HTTP contract follows [OpenAPI Contract First](../../pattern/openapi-contract-first.md); the router's routes and
the contract's operations match one to one.

## Enforcement

The Go gates enforce in the adopter's own build, hooks, and pipeline, and a configuration test proves trusted proxies
and release mode are set. Review applies binding variants, context handling, middleware order, and handler thinness.
