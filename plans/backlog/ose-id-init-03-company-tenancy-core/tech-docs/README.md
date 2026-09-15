# Technical Design — OSE ID Init 03 Company Tenancy Core

Read in order:

1. [Company, membership, and invitation domain](001-company-membership-and-invitation-domain.md)
2. [Entitlements and authorization contexts](002-entitlements-and-authorization-contexts.md)
3. [PostgreSQL RLS and tenant-store seam](003-postgresql-rls-and-tenant-store-seam.md)
4. [Local APIs, statelessness, and verification](004-local-apis-statelessness-and-verification.md)
5. [Decisions, sources, and file impact](005-decisions-sources-and-file-impact.md)
6. [Physical schema and migration contract](006-physical-schema-and-migration-contract.md)
7. [BDD spec delta and adapter map](007-bdd-spec-delta-and-adapter-map.md)
8. [Company tenancy API contract delta](008-api-contract-delta.md)

## Carried Invariants

- Plan 01 owns projects, runner, runtime guard, health, and database roles; Plan 02 owns Person/account/
  session/capability/notification behavior.
- Person is global and company-optional. Company context is server-resolved and single-company.
- Product entitlement answers entry only; products retain domain roles.
- Runtime instances and connection pools cannot retain correctness/tenant state between requests.
- No UI, OIDC token, provider, production adapter, deployment manifest, or Kubernetes configuration is added.
- Every tenancy scenario has Unit, Integration, and E2E proof, a statically closed adapter map, and the
  backend Unit target enforces at least 99% Unit line coverage for authored production code.
