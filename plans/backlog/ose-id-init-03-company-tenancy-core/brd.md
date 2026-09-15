# Business Requirements — OSE ID Init 03 Company Tenancy Core

## Business Goal

Let one OSE person participate in multiple companies while preserving honest personal access and
database-enforced company isolation. Establish the identity-level membership and product-entry facts
that later OIDC/UI/LMS plans can consume without centralizing product-domain permissions.

## Why This Is a Separate Delivery

Tenancy is not a field added to an account. It changes aggregate ownership, query context, database
policies, invitations, revocation, audit, concurrency, and client claims. Delivering it behind a
backend-only, production-disabled boundary lets the repository prove isolation before tokens or UI can
amplify a mistake.

## Business Outcomes

1. A person with no company remains a valid account and may receive explicit personal product access.
2. One person can hold independent memberships/authority in multiple companies.
3. Company administrators can distinguish and manage memberships/invitations/entitlements only in
   their active company, using a narrow verified-contact projection rather than private identity data.
4. Application code and PostgreSQL RLS both deny cross-company read/write paths.
5. Product entitlement remains separate from LMS or other domain roles.
6. Authorization resolves to exactly one personal or company context; no token can later represent
   multiple companies accidentally.
7. Future dedicated tenant storage remains possible through stable IDs and a narrow resolver.
8. Tenant data access remains inspectable and predictable: selected SQL, bindings, RLS context,
   transaction, index path, and row budget are test evidence rather than ORM side effects.

## Affected Roles

| Role                     | Need                                                                                          |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| Personal user            | Use eligible products without a company or fake tenant.                                       |
| Multi-company member     | See/select only current eligible contexts.                                                    |
| Company membership admin | Invite, list, suspend/reactivate members and manage product entitlements in one company.      |
| Product team             | Receive a stable personal/company context later while keeping domain roles local.             |
| Security reviewer        | Prove isolation under guessed IDs, joins, concurrency, stale membership, and missing context. |
| Future storage engineer  | Route a company to a dedicated store without changing public IDs/contracts.                   |

## Success Measures

- A companyless verified Person with a personal LMS fixture entitlement resolves one `personal` context
  and no `company_id`; a company-required resource returns no eligible context without creating membership.
- A Person in Companies A and B resolves each eligible company separately and never a combined context.
- Company A membership admin cannot read/mutate Company B rows even with valid guessed identifiers.
- A Company A membership admin can identify Company A members by verified contact email and pending
  invitations by recipient email, while provider subjects, login IDs, credentials, session state,
  capabilities, and Company B contacts remain absent from responses and observability data.
- A Company A membership admin can filter Company A members by a bounded literal verified-email prefix
  and page them in deterministic normalized-email/Membership-ID order; a cursor cannot be replayed with
  another company, filter, or ordering version.
- RLS denies read/write/join/soft-delete paths with missing/wrong transaction context under the real
  unprivileged runtime role; an application-filter omission still cannot leak Company B.
- Invitation acceptance is atomic/single-use, binds an authenticated verified-email account to the
  intended company, and handles new/existing accounts without using email as immutable identity.
- Suspension or entitlement removal blocks new context authorization immediately and produces the
  documented session/grant invalidation signal for future protocol integration.
- Two instances concurrently switching/evaluating contexts cannot merge companies or bypass current state.
- The backend Unit target enforces at least 99% Unit line coverage for authored production code, while static BDD
  validation proves every tenancy scenario has Unit, Integration, and E2E bindings or an exact valid
  scenario/adapter exemption.

## Options and Tradeoffs

| Option                                  | Benefits                                                                                                | Costs and risks                                                                                            | Decision   |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------- |
| Shared PostgreSQL + RLS + resolver seam | Strong local proof, low initial operations, future routing path                                         | RLS/pool transaction-context complexity; shared DB blast radius                                            | **Chosen** |
| Application filters only                | Simpler persistence code                                                                                | One missed filter leaks tenants; unacceptable                                                              | Rejected   |
| SqlKata + Npgsql plus RLS               | Visible SQL/projections and explicit connection/transaction context; no hidden tracking or lazy loading | String identifiers have weaker compile-time schema safety and require query/catalog/plan tests             | **Chosen** |
| EF runtime ORM for OSE tenant data      | Typed entity model and LINQ                                                                             | Obscures SQL/RLS context, encourages navigation leakage, and couples domain persistence to framework state | Rejected   |
| Database per company now                | Harder isolation boundary                                                                               | Premature routing/pooling/migration/backup fleet and no real scale driver                                  | Deferred   |
| Synthetic company for personal users    | Uniform token shape                                                                                     | Corrupts company meaning and creates hidden tenant/admin behavior                                          | Rejected   |
| Central product roles in OSE ID         | One authorization store                                                                                 | Stale/coupled identity tokens and central privilege escalation                                             | Rejected   |

## Risks and Mitigations

| Risk                                            | Consequence                        | Mitigation or stop condition                                                                     |
| ----------------------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------ |
| Tenant context leaks through pooled connections | Cross-company disclosure           | Transaction-local `SET LOCAL`, reset proof, wrong/unset-context E2E                              |
| Runtime role bypasses RLS                       | Policies become cosmetic           | `NOBYPASSRLS`, non-owner runtime, FORCE RLS where applicable, privilege audit                    |
| Invitation email becomes identity key           | Wrong account linked               | Authenticated verified-email possession plus invitation capability; Person ID remains identity   |
| Last admin removed                              | Company becomes unmanageable       | Atomic last-active-admin guard and concurrency test                                              |
| Entitlement confused with domain role           | Central privilege escalation       | Minimal product-entry fact only; LMS roles explicitly excluded                                   |
| Context switching reuses stale state            | Access after suspension/revocation | Fresh server-side re-evaluation and security/context version invalidation signal                 |
| Generic resolver becomes speculative sharding   | Complexity without value           | One shared-store implementation only; future route contract narrow and tested                    |
| Query-builder identifier/schema drift           | Runtime error or wrong projection  | Central allowlists, exact compiled-SQL snapshots, catalog Integration tests, and `EXPLAIN` gates |

## Business Non-Goals

No UI, product integration, production operation, company billing, platform support console, or claim of
regulatory tenant certification is delivered here.
