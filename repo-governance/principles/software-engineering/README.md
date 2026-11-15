---
description: Values behind dependable, understandable software development in the platform
when_to_use: Use when deciding whether a software-development value belongs here, or looking up a specific software-engineering principle.
---

# Software Engineering Principles

These principles explain why the platform favors dependable, understandable software: explicit choices, reproducible work, and automation that removes avoidable friction.

## Purpose

These principles define **WHY we value specific approaches to software development**, covering configuration philosophy, automation strategies, code organization, and technical decision-making. All development practices implement these principles.

## Scope

**✅ Belongs Here:**

- Foundational values about software development
- Philosophical stances on automation and configuration
- Beliefs about code quality and organization
- Reasons behind technical standards

**❌ Does NOT Belong:**

- Specific coding standards (that's a development practice)
- How-to implement features (that's a guide)
- Technical tool configurations (that's a development practice)

## Principles Implemented/Respected

- [Automation Over Manual](./automation-over-manual.md) — Automate repetitive tasks to ensure consistency and reduce human error - humans for creative work, machines for repetition Use when deciding whether a repetitive task should be automated, or when looking for this repository's automation examples.
- [Consumer Correctness First](./consumer-correctness-first.md) — Choose the option that most helps the end user or consumer be correct, even when it is longer Use when deciding between a terse surface and a descriptive one, or when reviewing errors, names, and defaults for silent misuse.
- [Explicit Over Implicit](./explicit-over-implicit.md) — Choose explicit composition and configuration over magic, convenience, and hidden behaviour Use when deciding whether code or configuration should rely on defaults, or when looking for explicit-vs-implicit examples.
- [Immutability Over Mutability](./immutability.md) — Prefer immutable data structures over mutable state for safer, more predictable code Use when deciding whether to model data as mutable or immutable, or when reviewing code for accidental mutation.
- [Pure Functions Over Side Effects](./pure-functions.md) — Prefer pure functions (deterministic, no side effects) for predictable, testable code Use when deciding whether logic belongs in a pure function or an impure boundary, or when reviewing code for hidden side effects.
- [Reproducibility First](./reproducibility.md) — Development environments and builds should be reproducible from the start Use when setting up or auditing a project's development environment, build, or dependency-version reproducibility.

## Examples from Platform

Each principle has practical forms across the platform's technology stack:

### Principle-Specific Examples

- **Automation Over Manual**: Repository checks and generated artifacts make repeatable work less error-prone.
- **Consumer Correctness First**: Descriptive errors, exact names, and no silent behavior help consumers use surfaces correctly on the first try.
- **Explicit Over Implicit**: Named contracts, targets, and boundaries make important decisions visible.
- **Immutability Over Mutability**: Immutable values reduce surprising state changes and make concurrent work easier to reason about.
- **Pure Functions Over Side Effects**: A functional core and an effectful shell keep domain logic easier to test.
- **Reproducibility First**: Pinned toolchains and lockfiles help a fresh checkout behave like another developer's checkout.

## Related Documentation

- [Core Principles Index](../README.md) - All foundational principles
- [Development Practices Index](../../development/README.md) - Development practices implementing these principles
- [Repository Architecture](../../repository-governance-architecture.md) - Six-layer governance model
