# LMS User Identity Integration

> **Status:** Blocked — planning is complete, but execution must not start until the nine-plan OSE ID
> initialization series through `ose-id-init-09-local-scale-and-composition` is implemented, merged,
> and terminally verified on `origin/main`.

Integrate OSE LMS with the shared OSE Identity provider as an OIDC client and protected resource. LMS
will no longer register credentials, hash passwords, issue HS256 tokens, rotate refresh-token families,
or act as a competing issuer. It will trust the OSE ID issuer, identify people by `(iss, sub)`, map an
explicit personal or company authorization context and LMS entitlement, and keep LMS-specific roles and
permissions local.

## Scope

- Create `ose-lms-app-web`, a Next.js BFF/UI on local port 3400, plus
  `ose-lms-app-web-e2e`; register that concrete client and the `ose-lms-be` API resource/audience with
  the delivered OSE ID contract.
- Consume the frozen local registration: client `ose-lms-app-web-local`, callback
  `http://127.0.0.1:3400/auth/oidc/callback`, post-logout
  `http://127.0.0.1:3400/auth/signed-out`, audience `urn:ose:lms-api`, scopes
  `openid profile ose.context ose.lms`, and entitlement `lms.access`.
- Authorization Code with PKCE S256, server-managed browser session, and standards-compatible logout.
- Persist BFF sessions in shared PostgreSQL through server-only Kysely + `pg`. Both migration metadata
  and session tables carry the six audit columns, reject hard delete, and use bounded actor-attributed
  soft deletion so web instances remain stateless and horizontally replaceable.
- Validate signature/JWKS, issuer, audience, time, entitlement, and the discriminated authorization
  context.
- Map the immutable external principal into a typed request security context and map `company_id` only
  for company context; a personal user requires no synthetic company. LMS domain/profile persistence is
  deferred until a domain feature needs it.
- Keep instructor, learner, course-owner, grading, and other LMS roles inside LMS.
- Provide one local authenticated-stack target that starts `ose-lms-app-web`, `ose-lms-be`, the LMS BFF
  session PostgreSQL, `ose-id-web`, `ose-id-be`, ID PostgreSQL, Mailpit, and the fake provider through
  OSE ID's reusable lifecycle.
- Preserve app-only development with a clear OSE ID dependency-unavailable state and no auth fallback.
- Place backend behavior under `specs/apps/ose/lms-be/` and the new browser/BFF behavior under
  `specs/apps/ose/lms-app-web/`; delivery-phase names never become spec owners.
- Enforce at least 99% authored production-line Unit coverage in every changed LMS app. Map every
  Gherkin scenario to Unit, Integration, and E2E adapters when their boundaries apply; record any
  Integration/E2E exemption per scenario with a concrete boundary reason and validate it statically.

## Non-Goals

- LMS-owned usernames/passwords, verification, recovery, social login, passkeys, MFA, consent,
  signing keys, access/refresh-token issuance, or session-family persistence.
- Duplicating company membership, company-admin UI, or product entitlement administration in LMS.
- Production deployment, provider secrets, DNS, or identity infrastructure.
- Centralizing LMS domain authorization inside OSE ID.

## Approach Summary

The frontend/BFF redirects to OSE ID and stores only its own opaque, secure session cookie. The LMS API
accepts an access token only for its registered audience and translates `(iss, sub, context_type,
optional company_id)` to a local security context. It does not trust email or a client-supplied company
header. Personal access, membership removal, entitlement removal, company switching, logout, and token
expiry are tested through the upstream service.

The local-stack command composes the already-delivered OSE ID runner rather than copying its Compose,
keys, users, or fake-provider implementation. Readiness replaces sleeps/retries, and the outer LMS runner
owns complete cleanup.

## Dependency

```mermaid
flowchart LR
  accTitle: LMS identity dependency
  accDescr: Verified OSE ID delivery leads to LMS OIDC integration, which leads to an authenticated LMS local stack.
  I["OSE ID verified"] --> C["LMS OIDC integration"]
  C --> S["LMS auth stack"]

  classDef upstream fill:#029E73,stroke:#000000,color:#000000,stroke-width:2px
  classDef downstream fill:#0173B2,stroke:#000000,color:#FFFFFF,stroke-width:2px
  class I upstream
  class C,S downstream
  classDef default fill:#FFFFFF,stroke:#000000,color:#000000
```

Arrow order is mandatory; color is only supplementary.

## Navigation

- [Business requirements](./brd.md)
- [Product requirements](./prd.md)
- [Technical design](./tech-docs/README.md)
- [Delivery checklist](./delivery.md)
- [Execution learnings](./learnings.md)
- [Final upstream OSE ID initialization plan](../../backlog/ose-id-init-09-local-scale-and-composition/README.md)
  — Phase 0 resolves all nine archived OSE ID plan paths before this plan executes.

## Related

- [LMS backend specs](../../../specs/apps/ose/lms-be/README.md)
- [OIDC Core](https://openid.net/specs/openid-connect-core-1_0.html)
- [OAuth security BCP](https://www.rfc-editor.org/rfc/rfc9700)
