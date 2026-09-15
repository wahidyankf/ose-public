# Technical Design — OSE ID Init 01 Local Foundation

Read these documents in order. They explain the foundation before the delivery checklist asks an
executor to change code.

1. [System boundaries and project topology](001-system-boundaries-and-project-topology.md)
2. [Runtime, persistence, and statelessness](002-runtime-persistence-and-statelessness.md)
3. [Local stack and verification](003-local-stack-and-verification.md)
4. [Decisions, sources, and file impact](004-decisions-sources-and-file-impact.md)
5. [BDD spec delta and adapter map](005-bdd-spec-delta-and-adapter-map.md)
6. [Foundation API contract delta](006-api-contract-delta.md)
7. [Database audit and soft-delete contract](007-database-audit-and-soft-delete-contract.md)

## Invariants Carried to Later Plans

- `ose-id-be` owns credentials/protocol/domain persistence. Plan 05 may give the Next.js server a
  separate least-privilege PostgreSQL role for `ose_id_web.web_session` only; browser bundles and other
  web code never access PostgreSQL or the identity schema.
- `ose-id-be` keeps Domain/Application transport-neutral behind pragmatic hexagonal boundaries. Plan 01
  ships the REST health adapter; Plan 04 later adds OIDC. Any future GraphQL or Model Context Protocol
  surface is a separately planned inbound adapter over the same use cases, identity/tenant policy,
  transactions, idempotency, and audit.
- Process instances are disposable; PostgreSQL and explicit shared providers own durable state.
- Local/Test are the only enabled runtime modes until a separate production-readiness plan removes the guard.
- Migrations run with a separate role before the application is declared ready.
- Every persisted OSE ID table, including framework metadata and web-session tables, carries
  `created_at`, `created_by`, `updated_at`, `updated_by`, `deleted_at`, and `deleted_by`. Runtime roles
  have no hard-delete privilege; all lifecycle removal is auditable soft-delete.
- Every local runner owns, labels, waits for, and cleans only its uniquely named resources.
- The OSE ID implementation is distributed under MIT; third-party notices remain accurate to resolved versions.
- Every active scenario has mandatory Unit proof, every boundary-applicable Integration/E2E adapter or
  a scenario-local valid exemption, and statically closed adapter maps. `ose-id-be` and `ose-id-web`
  Unit targets enforce at least 99% Unit line coverage for authored production code.
