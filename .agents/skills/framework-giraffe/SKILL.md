---
name: framework-giraffe
description: >-
  Guides Giraffe handler work under its standard, on top of the F# and ASP.NET Core skills: composing the handler chain
  in order, binding strictly and validating before the core, and mapping the core's result to a response once.
when_to_use: >-
  Use when writing, changing, or reviewing a Giraffe route or handler chain, before the first test of the change.
compatibility: Requires an F# application on ASP.NET Core that records Giraffe as its web framework.
---

# Giraffe Framework

Every Giraffe rule is owned by
[Giraffe Standards](../../../repo-governance/development/quality/stacks/giraffe-standards.md), which inherits
[F# Standards](../../../repo-governance/development/quality/stacks/fsharp-standards.md) and
[ASP.NET Core Standards](../../../repo-governance/development/quality/stacks/aspnet-core-standards.md). This skill
inherits [F# Programming](../programming-fsharp/SKILL.md) and
[ASP.NET Core Framework](../framework-aspnet-core/SKILL.md) and repeats neither: compile order, outcome shapes, service
lifetimes, options, and host tests are theirs. It adds only the judgement at the boundary where a Giraffe handler meets
them. Where a sentence here seems to state a rule, the standard decides.

## Start From What the Project Records

Read the routing style the application records, its error-to-response mapping function, and the handler it uses for
authorization. A new route follows the recorded style; a second style is a decision, not a local choice.

## Compose the Chain in Order

Write the chain in the order the standard fixes, and read it back left to right:

1. the route, with typed parameters;
2. authentication and authorization;
3. binding and validation;
4. one call into the core; and
5. the shared result mapping.

A chain where a later step appears earlier, such as binding before authorization, lets an unauthorized caller learn what
the binder accepts. When a handler needs a step the chain lacks, add the step to the chain; do not repeat it inside the
handler.

## Bind Strictly, Then Convert

| Input arrives as     | Handle it with                                                           |
| -------------------- | ------------------------------------------------------------------------ |
| path parameters      | the typed route, which rejects a malformed value before the handler runs |
| query or form fields | a strict binder, whose failure goes to the chain's error handler         |
| a JSON body          | a transport type with model validation, run by the validating handler    |

Then convert the transport value into the domain type through the domain's constructor, and treat that constructor's
error as one more validation failure. Write the failing request test for each rejection before the conversion code.

## Map the Result Once

A handler returns the core's result to the shared mapping; it never writes a status code for an error itself. When the
core gains an error case, the mapping's match stops compiling, and that is the place to decide the response. Add a test
asserting the status and body of the new case through the host.

## Before Handing Off

- the F# and ASP.NET Core checks in their skills' lists all passed;
- every new route uses the recorded routing style and typed parameters;
- every new chain puts authorization ahead of binding and ends in the shared mapping;
- each rejection path has its own request test; and
- each recorded red failed on an assertion about the missing behaviour.
