# OSE ID Company Tenancy API Contract Delta

## Operation Index and Traceability

Requirement IDs stay only in this plan table; durable paths, operation IDs, schemas, and executable
behavior names remain app/domain-scoped.

| Action | Plan traceability               | Durable API operation                                                                                                                  |
| ------ | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| ADD    | AC-TEN-01, AC-TEN-02, AC-TEN-03 | [`GET /api/v1/account/contexts`](#get-apiv1accountcontextsproductkeyproductkey)                                                        |
| ADD    | AC-TEN-03, AC-TEN-10, AC-TEN-11 | [`POST /api/v1/account/context-selections`](#post-apiv1accountcontext-selections)                                                      |
| ADD    | AC-TEN-05                       | [`GET /api/v1/companies/{companyId}/members`](#get-apiv1companiescompanyidmembers)                                                     |
| ADD    | AC-TEN-05, AC-TEN-06            | [`PATCH /api/v1/companies/{companyId}/members/{membershipId}`](#patch-apiv1companiescompanyidmembersmembershipid)                      |
| ADD    | AC-TEN-05, AC-TEN-06            | [`POST /api/v1/companies/{companyId}/members/{membershipId}/leave`](#post-apiv1companiescompanyidmembersmembershipidleave)             |
| ADD    | AC-TEN-04                       | [`GET /api/v1/companies/{companyId}/invitations`](#get-apiv1companiescompanyidinvitations)                                             |
| ADD    | AC-TEN-04                       | [`POST /api/v1/companies/{companyId}/invitations`](#post-apiv1companiescompanyidinvitations)                                           |
| ADD    | AC-TEN-04                       | [`POST /api/v1/companies/{companyId}/invitations/{invitationId}/resends`](#post-apiv1companiescompanyidinvitationsinvitationidresends) |
| ADD    | AC-TEN-04                       | [`DELETE /api/v1/companies/{companyId}/invitations/{invitationId}`](#delete-apiv1companiescompanyidinvitationsinvitationid)            |
| ADD    | AC-TEN-04                       | [`POST /api/v1/companies/{companyId}/invitation-acceptances`](#post-apiv1companiescompanyidinvitation-acceptances)                     |
| ADD    | AC-TEN-07                       | [`GET /api/v1/companies/{companyId}/entitlements`](#get-apiv1companiescompanyidentitlements)                                           |
| ADD    | AC-TEN-07                       | [`PUT /api/v1/companies/{companyId}/entitlements/{productKey}`](#put-apiv1companiescompanyidentitlementsproductkey)                    |
| ADD    | AC-TEN-07                       | [`DELETE /api/v1/companies/{companyId}/entitlements/{productKey}`](#delete-apiv1companiescompanyidentitlementsproductkey)              |
| UPDATE | AC-FND-02                       | [`GET /health/ready` adds tenancy schema and RLS compatibility](#updated-operation-packet-get-healthready)                             |
| RETAIN | AC-FND-02                       | [`GET /health/live`](#retain-get-healthlive)                                                                                           |
| RETAIN | AC-ACC-01                       | [`POST /api/v1/accounts/registrations`](#retain-post-apiv1accountsregistrations)                                                       |
| RETAIN | AC-ACC-04                       | [`POST /api/v1/accounts/email-verification-requests`](#retain-post-apiv1accountsemail-verification-requests)                           |
| RETAIN | AC-ACC-02                       | [`POST /api/v1/accounts/email-verifications`](#retain-post-apiv1accountsemail-verifications)                                           |
| RETAIN | AC-ACC-03                       | [`POST /api/v1/account-sessions`](#retain-post-apiv1account-sessions)                                                                  |
| RETAIN | AC-ACC-07                       | [`GET /api/v1/account`](#retain-get-apiv1account)                                                                                      |
| RETAIN | AC-ACC-06                       | [`GET /api/v1/account-sessions`](#retain-get-apiv1account-sessions)                                                                    |
| RETAIN | AC-ACC-06                       | [`DELETE /api/v1/account-sessions/current`](#retain-delete-apiv1account-sessionscurrent)                                               |
| RETAIN | AC-ACC-06                       | [`DELETE /api/v1/account-sessions/{sessionId}`](#retain-delete-apiv1account-sessionssessionid)                                         |
| RETAIN | AC-ACC-04                       | [`POST /api/v1/accounts/password-recovery-requests`](#retain-post-apiv1accountspassword-recovery-requests)                             |
| RETAIN | AC-ACC-05                       | [`POST /api/v1/accounts/password-resets`](#retain-post-apiv1accountspassword-resets)                                                   |
| RETAIN | AC-FND-06                       | [`GET /connect/authorize`](#retain-get-connectauthorize)                                                                               |
| RETAIN | AC-FND-06                       | [`POST /connect/token`](#retain-post-connecttoken)                                                                                     |
| RETAIN | AC-FND-06                       | [`GET /external/google/challenge`](#retain-get-externalgooglechallenge)                                                                |
| RETAIN | AC-FND-06                       | [`POST /scim/v2/Users`](#retain-post-scimv2users)                                                                                      |
| RETAIN | AC-FND-06                       | [`GET /platform/admin/companies`](#retain-get-platformadmincompanies)                                                                  |
| RETAIN | AC-FND-07                       | [`GET /` on `ose-id-web`](#retained-web-status-operation)                                                                              |
| RETAIN | AC-FND-04-BE                    | [Backend startup guard; no HTTP operation](#retain-backend-startup-guard)                                                              |
| RETAIN | AC-FND-04-WEB                   | [Web startup guard; no HTTP operation](#retain-web-startup-guard)                                                                      |

## Shared Transport, Authentication, and Tenant Contract

- Base URL remains `http://127.0.0.1:8501`; every new route starts with `/api/v1`.
- Requests/responses use JSON and `Cache-Control: no-store`, return `X-Correlation-ID`, and use the
  existing closed problem schema with `status`, `code`, `title`, `correlationId`, and optional `errors`
  fields. Concrete problem examples stay in fenced JSON blocks in the applicable operation packets.
- Every operation requires the existing opaque account-session cookie. Mutations also require the matching
  `X-CSRF-Token`; invitation acceptance additionally requires the verified email and capability rules.
- A `{companyId}` path value is an untrusted selector. The application resolves the authenticated
  Person's current Membership, company state, authority, and entitlement before setting
  transaction-local `ose.person_id`/`ose.company_id`. The runtime role cannot bypass RLS.
- Foreign, guessed, missing, inactive, and soft-deleted company-owned identifiers share `404
tenant_resource_not_found`. A current member lacking MembershipAdmin authority receives `403
insufficient_company_authority` without foreign data.
- Authorized MembershipAdmin directory responses may contain the selected tenant's member
  `verifiedEmailAddress` and invitation `recipientEmail` so an administrator can distinguish people and
  pending invitations. They otherwise contain only opaque IDs and safe display fields. Provider
  subjects, login IDs, credential/session state, capability values/digests, product-domain roles,
  another tenant's counts, and RLS details never appear. Email values remain excluded from logs,
  traces, metrics, audit payloads, and non-admin responses.

## ADD Operation Index

| Method and path                                                         | Caller and required authorization                        | Request                                                               | Success                            | Safe errors                                                                                     |
| ----------------------------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------- |
| `GET /api/v1/account/contexts?productKey={productKey}`                  | Authenticated active Person; no preselected company      | query product key                                                     | `200 AuthorizationContextList`     | `400 invalid_request`, `404 product_not_found`, `409 context_limit_exceeded`                    |
| `POST /api/v1/account/context-selections`                               | Authenticated active Person + CSRF                       | `SelectAuthorizationContextRequest`                                   | `200 SelectedAuthorizationContext` | `400 invalid_request`, `403 context_not_eligible`, `404 product_not_found`                      |
| `GET /api/v1/companies/{companyId}/members`                             | Current active MembershipAdmin in selected company       | optional tenant-local email-prefix `query`, bounded cursor/page query | `200 MembershipList`               | `400 invalid_request` or tenant-safe `403`/`404`                                                |
| `PATCH /api/v1/companies/{companyId}/members/{membershipId}`            | Current active MembershipAdmin + CSRF                    | `ChangeMembershipRequest`                                             | `200 MembershipSummary`            | `400`, tenant-safe `403`/`404`, `409 concurrency_conflict` or `administrator_transfer_required` |
| `POST /api/v1/companies/{companyId}/members/{membershipId}/leave`       | The membership's active Person + CSRF                    | `LeaveMembershipRequest`                                              | `204`                              | tenant-safe `403`/`404`, `409 administrator_transfer_required`                                  |
| `GET /api/v1/companies/{companyId}/invitations`                         | Current active MembershipAdmin                           | bounded cursor/page query                                             | `200 InvitationList`               | tenant-safe `403`/`404`                                                                         |
| `POST /api/v1/companies/{companyId}/invitations`                        | Current active MembershipAdmin + CSRF                    | `CreateInvitationRequest`; required `Idempotency-Key`                 | `201 InvitationSummary`            | `400`, tenant-safe `403`/`404`, `409 invitation_exists`, `429 rate_limited`                     |
| `POST /api/v1/companies/{companyId}/invitations/{invitationId}/resends` | Current active MembershipAdmin + CSRF                    | required `Idempotency-Key`                                            | `202 InvitationSummary`            | tenant-safe `403`/`404`, `409 invitation_terminal`, `429 rate_limited`                          |
| `DELETE /api/v1/companies/{companyId}/invitations/{invitationId}`       | Current active MembershipAdmin + CSRF                    | none                                                                  | `204`                              | tenant-safe `403`/`404`                                                                         |
| `POST /api/v1/companies/{companyId}/invitation-acceptances`             | Authenticated Person with matching verified email + CSRF | `AcceptInvitationRequest`                                             | `204`                              | `400 capability_unavailable`, tenant-safe `404`, `409 invitation_terminal`, `429 rate_limited`  |
| `GET /api/v1/companies/{companyId}/entitlements`                        | Current active MembershipAdmin                           | bounded cursor/page query                                             | `200 CompanyEntitlementList`       | tenant-safe `403`/`404`                                                                         |
| `PUT /api/v1/companies/{companyId}/entitlements/{productKey}`           | Current active MembershipAdmin + CSRF                    | none                                                                  | `204`                              | tenant-safe `403`/`404`, `409 entitlement_terminal`                                             |
| `DELETE /api/v1/companies/{companyId}/entitlements/{productKey}`        | Current active MembershipAdmin + CSRF                    | none                                                                  | `204`                              | tenant-safe `403`/`404`                                                                         |

All authenticated operations also return `401 authentication_required`; all authenticated mutations
may return `403 csrf_required`. Malformed UUIDs, cursors, fields, or bodies return `400 invalid_request`
before tenant lookup. Cursor results never expose a total across tenants.

## Per-Operation Contract Packets

### `GET /api/v1/account/contexts?productKey={productKey}`

- **Caller/auth/context:** an authenticated active Person; no company context may already be trusted or
  supplied. The service derives every eligible context from current shared state.
- **Request:** opaque account-session cookie, optional validated `X-Correlation-ID`, and one required
  `productKey` query string. Example: `?productKey=ose-lms`. There is no body or CSRF header.
- **Success:** `200 application/json`, `Cache-Control: no-store`, `X-Correlation-ID`, and:

  ```json
  {
    "contexts": [
      {
        "type": "personal",
        "personId": "<uuid>",
        "companyId": null,
        "membershipId": null,
        "displayName": null,
        "authorizationVersion": 7
      }
    ]
  }
  ```

- **Problems/validation:** `400 invalid_request` for a missing, empty, oversized, or malformed product
  key; `401 authentication_required`; `404 product_not_found`; `409 context_limit_exceeded` when the
  Person has more than 100 eligible contexts. The overflow response returns no partial list or
  continuation. Ineligible companies are omitted rather than disclosed as per-company errors.

  ```http
  HTTP/1.1 409 Conflict
  Content-Type: application/problem+json
  Cache-Control: no-store
  X-Correlation-ID: corr_synthetic_context_overflow
  ```

  ```json
  {
    "status": 409,
    "code": "context_limit_exceeded",
    "title": "Too many eligible contexts",
    "correlationId": "corr_synthetic_context_overflow"
  }
  ```

- **Semantics/privacy:** fresh, read-idempotent, and safe under concurrent membership/entitlement change;
  no pagination or application rate limit. The response and logs omit roles, invitation data, foreign
  tenant counts, and raw session material.
- **Discovery/proof:** OpenAPI `listAuthorizationContexts`; follow the
  [operation-scoped Gherkin proof](#gherkin-proof-list-authorization-contexts).

#### Gherkin proof: list authorization contexts

- **Exact scenarios:** [`AC-TEN-01 — Evaluate a personal-only eligible user`](./007-bdd-spec-delta-and-adapter-map.md#ac-ten-01--personal-only-context),
  [`AC-TEN-02 — Evaluate a company-required resource for a companyless Person`](./007-bdd-spec-delta-and-adapter-map.md#ac-ten-02--company-required-resource),
  [`AC-TEN-03 — Resolve separate company contexts`](./007-bdd-spec-delta-and-adapter-map.md#ac-ten-03--resolve-separate-company-contexts),
  and [`AC-TEN-03 — Refuse to truncate an oversized context set`](./007-bdd-spec-delta-and-adapter-map.md#ac-ten-03--refuse-to-truncate-an-oversized-context-set).
- **Canonical destinations:** `specs/apps/ose/id-be/behaviours/tenancy/personal-context.feature` and
  `specs/apps/ose/id-be/behaviours/tenancy/multi-company-context.feature`.
- **Layer disposition:** Unit eligibility and nullability, Integration ASP.NET/repository composition,
  and E2E companyless and multi-company wire results are required; no exemption applies.

### `POST /api/v1/account/context-selections`

- **Caller/auth/context:** an authenticated active Person with valid CSRF; the submitted company is an
  untrusted candidate, not authorization context.
- **Request:** session/CSRF cookies, `X-CSRF-Token`, optional correlation header, no query or
  idempotency key, and:

  ```json
  {
    "productKey": "ose-lms",
    "type": "company",
    "companyId": "<uuid>"
  }
  ```

  A personal selection uses `companyId` with JSON null.

- **Success:** `200` with no-store/correlation headers and:

  ```json
  {
    "type": "company",
    "personId": "<uuid>",
    "companyId": "<uuid>",
    "membershipId": "<uuid>",
    "displayName": "Acme",
    "authorizationVersion": 11
  }
  ```

- **Problems/validation:** `400 invalid_request` for an unknown type, malformed IDs, forbidden extra
  fields, or inconsistent type/company pairing; `401 authentication_required`; `403 csrf_required` or
  `context_not_eligible`; `404 product_not_found`.
- **Semantics/privacy:** current membership/company/entitlement state is re-evaluated atomically. A retry
  is result-idempotent but receives the current authorization version; no stored server affinity,
  pagination, or separate rate limit. Logs contain only safe opaque IDs and outcome code.
- **Discovery/proof:** OpenAPI `selectAuthorizationContext`; follow the
  [operation-scoped Gherkin proof](#gherkin-proof-select-an-authorization-context).

#### Gherkin proof: select an authorization context

- **Exact scenario:** [`AC-TEN-03 — Resolve separate company contexts`](./007-bdd-spec-delta-and-adapter-map.md#ac-ten-03--multiple-independent-companies).
- **Canonical destination:** `specs/apps/ose/id-be/behaviours/tenancy/multi-company-context.feature`.
- **Layer disposition:** Unit selection policy, Integration CSRF/transaction wiring, and E2E
  cross-instance current-state selection are required; no exemption applies.

### `GET /api/v1/companies/{companyId}/members`

- **Caller/auth/context:** authenticated active MembershipAdmin in the selected active company. The
  path company is validated before one transaction-local RLS context is set.
- **Request:** session cookie, optional correlation header, UUID `companyId`, optional literal
  email-prefix `query` from `2` through `320` characters after trimming/normalization, optional opaque
  `cursor`, and optional integer `limit` from `1` through `100`; no body or CSRF header. Example:
  `?query=member%40&limit=25`.
- **Success:** `200` no-store with correlation header and:

  ```json
  {
    "items": [
      {
        "id": "<uuid>",
        "personId": "<uuid>",
        "verifiedEmailAddress": "member@example.test",
        "status": "active",
        "authority": "member",
        "rowVersion": 3
      }
    ],
    "nextCursor": null
  }
  ```

- **Problems/validation:** `400 invalid_request` for malformed ID/limit/query, wildcard or control input,
  or a cursor whose company/query/order/version binding does not match; `401 authentication_required`;
  `403 insufficient_company_authority`; `404 tenant_resource_not_found`.
- **Semantics/privacy:** filter only the selected company's members by literal prefix of the same
  normalized email used by account identity. Sort deterministically by `normalized_email ASC,
membership_id ASC`; the signed opaque cursor binds company ID, normalized query (or absence), ordering
  version, and last sort tuple. Concurrent writes may appear only on a later page. The verified contact
  email is returned solely because the caller is an active admin in this selected company; query/contact
  values are never logged. No login/provider identifier, cross-tenant total, invitation secret, or
  product role is returned; no application rate limit.
- **Discovery/proof:** OpenAPI `listCompanyMembers`; follow the
  [operation-scoped Gherkin proof](#gherkin-proof-list-company-members).

#### Gherkin proof: list company members

- **Exact scenarios:** [`AC-TEN-05 — Filter and page recognizable members within one company`](./007-bdd-spec-delta-and-adapter-map.md#ac-ten-05--recognizable-tenant-bound-administration),
  `AC-TEN-05 — List and update recognizable members without exposing private identity fields`, and
  `AC-TEN-05 — Reject a Company A administrator using a Company B member identifier` in that linked packet.
- **Canonical destination:** `specs/apps/ose/id-be/behaviours/tenancy/membership-admin.feature`.
- **Layer disposition:** Unit cursor/filter/allowlist/authority, Integration indexed joined
  projection/RLS, and E2E own-versus-foreign pagination plus response/log scans are required; no
  exemption applies.

### `PATCH /api/v1/companies/{companyId}/members/{membershipId}`

- **Caller/auth/context:** authenticated active MembershipAdmin with CSRF in the selected company; the
  target membership must be visible under that transaction's RLS context.
- **Request:** session/CSRF cookies, `X-CSRF-Token`, optional correlation header, UUID path values, no
  company/person field or query, and:

  ```json
  {
    "status": "suspended",
    "authority": null,
    "rowVersion": 3
  }
  ```

  At least one mutable field is non-null.

- **Success:** `200` no-store with the updated closed `MembershipSummary`, for example:

  ```json
  {
    "id": "<uuid>",
    "personId": "<uuid>",
    "verifiedEmailAddress": "member@example.test",
    "status": "suspended",
    "authority": "member",
    "rowVersion": 4
  }
  ```

- **Problems/validation:** `400 invalid_request`; `401 authentication_required`; `403 csrf_required` or
  `insufficient_company_authority`; `404 tenant_resource_not_found`; `409 concurrency_conflict` for a
  stale version or `administrator_transfer_required` when the mutation would remove the final active admin.
- **Semantics/privacy:** compare-and-swap is atomic; an identical retry with the stale version cannot
  silently reapply. No pagination/rate limit. Audit and logs use opaque IDs and safe before/after enum
  values, never foreign rows or secrets.
- **Discovery/proof:** OpenAPI `changeMembership`; follow the
  [operation-scoped Gherkin proof](#gherkin-proof-change-a-company-membership).

#### Gherkin proof: change a company membership

- **Exact scenarios:** [`AC-TEN-05 — List and update recognizable members without exposing private identity fields`](./007-bdd-spec-delta-and-adapter-map.md#ac-ten-05--recognizable-tenant-bound-administration),
  `AC-TEN-05 — Reject a Company A administrator using a Company B member identifier`, and
  [`AC-TEN-06 — Concurrently attempt to remove the final membership administrator`](./007-bdd-spec-delta-and-adapter-map.md#ac-ten-06--last-administrator-safety).
- **Canonical destination:** `specs/apps/ose/id-be/behaviours/tenancy/membership-admin.feature`.
- **Layer disposition:** Unit transition/last-admin policy, Integration SqlKata/Npgsql
  concurrency/RLS, and real concurrent E2E commits are required; no exemption applies.

### `POST /api/v1/companies/{companyId}/members/{membershipId}/leave`

- **Caller/auth/context:** the authenticated active Person who owns the target membership, with valid
  CSRF. MembershipAdmin authority is not sufficient to make another Person leave through this route.
- **Request:** session/CSRF cookies, `X-CSRF-Token`, optional correlation header, UUID path values, no
  query/idempotency key, and:

  ```json
  {
    "rowVersion": 3
  }
  ```

- **Success:** `204` with no-store/correlation headers and an empty body after the membership becomes
  `left` and its authorization version advances.
- **Problems/validation:** `400 invalid_request`; `401 authentication_required`; `403 csrf_required` or
  `membership_not_owned`; `404 tenant_resource_not_found`; `409 concurrency_conflict` or
  `administrator_transfer_required`.
- **Semantics/privacy:** one conditional terminal transition; replay with the old version cannot mutate
  twice. No pagination/rate limit. The response and logs reveal no company population or foreign Person.
- **Discovery/proof:** OpenAPI `leaveCompanyMembership`; follow the
  [operation-scoped Gherkin proof](#gherkin-proof-leave-a-company-membership).

#### Gherkin proof: leave a company membership

- **Exact scenarios:** [`AC-TEN-05 — Leave one company without affecting another membership`](./007-bdd-spec-delta-and-adapter-map.md#ac-ten-05--recognizable-tenant-bound-administration)
  and [`AC-TEN-06 — Concurrently attempt to remove the final membership administrator`](./007-bdd-spec-delta-and-adapter-map.md#ac-ten-06--last-administrator-safety).
- **Canonical destination:** `specs/apps/ose/id-be/behaviours/tenancy/membership-admin.feature`.
- **Layer disposition:** Unit ownership/last-admin policy, Integration transaction policy, and E2E
  concurrent final-admin leave/removal proof are required; no exemption applies.

### `GET /api/v1/companies/{companyId}/invitations`

- **Caller/auth/context:** authenticated active MembershipAdmin in the selected company.
- **Request:** session cookie, optional correlation header, UUID company path, optional opaque `cursor`,
  and optional `limit` from `1` through `100`; no body or CSRF.
- **Success:** `200` no-store with:

  ```json
  {
    "items": [
      {
        "id": "<uuid>",
        "recipientEmail": "invitee@example.test",
        "status": "pending",
        "intendedAuthority": "member",
        "expiresAt": "<instant>",
        "rowVersion": 1
      }
    ],
    "nextCursor": null
  }
  ```

- **Problems/validation:** `400 invalid_request`; `401 authentication_required`; `403
insufficient_company_authority`; `404 tenant_resource_not_found`.
- **Semantics/privacy:** read-idempotent keyset pagination, current RLS state, no application rate limit.
  Recipient email is visible only to an active admin of this selected company and is never logged;
  capability values/digests, provider/login identifiers, foreign counts, and notification content are
  omitted from the body, logs, and traces.
- **Discovery/proof:** OpenAPI `listCompanyInvitations`; follow the
  [operation-scoped Gherkin proof](#gherkin-proof-list-company-invitations).

#### Gherkin proof: list company invitations

- **Exact scenario:** [`AC-TEN-04 — Manage a company invitation lifecycle without exposing capabilities`](./007-bdd-spec-delta-and-adapter-map.md#ac-ten-04--invitation-administration-and-concurrent-acceptance).
- **Canonical destination:** `specs/apps/ose/id-be/behaviours/tenancy/invitations.feature`.
- **Layer disposition:** Unit projection/redaction, Integration cursor/RLS, and E2E tenant-safe
  response/log scanning are required; no exemption applies.

### `POST /api/v1/companies/{companyId}/invitations`

- **Caller/auth/context:** authenticated active MembershipAdmin with CSRF in the selected company.
- **Request:** session/CSRF cookies, `X-CSRF-Token`, optional correlation header, required bounded
  `Idempotency-Key`, UUID company path, no query, and:

  ```json
  {
    "email": "invitee@example.test",
    "intendedAuthority": "member"
  }
  ```

- **Success:** `201`, `Location: /api/v1/companies/{companyId}/invitations/{id}`, no-store/correlation
  headers, and this safe `InvitationSummary` example:

  ```json
  {
    "id": "<uuid>",
    "recipientEmail": "invitee@example.test",
    "status": "pending",
    "intendedAuthority": "member",
    "expiresAt": "<instant>",
    "rowVersion": 1
  }
  ```

- **Problems/validation:** `400 invalid_request`; `401 authentication_required`; `403 csrf_required` or
  `insufficient_company_authority`; `404 tenant_resource_not_found`; `409 invitation_exists` or
  `idempotency_conflict`; `429 rate_limited` with integer `Retry-After`.
- **Semantics/privacy:** same actor/company/key/digest replays the original status/body; a changed digest
  conflicts. Database uniqueness and the shared limiter converge concurrent requests. Raw email,
  capability, notification body, and idempotency key are excluded from logs/evidence. No pagination.
- **Discovery/proof:** OpenAPI `createCompanyInvitation`; follow the
  [operation-scoped Gherkin proof](#gherkin-proof-create-a-company-invitation).

#### Gherkin proof: create a company invitation

- **Exact scenario:** [`AC-TEN-04 — Manage a company invitation lifecycle without exposing capabilities`](./007-bdd-spec-delta-and-adapter-map.md#ac-ten-04--invitation-administration-and-concurrent-acceptance).
- **Canonical destination:** `specs/apps/ose/id-be/behaviours/tenancy/invitations.feature`.
- **Layer disposition:** Unit normalization/idempotency/state policy, Integration SqlKata/Npgsql
  notification transaction, and E2E PostgreSQL/Mailpit duplicate and cross-instance proof are required;
  no exemption applies.

### `POST /api/v1/companies/{companyId}/invitations/{invitationId}/resends`

- **Caller/auth/context:** authenticated active MembershipAdmin with CSRF in the invitation's selected company.
- **Request:** session/CSRF cookies, `X-CSRF-Token`, optional correlation header, required bounded
  `Idempotency-Key`, and UUID company/invitation paths; no query or body.
- **Success:** `202` no-store with the current safe `InvitationSummary`, including the authorized
  `recipientEmail` but omitting the rotated capability.

  ```json
  {
    "invitationId": "0c6756f5-784f-4b2e-a9b5-9f6d46ad8d53",
    "recipientEmail": "invitee@example.test",
    "role": "Member",
    "status": "Pending",
    "expiresAt": "2026-09-16T02:00:00Z"
  }
  ```

- **Problems/validation:** `400 invalid_request`; `401 authentication_required`; `403 csrf_required` or
  `insufficient_company_authority`; `404 tenant_resource_not_found`; `409 invitation_terminal` or
  `idempotency_conflict`; `429 rate_limited` with `Retry-After`.
- **Semantics/privacy:** a same-digest replay returns the original result. A successful resend atomically
  invalidates the prior capability and publishes at most one replacement notification. No pagination;
  capability, email, key, and message body never enter logs.
- **Discovery/proof:** OpenAPI `resendCompanyInvitation`; follow the
  [operation-scoped Gherkin proof](#gherkin-proof-resend-a-company-invitation).

#### Gherkin proof: resend a company invitation

- **Exact scenario:** [`AC-TEN-04 — Manage a company invitation lifecycle without exposing capabilities`](./007-bdd-spec-delta-and-adapter-map.md#ac-ten-04--invitation-administration-and-concurrent-acceptance).
- **Canonical destination:** `specs/apps/ose/id-be/behaviours/tenancy/invitations.feature`.
- **Layer disposition:** Unit rotation/terminal policy, Integration outbox/SqlKata/Npgsql composition, and E2E
  old-capability denial plus Mailpit proof are required; no exemption applies.

### `DELETE /api/v1/companies/{companyId}/invitations/{invitationId}`

- **Caller/auth/context:** authenticated active MembershipAdmin with CSRF in the invitation's selected company.
- **Request:** session/CSRF cookies, `X-CSRF-Token`, optional correlation header, and UUID path values;
  no query, body, or idempotency key.
- **Success:** `204` no-store/correlation headers and empty body for an active or already-revoked owned invitation.
- **Problems/validation:** `400 invalid_request`; `401 authentication_required`; `403 csrf_required` or
  `insufficient_company_authority`; `404 tenant_resource_not_found` for missing/foreign rows.
- **Semantics/privacy:** revoke-idempotent and atomic with capability invalidation; concurrent resend/
  accept resolves to one terminal state. No pagination/rate limit; logs contain safe opaque IDs only.
- **Discovery/proof:** OpenAPI `revokeCompanyInvitation`; follow the
  [operation-scoped Gherkin proof](#gherkin-proof-revoke-a-company-invitation).

#### Gherkin proof: revoke a company invitation

- **Exact scenario:** [`AC-TEN-04 — Manage a company invitation lifecycle without exposing capabilities`](./007-bdd-spec-delta-and-adapter-map.md#ac-ten-04--invitation-administration-and-concurrent-acceptance).
- **Canonical destination:** `specs/apps/ose/id-be/behaviours/tenancy/invitations.feature`.
- **Layer disposition:** Unit terminal/idempotency policy, Integration transaction/RLS, and E2E
  revoked-capability rejection are required; no exemption applies.

### `POST /api/v1/companies/{companyId}/invitation-acceptances`

- **Caller/auth/context:** authenticated active Person with matching verified email and valid CSRF. The
  capability, not a pre-existing membership, authorizes consideration; the server still derives company context.
- **Request:** session/CSRF cookies, `X-CSRF-Token`, optional correlation header, UUID company path, no
  query/idempotency key, and:

  ```json
  {
    "capability": "<secret>"
  }
  ```

- **Success:** `204` no-store/correlation headers and empty body after one Membership and audit event commit.
- **Problems/validation:** `400 invalid_request` or `capability_unavailable`; `401 authentication_required`;
  `403 csrf_required` or `verified_email_mismatch`; `404 tenant_resource_not_found`; `409
invitation_terminal`; `429 rate_limited` with `Retry-After`.
- **Semantics/privacy:** one atomic consumption/membership winner; replay/concurrent losers cannot create a
  second row. No pagination. Capability/email/session values never appear in response, logs, audit, or metrics.
- **Discovery/proof:** OpenAPI `acceptCompanyInvitation`; follow the
  [operation-scoped Gherkin proof](#gherkin-proof-accept-a-company-invitation).

#### Gherkin proof: accept a company invitation

- **Exact scenario:** [`AC-TEN-04 — Accept a company invitation concurrently`](./007-bdd-spec-delta-and-adapter-map.md#ac-ten-04--invitation-administration-and-concurrent-acceptance).
- **Canonical destination:** `specs/apps/ose/id-be/behaviours/tenancy/invitations.feature`.
- **Layer disposition:** Unit capability/email/state policy, Integration SqlKata/Npgsql RLS transaction, and E2E
  concurrent consumption with exactly one Membership are required; no exemption applies.

### `GET /api/v1/companies/{companyId}/entitlements`

- **Caller/auth/context:** authenticated active MembershipAdmin in the selected company.
- **Request:** session cookie, optional correlation header, UUID company path, optional opaque `cursor`,
  and optional integer `limit` from `1` through `100`; no body or CSRF.
- **Success:** `200` no-store with correlation header and:

  ```json
  {
    "items": [
      {
        "productKey": "ose-lms",
        "status": "active",
        "authorizationVersion": 4
      }
    ],
    "nextCursor": null
  }
  ```

- **Problems/validation:** `400 invalid_request`; `401 authentication_required`; `403
insufficient_company_authority`; `404 tenant_resource_not_found`.
- **Semantics/privacy:** read-idempotent stable keyset pagination over the selected company only; no
  cross-tenant total or domain role, no application rate limit, safe key/status logging only.
- **Discovery/proof:** OpenAPI `listCompanyEntitlements`; follow the
  [operation-scoped Gherkin proof](#gherkin-proof-list-company-entitlements).

#### Gherkin proof: list company entitlements

- **Exact scenario:** [`AC-TEN-07 — List company product-entry entitlements`](./007-bdd-spec-delta-and-adapter-map.md#ac-ten-07--entry-entitlement-boundary).
- **Canonical destination:** `specs/apps/ose/id-be/behaviours/tenancy/product-entitlements.feature`.
- **Layer disposition:** Unit projection/boundary, Integration RLS/serialization, and E2E
  selected-company listing are required; no exemption applies.

### `PUT /api/v1/companies/{companyId}/entitlements/{productKey}`

- **Caller/auth/context:** authenticated active MembershipAdmin with CSRF in the selected company.
- **Request:** session/CSRF cookies, `X-CSRF-Token`, optional correlation header, UUID company and bounded
  product-key path values; no query/body/idempotency key.
- **Success:** `204` no-store/correlation headers and empty body when the entry entitlement is newly or
  already active; authorization version advances only on a state change.
- **Problems/validation:** `400 invalid_request`; `401 authentication_required`; `403 csrf_required` or
  `insufficient_company_authority`; `404 tenant_resource_not_found`; `409 entitlement_terminal` for a
  previously revoked relationship that this contract cannot resurrect.
- **Semantics/privacy:** naturally idempotent under a unique company/product key and conditional write;
  no pagination/rate limit. No product-domain role or foreign tenant information is logged or returned.
- **Discovery/proof:** OpenAPI `grantCompanyEntitlement`; follow the
  [operation-scoped Gherkin proof](#gherkin-proof-grant-a-company-entitlement).

#### Gherkin proof: grant a company entitlement

- **Exact scenario:** [`AC-TEN-07 — Grant company access to the LMS fixture`](./007-bdd-spec-delta-and-adapter-map.md#ac-ten-07--entry-entitlement-boundary).
- **Canonical destination:** `specs/apps/ose/id-be/behaviours/tenancy/product-entitlements.feature`.
- **Layer disposition:** Unit terminal/authorization-version policy, Integration SqlKata/Npgsql RLS, and E2E
  repeat/concurrent grant proof are required; no exemption applies.

### `DELETE /api/v1/companies/{companyId}/entitlements/{productKey}`

- **Caller/auth/context:** authenticated active MembershipAdmin with CSRF in the selected company.
- **Request:** session/CSRF cookies, `X-CSRF-Token`, optional correlation header, UUID company and bounded
  product-key path values; no query/body/idempotency key.
- **Success:** `204` no-store/correlation headers and empty body for active or already-revoked owned rows.
- **Problems/validation:** `400 invalid_request`; `401 authentication_required`; `403 csrf_required` or
  `insufficient_company_authority`; `404 tenant_resource_not_found` for absent/foreign relationships.
- **Semantics/privacy:** terminal revoke-idempotent conditional update; concurrent grants/revokes converge
  to one legal state. No pagination/rate limit and no foreign counts/domain roles in response or logs.
- **Discovery/proof:** OpenAPI `revokeCompanyEntitlement`; follow the
  [operation-scoped Gherkin proof](#gherkin-proof-revoke-a-company-entitlement).

#### Gherkin proof: revoke a company entitlement

- **Exact scenario:** [`AC-TEN-07 — Revoke company access to the LMS fixture`](./007-bdd-spec-delta-and-adapter-map.md#ac-ten-07--entry-entitlement-boundary).
- **Canonical destination:** `specs/apps/ose/id-be/behaviours/tenancy/product-entitlements.feature`.
- **Layer disposition:** Unit terminal/idempotency policy, Integration transaction/RLS, and E2E
  current-context invalidation are required; no exemption applies.

## Exact Request and Response Schemas

`AuthorizationContextList` contains `contexts`; each item has a personal-or-company `type`, UUID
`personId`, nullable UUID `companyId` and `membershipId`, nullable string `displayName`, and integer
`authorizationVersion`. Personal rows have null company, membership, and display fields. Example:

```json
{
  "contexts": [
    {
      "type": "personal",
      "personId": "8e49d06c-1ee7-4b19-8bdd-0ec8a0b9a63e",
      "companyId": null,
      "membershipId": null,
      "displayName": null,
      "authorizationVersion": 2
    }
  ]
}
```

`SelectAuthorizationContextRequest` requires string `productKey`, personal-or-company `type`, and
nullable UUID `companyId`. `SelectedAuthorizationContext` has the same context-item shape and no token,
cookie, grant, claim set, or domain role. Example request:

```json
{
  "productKey": "ose-lms",
  "type": "company",
  "companyId": "c352456e-df77-47e0-bf6a-1468ccca4828"
}
```

`MembershipSummary` contains UUID `id` and `personId`, string `verifiedEmailAddress`, membership
`status`, authority (`member` or `membership_admin`), and integer `rowVersion`. The address is the
current active verified `email_display` projection, not a login ID or identity key. `MembershipList`
wraps those summaries in `items` and adds a nullable string `nextCursor`, scoped to the selected company.
Example item:

```json
{
  "id": "6e8c2ccd-e946-4a67-aaad-eb4640bf01dd",
  "personId": "8e49d06c-1ee7-4b19-8bdd-0ec8a0b9a63e",
  "verifiedEmailAddress": "person@example.test",
  "status": "active",
  "authority": "membership_admin",
  "rowVersion": 4
}
```

`ChangeMembershipRequest` accepts nullable `status`, nullable `authority`, and integer `rowVersion`;
at least one mutable field is non-null. `LeaveMembershipRequest` contains only integer `rowVersion`.
The server never accepts `companyId` or `personId` in either body. Example change:

```json
{
  "status": "suspended",
  "authority": null,
  "rowVersion": 4
}
```

`CreateInvitationRequest` contains string `email` and intended authority (`member` or
`membership_admin`). `AcceptInvitationRequest` contains only string `capability`.
`InvitationSummary` contains UUID `id`, string `recipientEmail`, invitation `status`, string
`intendedAuthority`, instant `expiresAt`, and integer `rowVersion`. `recipientEmail` is the stored
normalized intended address and appears only after current-company MembershipAdmin authorization;
capability material remains omitted. `InvitationList` wraps the same bounded item and adds
`nextCursor`. Example summary:

```json
{
  "id": "2f8316e9-6d7d-4c58-a324-9fbed2c2c5d3",
  "recipientEmail": "invitee@example.test",
  "status": "pending",
  "intendedAuthority": "member",
  "expiresAt": "2026-09-22T01:00:00Z",
  "rowVersion": 1
}
```

`CompanyEntitlementList` wraps items containing string `productKey`, active-or-revoked `status`, and
integer `authorizationVersion`, then adds nullable string `nextCursor`. Its representative payload is
shown in the entitlement-list operation packet above.

Context listing starts from the Person and evaluates each company independently. Selection re-evaluates
current state and never trusts a previously listed result. Company routes set one transaction-local
company context before repository work; no request can represent multiple selected companies.

## Idempotency, Concurrency, and Rate Limits

- Context list/selection and all GET operations are read-idempotent and use current shared state on every
  request. Member cursors bind the selected company, normalized email-prefix filter, ordering version,
  and last tuple; reusing one with another company/filter fails `400 invalid_request`. No result is
  cached in process memory or bound to instance affinity.
- Invitation creation/resend requires a bounded, opaque `Idempotency-Key`. The key is scoped to actor,
  company, operation, and canonical request digest; same-key/same-request replays return the original
  status/body, while same-key/different-request returns `409 idempotency_conflict`.
- Resend creates one replacement capability and atomically revokes the prior pending invitation. Accept
  performs one conditional consumption plus membership creation; concurrent/replayed losers receive the
  stable terminal/capability result and never create a second Membership.
- Membership changes require `rowVersion`. Database concurrency plus the last-active-admin invariant
  prevents two requests from committing zero active MembershipAdmin rows.
- Entitlement `PUT` is idempotent while active; a previously revoked relationship is terminal here and
  returns `409 entitlement_terminal`. `DELETE` returns `204` for active or already-revoked owned rows.
- Shared rate buckets cover invitation create, resend, and acceptance. `429 rate_limited` returns integer
  `Retry-After` without email, capability, tenant counts, or foreign identity state.

## UPDATE, DELETE, and RETAIN Contracts

- **UPDATE:** `GET /health/ready` evaluates the additive tenancy migration and policy catalog while
  retaining its wire contract.
- **DELETE:** none.

### Updated operation packet: `GET /health/ready`

- **Caller/auth/context:** anonymous local runner/operator; no authorization or tenant context.
- **Request:** optional validated correlation header; no path/query/body/cookie.
- **Success:** unchanged `200` no-store/correlation response:

  ```json
  {
    "status": "ready",
    "components": {
      "postgresql": "ready",
      "schema": "compatible"
    }
  }
  ```

- **Problems/validation:** unchanged `503 database_unavailable` or `503 schema_incompatible`; tenancy
  migration or RLS-policy-catalog mismatch selects the latter without identifying a table or policy.
- **Semantics/privacy:** current bounded evaluation, idempotent/concurrency-safe, unpaginated, not
  rate-limited, no mutation, and allowlisted logs only.
- **Discovery/proof:** UPDATE composed OpenAPI `getReadiness`; follow the
  [exact local readiness scenario](#readiness-wire-compatibility--ac-fnd-02-and-ac-ten-08).

#### Gherkin proof: report tenancy readiness

- **Exact scenario:** [`AC-FND-02 / AC-TEN-08 — “Report tenancy-schema and RLS-policy readiness without
  changing the wire contract”](#readiness-wire-compatibility--ac-fnd-02-and-ac-ten-08).
- **Canonical destination:** `specs/apps/ose/id-be/behaviours/foundation/health.feature`.
- **Layer disposition:** Unit composed-state mapping, Integration real migration/RLS policy checks, and
  E2E compatible/incompatible PostgreSQL readiness are required; no exemption applies.

### Retained foundation operation packets

The following table is a navigation summary only. Each row has a complete in-document packet below;
the table is not a contract substitute.

| Method/path                      | Caller, request, result, and stable problems                                                 | Semantics, discovery, and proof                                                                                  |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `GET /health/live`               | Anonymous/no tenant; optional correlation only; exact `200 LivenessResponse`                 | Idempotent/no-write/no-limit; `getLiveness`; health scenario at Unit/Integration/E2E                             |
| `GET /connect/authorize`         | Anonymous/no tenant; bounded ignored query; `404 capability_disabled`, no redirect           | Deterministic/no-write; `rejectDisabledOidcAuthorization`; disabled OIDC example at all three layers             |
| `POST /connect/token`            | Anonymous/no tenant; bounded unparsed body; `404 capability_disabled`, no token field        | Replay/concurrency safe; `rejectDisabledTokenIssuance`; disabled token example at all three layers               |
| `GET /external/google/challenge` | Anonymous/no tenant; bounded ignored query; `404 capability_disabled`, no redirect/cookie    | Deterministic/no-write; `rejectDisabledGoogleSignIn`; disabled provider example at all three layers              |
| `POST /scim/v2/Users`            | No bearer/tenant; bounded unparsed body; `404 capability_disabled`, no resource ID           | Replay/concurrency safe; `rejectDisabledScimUserProvisioning`; disabled SCIM example at all three layers         |
| `GET /platform/admin/companies`  | No operator/tenant; no body; `404 capability_disabled`, no company fact                      | Idempotent/no-write; `rejectDisabledPlatformAdministration`; disabled administration example at all three layers |
| `GET /` on `ose-id-web`          | Anonymous browser/no tenant; no body/cookie; `200` accessible status HTML or sanitized error | Idempotent, `no-cache`, no data; status-shell component Unit, server Integration, and browser E2E                |

### Retained account operation packets

This navigation summary highlights the inherited shape. The complete packet for every row below
restates its wire example, failures, semantics, publication, rollback, scenario, and proof. All retain
the opaque account-session/no-company contract, no-store/correlation headers, closed JSON,
sensitive-value redaction, account OpenAPI operation ID, and exact Unit/Integration/E2E behavior binding.

| Method/path                                         | Caller, request, success, and stable problems                                                                | Semantics, discovery, and proof                                                                          |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `POST /api/v1/accounts/registrations`               | Anonymous; email/password JSON; generic `202`; `400 invalid_request`, `429 rate_limited`                     | Response-idempotent, shared limit/no secret logs; `registerAccount`; registration scenario at all layers |
| `POST /api/v1/accounts/email-verification-requests` | Anonymous; email JSON; generic `202`; `400 invalid_request`, `429 rate_limited`                              | Cooldown-safe/no disclosure; `requestEmailVerification`; public-action scenario at all layers            |
| `POST /api/v1/accounts/email-verifications`         | Capability holder; capability JSON; `204`; `400 capability_unavailable`, `429 rate_limited`                  | One atomic winner/no secret logs; `verifyEmail`; verification scenario at all layers                     |
| `POST /api/v1/account-sessions`                     | Anonymous; email/password JSON; `201` plus rotated cookies; `400`, `401 invalid_credentials`, `429`          | Non-idempotent success/shared limit; `createAccountSession`; sign-in scenario at all layers              |
| `GET /api/v1/account`                               | Authenticated Person/no company; cookie only; `200 CurrentAccount`; `401 authentication_required`            | Fresh idempotent read/no limit; `getCurrentAccount`; instance-handoff scenario at all layers             |
| `GET /api/v1/account-sessions`                      | Authenticated Person/no company; cookie only; `200 AccountSessionList`; `401 authentication_required`        | Caller-owned bounded list/no limit; `listAccountSessions`; session-management scenario at all layers     |
| `DELETE /api/v1/account-sessions/current`           | Authenticated Person + CSRF; no body; `204` plus expired cookies; `401`, `403 csrf_required`                 | Atomic/idempotent revoke; `revokeCurrentAccountSession`; session-management scenario at all layers       |
| `DELETE /api/v1/account-sessions/{sessionId}`       | Authenticated owner + CSRF; UUID path; `204`; `400`, `401`, `403`, `404 session_not_found`                   | Owned revoke-idempotent/no disclosure; `revokeAccountSession`; session-management scenario at all layers |
| `POST /api/v1/accounts/password-recovery-requests`  | Anonymous; email JSON; generic `202`; `400 invalid_request`, `429 rate_limited`                              | Response-idempotent/cooldown/no disclosure; `requestPasswordRecovery`; recovery scenario at all layers   |
| `POST /api/v1/accounts/password-resets`             | Capability holder; capability/new-password JSON; `204`; `400 invalid_request\|capability_unavailable`, `429` | Atomic winner and prior-session invalidation; `resetPassword`; recovery scenario at all layers           |

#### RETAIN `GET /health/live`

- **Owner/caller/auth/context:** `ose-id-be`; anonymous local runner/operator; no authorization,
  scope, audience, Person, Company, or tenant context.
- **Request/success:** optional validated correlation header; no parameters, body, cookie, or request
  media type. Exact exchange:

  ```http
  GET /health/live HTTP/1.1
  Host: 127.0.0.1:8501
  Accept: application/json

  HTTP/1.1 200 OK
  Content-Type: application/json
  Cache-Control: no-store
  X-Correlation-ID: corr_synthetic_21

  {"status":"live","service":"ose-id-be"}
  ```

- **Failures/validation:** no operation-owned error while listening; malformed correlation is replaced.
  Process absence is a connection failure. Dependency, auth, context, and RLS errors are none.
- **Semantics/privacy:** fresh idempotent, replay/concurrency-safe, no-write, and dependency-free.
  Pagination and the application rate limit are none. Only allowlisted route/result/timing/correlation data logs.
- **Publication/compatibility/rollback:** retain OpenAPI `getLiveness`; discovery/codegen changes are
  none. Tenancy rollout and rollback preserve exact bytes and do not consult RLS.
- **Scenario/proof:** `Preserve process-only liveness while tenancy is enabled` maps to
  `specs/apps/ose/id-be/behaviours/foundation/health.feature`; Unit, Integration, and E2E prove response
  mapping, pipeline, and database/RLS independence.

  ```gherkin
  Scenario: Preserve process-only liveness while tenancy is enabled
    Given tenancy is enabled and PostgreSQL is unavailable
    When an anonymous caller sends GET "/health/live"
    Then the response is the unchanged 200 live JSON with no-store
    And replay and concurrency create no state or dependency call
    And identity, company, RLS, secret, and machine-path data is not returned or logged
  ```

#### RETAIN `POST /api/v1/accounts/registrations`

- **Owner/caller/auth/context:** `ose-id-be`; anonymous caller with no cookie, authorization, Person,
  Company, tenant, scope, or audience.
- **Request/success:** required JSON content type, optional validated correlation header, no
  path/query/idempotency key. The generic `202` is identical for new and existing account states:

  ```http
  POST /api/v1/accounts/registrations HTTP/1.1
  Host: 127.0.0.1:8501
  Content-Type: application/json

  {"email":"person@example.test","password":"synthetic-secret"}

  HTTP/1.1 202 Accepted
  Content-Type: application/json
  Cache-Control: no-store
  X-Correlation-ID: corr_synthetic_11

  {"status":"accepted","correlationId":"corr_synthetic_11"}
  ```

- **Failures/validation:** closed-schema email/password and body-limit failures return `400
invalid_request`; the shared limiter returns `429 rate_limited` with integer `Retry-After`. Account
  existence/lifecycle never changes status, body, or timing class.
- **Semantics/privacy:** response-idempotent; uniqueness races create at most one eligible Person and
  verification capability. No pagination. Raw email/password/capability, account state, company facts,
  cookies, and digests are absent from response, cache, logs, traces, metrics, and audit payloads.
- **Publication/compatibility/rollback:** retain `registerAccount` in
  `account.openapi.yaml`; discovery/codegen shape is unchanged. Tenancy adds no request/context field;
  tenancy rollback leaves this operation and account rows intact.
- **Scenario/proof:** `Preserve registration while tenancy is enabled` maps to
  `specs/apps/ose/id-be/behaviours/account/registration.feature`; Unit, Integration, and E2E prove
  validation, generic parity, one-winner concurrency, no-company creation, and redaction.

  ```gherkin
  Scenario: Preserve registration while tenancy is enabled
    Given tenancy is enabled and an anonymous caller has a valid email and password
    When the caller posts the unchanged registration request
    Then the response is the generic 202 account result with no company context
    And invalid input or an exhausted shared limit returns only the retained 400 or 429 problem
    And replay and concurrency create at most one Person and capability and no company
    And contact, credential, capability, account-state, and tenant values are not disclosed or logged
  ```

#### RETAIN `POST /api/v1/accounts/email-verification-requests`

- **Owner/caller/auth/context:** `ose-id-be`; anonymous caller; no session, CSRF, Person, Company,
  tenant, scope, or audience.
- **Request/success:** JSON with exactly one normalized email input, optional correlation header, no
  query/path/idempotency key. Unknown, pending, verified, suspended, and deleted states share:

  ```http
  POST /api/v1/accounts/email-verification-requests HTTP/1.1
  Host: 127.0.0.1:8501
  Content-Type: application/json

  {"email":"person@example.test"}

  HTTP/1.1 202 Accepted
  Content-Type: application/json
  Cache-Control: no-store
  X-Correlation-ID: corr_synthetic_12

  {"status":"accepted","correlationId":"corr_synthetic_12"}
  ```

- **Failures/validation:** malformed/oversized/extra input is `400 invalid_request`; shared limit is
  `429 rate_limited` with `Retry-After`. No account-state-specific error exists.
- **Semantics/privacy:** response-idempotent and replay-safe; cooldown may suppress duplicate mail and concurrency
  cannot multiply active capabilities. No pagination. Email, message, capability, account status,
  company facts, and limiter key never enter responses, cache, logs, traces, metrics, or audit.
- **Publication/compatibility/rollback:** retain `requestEmailVerification` in
  `account.openapi.yaml`; discovery and codegen/generated contract remain unchanged. Tenancy and rollback do
  not alter enumeration parity, notification behavior, or absence of company context.
- **Scenario/proof:** `Preserve verification request while tenancy is enabled` maps to
  `specs/apps/ose/id-be/behaviours/account/enumeration-resistance.feature`; Unit, Integration, and E2E
  cover input, generic parity, Mailpit cooldown, concurrency, rate limit, and redaction.

  ```gherkin
  Scenario: Preserve verification request while tenancy is enabled
    Given tenancy is enabled and an anonymous caller submits a syntactically valid email
    When the caller requests email verification
    Then every account state receives the unchanged generic 202 response
    And invalid input or an exhausted shared limit returns only the retained 400 or 429 problem
    And retry, cooldown, and concurrency do not reveal state or multiply active capabilities
    And email, message, capability, account, and tenant values are not disclosed or logged
  ```

#### RETAIN `POST /api/v1/accounts/email-verifications`

- **Owner/caller/auth/context:** `ose-id-be`; anonymous holder of a purpose-bound capability; no
  session, Company, tenant, scope, or audience.
- **Request/success:** JSON contains exactly one capability; no query/path/cookie/idempotency key. A
  valid current capability has an explicit empty-body response:

  ```http
  POST /api/v1/accounts/email-verifications HTTP/1.1
  Host: 127.0.0.1:8501
  Content-Type: application/json

  {"capability":"synthetic-capability"}

  HTTP/1.1 204 No Content
  Cache-Control: no-store
  X-Correlation-ID: corr_synthetic_13
  Content-Length: 0
  ```

- **Failures/validation:** malformed/oversized/extra input is `400 invalid_request`; invalid,
  wrong-purpose/version, expired, replaced, consumed, or replayed capability is the same `400
capability_unavailable`; shared exhaustion is `429 rate_limited` with `Retry-After`.
- **Semantics/privacy:** one atomic consumer wins; concurrent/replayed losers share the safe problem.
  No pagination. Capability/email/security version/company state is absent from response, cache,
  logging, tracing, metrics, audit payload, and persistence beyond its digest.
- **Publication/compatibility/rollback:** retain OpenAPI `verifyEmail`; discovery/codegen is unchanged.
  Success activates only the Person/email login and creates no Company/Membership; tenancy rollback
  preserves that account state.
- **Scenario/proof:** `Preserve email verification while tenancy is enabled` maps to
  `specs/apps/ose/id-be/behaviours/account/verification.feature`; Unit, Integration, and E2E prove
  purpose/version validation, atomic consumption, stable errors, no-company effect, and redaction.

  ```gherkin
  Scenario: Preserve email verification while tenancy is enabled
    Given tenancy is enabled and a pending personal account has one current verification capability
    When anonymous callers concurrently submit that capability
    Then exactly one response is the unchanged empty 204 and every loser is capability_unavailable
    And malformed input or a shared limit returns only the retained 400 or 429 problem
    And no company or membership is created
    And capability, email, version, account, and tenant values are not disclosed or logged
  ```

#### RETAIN `POST /api/v1/account-sessions`

- **Owner/caller/auth/context:** `ose-id-be`; anonymous caller; no existing session, selected Company,
  tenant, scope, or audience is required or trusted.
- **Request/success:** closed JSON email/password, optional correlation header, no query/path/
  idempotency key. A verified active account returns rotated protected cookies and:

  ```http
  POST /api/v1/account-sessions HTTP/1.1
  Host: 127.0.0.1:8501
  Content-Type: application/json

  {"email":"person@example.test","password":"synthetic-secret"}

  HTTP/1.1 201 Created
  Content-Type: application/json
  Cache-Control: no-store
  X-Correlation-ID: corr_synthetic_14
  Set-Cookie: ose_id_session=session_synthetic; HttpOnly; SameSite=Strict; Path=/
  Set-Cookie: ose_id_csrf=csrf_synthetic; SameSite=Strict; Path=/

  {"status":"authenticated","session":{"id":"91f6025b-b14a-4eb2-b915-eca860078f5e","createdAt":"2026-09-15T01:00:00Z","idleExpiresAt":"2026-09-15T02:00:00Z","absoluteExpiresAt":"2026-09-16T01:00:00Z","current":true}}
  ```

- **Failures/validation:** `400 invalid_request` for closed-schema/body policy; uniform `401
invalid_credentials` for unknown, wrong-password, pending, suspended, or deleted state; `429
rate_limited` plus `Retry-After` for shared exhaustion.
- **Semantics/privacy:** each success creates/rotates one shared-store session, is not idempotent, and
  does not automatically replay;
  concurrency cannot reuse a prior cookie or create authority beyond the authenticated Person. No
  pagination. Credentials, raw cookies/digests, email, account state, and tenant facts never log/cache.
- **Publication/compatibility/rollback:** retain `createAccountSession` in `account.openapi.yaml` and
  codegen/generated transport shape; discovery is unchanged. Tenancy adds no selected-company field and
  rollback leaves sessions usable under the global Person contract.
- **Scenario/proof:** `Preserve password sign-in while tenancy is enabled` maps to
  `specs/apps/ose/id-be/behaviours/account/password-sign-in.feature`; Unit, Integration, and E2E prove
  eligibility, generic denial, cookie rotation, shared-instance use, rate limiting, and redaction.

  ```gherkin
  Scenario: Preserve password sign-in while tenancy is enabled
    Given tenancy is enabled and a verified active personal account has a valid password
    When the caller posts the unchanged credentials
    Then the response is 201 with the safe session summary and rotated protected cookies
    And invalid input, unsafe credentials, or shared exhaustion returns only the retained 400, 401, or 429 problem
    And concurrent success creates only Person authority and no selected company context
    And password, email, cookie, digest, state, and tenant values are not disclosed or logged
  ```

#### RETAIN `GET /api/v1/account`

- **Owner/caller/auth/context:** `ose-id-be`; authenticated active Person from opaque session cookie;
  no Company, tenant, scope, or audience is selected or accepted.
- **Request/success:** optional correlation header and session cookie; no path/query/body/CSRF. Exact
  representative exchange:

  ```http
  GET /api/v1/account HTTP/1.1
  Host: 127.0.0.1:8501
  Cookie: ose_id_session=session_synthetic

  HTTP/1.1 200 OK
  Content-Type: application/json
  Cache-Control: no-store
  X-Correlation-ID: corr_synthetic_15

  {"personId":"4f277179-a6d6-4668-8b8c-9e70f6c8e6a9","status":"active","verifiedEmail":true}
  ```

- **Failures/validation:** absent, expired, revoked, or security-version-stale session is the same
  `401 authentication_required`; request parameters/body are none and foreign context input is ignored
  as unsupported rather than authorizing access.
- **Semantics/privacy:** fresh idempotent/concurrency-safe read and no-write. Pagination and the
  application rate limit are none. Email value, credential, cookie/digest, company/product facts, and foreign identifiers are
  absent from body, cache, logs, traces, metrics, and audit.
- **Publication/compatibility/rollback:** retain OpenAPI `getCurrentAccount` and codegen/generated model;
  discovery is unchanged. Tenancy does not widen the response or require a company; rollback preserves it.
- **Scenario/proof:** `Preserve current account read while tenancy is enabled` maps to
  `specs/apps/ose/id-be/behaviours/account/account-sessions.feature`; Unit, Integration, and E2E prove
  session validation, current projection, cross-instance read, stable denial, and privacy.

  ```gherkin
  Scenario: Preserve current account read while tenancy is enabled
    Given tenancy is enabled and an active Person has a valid opaque session
    When the Person sends GET "/api/v1/account" without company context
    Then the response is the unchanged 200 current-Person summary
    And an absent, expired, revoked, or stale session returns authentication_required
    And replay and concurrency perform a fresh no-write read through any instance
    And email, credential, session secret, company, and product facts are not disclosed or logged
  ```

#### RETAIN `GET /api/v1/account-sessions`

- **Owner/caller/auth/context:** `ose-id-be`; authenticated active Person; no Company, tenant, scope,
  or audience.
- **Request/success:** session cookie plus optional correlation; no path/query/body/CSRF. The list is
  bounded by account session policy rather than client pagination:

  ```http
  GET /api/v1/account-sessions HTTP/1.1
  Host: 127.0.0.1:8501
  Cookie: ose_id_session=session_synthetic

  HTTP/1.1 200 OK
  Content-Type: application/json
  Cache-Control: no-store
  X-Correlation-ID: corr_synthetic_16

  {
    "sessions": [
      {
        "id": "91f6025b-b14a-4eb2-b915-eca860078f5e",
        "current": true,
        "createdAt": "2026-09-15T01:00:00Z",
        "lastSeenAt": "2026-09-15T01:15:00Z",
        "idleExpiresAt": "2026-09-15T02:15:00Z",
        "absoluteExpiresAt": "2026-09-16T01:00:00Z"
      }
    ]
  }
  ```

- **Failures/validation:** absent, expired, revoked, or stale session returns `401
authentication_required`; foreign-session distinctions and caller-selected filters are none.
- **Semantics/privacy:** fresh idempotent/concurrency-safe snapshot; no pagination or application rate
  limit. Only caller-owned summaries appear. Cookies/digests, email, credentials, foreign sessions,
  company/product facts, and total counts are absent from cache and observability.
- **Publication/compatibility/rollback:** retain `listAccountSessions` in `account.openapi.yaml` and
  codegen/generated model; discovery unchanged. Tenancy adds no context field and rollback preserves the list.
- **Scenario/proof:** `Preserve account session list while tenancy is enabled` maps to
  `specs/apps/ose/id-be/behaviours/account/account-sessions.feature`; Unit, Integration, and E2E prove
  ownership, lifecycle filtering, bounded list, cross-instance state, denial, and redaction.

  ```gherkin
  Scenario: Preserve account session list while tenancy is enabled
    Given tenancy is enabled and an active Person has multiple shared-store sessions
    When the Person sends GET "/api/v1/account-sessions" without company context
    Then the response is 200 with only that Person's unchanged bounded session summaries
    And an invalid session returns authentication_required without a foreign-session distinction
    And replay and concurrency observe current shared state without mutation or pagination
    And cookies, digests, email, foreign sessions, company, and product facts are not disclosed or logged
  ```

#### RETAIN `DELETE /api/v1/account-sessions/current`

- **Owner/caller/auth/context:** `ose-id-be`; authenticated active Person with matching CSRF; no
  Company, tenant, scope, or audience.
- **Request/success:** session and CSRF cookies, matching `X-CSRF-Token`, optional correlation; no
  path/query/body. Success is explicitly empty and expires both cookies:

  ```http
  DELETE /api/v1/account-sessions/current HTTP/1.1
  Host: 127.0.0.1:8501
  Cookie: ose_id_session=session_synthetic; ose_id_csrf=csrf_synthetic
  X-CSRF-Token: csrf_synthetic

  HTTP/1.1 204 No Content
  Cache-Control: no-store
  X-Correlation-ID: corr_synthetic_17
  Set-Cookie: ose_id_session=; Max-Age=0; HttpOnly; SameSite=Strict; Path=/
  Set-Cookie: ose_id_csrf=; Max-Age=0; SameSite=Strict; Path=/
  Content-Length: 0
  ```

- **Failures/validation:** absent/invalid session is `401 authentication_required`; absent/mismatched
  CSRF is `403 csrf_required`. Body/query input is not accepted; tenant context never changes ownership.
- **Semantics/privacy:** atomic and idempotent from the current session; replay/concurrency cannot
  reactivate it. No pagination or separate rate limit. Cookie/CSRF/digest, Person/company values, and
  foreign identifiers never enter bodies, cache, logs, traces, metrics, or audit.
- **Publication/compatibility/rollback:** retain OpenAPI `revokeCurrentAccountSession`; discovery and
  codegen unchanged. Tenancy and rollback preserve exact global-session revocation.
- **Scenario/proof:** `Preserve current session revocation while tenancy is enabled` maps to
  `specs/apps/ose/id-be/behaviours/account/account-sessions.feature`; Unit, Integration, and E2E prove
  terminal transition, CSRF pipeline, cookie expiry, replay, old-cookie rejection, and privacy.

  ```gherkin
  Scenario: Preserve current session revocation while tenancy is enabled
    Given tenancy is enabled and an active Person presents a valid session and matching CSRF
    When the Person deletes the current account session
    Then the response is an empty 204 and both protected cookies expire
    And missing authentication or CSRF returns only authentication_required or csrf_required
    And replay and concurrency cannot reactivate the session or affect a company
    And cookie, CSRF, digest, Person, and tenant values are not disclosed or logged
  ```

#### RETAIN `DELETE /api/v1/account-sessions/{sessionId}`

- **Owner/caller/auth/context:** `ose-id-be`; authenticated active Person with matching CSRF; path UUID
  must name an owned non-current session. No Company, tenant, scope, or audience.
- **Request/success:** UUID path, session/CSRF cookies, matching header, optional correlation, no query
  or body. Active and already-revoked owned sessions share the explicit empty success:

  ```http
  DELETE /api/v1/account-sessions/91f6025b-b14a-4eb2-b915-eca860078f5e HTTP/1.1
  Host: 127.0.0.1:8501
  Cookie: ose_id_session=session_synthetic; ose_id_csrf=csrf_synthetic
  X-CSRF-Token: csrf_synthetic

  HTTP/1.1 204 No Content
  Cache-Control: no-store
  X-Correlation-ID: corr_synthetic_18
  Content-Length: 0
  ```

- **Failures/validation:** malformed UUID is `400 invalid_request`; invalid session is `401
authentication_required`; CSRF failure is `403 csrf_required`; never-owned, foreign, or missing ID is
  `404 session_not_found` without distinction.
- **Semantics/privacy:** owned revocation is atomic/idempotent and concurrent calls converge; it cannot
  revoke/reactivate a foreign or current session. No pagination or separate rate limit. IDs, cookies,
  CSRF, digests, and tenant facts never enter cache or unsafe observability.
- **Publication/compatibility/rollback:** retain OpenAPI `revokeAccountSession` and codegen/generated path
  contract; discovery unchanged. Tenancy does not reinterpret ownership; rollback leaves revocation intact.
- **Scenario/proof:** `Preserve named session revocation while tenancy is enabled` maps to
  `specs/apps/ose/id-be/behaviours/account/account-sessions.feature`; Unit, Integration, and E2E prove
  UUID/ownership/CSRF validation, idempotency, foreign denial, other-cookie rejection, and redaction.

  ```gherkin
  Scenario: Preserve named session revocation while tenancy is enabled
    Given tenancy is enabled and an active Person owns a non-current account session
    When the Person deletes that session with valid authentication and CSRF
    Then the response is an empty 204 for active or already-revoked owned state
    And malformed, unauthenticated, CSRF-invalid, missing, or foreign input uses only the retained safe problem
    And replay and concurrency cannot affect a foreign or current session
    And identifiers, cookies, CSRF, digests, and tenant facts are not disclosed or logged
  ```

#### RETAIN `POST /api/v1/accounts/password-recovery-requests`

- **Owner/caller/auth/context:** `ose-id-be`; anonymous caller; no session, Person, Company, tenant,
  scope, or audience.
- **Request/success:** exact one-email JSON, optional correlation, no query/path/cookie/idempotency key.
  Every account state shares:

  ```http
  POST /api/v1/accounts/password-recovery-requests HTTP/1.1
  Host: 127.0.0.1:8501
  Content-Type: application/json

  {"email":"person@example.test"}

  HTTP/1.1 202 Accepted
  Content-Type: application/json
  Cache-Control: no-store
  X-Correlation-ID: corr_synthetic_19

  {"status":"accepted","correlationId":"corr_synthetic_19"}
  ```

- **Failures/validation:** malformed/oversized/extra input is `400 invalid_request`; shared exhaustion
  is `429 rate_limited` with `Retry-After`. No existence/status-specific response exists.
- **Semantics/privacy:** response-idempotent and replay-safe; cooldown/deduplication may suppress mail and concurrency
  cannot multiply current recovery capabilities. No pagination. Email/message/capability/account state,
  company facts, and limiter key never enter response, cache, logs, traces, metrics, or audit.
- **Publication/compatibility/rollback:** retain OpenAPI `requestPasswordRecovery`; discovery/codegen
  unchanged. Tenancy and rollback preserve Mailpit behavior and no-company semantics.
- **Scenario/proof:** `Preserve password recovery request while tenancy is enabled` maps to
  `specs/apps/ose/id-be/behaviours/account/enumeration-resistance.feature`; Unit, Integration, and E2E
  prove generic parity, validation, cooldown, shared limiting, Mailpit handoff, and redaction.

  ```gherkin
  Scenario: Preserve password recovery request while tenancy is enabled
    Given tenancy is enabled and an anonymous caller submits a syntactically valid email
    When the caller requests password recovery
    Then every account state receives the unchanged generic 202 response
    And invalid input or exhausted shared capacity returns only the retained 400 or 429 problem
    And retry, cooldown, and concurrency reveal no state and create at most one current capability
    And email, message, capability, account, and tenant values are not disclosed or logged
  ```

#### RETAIN `POST /api/v1/accounts/password-resets`

- **Owner/caller/auth/context:** `ose-id-be`; anonymous holder of a purpose-bound recovery capability;
  no session, Company, tenant, scope, or audience.
- **Request/success:** closed JSON capability/new-password, optional correlation, no query/path/cookie/
  idempotency key. Success is explicitly empty after password replacement and session invalidation:

  ```http
  POST /api/v1/accounts/password-resets HTTP/1.1
  Host: 127.0.0.1:8501
  Content-Type: application/json

  {"capability":"synthetic-capability","newPassword":"synthetic-new-secret"}

  HTTP/1.1 204 No Content
  Cache-Control: no-store
  X-Correlation-ID: corr_synthetic_20
  Content-Length: 0
  ```

- **Failures/validation:** password/shape/body policy is `400 invalid_request`; invalid,
  wrong-purpose/version, expired, replaced, consumed, or replayed capability is `400
capability_unavailable`; shared exhaustion is `429 rate_limited` with `Retry-After`.
- **Semantics/privacy:** one atomic winner increments security version once and invalidates every prior
  session before success; replay/concurrent losers share the safe problem. No pagination. Capability,
  password/hash, email, session/cookie, version, and tenant facts never appear in cache/observability.
- **Publication/compatibility/rollback:** retain OpenAPI `resetPassword` and codegen/generated schema;
  discovery unchanged. Tenancy neither scopes the reset to a company nor preserves old sessions;
  rollback cannot undo a completed reset.
- **Scenario/proof:** `Preserve password reset while tenancy is enabled` maps to
  `specs/apps/ose/id-be/behaviours/account/password-recovery.feature`; Unit, Integration, and E2E prove
  validation, one-winner consumption, version/session effects, replay errors, and redaction.

  ```gherkin
  Scenario: Preserve password reset while tenancy is enabled
    Given tenancy is enabled and an account has prior sessions and one current recovery capability
    When anonymous callers concurrently submit that capability with a valid new password
    Then exactly one response is an empty 204 and all prior sessions are invalid before it returns
    And invalid input, unavailable capability, or shared exhaustion uses only the retained safe problem
    And replay cannot change the password or security version again
    And capability, password, hash, email, session, version, and tenant values are not disclosed or logged
  ```

#### RETAIN `GET /connect/authorize`

- **Owner/caller/auth/context:** `ose-id-be`; anonymous browser/probe; no client, login, consent,
  scope, audience, Person, Company, or tenant authority.
- **Request/result:** optional correlation, bounded ignored query, no body/cookie. Exact exchange:

  ```http
  GET /connect/authorize?client_id=synthetic&response_type=code&scope=openid HTTP/1.1
  Host: 127.0.0.1:8501

  HTTP/1.1 404 Not Found
  Content-Type: application/problem+json
  Cache-Control: no-store
  X-Correlation-ID: corr_synthetic_22

  {"status":404,"code":"capability_disabled","title":"Capability is not available","correlationId":"corr_synthetic_22"}
  ```

- **Failures/validation:** `404 capability_disabled` is the sole owned result for bounded query; no
  redirect URI/client/scope validation or OAuth error redirect. Host-level oversize rejection occurs
  before the operation.
- **Semantics/privacy:** deterministic, idempotent, replay/concurrency-safe, and no-write. Pagination
  and the application rate limit are none; no `Location`/cookie. Query, account, company, provider, and secret values never log/cache.
- **Publication/compatibility/rollback:** retain OpenAPI `rejectDisabledOidcAuthorization` in the
  foundation contract; OIDC discovery/codegen still exposes no capability. Tenancy and rollback cannot enable it.
- **Scenario/proof:** `Preserve disabled OIDC authorization while tenancy is enabled` maps to the
  foundation disabled-capabilities feature; Unit, Integration, and E2E prove exact route/problem,
  no redirect/cookie, and no identity/tenant row.

  ```gherkin
  Scenario: Preserve disabled OIDC authorization while tenancy is enabled
    Given tenancy is enabled and OIDC authorization remains disabled
    When an anonymous caller requests the exact authorization route with bounded input
    Then the response is 404 capability_disabled without redirect or cookie
    And replay and concurrency create no authorization, identity, or tenant state
    And query, account, provider, company, and secret values are not disclosed or logged
  ```

#### RETAIN `POST /connect/token`

- **Owner/caller/auth/context:** `ose-id-be`; anonymous protocol probe; no client authentication,
  grant, scope, audience, Person, Company, or tenant authority.
- **Request/result:** optional correlation and bounded unparsed body. Exact exchange:

  ```http
  POST /connect/token HTTP/1.1
  Host: 127.0.0.1:8501
  Content-Type: application/x-www-form-urlencoded

  grant_type=authorization_code&code=synthetic

  HTTP/1.1 404 Not Found
  Content-Type: application/problem+json
  Cache-Control: no-store
  X-Correlation-ID: corr_synthetic_23

  {"status":404,"code":"capability_disabled","title":"Capability is not available","correlationId":"corr_synthetic_23"}
  ```

- **Failures/validation:** `404 capability_disabled` is the sole operation-owned result within the host
  bound. Grant/media/auth fields are not parsed; over-limit/unreadable transport fails before the operation.
- **Semantics/privacy:** deterministic no-write; replay/concurrency returns the same problem.
  Idempotency key, pagination, and application rate limit are none. Body, credentials, codes, token values,
  company facts, and secrets never log/cache/persist.
- **Publication/compatibility/rollback:** retain OpenAPI `rejectDisabledTokenIssuance`; discovery and codegen
  expose no token capability. Tenancy rollout/rollback preserve exact rejection.
- **Scenario/proof:** `Preserve disabled token issuance while tenancy is enabled` maps to the foundation
  disabled-capabilities feature; Unit, Integration, and E2E prove safe body handling and no token/row.

  ```gherkin
  Scenario: Preserve disabled token issuance while tenancy is enabled
    Given tenancy is enabled and token issuance remains disabled
    When an anonymous caller posts a bounded synthetic grant
    Then the response is 404 capability_disabled with no token field
    And replay and concurrency create no grant, session, consent, identity, or tenant state
    And request, credential, token, company, and secret values are not disclosed or logged
  ```

#### RETAIN `GET /external/google/challenge`

- **Owner/caller/auth/context:** `ose-id-be`; anonymous browser/probe; no provider, return target,
  session, scope, audience, Person, Company, or tenant authority.
- **Request/result:** optional correlation, bounded ignored query, no body/cookie. Exact exchange:

  ```http
  GET /external/google/challenge?returnUrl=%2F HTTP/1.1
  Host: 127.0.0.1:8501

  HTTP/1.1 404 Not Found
  Content-Type: application/problem+json
  Cache-Control: no-store
  X-Correlation-ID: corr_synthetic_24

  {"status":404,"code":"capability_disabled","title":"Capability is not available","correlationId":"corr_synthetic_24"}
  ```

- **Failures/validation:** every bounded query is `404 capability_disabled`; no return/provider input
  is validated/reflected and no provider error exists because no outbound call occurs.
- **Semantics/privacy:** deterministic, idempotent, replay/concurrency-safe, and no-write. Pagination
  and the application rate limit are none; no redirect/state/nonce/cookie. Provider/query/account/company values never log/cache.
- **Publication/compatibility/rollback:** retain OpenAPI `rejectDisabledGoogleSignIn`; discovery/codegen
  expose no Google provider. Tenancy and rollback preserve external-provider absence.
- **Scenario/proof:** `Preserve disabled Google challenge while tenancy is enabled` maps to the
  foundation disabled-capabilities feature; Unit, Integration, and E2E prove route, no redirect/cookie,
  and no provider/tenant row.

  ```gherkin
  Scenario: Preserve disabled Google challenge while tenancy is enabled
    Given tenancy is enabled and Google sign-in remains disabled
    When an anonymous caller requests the exact Google challenge route
    Then the response is 404 capability_disabled without redirect, state, nonce, or cookie
    And replay and concurrency create no provider, identity, or tenant state
    And query, provider, account, company, and secret values are not disclosed or logged
  ```

#### RETAIN `POST /scim/v2/Users`

- **Owner/caller/auth/context:** `ose-id-be`; unauthenticated provisioning probe; no bearer scheme,
  SCIM scope, provisioning authority, Person, Company, or tenant context.
- **Request/result:** optional correlation and bounded unparsed body. Exact exchange:

  ```http
  POST /scim/v2/Users HTTP/1.1
  Host: 127.0.0.1:8501
  Content-Type: application/scim+json

  {"userName":"person@example.test","active":true}

  HTTP/1.1 404 Not Found
  Content-Type: application/problem+json
  Cache-Control: no-store
  X-Correlation-ID: corr_synthetic_25

  {"status":404,"code":"capability_disabled","title":"Capability is not available","correlationId":"corr_synthetic_25"}
  ```

- **Failures/validation:** `404 capability_disabled` is the sole operation-owned result within the host
  bound. Bearer/media/schema fields are not parsed; over-limit transport fails before the operation and
  never produces a SCIM resource/error body.
- **Semantics/privacy:** deterministic no-write under retry/concurrency; no idempotency key,
  pagination, or application rate limit. Body, bearer, contact, identity, and tenant values never log/cache.
- **Publication/compatibility/rollback:** retain OpenAPI `rejectDisabledScimUserProvisioning`; SCIM discovery,
  schemas, and codegen remain absent. Tenancy and rollback keep provisioning disabled.
- **Scenario/proof:** `Preserve disabled SCIM provisioning while tenancy is enabled` maps to the
  foundation disabled-capabilities feature; Unit, Integration, and E2E prove no parser/authority/row.

  ```gherkin
  Scenario: Preserve disabled SCIM provisioning while tenancy is enabled
    Given tenancy is enabled and SCIM provisioning remains disabled
    When an unauthenticated caller posts a bounded SCIM user
    Then the response is 404 capability_disabled without a SCIM resource identifier
    And replay and concurrency create no Person, login, membership, company, or audit row
    And bearer, body, contact, tenant, and secret values are not disclosed or logged
  ```

#### RETAIN `GET /platform/admin/companies`

- **Owner/caller/auth/context:** `ose-id-be`; anonymous probe; no platform operator, scope, audience,
  impersonation, Person, Company, or tenant context.
- **Request/result:** optional correlation; no path/query/body/cookie. Exact exchange:

  ```http
  GET /platform/admin/companies HTTP/1.1
  Host: 127.0.0.1:8501

  HTTP/1.1 404 Not Found
  Content-Type: application/problem+json
  Cache-Control: no-store
  X-Correlation-ID: corr_synthetic_26

  {"status":404,"code":"capability_disabled","title":"Capability is not available","correlationId":"corr_synthetic_26"}
  ```

- **Failures/validation:** exact `404 capability_disabled`; authentication challenge, lookup, query,
  and alternate response are none. Adjacent unknown routes retain ordinary framework `404`.
- **Semantics/privacy:** deterministic idempotent no-write and replay/concurrency-safe. Pagination and
  the application rate limit are none. No company count/ID or operator fact; only route/result/timing/correlation logs.
- **Publication/compatibility/rollback:** retain OpenAPI `rejectDisabledPlatformAdministration`;
  discovery and codegen/generated admin clients remain absent. Tenant membership administration does not enable superadmin;
  rollback leaves the route disabled.
- **Scenario/proof:** `Preserve disabled platform administration while tenancy is enabled` maps to the
  foundation disabled-capabilities feature; Unit, Integration, and E2E prove exact dispatch and no data.

  ```gherkin
  Scenario: Preserve disabled platform administration while tenancy is enabled
    Given tenancy is enabled and platform administration remains disabled
    When an anonymous caller requests the exact platform administration route
    Then the response is 404 capability_disabled without a company fact
    And replay and concurrency create or change no identity, company, membership, or audit state
    And operator, account, tenant, and secret values are not disclosed or logged
  ```

#### Retained web status operation

- **Owner/caller/auth/context:** `ose-id-web`; anonymous local browser; no account, authorization,
  scope, audience, Person, Company, or tenant context.
- **Request/success:** optional correlation; no query/body/cookie. Representative success:

  ```http
  GET / HTTP/1.1
  Host: 127.0.0.1:3500
  Accept: text/html

  HTTP/1.1 200 OK
  Content-Type: text/html; charset=utf-8
  Cache-Control: no-cache
  X-Correlation-ID: corr_synthetic_27

  <!doctype html><html lang="en"><body><h1>OSE ID service status</h1><section aria-label="Service status">Backend ready</section></body></html>
  ```

- **Failures/validation:** backend-status unavailability is the retained sanitized `503` page;
  unhandled render failure is sanitized framework `500`; no stack, backend host, machine path, cookie,
  identity, or tenant field. Unsupported runtime binds no listener.
- **Semantics/privacy:** idempotent, replay/concurrency-safe, and no-write. Pagination and the
  application rate limit are none; no identity cookie or login/provider/company/admin control. Only safe route/status/timing/correlation logs.
- **Publication/compatibility/rollback:** backend OpenAPI, OIDC discovery, and codegen are none; id-web
  status spec remains authoritative. Tenancy and rollback retain exact identity-free shell.
- **Scenario/proof:** `Preserve the identity-free status shell while tenancy is enabled` maps to
  `specs/apps/ose/id-web/behaviours/foundation/status-shell.feature`; component Unit, server Integration,
  and browser E2E prove success, sanitized failures, accessibility, responsiveness, and privacy.

  ```gherkin
  Scenario: Preserve the identity-free status shell while tenancy is enabled
    Given tenancy is enabled and the local web listener is running
    When an anonymous browser sends GET "/" to ose-id-web
    Then success is accessible 200 HTML with no-cache and no session cookie
    And dependency or render failure produces only the retained sanitized 503 or 500 page
    And replay and concurrency create no identity or tenant state
    And contact, company, provider, secret, host, stack, and machine-path values are absent
  ```

#### RETAIN backend startup guard

- **Owner/caller/auth/context:** `ose-id-be` entry point invoked by local runner/test harness; no HTTP
  principal, scope, audience, Person, Company, or tenant exists before listener binding.
- **Input/result:** process runtime mode and port; no HTTP headers, parameters, media type, or body.

  ```text
  input.runtimeMode=Production
  result.exitCode=non-zero
  result.code=runtime_mode_disabled
  result.listener=not-bound
  ```

- **Failures/validation:** missing, unknown, Production, Staging, or production-like mode fails before
  database/RLS/migration/socket use. Invalid Local/Test configuration fails through sanitized diagnostics.
- **Semantics/privacy:** deterministic/replay/concurrency-safe; no write, pagination, idempotency key,
  rate limit, cache, or HTTP response. Config, connection, secret, stack, and path values never log.
- **Publication/compatibility/rollback:** OpenAPI, discovery, schema, and codegen are none. Tenancy and
  rollback retain the exact pre-listener guard.
- **Scenario/proof:** `Preserve backend runtime guard while tenancy is enabled` maps to
  `specs/apps/ose/id-be/behaviours/foundation/runtime-mode.feature`; Unit, Integration, and E2E prove
  mode decision, host exit, unbound port, and no identity/tenant row.

  ```gherkin
  Scenario: Preserve backend runtime guard while tenancy is enabled
    Given tenancy is enabled and ose-id-be uses an unsupported runtime mode
    When the backend process starts
    Then it exits non-zero with code "runtime_mode_disabled" before listener, database, or RLS use
    And replay and concurrency create no process-local or shared state
    And configuration, connection, secret, stack, and absolute-path values are not logged
  ```

#### RETAIN web startup guard

- **Owner/caller/auth/context:** `ose-id-web` entry point invoked by local runner/test harness; no HTTP
  principal, scope, audience, Person, Company, or tenant exists before listener binding.
- **Input/result:** process runtime mode and port; no HTTP request or schema.

  ```text
  input.runtimeMode=Production
  result.exitCode=non-zero
  result.code=runtime_mode_disabled
  result.listener=not-bound
  ```

- **Failures/validation:** missing, unknown, Production, Staging, or production-like mode fails before
  socket bind/backend fetch. Invalid Local/Test config fails through sanitized diagnostics.
- **Semantics/privacy:** deterministic/replay/concurrency-safe; no write, pagination, idempotency key,
  rate limit, cache, cookie, or HTTP response. Config, secret, stack, and path values never log.
- **Publication/compatibility/rollback:** backend OpenAPI, discovery, schema, and codegen are none.
  Tenancy and rollback retain the exact pre-listener guard.
- **Scenario/proof:** `Preserve web runtime guard while tenancy is enabled` maps to
  `specs/apps/ose/id-web/behaviours/foundation/runtime-mode.feature`; Unit, Integration, and E2E prove
  config decision, Next exit, unbound port, and no cookie.

  ```gherkin
  Scenario: Preserve web runtime guard while tenancy is enabled
    Given tenancy is enabled and ose-id-web uses an unsupported runtime mode
    When the web process starts
    Then it exits non-zero with code "runtime_mode_disabled" before listener binding
    And replay and concurrency create no browser or server-side identity state
    And configuration, secret, stack, and absolute-path values are not logged
  ```

The backend/web runtime guards are RETAINED pre-listener behavior and therefore have no method/path.
`/platform/admin/companies` remains disabled: tenant-bound membership administration does not create a
platform-operator API.

- Public company creation, product registration, personal-entitlement administration, cross-company
  search, impersonation, support override, and test fixture/bootstrap HTTP endpoints are **none**.
  Deterministic E2E setup remains an out-of-process test command, not an API exception.

## Copy-Ready API Contract Scenarios

These app-scoped packets are merged into the named durable feature files. Every scenario has exactly
one Unit, one Integration, and one backend E2E binding; no adapter exemption applies. The operation
inventory maps one action row to one exact method/path or non-HTTP startup guard.

| Action and operation                                                        | Exact target                                                               | Full scenario mapping                                                             |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| ADD `GET /api/v1/account/contexts`                                          | `specs/apps/ose/id-be/behaviours/tenancy/multi-company-context.feature`    | List current eligible authorization contexts safely                               |
| ADD `POST /api/v1/account/context-selections`                               | `specs/apps/ose/id-be/behaviours/tenancy/multi-company-context.feature`    | Select one current authorization context safely                                   |
| ADD `GET /api/v1/companies/{companyId}/members`                             | `specs/apps/ose/id-be/behaviours/tenancy/membership-admin.feature`         | Filter and page recognizable members within one company                           |
| ADD `PATCH /api/v1/companies/{companyId}/members/{membershipId}`            | `specs/apps/ose/id-be/behaviours/tenancy/membership-admin.feature`         | Change a membership without crossing tenant or concurrency boundaries             |
| ADD `POST /api/v1/companies/{companyId}/members/{membershipId}/leave`       | `specs/apps/ose/id-be/behaviours/tenancy/membership-admin.feature`         | Leave one owned company membership safely                                         |
| ADD `GET /api/v1/companies/{companyId}/invitations`                         | `specs/apps/ose/id-be/behaviours/tenancy/invitations.feature`              | Complete an authorized invitation operation — list row                            |
| ADD `POST /api/v1/companies/{companyId}/invitations`                        | `specs/apps/ose/id-be/behaviours/tenancy/invitations.feature`              | Complete an authorized invitation operation — create row                          |
| ADD `POST /api/v1/companies/{companyId}/invitations/{invitationId}/resends` | `specs/apps/ose/id-be/behaviours/tenancy/invitations.feature`              | Complete an authorized invitation operation — resend row                          |
| ADD `DELETE /api/v1/companies/{companyId}/invitations/{invitationId}`       | `specs/apps/ose/id-be/behaviours/tenancy/invitations.feature`              | Complete an authorized invitation operation — revoke row                          |
| ADD `POST /api/v1/companies/{companyId}/invitation-acceptances`             | `specs/apps/ose/id-be/behaviours/tenancy/invitations.feature`              | Complete an authorized invitation operation — accept row                          |
| ADD `GET /api/v1/companies/{companyId}/entitlements`                        | `specs/apps/ose/id-be/behaviours/tenancy/product-entitlements.feature`     | Complete a company entitlement operation — list row                               |
| ADD `PUT /api/v1/companies/{companyId}/entitlements/{productKey}`           | `specs/apps/ose/id-be/behaviours/tenancy/product-entitlements.feature`     | Complete a company entitlement operation — grant row                              |
| ADD `DELETE /api/v1/companies/{companyId}/entitlements/{productKey}`        | `specs/apps/ose/id-be/behaviours/tenancy/product-entitlements.feature`     | Complete a company entitlement operation — revoke row                             |
| UPDATE `GET /health/ready`                                                  | `specs/apps/ose/id-be/behaviours/foundation/health.feature`                | Report tenancy-schema and RLS-policy readiness without changing the wire contract |
| DELETE                                                                      | none                                                                       | No operation is removed                                                           |
| RETAIN `POST /api/v1/accounts/registrations`                                | `specs/apps/ose/id-be/behaviours/account/registration.feature`             | Preserve registration while tenancy is enabled                                    |
| RETAIN `POST /api/v1/accounts/email-verification-requests`                  | `specs/apps/ose/id-be/behaviours/account/enumeration-resistance.feature`   | Preserve verification request while tenancy is enabled                            |
| RETAIN `POST /api/v1/accounts/email-verifications`                          | `specs/apps/ose/id-be/behaviours/account/verification.feature`             | Preserve email verification while tenancy is enabled                              |
| RETAIN `POST /api/v1/account-sessions`                                      | `specs/apps/ose/id-be/behaviours/account/password-sign-in.feature`         | Preserve password sign-in while tenancy is enabled                                |
| RETAIN `GET /api/v1/account`                                                | `specs/apps/ose/id-be/behaviours/account/account-sessions.feature`         | Preserve current account read while tenancy is enabled                            |
| RETAIN `GET /api/v1/account-sessions`                                       | `specs/apps/ose/id-be/behaviours/account/account-sessions.feature`         | Preserve account session list while tenancy is enabled                            |
| RETAIN `DELETE /api/v1/account-sessions/current`                            | `specs/apps/ose/id-be/behaviours/account/account-sessions.feature`         | Preserve current session revocation while tenancy is enabled                      |
| RETAIN `DELETE /api/v1/account-sessions/{sessionId}`                        | `specs/apps/ose/id-be/behaviours/account/account-sessions.feature`         | Preserve named session revocation while tenancy is enabled                        |
| RETAIN `POST /api/v1/accounts/password-recovery-requests`                   | `specs/apps/ose/id-be/behaviours/account/enumeration-resistance.feature`   | Preserve password recovery request while tenancy is enabled                       |
| RETAIN `POST /api/v1/accounts/password-resets`                              | `specs/apps/ose/id-be/behaviours/account/password-recovery.feature`        | Preserve password reset while tenancy is enabled                                  |
| RETAIN `GET /health/live`                                                   | `specs/apps/ose/id-be/behaviours/foundation/health.feature`                | Preserve process-only liveness while tenancy is enabled                           |
| RETAIN `GET /connect/authorize`                                             | `specs/apps/ose/id-be/behaviours/foundation/disabled-capabilities.feature` | Preserve disabled OIDC authorization while tenancy is enabled                     |
| RETAIN `POST /connect/token`                                                | `specs/apps/ose/id-be/behaviours/foundation/disabled-capabilities.feature` | Preserve disabled token issuance while tenancy is enabled                         |
| RETAIN `GET /external/google/challenge`                                     | `specs/apps/ose/id-be/behaviours/foundation/disabled-capabilities.feature` | Preserve disabled Google challenge while tenancy is enabled                       |
| RETAIN `POST /scim/v2/Users`                                                | `specs/apps/ose/id-be/behaviours/foundation/disabled-capabilities.feature` | Preserve disabled SCIM provisioning while tenancy is enabled                      |
| RETAIN `GET /platform/admin/companies`                                      | `specs/apps/ose/id-be/behaviours/foundation/disabled-capabilities.feature` | Preserve disabled platform administration while tenancy is enabled                |
| RETAIN web `GET /`                                                          | `specs/apps/ose/id-web/behaviours/foundation/status-shell.feature`         | Preserve the identity-free status shell while tenancy is enabled                  |
| RETAIN backend startup guard                                                | `specs/apps/ose/id-be/behaviours/foundation/runtime-mode.feature`          | Preserve backend runtime guard while tenancy is enabled                           |
| RETAIN web startup guard                                                    | `specs/apps/ose/id-web/behaviours/foundation/runtime-mode.feature`         | Preserve web runtime guard while tenancy is enabled                               |

### Authorization-context contract

```gherkin
Feature: Personal and company authorization-context API contract
  An authenticated Person receives only current eligible single-scope contexts.

  Rule: Context listing and selection derive authorization from current shared state

    Scenario: List current eligible authorization contexts safely
      Given an active Person has personal eligibility and memberships in Company A and Company B
      When the Person sends GET "/api/v1/account/contexts?productKey=ose-lms"
      Then the response is 200 with separate current personal, Company A, and Company B contexts
      And no context combines companies or contains a product role, invitation, credential, or session secret
      And a repeated or concurrent read re-evaluates current state without mutation or instance affinity
      And omitting authentication returns 401 with code "authentication_required"
      And an invalid request or unknown product returns only "invalid_request" or "product_not_found"

    Scenario: Select one current authorization context safely
      Given an active Person is currently eligible for Company A in product "ose-lms"
      When the Person sends POST "/api/v1/account/context-selections" with valid CSRF and Company A selection
      Then the response is 200 with exactly one current Company A context and authorization version
      And replay or concurrency re-evaluates eligibility without storing process-local selection state
      And missing authentication or CSRF returns only "authentication_required" or "csrf_required"
      And invalid, ineligible, revoked, or foreign selection returns only the documented safe 400, 403, or 404 problem
      And no product role, foreign company fact, session value, or selection input is logged or cached
```

### Membership-directory and mutation contract

```gherkin
Feature: Company membership API contract
  A current company administrator can identify and manage only that company's memberships.

  Rule: Member reads and writes bind tenant, ownership, concurrency, and privacy

    Scenario: Filter and page recognizable members within one company
      Given an active MembershipAdmin in Company A and matching members in Companies A and B
      When the admin sends GET "/api/v1/companies/{companyAId}/members?query=member%40&limit=1" and follows each cursor
      Then every response is 200 and contains only matching Company A members
      And rows are ordered by normalized email then Membership ID
      And every cursor is bound to Company A, the normalized query, ordering version, and last tuple
      And changing the company, query, order, cursor, or limit outside its bounds returns only the documented safe 400, 403, or 404 problem
      And verified contact email appears only in the authorized response and never in logs, traces, metrics, or audit

    Scenario: Change a membership without crossing tenant or concurrency boundaries
      Given an active MembershipAdmin in Company A targets a current Company A membership version
      When the admin sends PATCH "/api/v1/companies/{companyAId}/members/{membershipId}" with valid CSRF and a legal change
      Then the response is 200 with the updated recognizable MembershipSummary and next row version
      And concurrent stale mutation returns 409 with code "concurrency_conflict"
      And removing the last active administrator returns 409 with code "administrator_transfer_required"
      And missing authentication, CSRF, authority, or tenant ownership returns only the documented safe 401, 403, or 404 problem
      And no foreign contact, provider subject, login identifier, credential, session, or request secret is returned or logged

    Scenario: Leave one owned company membership safely
      Given a Person owns active memberships in Company A and Company B with current row versions
      When the Person sends POST "/api/v1/companies/{companyAId}/members/{membershipAId}/leave" with valid CSRF
      Then the response is 204 and only the Company A membership becomes left
      And replay, stale concurrency, another Person's identifier, or a final-admin transition returns only the documented safe 403, 404, or 409 problem
      And Company B, foreign contact data, cookies, CSRF values, and row versions are absent from response and logs
```

### Invitation contract

```gherkin
Feature: Company invitation API contract
  Company invitation administration is tenant-bound and capability consumption is atomic.

  Rule: Every invitation operation has a closed success and failure contract

    Scenario Outline: Complete an authorized invitation operation
      Given <caller> has the documented current Company A context and eligible invitation state
      When the caller sends <method> <path> with valid required headers and body
      Then the response is <status> with <safe result>
      And replay and concurrency enforce <replay guarantee>
      And the response contains no capability, provider subject, login identifier, credential, session, foreign tenant fact, or product role
      And recipient email appears only for an authorized Company A administrator and never in logs, traces, metrics, or audit

      Examples:
        | caller                     | method | path                                                                    | status | safe result             | replay guarantee                    |
        | MembershipAdmin            | GET    | /api/v1/companies/{companyAId}/invitations                              | 200    | bounded invitation list | fresh idempotent tenant-local read  |
        | MembershipAdmin            | POST   | /api/v1/companies/{companyAId}/invitations                              | 201    | invitation summary      | same key and digest returns original |
        | MembershipAdmin            | POST   | /api/v1/companies/{companyAId}/invitations/{invitationId}/resends       | 202    | invitation summary      | one replacement capability          |
        | MembershipAdmin            | DELETE | /api/v1/companies/{companyAId}/invitations/{invitationId}                | 204    | empty body              | terminal revoke is idempotent        |
        | verified invited Person    | POST   | /api/v1/companies/{companyAId}/invitation-acceptances                    | 204    | empty body              | exactly one Membership is created    |

    Scenario Outline: Reject an unsafe invitation operation without disclosure
      Given <failure condition> applies to Company A invitation operation <method> <path>
      When the operation is requested
      Then the response uses status <status> and code <code>
      And no invitation, membership, notification, or audit state is partially changed
      And request email, capability, idempotency key, cookie, CSRF value, and foreign tenant data are absent from response and logs

      Examples:
        | method | path                                                               | failure condition             | status | code                           |
        | GET    | /api/v1/companies/{companyId}/invitations                         | authority is missing          | 403    | insufficient_company_authority |
        | POST   | /api/v1/companies/{companyId}/invitations                         | idempotency key changes body  | 409    | idempotency_conflict           |
        | POST   | /api/v1/companies/{companyId}/invitations/{invitationId}/resends  | invitation is terminal        | 409    | invitation_terminal            |
        | DELETE | /api/v1/companies/{companyId}/invitations/{invitationId}           | invitation is foreign         | 404    | tenant_resource_not_found      |
        | POST   | /api/v1/companies/{companyId}/invitation-acceptances               | capability is unusable        | 400    | capability_unavailable         |
        | POST   | /api/v1/companies/{companyId}/invitation-acceptances               | shared rate bucket exhausted  | 429    | rate_limited                   |
```

### Company-entitlement contract

```gherkin
Feature: Company product-entry entitlement API contract
  OSE ID manages company product entry without owning product-domain roles.

  Rule: Entitlement operations are current-company-only and terminally idempotent

    Scenario Outline: Complete a company entitlement operation
      Given an active MembershipAdmin acts in Company A with <initial state>
      When the admin sends <method> <path> with valid authentication and CSRF when required
      Then the response is <status> with <safe result>
      And retry and concurrency enforce <idempotency guarantee>
      And no learner, instructor, course, product permission, foreign company fact, cookie, or CSRF value is returned or logged

      Examples:
        | method | path                                                               | initial state          | status | safe result              | idempotency guarantee       |
        | GET    | /api/v1/companies/{companyAId}/entitlements                       | active LMS entitlement | 200    | bounded entitlement list | fresh tenant-local read     |
        | PUT    | /api/v1/companies/{companyAId}/entitlements/ose-lms               | no relationship         | 204    | empty body               | one active relationship     |
        | DELETE | /api/v1/companies/{companyAId}/entitlements/ose-lms               | active relationship     | 204    | empty body               | terminal revoke             |

    Scenario Outline: Reject an unsafe company entitlement operation
      Given <failure condition> applies to Company A entitlement operation <method> <path>
      When the operation is requested
      Then the response uses status <status> and code <code>
      And no entitlement or authorization version is partially changed
      And no product role, foreign tenant fact, request value, cookie, or CSRF value is returned or logged

      Examples:
        | method | path                                                         | failure condition           | status | code                           |
        | GET    | /api/v1/companies/{companyId}/entitlements                   | authority is missing        | 403    | insufficient_company_authority |
        | PUT    | /api/v1/companies/{companyId}/entitlements/{productKey}      | relationship was revoked    | 409    | entitlement_terminal           |
        | DELETE | /api/v1/companies/{companyId}/entitlements/{productKey}      | relationship is foreign     | 404    | tenant_resource_not_found      |
```

### Readiness wire compatibility — AC-FND-02 and AC-TEN-08

```gherkin
Feature: Tenancy-era readiness API contract
  Readiness includes additive tenancy schema and RLS policy compatibility without changing its wire format.

  Scenario Outline: Report tenancy-schema and RLS-policy readiness without changing the wire contract
    Given the backend has <tenancy persistence state>
    When an anonymous caller sends GET "/health/ready" without user or tenant context
    Then the response status is <status> with <result>
    And repeated or concurrent requests perform a fresh no-write check
    And no table, policy, role, connection, secret, contact email, or absolute path is returned or logged

    Examples:
      | tenancy persistence state        | status | result              |
      | schema and policy catalog valid  | 200    | ready               |
      | migration or policy incompatible | 503   | schema_incompatible |
```

## OpenAPI and Code Generation

Add the machine-readable OpenAPI 3.1.0 tenancy source at
`specs/apps/ose/id-be/contracts/tenancy.openapi.yaml` with all thirteen operations, closed schemas,
headers, cursor bounds, cookie/CSRF security, exact status/problem codes, the authorized
`verifiedEmailAddress`/`recipientEmail` fields, and explicit exclusion of provider/login/credential/session/
capability and product-role fields. `listCompanyMembers` declares the optional normalized literal-prefix
`query`, `limit`, and opaque `cursor`, including cursor-binding validation and deterministic order.
Operation IDs use durable names such as `listAuthorizationContexts`, `changeMembership`,
`acceptCompanyInvitation`, and `revokeCompanyEntitlement`; no plan ID appears. Compose it with the exact
retained OpenAPI 3.1.0 sources `specs/apps/ose/id-be/contracts/openapi.yaml` and
`specs/apps/ose/id-be/contracts/account.openapi.yaml`; fail validation on a duplicate method/path,
schema, or operation ID. These three machine-readable files, not prose or Gherkin alone, are the API
Quality Gate contract inputs.

Run repository OpenAPI validation/code generation. Generated transport types stay inside the exact
owner-configured project path, do not become framework/domain entities, and preserve personal/company
discrimination and nullable fields. Any unexpected generated path stops for file-ledger reconciliation.

## Compatibility, Rollback, and Forward Repair

All new paths and schema objects are additive. Account-only clients continue using unchanged account
operations. New tenancy code against an old schema returns readiness `503 schema_incompatible` and
serves no tenancy route. Rolling code back retains company data/RLS and removes tenancy routes; old code
ignores the additive schema. Clients treat route absence as unavailable and never infer authorization
from cached contexts. Fix contract/isolation defects forward with compatible additions or a reviewed
`/api/v2` break; never weaken RLS, tenant-safe errors, or last-admin/capability concurrency semantics.

## Unit, Integration, and E2E Proof

| Contract concern                        | Unit obligation                                           | Integration obligation                              | E2E obligation                                                            |
| --------------------------------------- | --------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------- |
| Personal/company context discrimination | Eligibility and nullability matrix                        | Endpoint/repository composition                     | Built API with companyless and multi-company Persons                      |
| Tenant member directory and mutation    | Contact allowlist, authority, non-disclosure, concurrency | ASP.NET + joined SqlKata/Npgsql transaction mapping | Recognizable own members; foreign/private/log denial; last-admin races    |
| Invitation directory and lifecycle      | Recipient allowlist, capability/idempotency/state machine | Notification + SqlKata/Npgsql atomic composition    | Create/list/resend/revoke/accept with response/log scans and Mailpit      |
| Entitlement boundary                    | Entry-only schema and terminal lifecycle                  | Repository/serialization mapping                    | Real company entitlement and forbidden product-role scan                  |
| RLS and pooled context                  | Exact operation/context policy matrix                     | Npgsql transaction/pool wiring                      | Real non-bypass role across every table, operation, and reused connection |
| Multi-instance revocation               | Version/current-state decisions                           | Two hosts on one controlled store                   | List on one instance, mutate/select on another, then stop one             |

Every added/updated/retained behavior has Unit, Integration, and E2E proof with no exemption. Static
adapter-map validation binds each durable scenario exactly once per layer.
