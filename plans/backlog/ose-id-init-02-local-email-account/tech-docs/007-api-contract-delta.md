# OSE ID Local Account API Contract Delta

## Operation Index and Traceability

Requirement IDs remain only in this plan mapping and never enter paths, operation IDs, schemas, or
executable behavior names.

| Action | Plan traceability | Durable API operation                                                                                 |
| ------ | ----------------- | ----------------------------------------------------------------------------------------------------- |
| ADD    | AC-ACC-01         | [`POST /api/v1/accounts/registrations`](#post-apiv1accountsregistrations)                             |
| ADD    | AC-ACC-04         | [`POST /api/v1/accounts/email-verification-requests`](#post-apiv1accountsemail-verification-requests) |
| ADD    | AC-ACC-02         | [`POST /api/v1/accounts/email-verifications`](#post-apiv1accountsemail-verifications)                 |
| ADD    | AC-ACC-03         | [`POST /api/v1/account-sessions`](#post-apiv1account-sessions)                                        |
| ADD    | AC-ACC-07         | [`GET /api/v1/account`](#get-apiv1account)                                                            |
| ADD    | AC-ACC-06         | [`GET /api/v1/account-sessions`](#get-apiv1account-sessions)                                          |
| ADD    | AC-ACC-06         | [`DELETE /api/v1/account-sessions/current`](#delete-apiv1account-sessionscurrent)                     |
| ADD    | AC-ACC-06         | [`DELETE /api/v1/account-sessions/{sessionId}`](#delete-apiv1account-sessionssessionid)               |
| ADD    | AC-ACC-04         | [`POST /api/v1/accounts/password-recovery-requests`](#post-apiv1accountspassword-recovery-requests)   |
| ADD    | AC-ACC-05         | [`POST /api/v1/accounts/password-resets`](#post-apiv1accountspassword-resets)                         |
| UPDATE | AC-FND-02         | [`GET /health/ready` adds account-schema compatibility](#updated-operation-packet-get-healthready)    |
| RETAIN | AC-FND-02         | [`GET /health/live`](#retain-get-healthlive)                                                          |
| RETAIN | AC-FND-06         | [`GET /connect/authorize`](#retain-get-connectauthorize)                                              |
| RETAIN | AC-FND-06         | [`POST /connect/token`](#retain-post-connecttoken)                                                    |
| RETAIN | AC-FND-06         | [`GET /external/google/challenge`](#retain-get-externalgooglechallenge)                               |
| RETAIN | AC-FND-06         | [`POST /scim/v2/Users`](#retain-post-scimv2users)                                                     |
| RETAIN | AC-FND-06         | [`GET /platform/admin/companies`](#retain-get-platformadmincompanies)                                 |
| RETAIN | AC-FND-07         | [`GET /` on `ose-id-web`](#retained-web-status-operation)                                             |
| RETAIN | AC-FND-04-BE      | [Backend startup guard; no HTTP operation](#retain-backend-startup-guard)                             |
| RETAIN | AC-FND-04-WEB     | [Web startup guard; no HTTP operation](#retain-web-startup-guard)                                     |

## Shared Transport and Security Contract

- Base URL is `http://127.0.0.1:8501`; every route starts with `/api/v1` except retained health and
  disabled-capability routes.
- Requests/responses use JSON and `Cache-Control: no-store`. Success and problem responses carry
  `X-Correlation-ID`. A problem contains `status`, `code`, `title`, and `correlationId`; the optional
  `errors` member appears only for syntactic or policy validation. Representative problem payloads live
  in the applicable operation packets below rather than in inline JSON.
- Public email actions normalize server-side and never return Person, email-login, capability, or
  session identifiers. `errors` appears only for syntactic/policy validation and never account state.
- Authentication uses the opaque `ose_id_session` cookie backed by PostgreSQL. Authenticated mutations
  also require the matching `X-CSRF-Token` from the rotating `ose_id_csrf` double-submit cookie; both
  cookies are `SameSite=Strict`, path `/`, and excluded from logs/evidence. The session cookie is
  `HttpOnly`; production transport remains disabled rather than weakening cookie policy.
- No route accepts or derives a Company/tenant context. Every successful account belongs to a global
  Person and creates no Company or Membership.
- Bodies are bounded before JSON parsing. Passwords, capabilities, cookies, CSRF values, and raw email
  are never echoed, logged, audited, traced, or emitted as metric labels.

## ADD Operation Index

| Method and path                                     | Caller / authentication     | Request                  | Success                                          | Safe errors                                                                                        |
| --------------------------------------------------- | --------------------------- | ------------------------ | ------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `POST /api/v1/accounts/registrations`               | Anonymous                   | `RegisterAccountRequest` | `202 GenericAccepted`                            | `400 invalid_request`, `429 rate_limited`                                                          |
| `POST /api/v1/accounts/email-verification-requests` | Anonymous                   | `EmailActionRequest`     | `202 GenericAccepted`                            | `400 invalid_request`, `429 rate_limited`                                                          |
| `POST /api/v1/accounts/email-verifications`         | Anonymous capability holder | `CapabilityRequest`      | `204`                                            | `400 capability_unavailable`, `429 rate_limited`                                                   |
| `POST /api/v1/account-sessions`                     | Anonymous                   | `PasswordSignInRequest`  | `201 AccountSessionCreated` plus rotated cookies | `400 invalid_request`, `401 invalid_credentials`, `429 rate_limited`                               |
| `GET /api/v1/account`                               | Authenticated Person        | none                     | `200 CurrentAccount`                             | `401 authentication_required`                                                                      |
| `GET /api/v1/account-sessions`                      | Authenticated Person        | none                     | `200 AccountSessionList`                         | `401 authentication_required`                                                                      |
| `DELETE /api/v1/account-sessions/current`           | Authenticated Person + CSRF | none                     | `204` and expired cookies                        | `401 authentication_required`, `403 csrf_required`                                                 |
| `DELETE /api/v1/account-sessions/{sessionId}`       | Authenticated Person + CSRF | path UUID                | `204`                                            | `400 invalid_request`, `401 authentication_required`, `403 csrf_required`, `404 session_not_found` |
| `POST /api/v1/accounts/password-recovery-requests`  | Anonymous                   | `EmailActionRequest`     | `202 GenericAccepted`                            | `400 invalid_request`, `429 rate_limited`                                                          |
| `POST /api/v1/accounts/password-resets`             | Anonymous capability holder | `ResetPasswordRequest`   | `204`                                            | `400 capability_unavailable` or `invalid_request`, `429 rate_limited`                              |

## Per-Operation Contract Packets

### `POST /api/v1/accounts/registrations`

- **Caller/auth/context:** anonymous; no cookie, authorization, or tenant/company context.
- **Request:** required `Content-Type`, optional correlation header, no query/path/idempotency header,
  and:

  ```json
  {
    "email": "person@example.test",
    "password": "<secret>"
  }
  ```

- **Success:** `202`, no-store/correlation headers, and the same body for new and existing states:

  ```json
  {
    "status": "accepted",
    "correlationId": "<opaque>"
  }
  ```

- **Problems/validation:** `400 invalid_request` for malformed/oversized email, missing/over-limit password,
  extra fields, media/body limits; `429 rate_limited` plus integer `Retry-After`.
- **Semantics/privacy:** response-idempotent; uniqueness races collapse to the generic result; shared rate
  bucket; raw email/password absent from logs. No pagination.
- **Discovery/proof:** OpenAPI `registerAccount`; the [registration contract](#registration-contract)
  scenarios “Accept registration generically” and “Reject invalid or over-limit registration safely”
  target `specs/apps/ose/id-be/behaviours/account/registration.feature`. Unit proves policy and
  normalization, Integration proves endpoint/Identity-primitives/query-builder behavior, and E2E proves PostgreSQL/Mailpit
  behavior plus no-company creation.

### `POST /api/v1/accounts/email-verification-requests`

- **Caller/auth/context:** anonymous with no tenant context.
- **Request:** required JSON content type, optional correlation header, no cookie/query/idempotency key,
  and:

  ```json
  {
    "email": "person@example.test"
  }
  ```

- **Success:** the exact response for unknown/pending/verified/suspended/deleted:

  ```http
  HTTP/1.1 202 Accepted
  Content-Type: application/json
  Cache-Control: no-store

  { "accepted": true }
  ```

- **Problems/validation:** `400 invalid_request` for malformed/oversized/extra input; `429 rate_limited`
  with `Retry-After`. Account state never changes a public code.
- **Semantics/privacy:** response-idempotent; cooldown may suppress duplicate mail; concurrent requests
  cannot multiply active capabilities; email/message absent from logs. No pagination.
- **Discovery/proof:** OpenAPI `requestEmailVerification`; the
  [public email-action contract](#public-email-action-contract) scenario outlines “Accept a public email
  action without account disclosure” and “Reject an invalid public email action safely”, restricted to
  their verification-request rows, target
  `specs/apps/ose/id-be/behaviours/account/enumeration-resistance.feature`. Unit proves generic policy,
  Integration proves notification composition, and E2E proves known/unknown Mailpit equivalence.

### `POST /api/v1/accounts/email-verifications`

- **Caller/auth/context:** anonymous holder of a purpose-bound capability; no tenant.
- **Request:** required JSON content type, optional correlation header, no cookie/query/idempotency key,
  and:

  ```json
  {
    "capability": "<secret>"
  }
  ```

- **Success:** `204` with no-store/correlation headers and empty body.
- **Problems/validation:** `400 invalid_request` for shape/body limits; `400 capability_unavailable` for
  invalid, wrong-purpose/version, expired, consumed, or replaced value; `429 rate_limited`.
- **Semantics/privacy:** one atomic winner; replay/concurrent losers share the safe problem; capability
  never logged/echoed, no pagination.
- **Discovery/proof:** OpenAPI `verifyEmail`; the [verification contract](#verification-contract)
  scenarios “Verify email exactly once” and “Reject an unavailable verification capability uniformly”
  target `specs/apps/ose/id-be/behaviours/account/verification.feature`. Unit proves the capability state
  machine, Integration proves the atomic endpoint transaction, and E2E proves two concurrent requests
  produce one stored active account.

### `POST /api/v1/account-sessions`

- **Caller/auth/context:** anonymous; no existing session or tenant required.
- **Request:** JSON/correlation headers only, no query/idempotency key, and:

  ```json
  {
    "email": "person@example.test",
    "password": "<secret>"
  }
  ```

- **Success:** `201`, no-store/correlation headers, rotated `ose_id_session`/`ose_id_csrf` cookies, and:

  ```json
  {
    "status": "authenticated",
    "session": {
      "id": "<uuid>",
      "createdAt": "<instant>",
      "idleExpiresAt": "<instant>",
      "absoluteExpiresAt": "<instant>",
      "current": true
    }
  }
  ```

- **Problems/validation:** `400 invalid_request`; identical `401 invalid_credentials` for every unsafe
  account/password state; `429 rate_limited` plus `Retry-After`.
- **Semantics/privacy:** each success rotates/creates one session under concurrency; retries are not
  idempotent; shared limits apply; credentials/cookies absent from logs. No pagination.
- **Discovery/proof:** OpenAPI `createAccountSession`; the
  [password-session contract](#password-session-contract) scenarios “Create a password session only for
  an eligible account” and “Reject password sign-in uniformly” target
  `specs/apps/ose/id-be/behaviours/account/password-sign-in.feature`. Unit proves state/verifier mapping,
  Integration proves the cookie/auth pipeline, and E2E proves the account-state matrix and rotation.

### `GET /api/v1/account`

- **Caller/auth/context:** authenticated active Person; no company context.
- **Request:** opaque session cookie and optional correlation header; no params/body.
- **Success:** `200`, no-store/correlation headers, and:

  ```json
  {
    "personId": "<uuid>",
    "status": "active",
    "verifiedEmail": true
  }
  ```

- **Problems/validation:** `401 authentication_required` for absent/expired/revoked/version-stale cookie.
- **Semantics/privacy:** fresh read, idempotent/concurrency-safe, unpaginated/unlimited; omits email value,
  credential/session secret, and company/product facts; logs opaque correlation only.
- **Discovery/proof:** OpenAPI `getCurrentAccount`; the
  [account-read and session-revocation contract](#account-read-and-session-revocation-contract)
  scenario outline “Read only the authenticated account and its sessions”, restricted to its current-
  account row, targets `specs/apps/ose/id-be/behaviours/account/account-sessions.feature`. Unit proves
  projection policy, Integration proves the authentication pipeline, and E2E proves session validation
  through either instance.

### `GET /api/v1/account-sessions`

- **Caller/auth/context:** authenticated active Person; no tenant.
- **Request:** session cookie plus optional correlation header; no query/body.
- **Success:** `200` no-store with `AccountSessionList`; an empty list is valid and every item belongs to
  the caller. Example:

  ```json
  {
    "sessions": [
      {
        "id": "<uuid>",
        "current": true,
        "createdAt": "<instant>",
        "lastSeenAt": "<instant>",
        "idleExpiresAt": "<instant>",
        "absoluteExpiresAt": "<instant>"
      }
    ]
  }
  ```

- **Problems/validation:** `401 authentication_required`; no foreign-session distinction.
- **Semantics/privacy:** read-idempotent, concurrency-safe snapshot, bounded by the account session policy
  rather than paginated; not rate-limited; no cookie/digest/log disclosure.
- **Discovery/proof:** OpenAPI `listAccountSessions`; the
  [account-read and session-revocation contract](#account-read-and-session-revocation-contract)
  scenario outline “Read only the authenticated account and its sessions”, restricted to its session-
  list row, targets `specs/apps/ose/id-be/behaviours/account/account-sessions.feature`. Unit proves
  ownership/lifecycle, Integration proves cookie/repository behavior, and E2E proves the two-session list
  through the built API.

### `DELETE /api/v1/account-sessions/current`

- **Caller/auth/context:** authenticated active Person with matching CSRF; no tenant.
- **Request:** session/CSRF cookies, `X-CSRF-Token`, optional correlation; no params/body.
- **Success:** `204`, no-store/correlation headers, expired session/CSRF cookies, empty body.
- **Problems/validation:** `401 authentication_required` or `403 csrf_required`; no session detail.
- **Semantics/privacy:** atomic and idempotent for the current session; concurrent duplicates cannot
  reactivate it; not separately rate-limited; cookie/digest absent from logs. No pagination.
- **Discovery/proof:** OpenAPI `revokeCurrentAccountSession`; the
  [account-read and session-revocation contract](#account-read-and-session-revocation-contract)
  scenario outline “Revoke an owned account session safely”, restricted to its current-session row,
  targets `specs/apps/ose/id-be/behaviours/account/account-sessions.feature`. Unit proves the terminal
  transition, Integration proves the cookie/CSRF pipeline, and E2E proves old-cookie rejection.

### `DELETE /api/v1/account-sessions/{sessionId}`

- **Caller/auth/context:** authenticated active Person with CSRF; ownership of the path UUID required.
- **Request:** UUID path, session/CSRF headers/cookies, no query/body.
- **Success:** `204` empty no-store response for active or already-revoked owned session.
- **Problems/validation:** `400 invalid_request` malformed UUID; `401 authentication_required`; `403
csrf_required`; `404 session_not_found` for missing/foreign.
- **Semantics/privacy:** revoke-idempotent and atomic under concurrency; cannot revoke/reactivate a
  foreign/current session accidentally; not rate-limited or paginated; opaque-ID-only logs.
- **Discovery/proof:** OpenAPI `revokeAccountSession`; the
  [account-read and session-revocation contract](#account-read-and-session-revocation-contract)
  scenario outline “Revoke an owned account session safely”, restricted to its named-session row, targets
  `specs/apps/ose/id-be/behaviours/account/account-sessions.feature`. Unit proves ownership/idempotency,
  Integration proves the endpoint transaction, and E2E proves other-cookie rejection plus current-cookie
  survival.

### `POST /api/v1/accounts/password-recovery-requests`

- **Caller/auth/context:** anonymous; no tenant.
- **Request:** JSON and optional correlation header, no query/cookie/idempotency key, and this exact
  `EmailActionRequest` example:

  ```json
  {
    "email": "person@example.test"
  }
  ```

- **Success:** exact result for every account state:

  ```http
  HTTP/1.1 202 Accepted
  Content-Type: application/json
  Cache-Control: no-store

  { "accepted": true }
  ```

- **Problems/validation:** `400 invalid_request`; `429 rate_limited` with `Retry-After`; never an
  existence/status-specific result.
- **Semantics/privacy:** response-idempotent, cooldown/deduped notification, shared cross-instance bucket,
  no raw email/message log, no pagination.
- **Discovery/proof:** OpenAPI `requestPasswordRecovery`; the
  [public email-action contract](#public-email-action-contract) scenario outlines “Accept a public email
  action without account disclosure” and “Reject an invalid public email action safely”, restricted to
  their recovery-request rows, target
  `specs/apps/ose/id-be/behaviours/account/enumeration-resistance.feature`. Unit proves generic
  notification policy, Integration proves adapter wiring, and E2E proves known/unknown Mailpit parity.

### `POST /api/v1/accounts/password-resets`

- **Caller/auth/context:** anonymous capability holder; no tenant.
- **Request:** JSON/correlation headers only, no query/cookie/idempotency key, and:

  ```json
  {
    "capability": "<secret>",
    "newPassword": "<secret>"
  }
  ```

- **Success:** `204`, no-store/correlation headers, empty body after password change and prior-session invalidation.
- **Problems/validation:** `400 invalid_request` for password/shape/body policy; `400
capability_unavailable` for all unusable capability states; `429 rate_limited` with `Retry-After`.
- **Semantics/privacy:** exactly one atomic winner; replay/concurrency safe; security version increments
  once and all prior sessions revoke before success; secrets absent from logs. No pagination.
- **Discovery/proof:** OpenAPI `resetPassword`; the [password-reset contract](#password-reset-contract)
  scenarios “Reset a password exactly once” and “Reject an unavailable reset uniformly” target
  `specs/apps/ose/id-be/behaviours/account/password-recovery.feature`. Unit proves transition/version
  policy, Integration proves the Identity-primitives/query-builder transaction, and E2E proves old-password/session denial plus
  fresh sign-in.

## Exact Schemas and Semantics

- `RegisterAccountRequest` contains exactly string fields `email` and `password`.
  `PasswordSignInRequest` has the same shape. `EmailActionRequest` contains only the string field
  `email`. The applicable operation packets above provide their representative JSON bodies.
- `CapabilityRequest` contains only the string field `capability`; `ResetPasswordRequest` adds the
  string field `newPassword`. Capability values exist only in request memory.
- `GenericAccepted` contains a `status` fixed to `accepted` and a string `correlationId` for new,
  duplicate, missing, pending, verified, suspended, and soft-deleted account states.
- `AccountSessionCreated` contains a `status` fixed to `authenticated` and one current session with a
  UUID `id` plus creation, idle-expiry, and absolute-expiry instants. It contains no Person, email,
  password, or cookie value.
- `CurrentAccount` contains a UUID `personId`, a `status` fixed to `active`, and `verifiedEmail` fixed
  to `true`; it omits the email value and all company/product facts.
- `AccountSessionList` lists only active sessions owned by the authenticated Person. Its concrete wire
  shape is:

  ```json
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

Registration always returns the generic `202`; only an eligible new/pending flow sends Mailpit mail.
Verification and reset consume a purpose-bound capability atomically. Invalid, wrong-purpose, expired,
already-consumed, or wrong-security-version values share `400 capability_unavailable`. Password sign-in
returns identical `401 invalid_credentials` status/schema for unknown, pending, suspended, deleted, or
wrong-password states.

## Idempotency, Concurrency, and Rate Limits

- Registration, verification-message request, and recovery request are response-idempotent: retries
  return the same generic shape. Notification deduplication/cooldown may suppress duplicate messages but
  never changes the public result. These anonymous operations do not accept an idempotency key.
- Capability consumption uses one conditional database mutation. Concurrent verification/reset yields
  one `204`; every loser receives `400 capability_unavailable` and cannot partially change account state.
- Deleting the current session is idempotent from the authenticated session's perspective. Revoking a
  named owned session returns `204` when already revoked; a never-owned/foreign identifier is the same
  `404 session_not_found` to avoid disclosure.
- Shared PostgreSQL rate buckets cover registration, verification request/consume, sign-in, recovery
  request, and reset. `429 rate_limited` includes an integer `Retry-After` header and the generic safe
  problem schema. Limits are consistent across instances and keyed without raw email in labels.
- Session/security versions and conditional updates resolve sign-in/reset/revocation races. A completed
  password reset invalidates every prior session before returning `204`.

## UPDATE, DELETE, and RETAIN Contracts

- **UPDATE:** `GET /health/ready` now evaluates account-schema compatibility without changing its wire contract.
- **DELETE:** none.

### Updated operation packet: `GET /health/ready`

- **Caller/auth/context:** anonymous local runner/operator; no authorization or tenant context.
- **Request:** optional validated correlation header; no path/query/body/cookie.
- **Success:** unchanged `200` no-store JSON and correlation header with:

  ```json
  {
    "status": "ready",
    "components": {
      "postgresql": "ready",
      "schema": "compatible"
    }
  }
  ```

- **Problems/validation:** unchanged `503 database_unavailable` or `503 schema_incompatible` closed
  problem body. Account migration incompatibility selects the latter without exposing migration names.
- **Semantics/privacy:** fresh bounded read, idempotent/concurrency-safe, unpaginated, not rate-limited,
  no mutation, and allowlisted logs only.
- **Discovery/proof:** UPDATE retained OpenAPI `getReadiness`; the
  [updated readiness contract](#updated-readiness-contract) scenario outline “Report account-schema
  readiness without changing the health wire contract” targets
  `specs/apps/ose/id-be/behaviours/foundation/health.feature`. Unit state mapping, Integration migration
  checks, and E2E compatible/incompatible PostgreSQL proof are mandatory.

### Retained operation packets

These packets restate every retained wire contract in this document. A predecessor reference or the
traceability inventory cannot substitute for any field below.

#### RETAIN `GET /health/live`

- **Owner/caller/auth/context:** `ose-id-be`; anonymous local runner or operator; no authorization,
  scope, audience, Person, Company, or tenant context.
- **Request and response:** optional validated `X-Correlation-ID`; no path/query parameters, cookie,
  media type, or body. Exact representative exchange:

  ```http
  GET /health/live HTTP/1.1
  Host: 127.0.0.1:8501
  Accept: application/json
  X-Correlation-ID: corr_synthetic_01

  HTTP/1.1 200 OK
  Content-Type: application/json
  Cache-Control: no-store
  X-Correlation-ID: corr_synthetic_01

  {"status":"live","service":"ose-id-be"}
  ```

- **Failures/validation:** no operation-owned problem response while the process is listening;
  malformed correlation input is replaced rather than reflected. Process absence is a connection
  failure. Authentication, authorization, context, and dependency errors are none.
- **Semantics/privacy:** read-idempotent, replay-safe, concurrency-safe, and no-write. Pagination is
  none; the application rate limit is none. It never queries PostgreSQL. Logs contain only route, result,
  timing bucket, and accepted/generated correlation ID; secrets, paths, and dependency details are absent.
- **Publication/compatibility/rollback:** retain OpenAPI operation `getLiveness` in
  `specs/apps/ose/id-be/contracts/openapi.yaml`; discovery and codegen/generated-client changes are none. Account
  enablement and rollback leave this exact exchange unchanged.
- **Scenario/proof:** map `Report liveness without consulting dependencies` to
  `specs/apps/ose/id-be/behaviours/foundation/health.feature`; Unit proves response mapping,
  Integration proves the ASP.NET pipeline, and E2E proves database loss does not change liveness.

  ```gherkin
  Scenario: Preserve process-only liveness while accounts are enabled
    Given account behavior is enabled and PostgreSQL is unavailable
    When an anonymous caller sends GET "/health/live"
    Then the response is 200 with the unchanged live JSON and no-store headers
    And replay and concurrency create no state or dependency call
    And no secret, machine path, account, or tenant fact is returned or logged
  ```

#### RETAIN `GET /connect/authorize`

- **Owner/caller/auth/context:** `ose-id-be`; anonymous browser or protocol probe. No OIDC client,
  login, consent, scope, audience, Person, Company, or tenant authority is accepted.
- **Request and response:** optional validated correlation header; bounded query values are ignored;
  no request body or cookie. Exact representative exchange:

  ```http
  GET /connect/authorize?client_id=synthetic&response_type=code&scope=openid HTTP/1.1
  Host: 127.0.0.1:8501
  X-Correlation-ID: corr_synthetic_02

  HTTP/1.1 404 Not Found
  Content-Type: application/problem+json
  Cache-Control: no-store
  X-Correlation-ID: corr_synthetic_02

  {"status":404,"code":"capability_disabled","title":"Capability is not available","correlationId":"corr_synthetic_02"}
  ```

- **Failures/validation:** `404 capability_disabled` is the sole owned result for every bounded query;
  no redirect URI, response type, prompt, scope, or client value is validated or reflected. Oversized
  transport input is rejected by the unchanged host limit before this operation and creates no OIDC error redirect.
- **Semantics/privacy:** deterministic, idempotent, replay/concurrency-safe, and no-write. Pagination
  and the application rate limit are none. There is no `Location` or `Set-Cookie`; query values and
  provider/account facts never log.
- **Publication/compatibility/rollback:** retain OpenAPI `rejectDisabledOidcAuthorization`; OIDC
  discovery continues not to advertise an authorization capability and codegen has no new
  surface. Account rollout and rollback preserve the disabled route byte-for-byte.
- **Scenario/proof:** map the OIDC row of `Preserve every foundation HTTP contract while accounts are
enabled` to `specs/apps/ose/id-be/behaviours/foundation/disabled-capabilities.feature`; Unit proves
  inventory, Integration proves routing/problem serialization, and E2E proves no redirect/cookie/row.

  ```gherkin
  Scenario: Preserve disabled OIDC authorization while accounts are enabled
    Given account behavior is enabled and OIDC authorization remains disabled
    When an anonymous caller sends GET "/connect/authorize" with bounded query input
    Then the response is 404 with code "capability_disabled" and no redirect or cookie
    And replay and concurrency create no identity or authorization state
    And query, account, tenant, provider, and secret values are absent from responses and logs
  ```

#### RETAIN `POST /connect/token`

- **Owner/caller/auth/context:** `ose-id-be`; anonymous protocol probe. Client authentication, grant,
  scope, audience, Person, Company, and tenant context are all unsupported and confer no authority.
- **Request and response:** an optional correlation header and a bounded body are accepted only for safe
  rejection; no grant is parsed. Exact representative exchange:

  ```http
  POST /connect/token HTTP/1.1
  Host: 127.0.0.1:8501
  Content-Type: application/x-www-form-urlencoded
  X-Correlation-ID: corr_synthetic_03

  grant_type=authorization_code&code=synthetic

  HTTP/1.1 404 Not Found
  Content-Type: application/problem+json
  Cache-Control: no-store
  X-Correlation-ID: corr_synthetic_03

  {"status":404,"code":"capability_disabled","title":"Capability is not available","correlationId":"corr_synthetic_03"}
  ```

- **Failures/validation:** `404 capability_disabled` is the only operation-owned response for a body
  within the inherited host limit. Grant fields, Basic credentials, and media type are not parsed;
  over-limit or unreadable transport fails in the unchanged host layer before this operation.
- **Semantics/privacy:** deterministic no-write behavior; retries and concurrent replays return the same
  problem. Idempotency key, pagination, and application rate limit are none. Body, credentials, code,
  and token-shaped values never enter logs, traces, metrics, response fields, or persistence.
- **Publication/compatibility/rollback:** retain OpenAPI `rejectDisabledTokenIssuance`; discovery exposes
  no token capability and codegen adds nothing. Account enablement and rollback cannot enable a grant or
  alter the response.
- **Scenario/proof:** map the token row of the retained foundation scenario to
  `specs/apps/ose/id-be/behaviours/foundation/disabled-capabilities.feature`; Unit, Integration, and E2E
  prove exact inventory, safe body handling, and absence of tokens/rows.

  ```gherkin
  Scenario: Preserve disabled token issuance while accounts are enabled
    Given account behavior is enabled and token issuance remains disabled
    When an anonymous caller posts a bounded synthetic grant to "/connect/token"
    Then the response is 404 with code "capability_disabled" and no token field
    And replay and concurrency create no grant, consent, session, or authorization state
    And grant, credential, code, account, tenant, and secret values are absent from responses and logs
  ```

#### RETAIN `GET /external/google/challenge`

- **Owner/caller/auth/context:** `ose-id-be`; anonymous browser or probe. No Google provider, login,
  return target, Person, Company, tenant, scope, or audience is accepted.
- **Request and response:** optional validated correlation header, bounded ignored query, no body or
  cookie. Exact representative exchange:

  ```http
  GET /external/google/challenge?returnUrl=%2F HTTP/1.1
  Host: 127.0.0.1:8501
  X-Correlation-ID: corr_synthetic_04

  HTTP/1.1 404 Not Found
  Content-Type: application/problem+json
  Cache-Control: no-store
  X-Correlation-ID: corr_synthetic_04

  {"status":404,"code":"capability_disabled","title":"Capability is not available","correlationId":"corr_synthetic_04"}
  ```

- **Failures/validation:** every bounded query receives `404 capability_disabled`; return targets and
  provider fields are neither validated nor reflected. No provider outage/error contract exists because
  no provider call occurs.
- **Semantics/privacy:** idempotent, deterministic, replay/concurrency-safe, and no-write. Pagination
  and the application rate limit are none. `Location`, state, nonce, and cookies are absent;
  query/provider/account values never log.
- **Publication/compatibility/rollback:** retain OpenAPI `rejectDisabledGoogleSignIn`; discovery and
  codegen/generated clients expose no Google capability. Account enablement and rollback preserve absence of
  Google or any other external-provider behavior.
- **Scenario/proof:** map the provider row of the retained foundation scenario to
  `specs/apps/ose/id-be/behaviours/foundation/disabled-capabilities.feature`; Unit, Integration, and E2E
  prove exact routing, no redirect/cookie, and no provider/domain row.

  ```gherkin
  Scenario: Preserve disabled Google challenge while accounts are enabled
    Given account behavior is enabled and Google sign-in remains disabled
    When an anonymous caller sends GET "/external/google/challenge" with bounded query input
    Then the response is 404 with code "capability_disabled" and no redirect, state, nonce, or cookie
    And replay and concurrency create no provider, account, or tenant state
    And query, provider, identity, and secret values are absent from responses and logs
  ```

#### RETAIN `POST /scim/v2/Users`

- **Owner/caller/auth/context:** `ose-id-be`; unauthenticated provisioning probe. No bearer scheme,
  SCIM scope, provisioning authority, Person, Company, or tenant context exists.
- **Request and response:** optional correlation header and bounded body; the body is not parsed into a
  user. Exact representative exchange:

  ```http
  POST /scim/v2/Users HTTP/1.1
  Host: 127.0.0.1:8501
  Content-Type: application/scim+json
  X-Correlation-ID: corr_synthetic_05

  {"userName":"person@example.test","active":true}

  HTTP/1.1 404 Not Found
  Content-Type: application/problem+json
  Cache-Control: no-store
  X-Correlation-ID: corr_synthetic_05

  {"status":404,"code":"capability_disabled","title":"Capability is not available","correlationId":"corr_synthetic_05"}
  ```

- **Failures/validation:** `404 capability_disabled` is the sole operation-owned response within the
  inherited host body limit. SCIM schema, bearer header, media type, and attributes are not parsed;
  over-limit/unreadable transport fails before the operation and produces no SCIM resource/error body.
- **Semantics/privacy:** deterministic and no-write under retries/concurrency; idempotency key,
  pagination, and application rate limit are none. Body, bearer, username, and tenant values are absent
  from logs, metrics, audit, response identifiers, and persistence.
- **Publication/compatibility/rollback:** retain OpenAPI `rejectDisabledScimUserProvisioning`; SCIM
  discovery/schema endpoints and codegen/generated provisioning clients remain absent. Account rollout and
  rollback preserve the exact disabled route.
- **Scenario/proof:** map the SCIM row of the retained foundation scenario to
  `specs/apps/ose/id-be/behaviours/foundation/disabled-capabilities.feature`; Unit, Integration, and E2E
  prove no parser/authority/resource/row is created.

  ```gherkin
  Scenario: Preserve disabled SCIM provisioning while accounts are enabled
    Given account behavior is enabled and SCIM provisioning remains disabled
    When an unauthenticated caller posts a bounded SCIM user to "/scim/v2/Users"
    Then the response is 404 with code "capability_disabled" and no SCIM resource identifier
    And replay and concurrency create no Person, login, membership, or audit row
    And bearer, body, contact, tenant, and secret values are absent from responses and logs
  ```

#### RETAIN `GET /platform/admin/companies`

- **Owner/caller/auth/context:** `ose-id-be`; anonymous probe. No platform-operator scheme, scope,
  audience, impersonation, Person, Company, or tenant context exists.
- **Request and response:** optional validated correlation header, no path/query parameters, body, or
  cookie. Exact representative exchange:

  ```http
  GET /platform/admin/companies HTTP/1.1
  Host: 127.0.0.1:8501
  X-Correlation-ID: corr_synthetic_06

  HTTP/1.1 404 Not Found
  Content-Type: application/problem+json
  Cache-Control: no-store
  X-Correlation-ID: corr_synthetic_06

  {"status":404,"code":"capability_disabled","title":"Capability is not available","correlationId":"corr_synthetic_06"}
  ```

- **Failures/validation:** exact `404 capability_disabled`; authentication challenges, company lookup,
  and alternate query behavior are none. Unknown adjacent routes remain ordinary framework `404` and
  must not receive this capability code.
- **Semantics/privacy:** deterministic, idempotent, replay/concurrency-safe, and no-write. Pagination
  and the application rate limit are none. No company count/ID exists; logs contain only route, result,
  timing, and correlation.
- **Publication/compatibility/rollback:** retain OpenAPI `rejectDisabledPlatformAdministration`;
  discovery and codegen/generated admin clients remain absent. Accounts do not create platform administration,
  and rollback keeps the route disabled.
- **Scenario/proof:** map the administration row of the retained foundation scenario to
  `specs/apps/ose/id-be/behaviours/foundation/disabled-capabilities.feature`; Unit, Integration, and E2E
  prove exact dispatch, no company disclosure, and no data change.

  ```gherkin
  Scenario: Preserve disabled platform administration while accounts are enabled
    Given account behavior is enabled and platform administration remains disabled
    When an anonymous caller sends GET "/platform/admin/companies"
    Then the response is 404 with code "capability_disabled" and no company fact
    And replay and concurrency create or change no identity, company, or audit state
    And operator, account, tenant, and secret values are absent from responses and logs
  ```

#### Retained web status operation

- **Owner/caller/auth/context:** `ose-id-web`; anonymous local browser. No account, authorization,
  scope, audience, Person, Company, or tenant context is accepted or derived.
- **Request and response:** optional correlation header; no query/body/cookie required. Representative
  successful exchange (body abbreviated only after both required visible strings):

  ```http
  GET / HTTP/1.1
  Host: 127.0.0.1:3500
  Accept: text/html

  HTTP/1.1 200 OK
  Content-Type: text/html; charset=utf-8
  Cache-Control: no-cache
  X-Correlation-ID: corr_synthetic_07

  <!doctype html><html lang="en"><body><h1>OSE ID service status</h1><section aria-label="Service status">Backend ready</section></body></html>
  ```

- **Failures/validation:** backend-status unavailability renders the inherited sanitized `503` status
  page; an unhandled render failure uses sanitized framework `500`. Neither response includes a stack,
  backend host, machine path, cookie, or identity field. Unsupported runtime binds no listener.
- **Semantics/privacy:** idempotent, replay/concurrency-safe, and no-write. Pagination and the
  application rate limit are none. It sets no identity cookie and renders no
  login/provider/company/admin control; safe route,
  status, timing, and correlation fields are the only logs.
- **Publication/compatibility/rollback:** backend OpenAPI, OIDC discovery, and codegen are none; the
  id-web status specification remains authoritative. Account rollout and rollback retain the exact
  shell with no new UI behavior.
- **Scenario/proof:** map `Render the service status without identity controls` and `Sanitize a
status-rendering failure` to
  `specs/apps/ose/id-web/behaviours/foundation/status-shell.feature`; component Unit, Next-server
  Integration, and browser E2E prove semantics, failure redaction, accessibility, and responsiveness.

  ```gherkin
  Scenario: Preserve the identity-free status shell while accounts are enabled
    Given account behavior is enabled and the local web listener is running
    When an anonymous browser sends GET "/" to ose-id-web
    Then success is accessible 200 HTML with no-cache and no session cookie
    And backend or render failure produces only the documented sanitized 503 or 500 page
    And replay and concurrency create no state or identity control
    And user, company, provider, secret, host, stack, and machine-path values are absent
  ```

#### RETAIN backend startup guard

- **Owner/caller/auth/context:** `ose-id-be` process entry point invoked by the local runner/test
  harness; no HTTP principal, scope, audience, Person, Company, or tenant exists before listener binding.
- **Input/result:** process configuration supplies runtime mode and port; there are no HTTP headers,
  parameters, media type, or body. Representative unsupported result:

  ```text
  input.runtimeMode=Production
  result.exitCode=non-zero
  result.code=runtime_mode_disabled
  result.listener=not-bound
  ```

- **Failures/validation:** missing, unknown, Production, Staging, or equivalent production-like mode
  fails before database access, migration, or socket bind. Local/Test with otherwise invalid required
  configuration fails through its existing sanitized configuration diagnostic, never by starting partly.
- **Semantics/privacy:** deterministic/replay/concurrency-safe with no state write, pagination,
  idempotency key, rate limit, cache, or HTTP response. Diagnostics omit values, secrets, stack traces,
  connection strings, and absolute paths.
- **Publication/compatibility/rollback:** OpenAPI, discovery, schema, and codegen are none because no
  listener exists. Account enablement and rollback retain fail-closed behavior exactly.
- **Scenario/proof:** `Preserve backend runtime guard while accounts are enabled` maps to
  `specs/apps/ose/id-be/behaviours/foundation/runtime-mode.feature`; Unit validates mode decisions,
  Integration validates host startup, and E2E proves no listener/database row.

  ```gherkin
  Scenario: Preserve backend runtime guard while accounts are enabled
    Given account behavior is enabled and ose-id-be uses an unsupported runtime mode
    When the backend process starts
    Then it exits non-zero with code "runtime_mode_disabled" before listener or database use
    And replay and concurrency create no process-local or shared identity state
    And configuration, secret, connection, stack, and absolute-path values are not logged
  ```

#### RETAIN web startup guard

- **Owner/caller/auth/context:** `ose-id-web` process entry point invoked by local runner/test harness;
  no browser principal, scope, audience, Person, Company, or tenant exists before binding.
- **Input/result:** process configuration supplies runtime mode and port; no HTTP request or schema.
  Representative unsupported result:

  ```text
  input.runtimeMode=Production
  result.exitCode=non-zero
  result.code=runtime_mode_disabled
  result.listener=not-bound
  ```

- **Failures/validation:** missing, unknown, Production, Staging, or equivalent production-like mode
  fails before socket bind or backend fetch. Invalid Local/Test configuration fails with sanitized output.
- **Semantics/privacy:** deterministic/replay/concurrency-safe; no write, pagination, idempotency key,
  rate limit, cache, cookie, or HTTP response. Diagnostics omit config values, secrets, stacks, and paths.
- **Publication/compatibility/rollback:** backend OpenAPI, discovery, schema, and codegen are none.
  Account enablement and rollback retain the guard exactly.
- **Scenario/proof:** `Preserve web runtime guard while accounts are enabled` maps to
  `specs/apps/ose/id-web/behaviours/foundation/runtime-mode.feature`; Unit validates configuration,
  Integration validates Next startup, and E2E proves no listener/cookie.

  ```gherkin
  Scenario: Preserve web runtime guard while accounts are enabled
    Given account behavior is enabled and ose-id-web uses an unsupported runtime mode
    When the web process starts
    Then it exits non-zero with code "runtime_mode_disabled" before listener binding
    And replay and concurrency create no browser or server-side identity state
    And configuration, secret, stack, and absolute-path values are not logged
  ```

The backend/web runtime guards are also RETAINED as pre-listener behavior, so they have no method/path.
The disabled matrix deliberately contains no email/password account endpoint.

## Copy-Ready API Contract Scenarios

The following app-scoped packets are merged into the named durable feature files. Every scenario has
mandatory Unit, Integration, and E2E bindings; no exemption applies. Requirement identifiers remain in
the traceability table above and never enter these executable packets.

| Action and operations                                   | Exact target                                                               | Full scenario packet                                                                                                                                          |
| ------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ADD `POST /api/v1/accounts/registrations`               | `specs/apps/ose/id-be/behaviours/account/registration.feature`             | Accept registration generically; Reject invalid or over-limit registration safely                                                                             |
| ADD `POST /api/v1/accounts/email-verification-requests` | `specs/apps/ose/id-be/behaviours/account/enumeration-resistance.feature`   | Accept a public email action without account disclosure — verification-request rows; Reject an invalid public email action safely — verification-request rows |
| ADD `POST /api/v1/accounts/email-verifications`         | `specs/apps/ose/id-be/behaviours/account/verification.feature`             | Verify email exactly once; Reject an unavailable verification capability uniformly                                                                            |
| ADD `POST /api/v1/account-sessions`                     | `specs/apps/ose/id-be/behaviours/account/password-sign-in.feature`         | Create a password session only for an eligible account; Reject password sign-in uniformly                                                                     |
| ADD `GET /api/v1/account`                               | `specs/apps/ose/id-be/behaviours/account/account-sessions.feature`         | Read only the authenticated account and its sessions — account row                                                                                            |
| ADD `GET /api/v1/account-sessions`                      | `specs/apps/ose/id-be/behaviours/account/account-sessions.feature`         | Read only the authenticated account and its sessions — sessions row                                                                                           |
| ADD `DELETE /api/v1/account-sessions/current`           | `specs/apps/ose/id-be/behaviours/account/account-sessions.feature`         | Revoke an owned account session safely — current row                                                                                                          |
| ADD `DELETE /api/v1/account-sessions/{sessionId}`       | `specs/apps/ose/id-be/behaviours/account/account-sessions.feature`         | Revoke an owned account session safely — named row                                                                                                            |
| ADD `POST /api/v1/accounts/password-recovery-requests`  | `specs/apps/ose/id-be/behaviours/account/enumeration-resistance.feature`   | Accept a public email action without account disclosure — recovery-request rows; Reject an invalid public email action safely — recovery-request rows         |
| ADD `POST /api/v1/accounts/password-resets`             | `specs/apps/ose/id-be/behaviours/account/password-recovery.feature`        | Reset a password exactly once; Reject an unavailable reset uniformly                                                                                          |
| UPDATE `GET /health/ready`                              | `specs/apps/ose/id-be/behaviours/foundation/health.feature`                | Report account-schema readiness without changing the health wire contract                                                                                     |
| DELETE                                                  | none                                                                       | No operation is removed                                                                                                                                       |
| RETAIN `GET /health/live`                               | `specs/apps/ose/id-be/behaviours/foundation/health.feature`                | Preserve process-only liveness while accounts are enabled                                                                                                     |
| RETAIN `GET /connect/authorize`                         | `specs/apps/ose/id-be/behaviours/foundation/disabled-capabilities.feature` | Preserve disabled OIDC authorization while accounts are enabled                                                                                               |
| RETAIN `POST /connect/token`                            | `specs/apps/ose/id-be/behaviours/foundation/disabled-capabilities.feature` | Preserve disabled token issuance while accounts are enabled                                                                                                   |
| RETAIN `GET /external/google/challenge`                 | `specs/apps/ose/id-be/behaviours/foundation/disabled-capabilities.feature` | Preserve disabled Google challenge while accounts are enabled                                                                                                 |
| RETAIN `POST /scim/v2/Users`                            | `specs/apps/ose/id-be/behaviours/foundation/disabled-capabilities.feature` | Preserve disabled SCIM provisioning while accounts are enabled                                                                                                |
| RETAIN `GET /platform/admin/companies`                  | `specs/apps/ose/id-be/behaviours/foundation/disabled-capabilities.feature` | Preserve disabled platform administration while accounts are enabled                                                                                          |
| RETAIN web `GET /`                                      | `specs/apps/ose/id-web/behaviours/foundation/status-shell.feature`         | Preserve the identity-free status shell while accounts are enabled                                                                                            |
| RETAIN backend startup guard                            | `specs/apps/ose/id-be/behaviours/foundation/runtime-mode.feature`          | Preserve backend runtime guard while accounts are enabled                                                                                                     |
| RETAIN web startup guard                                | `specs/apps/ose/id-web/behaviours/foundation/runtime-mode.feature`         | Preserve web runtime guard while accounts are enabled                                                                                                         |

### Registration contract

```gherkin
Feature: Email account registration API contract
  Registration creates an eligible personal account without exposing existing account state.

  Rule: Registration is generic, bounded, and safe under retry

    Scenario Outline: Accept registration generically
      Given <account state> exists for normalized email "person@example.test"
      When an anonymous caller sends POST "/api/v1/accounts/registrations" with that email and a valid password
      Then the response is 202 with the generic accepted body
      And no company or membership is created
      And repeated or concurrent requests create at most one eligible Person and active verification capability
      And the response, logs, traces, metrics, and audit contain no raw email, password, capability, or account-state disclosure

      Examples:
        | account state |
        | no account    |
        | pending       |
        | verified      |

    Scenario Outline: Reject invalid or over-limit registration safely
      Given an anonymous caller has <invalid input>
      When the caller sends POST "/api/v1/accounts/registrations"
      Then the response is <status> with code <code>
      And no Person, credential, capability, session, company, or membership is changed
      And no submitted email or password appears in logs or the problem body

      Examples:
        | invalid input                 | status | code           |
        | malformed request JSON        | 400    | invalid_request |
        | an oversized email or password | 400   | invalid_request |
        | an exhausted shared rate bucket | 429  | rate_limited   |
```

### Public email-action contract

```gherkin
Feature: Public account email-action API contract
  Verification and recovery requests reveal no account existence or lifecycle state.

  Rule: Every syntactically valid public email action has one observable result

    Scenario Outline: Accept a public email action without account disclosure
      Given normalized email "person@example.test" has <account state>
      When an anonymous caller sends POST <path> with that email
      Then the response is 202 with the generic accepted body
      And retry, concurrency, and notification cooldown do not change the public response
      And any sent message remains local to Mailpit
      And raw email, message content, capability, and account state are absent from responses and observability data

      Examples:
        | path                                          | account state |
        | /api/v1/accounts/email-verification-requests  | unknown       |
        | /api/v1/accounts/email-verification-requests  | pending       |
        | /api/v1/accounts/email-verification-requests  | verified      |
        | /api/v1/accounts/password-recovery-requests   | unknown       |
        | /api/v1/accounts/password-recovery-requests   | active        |

    Scenario Outline: Reject an invalid public email action safely
      Given an anonymous caller sends POST <path> with <condition>
      When the request is handled
      Then the response is <status> with code <code>
      And no account existence or email value is disclosed or logged

      Examples:
        | path                                         | condition                  | status | code            |
        | /api/v1/accounts/email-verification-requests | malformed or oversized JSON | 400   | invalid_request |
        | /api/v1/accounts/password-recovery-requests  | malformed or oversized JSON | 400   | invalid_request |
        | /api/v1/accounts/email-verification-requests | exhausted shared rate bucket | 429  | rate_limited    |
        | /api/v1/accounts/password-recovery-requests  | exhausted shared rate bucket | 429  | rate_limited    |
```

### Verification contract

```gherkin
Feature: Email verification API contract
  A purpose-bound verification capability activates its account once.

  Rule: Capability consumption is atomic and purpose-bound

    Scenario: Verify email exactly once
      Given a pending personal account has one unexpired email-verification capability
      When anonymous callers concurrently send POST "/api/v1/accounts/email-verifications" with that capability
      Then exactly one response is 204 and the account becomes active
      And every other response is 400 with code "capability_unavailable"
      And no company or membership is created
      And the capability, email, credential, and security version are absent from responses and logs

    Scenario Outline: Reject an unavailable verification capability uniformly
      Given a verification capability is <condition>
      When an anonymous caller sends POST "/api/v1/accounts/email-verifications" with it
      Then the response is <status> with code <code>
      And no account or session state is changed
      And the capability is absent from the problem body and observability data

      Examples:
        | condition                  | status | code                   |
        | malformed request          | 400    | invalid_request        |
        | invalid or wrong-purpose   | 400    | capability_unavailable |
        | expired or already consumed | 400   | capability_unavailable |
        | rate limited               | 429    | rate_limited           |
```

### Password-session contract

```gherkin
Feature: Password account-session API contract
  Password sign-in creates an opaque shared-store session only for an eligible verified account.

  Rule: Successful sign-in rotates cookies and every unsafe state is indistinguishable

    Scenario: Create a password session only for an eligible account
      Given a verified active personal account has a valid password
      When an anonymous caller sends POST "/api/v1/account-sessions" with those credentials
      Then the response is 201 with a safe session summary and rotated secure session and CSRF cookies
      And the stored session is valid through another backend instance
      And no email, password, cookie, digest, company, or membership is returned or logged

    Scenario Outline: Reject password sign-in uniformly
      Given the submitted credentials represent <account state>
      When an anonymous caller sends POST "/api/v1/account-sessions"
      Then the response is <status> with code <code>
      And no session or cookie is created
      And the response and observability data disclose no email, password, or account state

      Examples:
        | account state                | status | code                |
        | malformed request            | 400    | invalid_request     |
        | unknown email                | 401    | invalid_credentials |
        | wrong password               | 401    | invalid_credentials |
        | pending or suspended account | 401    | invalid_credentials |
        | exhausted shared rate bucket | 429    | rate_limited        |
```

### Account-read and session-revocation contract

```gherkin
Feature: Current account and session API contract
  An authenticated Person may inspect and revoke only its own shared-store sessions.

  Rule: Reads and revocations preserve ownership, CSRF, and non-disclosure

    Scenario Outline: Read only the authenticated account and its sessions
      Given an active Person has a valid opaque account session
      When the Person sends GET <path> with that cookie and no tenant context
      Then the response is 200 with <safe body>
      And a repeated or concurrent read returns current shared state without mutation
      And no email value, credential, cookie, digest, company, product, or foreign session is returned or logged
      But omitting or invalidating the cookie returns 401 with code "authentication_required"

      Examples:
        | path                      | safe body                    |
        | /api/v1/account           | current global Person summary |
        | /api/v1/account-sessions  | caller-owned session list     |

    Scenario Outline: Revoke an owned account session safely
      Given an active Person has a current session and another owned session
      When the Person sends DELETE <path> with valid session and CSRF proof
      Then the response is 204 and only <effect> occurs
      And replay or concurrency cannot reactivate or revoke a foreign session
      And missing authentication returns 401 with code "authentication_required"
      And missing or mismatched CSRF returns 403 with code "csrf_required"
      And malformed or foreign named identifiers use only the documented safe 400 or 404 problem
      And cookies, CSRF values, digests, and foreign identifiers are absent from logs and bodies

      Examples:
        | path                                         | effect                         |
        | /api/v1/account-sessions/current             | the current session is revoked |
        | /api/v1/account-sessions/{owned-session-id}  | the named session is revoked   |
```

### Password-reset contract

```gherkin
Feature: Password reset API contract
  A recovery capability changes the password once and invalidates all earlier sessions.

  Rule: Reset is atomic, replay-safe, and secret-free

    Scenario: Reset a password exactly once
      Given an active account has prior sessions and one unexpired password-reset capability
      When anonymous callers concurrently send POST "/api/v1/accounts/password-resets" with the capability and a valid new password
      Then exactly one response is 204 and the password changes once
      And all prior sessions are invalid before success returns
      And every other response is 400 with code "capability_unavailable"
      And no capability, password, cookie, hash, email, or security version is returned or logged

    Scenario Outline: Reject an unavailable reset uniformly
      Given a password-reset request has <condition>
      When an anonymous caller sends POST "/api/v1/accounts/password-resets"
      Then the response is <status> with code <code>
      And no password, capability, or session state is changed
      And submitted secrets are absent from the problem body and observability data

      Examples:
        | condition                    | status | code                   |
        | malformed body or weak password | 400 | invalid_request        |
        | invalid or wrong-purpose capability | 400 | capability_unavailable |
        | expired or consumed capability | 400 | capability_unavailable |
        | exhausted shared rate bucket | 429 | rate_limited             |
```

### Multi-instance account contract

```gherkin
Feature: Stateless account API contract
  Every account operation relies on shared stores rather than process-local correctness state.

  Rule: Any healthy instance observes the same account lifecycle

    Scenario: Complete account operations through interchangeable instances
      Given two backend instances share PostgreSQL, rate-limit state, and Mailpit
      When registration, verification request, verification, sign-in, account read, session list, both session revocations, recovery request, and password reset alternate between the instances
      Then every operation returns its documented success or stable problem contract
      And retry and concurrency invariants remain unchanged after either instance stops
      And no process-local session, capability, rate bucket, email, or tenant state is required
      And evidence and logs contain none of the submitted secrets or contact values
```

### Updated readiness contract

```gherkin
Feature: Account-era foundation API compatibility
  Enabling accounts changes schema readiness but preserves every foundation contract.

  Rule: Readiness includes account schema without changing its wire representation

    Scenario Outline: Report account-schema readiness without changing the health wire contract
      Given the backend runs with <account schema state>
      When an anonymous caller sends GET "/health/ready" without user or tenant context
      Then the response status is <status> with <result>
      And retry or concurrency performs a fresh no-write check
      And no migration name, connection value, secret, email, or absolute path is returned or logged

      Examples:
        | account schema state | status | result              |
        | compatible           | 200    | ready               |
        | incompatible         | 503    | schema_incompatible |

```

## OpenAPI and Code Generation

Add the machine-readable OpenAPI 3.1.0 account source at
`specs/apps/ose/id-be/contracts/account.openapi.yaml` for the ten operations, exact schemas,
headers, cookies, response codes, limits, and `cookieAuth` security requirement. Operation IDs use
durable names such as `registerAccount`, `verifyEmail`, `createAccountSession`, and `resetPassword`.
They never contain plan IDs or framework entity names. Compose it with the retained OpenAPI 3.1.0
foundation source `specs/apps/ose/id-be/contracts/openapi.yaml` and validate that the two exact files
contain no duplicate path/method, operation ID, or schema name. These machine-readable files, not this
prose or Gherkin alone, are the API Quality Gate contract inputs.

Run repository OpenAPI validation/code generation. Generated DTOs stay at the exact owner-configured
project path and must preserve closed schemas, nullable rules, and sensitive-field omissions. Server
domain/OpenIddict/framework entities never derive from or leak through generated transport models.

## Compatibility, Rollback, and Forward Repair

Every path is additive. Old foundation code ignores the account schema; new code refuses account work
when the migration is absent while retained health remains truthful. Rollback removes account routes
and retains all account rows/migrations; the disabled-capability matrix is not broadened to impersonate
rolled-back account behavior. Clients must treat missing account routes as unavailable. A shipped
contract/security defect is fixed forward with a version-compatible schema addition or a separately
reviewed `/api/v2` break, never by silently weakening generic responses, cookie rules, or validation.

## Unit, Integration, and E2E Proof

| Contract concern                        | Unit obligation                           | Integration obligation                           | E2E obligation                                      |
| --------------------------------------- | ----------------------------------------- | ------------------------------------------------ | --------------------------------------------------- |
| Validation and generic response mapping | Every state/error branch                  | ASP.NET binding/problem/correlation pipeline     | Built API known-versus-unknown equivalence          |
| Registration and email verification     | Domain state/capability policy            | Query-builder transaction + notification adapter | Real PostgreSQL/Mailpit plus concurrent consumption |
| Password sign-in/reset                  | Identity verifier/security-version policy | Cookie/auth/SqlKata transaction composition      | Built API old/new password and prior-session denial |
| Current account/session APIs            | Ownership, expiry, revoke idempotency     | Cookie/CSRF endpoint pipeline                    | Two sessions across interchangeable instances       |
| Rate limiting and redaction             | Bucket and allowlist policy               | Shared repository/log/audit sinks                | Cross-instance limits and forbidden-pattern scan    |

Every added/retained behavior has Unit, Integration, and E2E proof with no exemption. Static adapter-map
validation closes each durable scenario to exactly one binding per layer.
