# Technical Design — LMS User Identity Integration

## Purpose

These numbered documents define how LMS consumes the delivered OSE ID service as an OIDC client and
resource server, keeps LMS-domain authorization local, stores only an opaque BFF session in the browser,
and composes the complete OSE ID stack for local development and verification.

## Document Map

1. [Architecture, BDD, and file impact](001-architecture-bdd-and-file-impact.md)
2. [API contract delta](002-api-contract-delta.md)

Document 001 preserves the detailed dependency, architecture, principal/context, session, physical
storage, local composition, complete copy-ready Gherkin, alternatives, and annotated file-impact
contract. Document 002 is the sole API delta authority for this plan and links every operation to the
canonical app-scoped Gherkin and machine-readable contract.

## Non-Negotiable Contracts

- OSE ID owns authentication, provider federation, identity proofing, OIDC/OAuth issuance, and
  personal/company context. LMS creates no credential authority, local issuer, or fallback identity.
- `ose-lms-app-web` is a confidential Authorization Code + PKCE BFF. Browser JavaScript receives only
  an opaque LMS session cookie, never an access, refresh, ID, or provider token.
- `ose-lms-be` accepts only the exact OSE ID issuer, LMS API audience/scope/entitlement, and one valid
  personal or company context. It derives principal identity from issuer plus subject, never email.
- LMS product roles and permissions stay LMS-owned and ignore role-like identity claims.
- Local authenticated runs compose OSE ID through its versioned public runner contract and clean every
  owned nested resource. App-only mode fails clearly when OSE ID is absent and offers no debug login.
- Server-only Kysely + `pg` owns LMS BFF-session persistence. Both owned tables have the complete audit
  envelope, no hard-delete path or grant, guarded soft deletion, and exhaustive PostgreSQL proof.
- Authored production code meets at least 99% Unit line coverage. Unit is mandatory for every canonical
  scenario; Integration/E2E are mandatory unless the exact per-scenario exemption contract applies.
- This plan is local-run-only. Production deployment remains outside scope and blocked on the private
  Kubernetes/platform plan family.

## Traceability

| Reader question                                         | Technical owner                                 |
| ------------------------------------------------------- | ----------------------------------------------- |
| Dependency, topology, ports, client registration        | Document 001 sections 1–2                       |
| Principal, personal/company context, LMS authorization  | Document 001 section 3                          |
| Browser session, logout, physical schema/migration      | Document 001 sections 4–5                       |
| Local OSE ID composition and test architecture          | Document 001 sections 6–7                       |
| Canonical Gherkin and layer/exemption mapping           | Document 001 section 8                          |
| Alternatives and exact file impact                      | Document 001 section 9 and File-Impact Analysis |
| Exact HTTP/BFF operation contracts and API quality gate | Document 002                                    |
