---
description: The engineering principles behind Nx target naming, the related Nx Target Standards convention, and the lifecycle naming scheme for build, test, and runtime targets.
when_to_use: Use when naming a lifecycle target such as a build, test, dev, or start script, or when checking which principles and conventions this naming scheme implements.
---

# Principles, Conventions, and Lifecycle Targets

## Principles Implemented/Respected

- **[Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md)**:
  Target names encode their scope and operation, making `nx affected -t test:behaviour:coverage` more
  self-describing than `nx affected -t spec-coverage`.

- **[Simplicity Over Complexity](../../../principles/general/simplicity-over-complexity.md)**:
  Two schemes cover all cases. No per-project inventions. A reader who knows the scheme can
  predict any target name.

## Conventions Implemented/Respected

- **[Nx Target Standards](../nx-targets.md)**: The full required target set per project type
  and caching rules are defined there. This document covers only the naming derivation rule.

## Scheme 1 — Lifecycle Targets

Lifecycle targets describe the project's build and test pipeline. Names are short verbs or
`verb:qualifier` pairs. These are constant across all project types (every project that has
unit tests uses `test:unit`, not `test-unit`, not `unit`, not `unit_tests`).

| Pattern                   | Examples                                                                         |
| ------------------------- | -------------------------------------------------------------------------------- |
| `{verb}`                  | `build`, `lint`, `typecheck`, `dev`, `start`, `run`                              |
| `{verb}:{qualifier}`      | `test:quick`, `test:unit`, `test:integration`, `test:e2e`, `test:e2e:ui`         |
| `test:behaviour:coverage` | `test:behaviour:coverage` (RHINO's shared static behaviour check, one per owner) |

`test:behaviour:coverage` is the only static coverage target. It replaces the retired per-layer
`test:coverage:{scope}` targets and their aggregate `test:coverage`. It is a project-local testing
lifecycle check, never a central governance alias and never a runtime test.

**Rules**:

- Use `dev` for development server — never `serve` or `start:dev`.
- Use `start` for production server — never `serve`.
- Separate qualifiers with `:` — never `-` or `_`.
- All names are lowercase kebab-case.
