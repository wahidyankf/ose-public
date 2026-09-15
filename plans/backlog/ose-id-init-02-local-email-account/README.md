# OSE ID Init 02 — Local Email Account

> **Status:** Backlog — second delivery in the OSE ID initialization chain. It is blocked until
> `ose-id-init-01-foundation` is delivered, audited, and archived on `origin/main`.

Add backend-only local account behavior to the delivered OSE ID foundation: email registration,
verification, password sign-in, password recovery, and revocable server-side sessions. All messages go
through `INotificationSender`; Local/Test use an owned Mailpit SMTP catcher. There is no login UI,
OIDC/OAuth issuer, social provider, company model, product token, or deployment in this slice.

## Dependency Chain

```mermaid
flowchart LR
  accTitle: Local email account dependency
  accDescr: Delivered foundation enables the email account backend, which later enables company tenancy.
  A["01 Foundation ready"] --> B["02 Email account"] --> C["03 Company tenancy"]

  classDef done fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
  classDef current fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
  classDef later fill:#808080,stroke:#000000,color:#000000,stroke-width:2px
  class A done
  class B current
  class C later
```

## Scope

- SqlKata + `SqlKata.Execution`/Npgsql-backed Person/email/password records in `ose-id-be` and
  PostgreSQL. ASP.NET Core Identity supplies password hashing/validation primitives only; no EF Identity
  store or `UserManager` persistence owns account state.
- Backend JSON APIs for registration, verification, password sign-in/sign-out, recovery request/reset,
  session listing, session revocation, and current-account status.
- Verified-email requirement, enumeration-resistant public responses, rate limits, single-use expiring
  capabilities, password hashing/policy, session rotation, security-stamp consequences, and audit events.
- Stateless backend instances: all account/session/challenge/rate-limit correctness state is shared in
  PostgreSQL; callbacks and requests need no affinity.
- `INotificationSender` application port with Local/Test SMTP adapter and pinned Mailpit inbox/API for E2E.
- Local-only runner composition on top of Plan 01, including Mailpit readiness and complete cleanup.
- Preserve Plan 01 URLs and add Mailpit SMTP `127.0.0.1:1026`
  (`OSE_ID_MAILPIT_SMTP_PORT=1026`) plus UI/API `http://127.0.0.1:8026`
  (`OSE_ID_MAILPIT_UI_PORT=8026`).
- MIT for OSE-authored source/docs through the repository root license; every third-party component,
  including Mailpit, retains its own license and notice obligations.

## Non-Goals

- Login/registration/recovery UI or changes to `ose-id-web` beyond documenting its disabled state.
- OIDC/OAuth endpoints, access/ID/refresh tokens, client registration, consent, LMS integration, or BFF.
- Companies, memberships, invitations, entitlements, RLS tenant policies, or personal/company context.
- Google or other provider login, passkeys, TOTP, recovery codes, SMS, or production email delivery.
- Production deployment/configuration. A future deploy plan is blocked at minimum by ose-private
  `plans/backlog/start-infra-04-deploy-tencent-lighthouse-k3s-cluster` and then-current platform handoff gates.

## Resulting Main State

The backend can prove local account journeys through API/E2E, but remains unavailable in
Staging/Production. No product can log in through OSE ID yet: an account session is an OSE ID
authentication state, not an OIDC client session or API bearer token.

## Navigation

- [Business requirements](brd.md)
- [Product requirements and flows](prd.md)
- [Technical design](tech-docs/README.md)
- [Execution checklist](delivery.md)
- [Execution learnings](learnings.md)
- [Prerequisite plan](../ose-id-init-01-foundation/README.md)
- [Next plan](../ose-id-init-03-company-tenancy-core/README.md)
