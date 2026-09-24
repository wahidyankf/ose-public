---
title: "Java Coding Standards"
description: Authoritative OSE Platform Java coding standards — naming, package layout, records, controllers, and configuration
category: explanation
subcategory: prog-lang
tags:
  - java
  - coding-standards
  - naming-conventions
  - package-organization
  - spring-boot
  - records
principles:
  - explicit-over-implicit
  - immutability
  - pure-functions
  - reproducibility
created: 2026-09-08
---

# Java Coding Standards

## Prerequisite Knowledge

**REQUIRED**: You MUST understand Java fundamentals from the [AyoKoding Java Learning Path](../../../../../apps/ayokoding-www/content/en/learn/legacy/software-engineering/programming-languages/java/_index.md) before using these standards.

**This document is OSE Platform-specific**, not a Java tutorial. We define HOW to apply Java in THIS codebase, not WHAT Java is.

**See**: [Programming Language Documentation Separation Convention](../../../../../repo-governance/conventions/structure/programming-language-docs-separation.md)

## Purpose

These are the conventions a reviewer will hold Java code in this repository to. Where a rule below differs from common Java practice, the difference is deliberate and its reason is stated — a standard without a reason is a preference.

## Formatting Is Not a Judgement Call

**Spotless with google-java-format is mandatory.** Formatting is never discussed in review, because no human decides it.

- The `format-staged` gate runs on commit and rewrites staged `.java` files through `scripts/format-java.sh` (Spotless `spotlessApply`).
- On a pull request the same `format-staged` gate replays the formatter over the changed files and fails on any file it would change.

Do not add per-file formatter suppressions, and do not reformat a file "while you are in there" — a formatting-only diff inside a behavioural change hides the behavioural change.

## Package Layout

Root package: `com.oseplatform.<product>`, e.g. `com.oseplatform.lms`.

Package **by feature, not by layer**. A reader looking for the health endpoint should find it under `health/`, not by opening a `controllers/` package holding every controller in the service:

```text
com/oseplatform/lms/
├── OseLmsBeApplication.java     # entry point, at the root package
├── config/                      # framework-free configuration logic
├── health/                      # everything the health feature needs
└── hello/
```

`config/` is the one layer-named package this standard allows, and it holds framework-free logic — see below.

## Naming

| Element              | Convention                  | Example                      |
| -------------------- | --------------------------- | ---------------------------- |
| Class, record, enum  | `PascalCase`                | `HealthController`           |
| Method, field, local | `camelCase`                 | `resolvePort`                |
| Constant             | `SCREAMING_SNAKE_CASE`      | `DEFAULT_PORT`               |
| Package              | lowercase, no underscores   | `com.oseplatform.lms.health` |
| Application class    | `<ProjectNameInPascalCase>` | `OseLmsBeApplication`        |

Type names carry their role: a Spring `@RestController` ends in `Controller`, a `@Configuration` class in `Configuration`. Do not name a class after a pattern it does not implement (`HealthManager`, `HealthHelper`, `HealthUtil` are all worse than `HealthController`).

Avoid abbreviations that are not already domain vocabulary. `req`/`res` are acceptable inside a request-handling method; `hc` for a health check is not.

## Prefer Records and `final`

Use `record` for any type that carries data and has no identity:

```java
public record HealthResponse(String status) {}
```

Where a class is genuinely needed, declare fields `final` and assign them in the constructor. Setters on a domain type are a request for a defect: a value that can change after construction can change between the check and the use.

Declare local variables `final` only where it clarifies intent — the formatter does not add it and blanket `final` on every local adds noise without adding a guarantee.

## Keep Logic Out of the Framework

Any decision worth a test belongs in a class with no Spring annotations and no Spring imports.

`PortResolver` in `ose-lms-be` is the reference example: it decides the listen port from a flag, an environment variable, and a default, and it does so as a pure function. A test for it starts no application context and binds no port, so it runs in milliseconds and fails for exactly one reason.

The inverse anti-pattern — putting the same precedence logic inside a `@Configuration` bean — makes the only way to test it a full context boot, and the only way to see it fail a stack trace.

## Constructor Injection Only

Inject dependencies through the constructor. Never use field injection (`@Autowired` on a field):

- A constructor-injected dependency can be `final`.
- A constructor makes an unsatisfiable dependency a startup failure rather than a `NullPointerException` at first use.
- A constructor-injected class can be instantiated in a test with no framework at all.

With a single constructor, Spring resolves it without an `@Autowired` annotation; omit the annotation.

## Configuration Is Declared, Not Inherited

State the behaviour you depend on in `application.yaml` even when the framework default already matches it. Spring Boot's defaults change between major versions; a default you did not write down is a default you did not choose.

This applies with particular force to anything reachable over HTTP. Actuator exposure is declared explicitly and narrowly:

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health
  endpoint:
    health:
      show-details: never
```

Anything not on the include list is unreachable, and that is asserted by a test rather than assumed.

## HTTP Surface

- Application endpoints live under the `/api/v1` prefix. Actuator keeps its own default `/actuator` path and is not versioned — it is an operational surface, not part of the API contract.
- Controllers are hand-written. Request and response **models** are generated from the OpenAPI contract; controllers that were generated cannot be reviewed as code.
- A controller method does one thing: translate an HTTP request into a call, and a result into a response. Business logic inside a controller is logic that cannot be tested without HTTP.

## Ports and Environment

A listen port is resolved from, in order: an explicit override, the project's environment variable (e.g. `OSE_LMS_BE_PORT`), then the default recorded in [web-sites.md](../../../../reference/web-sites.md).

An unparseable override fails at startup. Falling back to the default on malformed input silently starts a service on the wrong port, which is worse than not starting.

**See**: [Secrets and Env Standards](../../../../../repo-governance/conventions/security/secrets-and-env-standards.md)

## Related Documentation

- [Java Overview](./README.md)
- [Java Testing Standards](./testing-standards.md)
- [Java Error Handling Standards](./error-handling-standards.md)
