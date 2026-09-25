---
name: programming-java
description: >-
  Guides Java work under the Java standard: building through the committed wrapper, starting from the scenario and a red
  that fails on an assertion, keeping decisions testable without the framework, and judging values against exceptions.
when_to_use: >-
  Use when writing, changing, or reviewing Java code, before the first scenario or test of the change.
compatibility: Requires a Java project with its committed build wrapper, formatter, and test targets.
---

# Java Programming

Every Java rule is owned by [Java Standards](../../../repo-governance/development/quality/stacks/java-standards.md).
[Behaviour-Driven Development](../../../repo-governance/development/behaviour-driven-development.md)
places the scenario first,
[Test-Driven Development](../../../repo-governance/development/workflow/test-driven-development.md) and
[Test Boundaries and Gates](../../../repo-governance/development/behaviour-driven-development.md) govern
tests and gates, [Red, Green, Refactor](../../../repo-governance/development/workflow/test-driven-development/the-red-green-refactor-cycle.md) runs each
cycle, and [Developing Applications](../developing-applications/SKILL.md) carries the judgement on layers, errors, logs,
and input that holds in every language. This skill adds only the procedure and judgement of applying them in Java. Where
a sentence here seems to state a rule, the standard decides.

## Start Through the Wrapper

Run every build through the committed wrapper, and confirm that the JDK doing the compiling is the one the toolchain
setting names rather than whichever one the shell finds first. A green build on an undeclared JDK says nothing about the
pipeline's build.

Run the formatter check, the compile, and the unit target on the untouched tree. A gate already failing before any edit
is handled under
[Preexisting Error Resolution](../../../repo-governance/development/practice/proactive-preexisting-error-resolution.md).

## Scenario, Then a Red That Counts

Write or update the scenario first. Then write the test: one naming a class or method that does not exist fails to
compile, and a compile error is not a red. Add the signature with a body returning a value the assertion rejects, then
run it. A stub throwing `UnsupportedOperationException` does not count: the failure it reports is the stub, not the
missing behaviour.

## Keep the Test Free of the Framework

When a test of a decision needs the framework context to start, the decision lives in the wrong class. Extract it into a
class that imports nothing from the framework, hand it what it needs through its constructor, and test it directly.

Keep framework-backed tests for what only the framework does: routing, serialization, configuration binding, and which
endpoints are reachable. A unit run in which most tests start a context grows slow, and a slow suite is the one people
stop running before a push.

## Value or Exception: Two Tells

The standard fixes when an outcome is returned and when it is thrown. Two signs show it was misapplied:

- a caller catches an exception one frame above the throw only to choose a branch, so that outcome wanted to be a return
  value; and
- a returned value travels unexamined through several layers to reach a single handler at the edge, so that outcome
  wanted to be the unchecked exception.

Fix the signature where the tell appears, and let the compiler show each caller that must change.

## When Coverage Falls Below the Floor

Find the behaviour the uncovered lines implement, and write a test that would fail if that behaviour broke. A test that
only executes lines, or an exclusion added to pass, meets the number and hides the gap, which
Software Quality Enforcement
rules out. Uncovered lines no behaviour needs are a candidate for deletion rather than a test.

## When Configuration Changes

A change that relies on a framework default, or that alters which operational endpoints are exposed, is behaviour. It
gets a red like any other: write the test asserting the configured value or the unreachable endpoint first, watch it
fail, then change the configuration.

## Before Handing Off

- the wrapper build passed the formatter, compiler warnings, and coverage verification;
- each behaviour has its scenario, and each recorded red failed on an assertion about the missing behaviour;
- no decision under test needs a framework context to run; and
- every configuration or exposure change the work made is pinned by a test.

## In This Repository

The [Java style guide](../../../docs/explanation/software-engineering/programming-languages/java/README.md) holds this repository's detailed Java practice. Where it is stricter than the stack
standard, the guide wins. The
[repository adapter](../../../repo-governance/development/quality/stacks/repository-adapter.md) records every deviation.

Java is active only in `ose-lms-be`; a new Java project needs its own recorded decision.
