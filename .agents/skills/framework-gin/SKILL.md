---
name: framework-gin
description: >-
  Guides Gin handler work under its standard, on top of the Go skill: binding with the error-returning variants, keeping
  the request context inside its handler, assembling the router in one place, and testing through the router.
when_to_use: >-
  Use when writing, changing, or reviewing a Gin route, handler, middleware, or router configuration, before the first
  test of the change.
compatibility: Requires a Go module that serves HTTP with Gin.
---

# Gin Framework

Every Gin rule is owned by [Gin Standards](../../../repo-governance/development/quality/stacks/gin-standards.md), which
inherits [Go Standards](../../../repo-governance/development/quality/stacks/golang-standards.md). This skill inherits
[Go Programming](../programming-golang/SKILL.md) and repeats nothing from it: the toolchain gates, error forms,
interface placement, and goroutine ownership are its. It adds only the judgement at the boundary where a Gin handler
meets plain Go. Where a sentence here seems to state a rule, the standard decides.

## Start From What the Project Records

Find the one place the router is assembled, the error shape the service returns, and how the configuration sets trusted
proxies and the framework mode. Run the Go gates on the untouched tree; a gate already failing is handled under
[Preexisting Error Resolution](../../../repo-governance/development/practice/proactive-preexisting-error-resolution.md).

## Write the Core Before the Handler

Write the application function test-first as plain Go, taking the standard library context and domain values, with no
framework type in its signature. The handler then binds, converts, calls it once, and writes one response. A handler
that grows a business branch is moving work out of the core; move it back.

## Bind With the Returning Variant

Declare the request struct with exported fields and binding tags first, then write a failing router test for each
rejection it should produce: a missing field, a wrong type, an out-of-range value. Bind with the variant that returns an
error, and map that error to the service's error shape in the one helper every handler uses. A test that sees a
plain-text 400 has found a binder that aborts on its own.

## Keep the Request Context Home

Before starting a goroutine from a handler or middleware, decide what it needs:

| It needs                              | Pass it                                          |
| ------------------------------------- | ------------------------------------------------ |
| a few request values                  | those values, copied                             |
| the framework context's data          | the framework's copy of the context              |
| to stop when the request is cancelled | the request's standard library context           |
| to outlive the request                | a fresh context, owned by whatever runs the work |

Never pass the framework's original request context; it is reused once the handler returns, and the race detector may
not catch the misuse in a short test.

## Test Through the Router

Build the real router in the test, in test mode, serve each request into an in-memory recorder, and assert the status
and body. Register routes through the same assembly function production uses, so middleware order and trusted-proxy
settings are what the test exercises. Keep the core's own tests free of the framework. Layers follow
[Test Boundaries and Gates](../../../repo-governance/development/behaviour-driven-development.md).

## Before Handing Off

- the Go gates in the Go skill's list all passed;
- every new handler binds with an error-returning variant and writes one response;
- no goroutine receives the original framework request context;
- new middleware is registered before the routes it guards; and
- each recorded red failed on an assertion about the missing behaviour.
