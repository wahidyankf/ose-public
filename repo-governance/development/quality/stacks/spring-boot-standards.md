---
description: >-
  Fixes Spring Boot stack choices on top of the Java baseline: framework-managed dependency versions, typed and
  validated configuration properties, validated request input, explicit persistence defaults, and one narrow test
  context per framework-backed test.
when_to_use: >-
  Use when building, configuring, or reviewing a Spring Boot application, or when binding its configuration, validating
  its requests, or choosing the test context a framework-backed test starts.
---

# Spring Boot Standards

This standard is canonical for Spring Boot and holds only the choices the framework leaves open. It inherits
[Java Standards](java-standards.md), whose runtime, wrapper, gates, code shape, and failure rules apply unchanged, and a
Spring Boot framework skill defers here for each rule it applies.

It implements [Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md),
Fail Closed, and [Reproducibility](../../../principles/software-engineering/reproducibility.md).

## Version

The application builds on a supported framework release line, recorded in the build files. Dependency versions the
framework manages come from its managed set; an override of one names its reason beside it, since an overridden library
leaves the combination the framework release was tested with. Crossing a major line is a planned change, and every
default the application relies on is re-read at that point. Pins follow
[Dependency Bump Policy](../../workflow/dependency-bump-policy.md).

## Gates

Spring Boot adds no gate of its own; the Java gates run over framework code too.

## Type and Boundary Safety

[Type and Boundary Safety](../code/type-and-boundary-safety.md) owns the rule; in Spring Boot it maps as follows.

- **Configuration binds to a type.** Related settings bind to one
  [`@ConfigurationProperties`](https://docs.spring.io/spring-boot/reference/features/external-config.html) type, a
  record where it serves, annotated `@Validated` with constraint annotations, so an invalid value stops startup. Nested
  groups carry `@Valid`. Settings are never read one by one through scattered `@Value` expressions.
- **Request input is validated where it arrives.** A request body carries `@Valid`, and constraints on handler
  parameters use the framework's built-in
  [method validation](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-validation.html),
  never a class-level `@Validated` on a controller, which applies validation a second time. Each validation failure maps
  to the error response the Java standard fixes.

## Persistence Defaults

The open-session-in-view setting (`spring.jpa.open-in-view`) is declared explicitly. The framework enables it by
default, which keeps a database session open while a response renders, so a lazy association can issue queries outside
the transaction that should own them. Disabling it is the default choice; keeping it enabled names the reason.

## Tests

Layers follow [Test Boundaries and Gates](../../behaviour-driven-development.md); a test that starts a framework
context is an integration test, never a unit test. Decisions are unit-tested without the framework, as the Java standard
requires.

- **One slice per test.** A framework-backed test starts the narrowest
  [test slice](https://docs.spring.io/spring-boot/reference/testing/spring-boot-applications.html) that covers its
  concern, such as the web layer, persistence, or serialization, and never stacks two slices. A full application context
  is kept for wiring and journey tests.
- **Stable contexts.** Each distinct set of replaced beans or dynamic properties builds its own cached context, so test
  classes share one declared set rather than varying it per class. Forcing a context rebuild names the state it clears.
- **Current override annotations.** A replaced bean uses `@MockitoBean` or `@MockitoSpyBean`; the deprecated `@MockBean`
  family is not used in new tests.
- **Real resources in containers.** A database or broker test runs against a disposable container wired through the
  framework's [service connection](https://docs.spring.io/spring-boot/reference/testing/testcontainers.html) support,
  never against a shared instance, as Test Data Isolation requires.

What coverage measures follows [Meaningful Coverage](../testing/meaningful-coverage.md); generated contract models and
framework configuration classes that hold no decision are named exclusions.

## Documentation

Each configuration property carries a Javadoc description, which the framework's configuration processor publishes as
property metadata, so an operator reads what a setting does without reading code. An HTTP contract follows
[OpenAPI Contract First](../../pattern/openapi-contract-first.md), as the Java standard sets.

## Enforcement

The Java gates enforce formatting, warnings, and coverage in the adopter's own build, hooks, and pipeline. A startup
test proves an invalid property value fails the context. Review applies configuration binding, validation placement, the
persistence default, and slice selection.
