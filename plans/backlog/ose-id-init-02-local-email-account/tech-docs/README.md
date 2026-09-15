# Technical Design — OSE ID Init 02 Local Email Account

Read in order:

1. [Account domain and API contract](001-account-domain-and-api-contract.md)
2. [Email, capabilities, and password security](002-email-capabilities-and-password-security.md)
3. [Sessions, statelessness, and local verification](003-sessions-statelessness-and-local-verification.md)
4. [Decisions, sources, and file impact](004-decisions-sources-and-file-impact.md)
5. [Physical schema and migration contract](005-physical-schema-and-migration-contract.md)
6. [BDD spec delta and adapter map](006-bdd-spec-delta-and-adapter-map.md)
7. [Local account API contract delta](007-api-contract-delta.md)

## Carried Foundation Invariants

- Use Plan 01's four projects, PostgreSQL roles/migrations, health contract, local runner, and runtime guard.
- Do not add UI, token issuance, product/client protocol, or company behavior.
- A Person exists independently of any Company. This plan creates no synthetic company.
- OSE-authored source/docs inherit the repository MIT license; third-party artifacts retain their licenses.
- Every account scenario has Unit, Integration, and E2E bindings under the backend owner; the Unit target
  enforces at least 99% Unit line coverage for authored production code and static adapter-map validation is mandatory.
