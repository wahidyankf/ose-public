# Technical Design

All new app, library, test, and target paths described here are planned artifacts unless explicitly
identified as existing. This directory describes the intended implementation; the canonical specs'
architecture documents remain honest about what currently exists.

## Read in this order

1. [Baseline and parity](./001-baseline-and-parity.md) — inspected source, scenario dispositions,
   shared-source changes, and parallel-plan coordination.
2. [Architecture and content](./002-architecture-and-content.md) — Go packages, rendering,
   local configuration, shared datasets, browser state, and runtime boundaries.
3. [BDD and verification](./003-bdd-and-verification.md) — godog harness, layer
   ownership, strict static checking, numeric coverage, and local commands.
4. [API contract delta](./004-api-contract-delta.md) — page and discovery HTTP behavior, htmx
   fragment endpoints, retained old tRPC boundary, and attributable wire recipes.
5. [Decisions and file impact](./005-decisions-and-file-impact.md) — alternatives, annotated file
   tree, concrete rule/docs impacts, and rollback.

The [File-Impact Analysis](./005-decisions-and-file-impact.md#file-impact-analysis) is the primary
scope view. The [delivery checklist](../delivery.md) owns execution actions and their dependency
edges; technical documents do not carry a second checklist.
