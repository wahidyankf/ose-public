---
description: Principles and conventions this CI/CD series implements.
when_to_use: Use when tracing a rule's source principle or convention.
---

# Principles and Conventions Implemented/Respected

## Principles Implemented/Respected

- **[Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md)**:
  Every hook step, target name, workflow file, and container image layer is explicitly documented. No
  implicit behaviour is tolerated — if something runs in CI, it is declared in a workflow file; if
  something runs in a hook, it is declared in the hook script.

- **[Automation Over Manual](../../../principles/software-engineering/automation-over-manual.md)**:
  Pre-commit, commit-msg, and pre-push hooks enforce quality automatically on every developer
  machine. Reusable workflows and composite actions keep CI logic DRY, so adding a new app variant
  requires only a thin per-variant file calling shared logic.

- **[Simplicity Over Complexity](../../../principles/general/simplicity-over-complexity.md)**:
  Three hook stages, three test levels, one canonical naming scheme. Per-variant test workflows are
  kept to ~40 lines each by delegating to reusable workflows.

## Conventions Implemented/Respected

- **[File Naming Convention](../../../conventions/structure/file-naming.md)**: Workflow files,
  composite action directories, infra directories, and specs directories all follow the naming
  patterns defined in this convention.

- **[Nx Target Standards](../nx-targets.md)**: The targets referenced in this document
  (`test:unit`, `test:integration`, `test:e2e`, `test:quick`, `lint`, `typecheck`) use the
  canonical names and caching rules defined in `nx-targets.md`.

- **[Behaviour-Driven Development](../../behaviour-driven-development.md)**: Test level
  definitions (unit, integration, E2E) and the isolation rules enforced here derive from the
  authoritative three-level testing standard.

- **[No Secrets in Git Convention](../../../conventions/security/no-secrets-in-committed-files.md)**: The
  no-hardcoded-secrets rule for CI workflows is one enforcement point of the broader hard iron rule
  that no system secret may ever be committed to any git-tracked file.
