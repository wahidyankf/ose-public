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
| `test:coverage:{scope}`   | `test:coverage:unit`, `test:coverage:integration`, `test:coverage:e2e`           |
| `test:behaviour:coverage` | `test:behaviour:coverage` (RHINO's shared static behaviour check, one per owner) |

`test:coverage` aggregates the applicable per-layer static coverage targets. `test:behaviour:coverage` stays
outside it. These targets are project-local testing lifecycle checks, never central governance aliases and never
runtime tests.

**Rules**:

- Use `dev` for development server — never `serve` or `start:dev`.
- Use `start` for production server — never `serve`.
- Separate qualifiers with `:` — never `-` or `_`.
- All names are lowercase kebab-case.
