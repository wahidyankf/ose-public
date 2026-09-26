# OSE ID Init 03 — Company Tenancy Core

> **Status:** Backlog — third delivery in the OSE ID initialization chain. It is blocked until
> `ose-id-init-02-local-email-account` is delivered, terminal-audited, and archived on `origin/main`.

Add the backend-only organizational identity core: companies, multi-company memberships, invitations,
delegated membership administration, personal/company product entitlements, explicit authorization
contexts, PostgreSQL RLS, and a narrow tenant-store resolver. It uses Plan 02 account sessions and
Mailpit, but adds no UI, OIDC/OAuth token issuance, Google, or deployment.

## Dependency Chain

```mermaid
flowchart LR
  accTitle: Company tenancy dependency chain
  accDescr: Foundation and email account deliveries must complete before company tenancy core can execute.
  A["01 Foundation ready"] --> B["02 Account complete"] --> C["03 Company tenancy"]

  classDef done fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
  classDef current fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
  class A,B done
  class C current
  classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

## Scope

- Company catalog and status, with synthetic test bootstrap only; public company-onboarding policy is deferred.
- Membership invitation, acceptance, resend/revoke, list, suspend/reactivate, leave, and last-admin safety.
- One Person may belong to zero, one, or many companies; no synthetic “personal company.”
- Narrow company authority (`Member`, `MembershipAdmin`) for identity administration only.
- Product/resource registration fixtures plus personal and company product entitlements.
- A discriminated authorization context: `personal` with no `company_id`, or `company` with exactly one
  server-resolved active membership/company ID.
- Shared PostgreSQL with transaction-local subject/company context and RLS on every tenant-owned table;
  runtime roles cannot bypass RLS.
- SqlKata + `SqlKata.Execution`/Npgsql for every OSE-owned runtime query and mutation, with explicit
  projections, one use-case-owned transaction, bounded query plans, and no EF runtime ORM.
- Stable IDs and `ITenantStoreResolver` seam for a future dedicated-company database without building
  database-per-company routing now.
- Stateless backend instances; membership, invitation, entitlement, selection, rate limit, audit, and
  revocation consequences live in shared storage.
- Reuse the fixed local stack: web 3500, backend 8501, PostgreSQL 5438, Mailpit SMTP 1026, and Mailpit
  UI/API 8026 with the inherited OSE ID environment-variable names; add no new listener.
- MIT for OSE-authored source/docs through the root license; third-party components keep their own licenses.

## Non-Goals

- Company/admin/context selection UI, platform super-admin/operator console, impersonation, billing roles,
  custom company roles, domain-specific LMS roles, or public company onboarding.
- OIDC clients, consent, PKCE, ID/access/refresh tokens, JWKS, UserInfo, or LMS integration.
- Google or other provider login, passkeys, TOTP, production email, SCIM, SAML, or database-per-company.
- Production deployment. A future deploy plan is blocked at minimum on the private sibling
  `plans/backlog/start-infra-04-deploy-tencent-lighthouse-k3s-cluster` and then-current platform handoff gates.

## Resulting Main State

Backend APIs and E2E prove tenant-domain behavior locally. No consuming product receives a token or
session. The inherited production guard remains, so partially built tenant administration cannot be
internet-facing.

## Navigation

- [Business requirements](brd.md)
- [Product requirements and flows](prd.md)
- [Technical design](tech-docs/README.md)
- [Execution checklist](delivery.md)
- [Execution learnings](learnings.md)
- [Prerequisite account plan](../ose-id-init-02-local-email-account/README.md)
