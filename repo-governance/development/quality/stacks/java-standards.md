---
description: >-
  Fixes the Java baseline: long-term-support runtimes only, a committed build wrapper with a verified distribution, a
  formatter and coverage verification that fail the build, and the Java rules for data types, injection, and failures.
when_to_use: >-
  Use when creating, building, or reviewing a Java project, or when choosing its runtime line, build wrapper, or
  formatter gate, or deciding how a Java class holds data, receives dependencies, or reports a failure.
---

# Java Standards

This standard is canonical for Java. It holds the choices Java and its build tools leave open, and a Java programming
skill defers here for each rule it applies.

It implements [Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md),
[Immutability](../../../principles/software-engineering/immutability.md), [Pure Functions](../../../principles/software-engineering/pure-functions.md), and
[Reproducibility](../../../principles/software-engineering/reproducibility.md).

## Long-Term-Support Runtimes Only

Every project runs on a long-term-support release, and a new project starts on the current one. Feature releases in
between are not adopted: each stops receiving updates when its successor ships, so a project on one upgrades every cycle
or runs unpatched. Contributors and the pipeline install the same JDK distribution, recorded with its release in the
build files rather than in prose.

## The Committed Build Wrapper

The build tool runs only through its committed wrapper, with the distribution checksum recorded in the wrapper
properties, so a substituted download fails before anything builds. The build names its JDK through the tool's toolchain
setting, so the JDK that compiles is the declared one. This is how Java meets
[Native-First Toolchain](../../workflow/native-first-toolchain.md); dependency pins follow
[Dependency Bump Policy](../../workflow/dependency-bump-policy.md).

Example: Gradle's `distributionSha256Sum` and a toolchain block.

## Gates

- **Formatting:** one formatter rewrites staged Java files on commit, and the pipeline fails on any file it would still
  change. No file carries a formatter suppression. Example: google-java-format through a build plugin.
- **Coverage:** verification runs inside the unit-test target. Where the adopter records a floor under
  [Layers and Adapters](../../behaviour-driven-development.md), the build fails below it;
  without one, the report stays in the gating run for review. Exclusions are named as
  [Test Boundaries and Gates](../../behaviour-driven-development.md) requires.
- **Warnings:** compiler and lint findings fail at the threshold [Lint Strictness](../cross-language-lint-strictness.md) sets.

Work proceeds test-first under [Test-Driven Development](../../workflow/test-driven-development.md), and each behaviour,
error paths included, is a scenario under [Behaviour-Driven Development](../../behaviour-driven-development.md)
before its code exists. A reformat outside the change's purpose is out of scope under
[File-Touch Discipline](../../practice/file-touch-discipline.md).

## Code Shape

- **Package by feature.** A feature's handler, logic, and types share a package. No package collects one layer across
  features, except a single configuration package holding framework-free configuration logic.
- **Records and final fields.** Data without identity is a `record`. A stateful class assigns `final` fields in its
  constructor, and a domain type has no setters, since a value that can change can change between check and use.
- **Constructor injection only.** Never inject into a field. A constructor lets the field be `final`, fails at startup
  on a missing dependency, and lets a test build the class without the framework.
- **Decisions outside the framework.** Logic worth a test lives in a class that imports no framework, as
  [Functional Core, Imperative Shell](../../pattern/functional-core-imperative-shell-web.md) requires. A request handler
  is written by hand and only translates; its request and response models are generated from the contract, per
  [OpenAPI Contract First](../../pattern/openapi-contract-first.md).
- **Declared configuration.** Behaviour the service relies on is configured explicitly even where a default matches,
  since defaults change between major versions. Operational and diagnostic endpoints are exposed only from an explicit
  allow list, and a test asserts the rest are unreachable. An invalid supplied value stops startup, as
  [Environment Variable Contract](../../../conventions/security/secrets-and-env-standards.md) requires.

## Failures

- An outcome the immediate caller branches on, such as a missing resource or bad input, is a return value. A specific
  unchecked exception is kept for an outcome handled at an outer boundary, so no intermediate caller repeats a `throws`
  clause.
- A programming error propagates; catching `Exception` to return a default turns a defect into wrong data. Catch the
  narrowest type where a decision exists, never discard an exception, pass the cause when wrapping, and never catch
  `Throwable`.
- A message names what was expected, what arrived, and which input.
- An error response carries no stack trace, exception class, path, host, configuration value, or secret. The client gets
  a stable status and a generic message; the log gets the detail.

Sleeps, retries, and loosened assertions in tests fall under
[Intermittent Failures](../../workflow/test-driven-development/flaky-tests-are-defects.md).

## Enforcement

The formatter, the coverage verification, and the compiler settings enforce the gates in the adopter's own build, hooks,
and pipeline. Review applies the code shape and failure rules.
