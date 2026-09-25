---
name: framework-aspnet-core
description: >-
  Guides ASP.NET Core work under its standard: keeping endpoints as translators, choosing each service lifetime
  deliberately, proving options fail at startup, and testing the request pipeline through the in-process host.
when_to_use: >-
  Use when writing, changing, or reviewing an ASP.NET Core endpoint, middleware, service registration, options type, or
  host test, in C# or F#, before the first test of the change.
compatibility: Requires an ASP.NET Core application on .NET with its build, format, and test commands.
---

# ASP.NET Core Framework

Every ASP.NET Core rule is owned by
[ASP.NET Core Standards](../../../repo-governance/development/quality/stacks/aspnet-core-standards.md), which inherits
the project's language standard. [C# Programming](../programming-csharp/SKILL.md) or
[F# Programming](../programming-fsharp/SKILL.md) carries the language procedure, and a Giraffe application adds
[Giraffe Framework](../framework-giraffe/SKILL.md). This skill adds only the judgement of working at the framework
boundary. Where a sentence here seems to state a rule, the standard decides.

## Start From What the Project Records

Read the composition root: the service registrations, the options bindings, and the middleware order. Read the
validation library and in-memory database choice the solution records, if any. Run the format check, the build with
warnings as errors, and the unit tests on the untouched tree. A gate already failing is handled under
[Preexisting Error Resolution](../../../repo-governance/development/practice/proactive-preexisting-error-resolution.md).

## Keep the Endpoint a Translator

Write the application function first, test-first, with no framework type in its signature. The endpoint then binds,
calls it once, and maps the result to a typed response. When an endpoint starts reading the request context in several
places, or branches on a business rule, move that work into the application function and pass it the values instead.

## Choose a Service Lifetime Deliberately

| The service                                              | Lifetime  |
| -------------------------------------------------------- | --------- |
| holds no state, or state safe to share across requests   | singleton |
| holds per-request state, such as a database unit of work | scoped    |
| is cheap, stateless, and resolved in several places      | transient |

Then check the dependencies: a service may depend only on services living at least as long. A singleton that needs a
scoped service takes a scope factory and creates a scope per unit of work. Enable the host's scope validation in
development, so a captured scoped service fails at startup rather than leaking state between requests.

## Prove the Options Fail First

For a new or changed options type, write the red first: a host test that starts with an invalid value and expects
startup to fail. Then add the validation and the validate-on-start registration. A value that is only checked when first
read reaches production and fails there.

## Test Through the In-Process Host

| Under test                                              | Test as                                           |
| ------------------------------------------------------- | ------------------------------------------------- |
| an application or domain function                       | a unit test with no host                          |
| routing, binding, validation, authorization, a response | a host test, with only outbound adapters replaced |
| a query against the real database                       | an integration test against a disposable database |

In a host test, replace services only through the test service registration, and only at outbound ports; replacing the
middleware or authentication under test proves nothing about them. For each authorization policy, write the refused
caller's test before the permitted one. Layers follow
[Test Boundaries and Gates](../../../repo-governance/development/behaviour-driven-development.md).

## Hand Work Off the Request Safely

Work that outlives the request, such as a queued job or a fire-and-forget task, takes copies of the values it needs,
never the request context or a scoped service from the request. Queue it to a background service that creates its own
scope.

## Before Handing Off

- the format check, the build with warnings as errors, and the unit and host tests all passed;
- each new endpoint only translates, and each new service's lifetime fits its dependencies;
- every new options type has its failing-startup test; and
- each recorded red failed on an assertion about the missing behaviour.
