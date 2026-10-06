---
description: Lists the software-engineering principles and repo conventions that the Nx target scheme implements.
when_to_use: Use when justifying why the target-naming and echo-placeholder rules exist, or when linking a target decision back to a named principle or convention.
---

# Principles and Conventions Implemented/Respected

## Principles Implemented/Respected

- **[Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md)**: Every project declares its capabilities through explicit targets. No implicit build or test mechanisms — if a project supports unit tests, it declares `test:unit`; if it has integration tests, it declares `test:integration`; if it has a dev server, it declares `dev`. The composition of `test:quick` is explicit in each project's `project.json`.

- **[Automation Over Manual](../../../principles/software-engineering/automation-over-manual.md)**: Targets integrate with Nx affected computation, caching, and the PR merge gate. Consistent naming allows workspace-level automation (`nx affected -t test:quick`) to work across all project types without special cases.

- **[Simplicity Over Complexity](../../../principles/general/simplicity-over-complexity.md)**: Projects omit inapplicable targets instead of publishing no-op contracts. `test:coverage` composes applicable static validators, and `test:quick` remains the one closed fast gate.

## Conventions Implemented/Respected

- **[File Naming Convention](../../../conventions/structure/file-naming.md)**: `project.json` follows Nx workspace conventions; target names follow the kebab-case + colon-variant pattern defined here.

- **[Reproducible Environments Convention](../../workflow/reproducible-environments.md)**: Projects with local dependencies expose an `install` target so dependency state is always explicit and reproducible.

- **[Behaviour-Driven Development](../../behaviour-driven-development.md)**: The `test:unit`, `test:integration`, and `test:e2e` targets defined here map to the mandatory three-level testing architecture. Each target's isolation boundaries, caching rules, and CI schedule derive from that standard.
