# Technical Design — OSE ID Init 08 Company Administration

## Purpose

These documents define the smallest tenant-administration presentation boundary: a BFF/UI over the
company membership, invitation, and entitlement APIs already owned by Plan 03.

## Document Map

1. [Boundary, routes, and request flow](001-boundary-routes-and-request-flow.md)
2. [Company-admin projections](002-company-admin-projections.md)
3. [UI, accessibility, audit, and verification](003-ui-accessibility-audit-and-verification.md)
4. [Decisions, security, and file impact](004-decisions-security-and-file-impact.md)
5. [BDD spec delta and adapter map](005-bdd-spec-delta-and-adapter-map.md)
6. [API contract delta](006-api-contract-delta.md)
7. [No-persistence and no-loss contract](007-no-persistence-and-no-loss-contract.md)

## Non-Negotiable Contracts

- Plan 03 remains sole owner of domain aggregates, APIs/commands, persistence, migrations, and RLS.
- Plan 08 adds only allowlisted BFF projections and UI; no persistence migration is permitted.
- Company admin authority is not a product-domain role and cannot grant one.
- Invitation capabilities are hashed, purpose/company-bound, expiring, revocable, and single-use.
- Cross-company platform operations remain absent.
- Web/backend processes stay stateless; PostgreSQL/shared key mechanisms hold correctness state.
- Root MIT covers OSE-authored source/docs; third-party licenses remain distinct.
- Local-only runtime remains production fail-closed; deployment depends on the private Kubernetes plan
  and then-current handoff gates.

## Traceability

| Product area                                | Technical owner       |
| ------------------------------------------- | --------------------- |
| Route/API trust boundary                    | Document 001          |
| Allowlisted view models and API adapters    | Document 002          |
| Responsive and accessible admin UX          | Document 003          |
| Audit, test layers, and manual proof        | Documents 003 and 004 |
| Decisions, rollback, licensing, file scope  | Document 004          |
| Canonical Gherkin and adapter ownership     | Document 005          |
| Detailed BFF and retained backend contracts | Document 006          |
| Empty schema delta and no-loss proof        | Document 007          |
