# Technical Design — FERRET Init 02 Protocol-Independent Local Backend

> **Evidence scope:** Existing repository and Plan 01 facts are **[Repo-grounded]**; proposed FERRET technical
> surfaces are approved **[Judgment calls — new artifacts]** unless a companion marks them otherwise.

Read this directory in order before executing `delivery.md`.

1. [Hexagonal architecture and protocol extension](001-hexagonal-architecture-and-protocol-extension.md) —
   dependency direction, use cases, ports, REST adapter, and deferred GraphQL/MCP seams.
2. [PostgreSQL, SQLite sync, migration, and recovery](002-persistence-sync-migration-and-recovery.md) — physical
   schemas, leases, idempotency, compatibility, retention, storage, and rollback.
3. [Decisions, sources, and file impact](003-decisions-sources-and-file-impact.md) — selected alternatives,
   authoritative prior art, dependencies, and annotated tree.
4. [BDD/spec delta and adapter map](004-bdd-spec-delta-and-adapter-map.md) — owner corpus and scenario proof.
5. [API contract delta](005-api-contract-delta.md) — complete REST operation inventory and packets.

The canonical runtime REST contract created during delivery is
`specs/apps/ferret/be/contracts/openapi.yaml`. This plan document describes its required delta but does not
replace it.
