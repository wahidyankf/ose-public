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
6. [Parity program design](./006-parity-program-design.md) — the audit behind the 2026-11-28
   amendment, the real-corpus, content-tree, URL-compatibility, discovery, caching, and
   design-parity contracts.
7. [E2E suites](./007-e2e-suites.md) — the two
   rebuilt e2e homes and the retry-free rules.
8. [BDD delta map](./008-bdd-delta-map.md) — every new or changed scenario, its durable title, tags,
   and layer ownership.

The [File-Impact Analysis](./005-decisions-and-file-impact.md#file-impact-analysis) is the primary
scope view. The [delivery checklist](../delivery.md) owns execution actions and their dependency
edges; technical documents do not carry a second checklist.
