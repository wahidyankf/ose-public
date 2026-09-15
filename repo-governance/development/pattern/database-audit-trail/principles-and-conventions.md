---
description: "The core principles and conventions this pattern implements - explicit metadata, automated migrations, reproducibility, and documentation-first."
when_to_use: "Use when you need to trace this pattern's audit-column requirement back to the principles and conventions it implements."
---

# Principles and Conventions

## Principles Implemented/Respected

This pattern implements the following core principles:

- **[Explicit Over Implicit](../../../principles/software-engineering/explicit-over-implicit.md)**:
  Current-row creation, latest-mutation, and deletion attribution use dedicated, named columns with
  mandatory types and nullability. Intermediate security or domain history remains explicit through
  append-only audit events rather than being inferred from these six columns.

- **[Automation Over Manual](../../../principles/software-engineering/automation-over-manual.md)**: DbUp discovers and applies migration scripts automatically at startup. EF Core handles entity mapping. Manual service code is only required for soft-delete columns (`deleted_at`, `deleted_by`).

- **[Reproducibility First](../../../principles/software-engineering/reproducibility.md)**: DbUp applies versioned SQL scripts in deterministic order, ensuring the schema is reproducible across PostgreSQL environments (dev/staging/prod) and Dockerised test databases without divergence.

- **[Documentation First](../../../principles/content/documentation-first.md)**: This pattern documents the required columns, types, and implementation approach before any table is created, ensuring teams follow a consistent and verifiable standard.

## Conventions Implemented/Respected

This pattern respects the following conventions:

- **[Content Quality Principles](../../../conventions/writing/quality.md)**: This document uses active voice, a single H1, and proper heading nesting.

- **[Acceptance Criteria Convention](../../infra/acceptance-criteria.md)**: The compliance checklist at the end of this document provides testable, concrete criteria for verifying a table meets this pattern.
