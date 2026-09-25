---
description: >-
  Requires each authored language's strongest practical static checker, keeps type escapes rare and reasoned, and turns
  untyped external input into typed or validated values where it arrives.
when_to_use: >-
  Use when choosing or configuring a type checker, adding a type escape, or deciding where data from outside the program
  is validated.
---

# Type and Boundary Safety

A type checker proves only what it is allowed to see. Data read from a request, a file, or the environment has whatever
shape its sender chose, and a type declared over it is a belief rather than a check.

This standard implements [Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md),
Fail Closed, and
Evidence Over Assertion. It holds the language-neutral rule; each
stack standard maps it to that stack's native tools and states no second copy of it.

## The Strongest Practical Checker

Each authored language runs the strongest static checker its ecosystem supports, over the whole project, as the type
check target that [Test Boundaries and Gates](../../behaviour-driven-development.md) names. Findings fail at the
threshold [Lint Strictness](../cross-language-lint-strictness.md) sets, and a strictness option is never relaxed to make a
change pass; the code is fixed instead.

| Stack capability                     | Strongest practical checker                                                                                    |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| static types                         | the compiler with its strict options, warnings treated as errors                                               |
| optional annotations                 | a checker in its strict mode, with every public and external boundary annotated                                |
| dynamic, with no checker of record   | its strongest substitute: static analysis plus declared data specifications checked at runtime at the boundary |
| shell                                | a static analyser for the declared dialect, or the dialect's native syntax check plus review where none exists |
| declarative infrastructure and hosts | schema-aware native validation, with no static-type claim                                                      |

A stack without static types states its strongest practical substitute in its stack standard, and never claims a
guarantee its tools cannot give.

## Type Escapes Are Rare and Reasoned

A type escape tells the checker to stop checking: an untyped value, an unchecked cast or assertion, a non-null
assertion, or an ignore comment. Each one is a waiver, placed and reasoned as Lint Strictness requires for any
suppression. It covers the smallest scope that needs it and never reaches a public signature.

Never add an escape to make a change compile. A silenced error is still there; it has only moved to runtime, where it
fails far from its cause.

## Validate Where Trust Ends

Data from outside the program's control becomes a typed or validated value where it arrives. That covers a request, a
command-line argument, parsed text, a file or stored record, a message, another process's output, the environment, and a
third-party response. A schema, parser, or type guard checks it once, at that boundary. Invalid input is refused with a
typed error there, and inner code trusts the result instead of checking it again.

Never declare a type over unvalidated external data. A cast that names the expected shape passes the checker and fails
later, in code that never saw the input. Runtime File Data and
[Environment Variable Contract](../../../conventions/security/secrets-and-env-standards.md) apply this rule to their
own boundaries.

## Dynamic Languages

A dynamic language declares checked annotations or runtime data specifications at its external and public boundaries. An
annotation that no tool checks is documentation, not safety, so the checker or the runtime validation that reads it is
named in the stack standard.

## Declarative Infrastructure

Infrastructure and host-configuration declarations use their tool's native validation: typed variables, schemas, and
argument specifications, plus a reviewed plan or dry run. Validation proves a declaration is well formed. It does not
prove that the resources it manages behave as intended, so no infrastructure standard claims a static-type guarantee.
Native tests carry that proof, as the stack standard states.

## Enforcement

An adopter enforces the checker and its strictness in its own type check and lint gates, and escape waivers through Lint
Strictness. Review applies what no checker sees: whether external data is validated where it arrives, and whether each
escape carries its reason.
