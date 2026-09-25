---
name: programming-csharp
description: >-
  Guides C# work under the C# standard: reading the solution's recorded choices first, reaching a red that fails on an
  assertion, and judging nullable warnings, expected failures, and asynchronous call chains as the code grows.
when_to_use: >-
  Use when writing, changing, or reviewing C# code on .NET, before the first test of the change.
compatibility: Requires a C# solution on .NET with its build, format, and test commands.
---

# C# Programming

Every C# rule is owned by [C# Standards](../../../repo-governance/development/quality/stacks/csharp-standards.md) and
its
[Domain Types and Tests](../../../repo-governance/development/quality/stacks/csharp-standards/domain-types-and-tests.md)
module. [Test-Driven Development](../../../repo-governance/development/workflow/test-driven-development.md) and
[Test Boundaries and Gates](../../../repo-governance/development/behaviour-driven-development.md) govern
tests and gates, [Red, Green, Refactor](../../../repo-governance/development/workflow/test-driven-development/the-red-green-refactor-cycle.md) runs each
cycle, and [Developing Applications](../developing-applications/SKILL.md) carries the judgement on layers, errors, logs,
and input that holds in every language. This skill adds only the procedure and judgement of applying them in C#. Where a
sentence here seems to state a rule, the standard decides.

## Start From What the Solution Records

Before writing, open the shared build file and the choices recorded once per solution: the test framework, the assertion
library, the analyzer set, and the validation library. Use exactly those. A second test framework or assertion style
brought in by one change leaves every later failure message in two dialects.

Build, verify formatting, and run the unit target on the untouched tree. A gate already failing before any edit is
handled under
[Preexisting Error Resolution](../../../repo-governance/development/practice/proactive-preexisting-error-resolution.md),
not folded into this change.

## Reach a Red That Counts

A test naming a type or member that does not exist fails to compile, and a compile error is not a red. Add the smallest
signature that compiles and returns a value the new assertion rejects, such as a default, then run the test and read the
assertion message. A stub throwing `NotImplementedException` does not count either: the failure it reports is the stub,
not the missing behaviour.

## Read a Nullable Warning as a Design Question

Each nullable warning asks whether null is a legitimate state at that point.

| Answer                                                    | Move                                                                            |
| --------------------------------------------------------- | ------------------------------------------------------------------------------- |
| absence means something to the caller                     | declare the type nullable, and handle null where that meaning is decided        |
| the value always exists once the object is built          | let the compiler see it: a `required` member, a constructor assignment, a guard |
| it can never be null, and no construct can show the proof | a waiver, carrying the reason the standard asks for                             |

A waiver whose only reason is that the compiler cannot tell usually belongs in the second row, not the third.

## Tell an Expected Failure From a Broken Invariant

Ask whether a well-behaved caller with plausible input could produce the failure: a missing record, a request that does
not meet a rule, a conflict with current state. If so, it is expected, and the standard decides how it travels. If only
a defect or failed infrastructure could produce it, it is exceptional.

One tell catches most misjudgements: a caller that catches an exception one frame above the throw only to choose a
branch was handed an expected failure in the wrong form.

## Keep the Asynchronous Chain Unbroken

When a synchronous caller meets an asynchronous method, make the caller asynchronous and continue outward to the entry
point. Where a caller cannot become asynchronous, such as a constructor, move the work into an asynchronous factory
method instead of blocking.

Pass the caller's cancellation token down through every call. A fresh empty token created halfway down silently ends
cancellation exactly where the slow call waits.

## When the Architecture Test Fails

The failing reference is the finding. Move the code to a layer allowed to hold that reference, or declare a port in the
inner project and implement it in an adapter. Never widen the rule to admit the reference.

## Before Handing Off

- the build passes with warnings as errors, the format check reports no change, and the unit run passed with coverage
  collected in that same run;
- each waiver the change added states its reason beside it;
- no new code blocks on an asynchronous call or drops a cancellation token; and
- each recorded red failed on an assertion about the missing behaviour.

## In This Repository

The [C# style guide](../../../docs/explanation/software-engineering/programming-languages/c-sharp/README.md) holds this repository's detailed C# practice. Where it is stricter than the stack
standard, the guide wins. The
[repository adapter](../../../repo-governance/development/quality/stacks/repository-adapter.md) records every deviation.
