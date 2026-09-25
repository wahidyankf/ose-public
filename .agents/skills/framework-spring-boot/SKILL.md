---
name: framework-spring-boot
description: >-
  Guides Spring Boot work under the Spring Boot standard: choosing the narrowest test context, keeping the context cache
  warm, pinning configuration binding with a failing test, and keeping decisions out of framework-annotated classes.
when_to_use: >-
  Use when writing, changing, or reviewing a Spring Boot application's configuration, web layer, persistence, or
  framework-backed tests, before the first test of the change.
compatibility: Requires a Spring Boot application with its committed build wrapper and test targets.
---

# Spring Boot Framework

Every Spring Boot rule is owned by
[Spring Boot Standards](../../../repo-governance/development/quality/stacks/spring-boot-standards.md), which inherits
[Java Standards](../../../repo-governance/development/quality/stacks/java-standards.md).
[Java Programming](../programming-java/SKILL.md) carries the Java procedure: the wrapper, the scenario and red, and
keeping decisions free of the framework. This skill adds only the judgement of working at the framework boundary. Where
a sentence here seems to state a rule, the standard decides.

## Start From What the Project Records

Read the framework release line in the build files and every managed-version override with its reason. Before relying on
a framework default, check it in that line's reference documentation; defaults move between majors.

Run the wrapper build with its formatter, compile, unit, and coverage steps on the untouched tree. A gate already
failing is handled under
[Preexisting Error Resolution](../../../repo-governance/development/practice/proactive-preexisting-error-resolution.md).

## Place Code at the Framework Boundary

An annotated controller, listener, or scheduled method translates and delegates: it receives input already bound and
validated, calls one application class, and maps the result. When such a class starts to branch on a business rule, move
the rule into a class with no framework import and inject it through the constructor.

## Pick the Narrowest Test Context

| The test proves                                     | Start                                                |
| --------------------------------------------------- | ---------------------------------------------------- |
| a decision                                          | no context; a plain unit test                        |
| routing, binding, validation, or the error response | the web slice, with the application class replaced   |
| a query, a mapping, or a constraint                 | the persistence slice against a disposable container |
| serialization of one type                           | the serialization slice                              |
| property binding or conditional configuration       | a context runner loading only that configuration     |
| wiring across layers or a whole journey             | the full application context                         |

Pick one row. A test that seems to need two slices is two tests.

## Keep the Context Cache Warm

Every distinct set of replaced beans or dynamic properties builds a new context, and a suite that builds many grows slow
enough that people stop running it. Put the replaced beans a group of tests shares on one shared test configuration, and
reuse it. When a test must rebuild the context, say in a comment what state it clears; a rebuild added to make a flaky
test pass hides the shared state instead of removing it, which
[Intermittent Failures](../../../repo-governance/development/workflow/test-driven-development/flaky-tests-are-defects.md)
rules out.

## Pin Configuration With a Failing Test

A new or changed property group gets its red first: a test loading the configuration with an invalid value that expects
startup to fail, and one with a valid value that expects the bound type to hold it. Only then add the constraint or
binding. The same applies to a changed default the application now declares, such as the persistence session setting.

## Test Validation From the Outside

Drive request validation through the web slice with invalid input, and assert the status and the error body the Java
standard fixes. A test calling the controller method directly skips binding and validation, so it cannot prove either.

## Before Handing Off

- the wrapper build passed the formatter, compiler warnings, and coverage verification;
- each framework-backed test starts exactly one slice or context, and the number of distinct contexts did not grow
  without reason;
- every new property group has its failing-startup test; and
- each recorded red failed on an assertion about the missing behaviour.
