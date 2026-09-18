# Technical Design — FERRET Init 01 Standalone Local CLI

This directory is the reader-led technical form for Plan 01. Read it in order before executing
`delivery.md`.

1. [Architecture and harness contracts](001-architecture-and-harness-contracts.md) — process boundaries,
   command behavior, fail-open adapters, and concurrency.
2. [SQLite schema, privacy, and retention](002-sqlite-schema-privacy-and-retention.md) — physical data model,
   field meanings, lifecycle, migration, and storage measurement.
3. [Decisions, sources, and file impact](003-decisions-sources-and-file-impact.md) — alternatives, verified
   prior art, dependencies, rollback, and complete annotated path tree.
4. [BDD/spec delta and adapter map](004-bdd-spec-delta-and-adapter-map.md) — canonical feature destinations,
   scenario-to-layer proof, and test fixtures.
5. [CLI and shared data contract](005-cli-and-shared-data-contract.md) — exact command grammar, event and
   capability schemas, deterministic hashes, config files, and machine-readable outputs.

Plan 01 changes no HTTP, RPC, GraphQL, MCP, or event-delivery API. Its CLI stdin/output contract and SQLite
schema are local process/storage boundaries documented here. Plan 02 owns the only OpenAPI delta.
