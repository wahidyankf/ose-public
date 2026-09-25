---
name: programming-fsharp
description: >-
  Guides F# work under the F# standard: placing each new file in the compile order, reaching a red that fails on an
  assertion, choosing among option, result, and exception, and finding invariants worth a property-based test.
when_to_use: >-
  Use when writing, changing, or reviewing F# code on .NET, before the first test of the change.
compatibility: Requires an F# project on .NET with its build, formatter check, and test commands.
---

# F# Programming

Every F# rule is owned by [F# Standards](../../../repo-governance/development/quality/stacks/fsharp-standards.md).
[Test-Driven Development](../../../repo-governance/development/workflow/test-driven-development.md) and
[Test Boundaries and Gates](../../../repo-governance/development/behaviour-driven-development.md) govern
tests and gates, [Red, Green, Refactor](../../../repo-governance/development/workflow/test-driven-development/the-red-green-refactor-cycle.md) runs each
cycle, and [Developing Applications](../developing-applications/SKILL.md) carries the judgement on layers, errors, logs,
and input that holds in every language. This skill adds only the procedure and judgement of applying them in F#. Where a
sentence here seems to state a rule, the standard decides.

## Start From What the Project Records

Read the web and test framework choices recorded under the standard's adopter decision. When the change needs one that
is not recorded, raise it as a decision: picking one quietly decides it for every later change too.

Run the formatter check, the build, and the unit target on the untouched tree. A gate already failing before any edit is
handled under
[Preexisting Error Resolution](../../../repo-governance/development/practice/proactive-preexisting-error-resolution.md).

## Place the File Before Writing It

A new file enters the compile list at the point where everything it uses sits above it and nothing above it needs it.
When no such point exists, the design is asking a question:

| Symptom                                    | Usual answer                                                                     |
| ------------------------------------------ | -------------------------------------------------------------------------------- |
| a type it needs is defined further down    | the type is shared; move it up beside the other contracts                        |
| a function further up needs to call it     | pass that behaviour in as a function parameter, so the dependency points one way |
| two files each need something in the other | one concept split in two, or an abstraction missing; merge or extract first      |

A recursive group comes only after those answers fail.

## Reach a Red That Counts

A test calling a function that does not exist is a compile error, not a red. Add the function with its declared
signature and a body returning a value the assertion rejects, then run the test. A body of `failwith` does not count:
the test fails on the exception, not on the missing behaviour.

## Let the Compiler List the Impact

Adding a case to a domain union breaks every match that has to handle it, since those matches carry no wildcard. Treat
the resulting compiler list as the change's impact list. Each site is a decision about the new case, and each decision
that changes behaviour gets its own cycle. A site that seems to need no decision deserves a second look before an empty
branch is written.

## Choose the Shape of an Outcome

Ask what the caller must do with it.

| The caller                                              | Shape                           |
| ------------------------------------------------------- | ------------------------------- |
| only needs to know whether a value is there             | option                          |
| must learn why it failed, to explain it or branch on it | result with a named error case  |
| cannot recover, since only a fault or defect causes it  | exception, handled at the shell |

## Find the Invariant for a Property Test

The standard asks for a property-based test wherever every valid input must keep an invariant. Candidates recur:

- a round trip, where parsing what was formatted returns the original;
- idempotence, where applying an operation twice equals applying it once;
- conservation, where a total or a count survives a transformation; and
- ordering, where a sort or a merge keeps what it promises.

Generate inputs through the domain's own constructors, so the property exercises valid values rather than ones the type
would refuse. A counterexample the tool finds becomes a named example test as well, per
[Regression Tests](../../../repo-governance/development/quality/regression-test-mandate.md).

## Before Handing Off

- the formatter check, the build with warnings as errors, and the unit run all passed;
- every new file sits in dependency order, and no recursive group was added without its reason;
- every match site the compiler listed for a new union case handles it deliberately; and
- each recorded red failed on an assertion about the missing behaviour.

Local practice: the [F# style guide](../../../docs/explanation/software-engineering/programming-languages/f-sharp/README.md)
and [quick references](reference/README.md) win where stricter; the
[adapter](../../../repo-governance/development/quality/stacks/repository-adapter.md) records deviations.
