# API Contract Delta

## Contract Boundary

This plan changes the existing LMS API from anonymous to OSE ID-protected and adds the
`ose-lms-app-web` authentication BFF/page surface. It consumes, but does not change, OSE ID's standard
OIDC/OAuth endpoints and local composition contract.

Machine-readable ground truth:

- UPDATE `specs/apps/ose/lms-be/contracts/openapi.yaml` for the protected LMS resource operation; and
- ADD `specs/apps/ose/lms-app-web/contracts/authentication.openapi.yaml` for the BFF callback/session/
  mutation operations and documented browser redirects.

Every BFF response uses `Cache-Control: no-store`; session/page responses additionally use `private`.
Browser JavaScript never receives access, refresh, ID, or provider tokens, PKCE verifier, authorization
code, client secret, upstream session ID, or raw OSE ID error. The BFF stores upstream artifacts only in
the encrypted server-side session row and sends one opaque `HttpOnly; SameSite=Lax` cookie.

## Operation Index

| Action | Method and exact path                             | Caller                                 | Detailed section                                                 |
| ------ | ------------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------- |
| UPDATE | `GET /api/v1/hello`                               | authenticated LMS API client/BFF       | [Protected resource](#1-protect-the-existing-lms-resource)       |
| ADD    | `GET /auth/oidc/start`                            | browser                                | [Start sign-in](#2-start-lms-sign-in)                            |
| ADD    | `GET /auth/oidc/callback`                         | browser redirected by OSE ID           | [Callback](#3-complete-the-lms-oidc-callback)                    |
| ADD    | `GET /api/bff/auth/session`                       | signed-in browser                      | [Session view](#4-read-the-current-lms-session-view)             |
| ADD    | `POST /api/bff/auth/context-switch`               | signed-in browser                      | [Context switch](#5-start-a-fresh-context-switch)                |
| ADD    | `POST /api/bff/auth/logout`                       | signed-in browser                      | [Logout](#6-end-an-lms-session)                                  |
| ADD    | `GET /learning`                                   | browser                                | [Protected page](#7-render-the-protected-learning-entry)         |
| RETAIN | `GET /.well-known/openid-configuration`           | confidential LMS BFF/resource verifier | [Discovery](#81-get-well-knownopenid-configuration)              |
| RETAIN | `GET /connect/authorize`                          | browser redirected by the LMS BFF      | [Authorization](#82-get-connectauthorize)                        |
| RETAIN | `POST /connect/token`                             | confidential LMS BFF                   | [Token exchange](#83-post-connecttoken)                          |
| RETAIN | `GET /connect/jwks`                               | LMS BFF/resource verifier              | [JWKS](#84-get-connectjwks)                                      |
| RETAIN | `POST /connect/revocation`                        | confidential LMS BFF                   | [Revocation](#85-post-connectrevocation)                         |
| RETAIN | `GET /connect/logout`                             | browser with an LMS/OSE ID session     | [Logout confirmation](#86-get-connectlogout)                     |
| RETAIN | `POST /connect/logout`                            | confirmed same-session browser action  | [Logout completion](#87-post-connectlogout)                      |
| RETAIN | `ose-id-web-e2e:local-stack` start/hold operation | LMS authenticated-stack runner         | [Start/hold](#91-start-and-hold)                                 |
| RETAIN | OSE ID runner ready/control-message operation     | LMS authenticated-stack runner         | [Readiness](#92-receive-readiness-and-public-descriptor)         |
| RETAIN | OSE ID runner schema-version negotiation          | LMS authenticated-stack runner         | [Version negotiation](#93-negotiate-the-runner-contract-version) |
| RETAIN | `ose-id-web-e2e:local-stack-cleanup` operation    | LMS authenticated-stack runner         | [Cleanup](#94-clean-up-the-owned-ose-id-stack)                   |

There is no runtime API deletion. Earlier plan-only ideas for LMS-local registration, password login,
refresh families, verification, recovery, or signing endpoints were never implemented; this plan removes
them only from active plan language and adds route-negative proof.

## Shared Authentication, Context, and Error Rules

- LMS client registration is exact: client `ose-lms-app-web-local`, callback
  `http://127.0.0.1:3400/auth/oidc/callback`, post-logout callback
  `http://127.0.0.1:3400/auth/signed-out`, audience `urn:ose:lms-api`, scopes `openid profile
ose.context ose.lms`, and product-entry entitlement `lms.access`.
- The BFF uses Authorization Code with PKCE S256, exact issuer/discovery, state, nonce, registered
  redirect, and server-side code redemption. It is a confidential client; no client secret or verifier
  reaches the browser.
- `ose-lms-be` accepts only a signed OSE ID access token with exact issuer, allowed algorithm, current
  key/time, LMS audience, required scopes/entitlement, and exactly one valid personal or company context.
  It derives immutable principal identity from `(issuer, subject)`, never email/name.
- Company context requires one opaque `company_id`; personal context forbids it. LMS loads product-domain
  roles locally after identity/context validation and ignores role-like identity claims.
- LMS API problems use its existing closed `application/problem+json` envelope with safe
  `invalid_access_token`, `insufficient_lms_access`, and `lms_authorization_denied` codes. BFF problems
  use `invalid_request`, `authentication_required`, `csrf_invalid`, `oidc_transaction_expired`,
  `oidc_response_invalid`, `authorization_cancelled`, `context_no_longer_eligible`,
  `dependency_unavailable`, and `rate_limited`.
  Responses/logs never reveal membership, entitlement, key, claim, or upstream-body details.

## Detailed Operation Contracts

### 1. Protect the existing LMS resource

`GET /api/v1/hello`

**Caller/auth/context.** Machine or LMS BFF presenting `Authorization: Bearer <access-token>`. No cookie,
CSRF header, query, or body. The token must be an access token for `urn:ose:lms-api`; ID/provider tokens
are rejected.

```http
GET /api/v1/hello HTTP/1.1
Host: 127.0.0.1:8303
Accept: application/json
Authorization: Bearer <ose-id-access-token-for-urn:ose:lms-api>
```

**Success.** The existing `200 application/json` response schema remains byte-compatible:

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: private, no-store

{
  "message": "Hello from OSE LMS"
}
```

The response body alone is:

```json
{
  "message": "Hello from OSE LMS"
}
```

Request-local security context additionally contains exact issuer, subject, context type, optional
company ID, and locally loaded permissions; none are added to the hello body.

**Failures.** `401 invalid_access_token` with `WWW-Authenticate: Bearer` for missing/malformed bearer,
wrong issuer/audience/algorithm/signature/key, expired/not-yet-valid time, missing subject, unknown or
structurally invalid context. `403 insufficient_lms_access` for a valid token lacking required LMS scope
or entitlement. `403 lms_authorization_denied` for a valid identity/context that lacks an LMS-local
permission on a protected domain operation. All bodies/timing/logs are non-disclosing.

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/problem+json
Cache-Control: private, no-store
WWW-Authenticate: Bearer

{
  "type": "urn:ose:lms:problem:invalid-access-token",
  "title": "Authentication required",
  "status": 401,
  "code": "invalid_access_token"
}
```

**Idempotency/concurrency/cache/privacy.** Safe read and naturally idempotent; no pagination, mutation,
or application rate limit. `Cache-Control: private, no-store`; token/claims/company membership are absent
from response, log fields, metrics labels, traces, and evidence. JWKS refresh is bounded and never turns
signature failure into anonymous access.

**Publication/compatibility/rollback.** OpenAPI adds bearer security and 401/403 responses while retaining
the existing 200 schema. Consumers must authenticate after the release; this intentional break is the
plan's product change. Rollback may restore the predecessor binary only while the local/test feature is
disabled; it must not introduce an LMS issuer or credential fallback.

**Gherkin anchor.** [LMS-HTTP-01](#lms-http-01), primary scenario
`A valid entitled personal token reaches the LMS API` in
`specs/apps/ose/lms-be/behaviours/security/resource-server.feature` belongs only to this indexed
operation. Supporting scenarios `Invalid token evidence is rejected as authentication failure`,
`A valid token without LMS entry authorization is forbidden`, and
`Role-like identity claims never grant LMS-domain authority` cover its stable error and authorization
branches. Unit, Integration, and E2E are required for every example row; no exemption applies.

### 2. Start LMS sign-in

`GET /auth/oidc/start?returnPath={safe-relative-path}`

**Caller/auth/context.** Browser. Existing LMS session is optional; context switch uses operation 5
instead. `returnPath` is optional and accepts only `/learning` in this slice. Absolute, scheme-relative,
encoded cross-origin, control-character, duplicate, or unknown query input fails.

```http
GET /auth/oidc/start?returnPath=%2Flearning HTTP/1.1
Host: 127.0.0.1:3400
Accept: text/html
```

**Success.** `303 See Other` to OSE ID `GET /connect/authorize` with the exact registered client,
callback, `response_type=code`, scopes, fresh state/nonce, and PKCE S256 challenge. The BFF persists a
single-use encrypted authorization transaction and emits no HTML/JSON body. Headers include `no-store`
and `Referrer-Policy: no-referrer`.

```http
HTTP/1.1 303 See Other
Location: http://127.0.0.1:8501/connect/authorize?<registered-opaque-query>
Cache-Control: no-store
Referrer-Policy: no-referrer
Set-Cookie: lms_oidc_transaction=<opaque>; Path=/auth/oidc/callback; Secure; HttpOnly; SameSite=Lax
Content-Length: 0
```

**Failures/lifecycle.** `400 invalid_request`; `429 rate_limited` plus integer `Retry-After`; or a safe
`503 dependency_unavailable` page when discovery/authorization is unreachable. Repeated navigation
creates a new transaction and invalidates/safely expires its predecessor according to the session policy;
one state is consumable once. No local password/debug/trusted-header fallback appears.

**Publication/rollback.** Document the redirect/query/error surface in the LMS web OpenAPI contract as a
browser callback operation; it is not an LMS API resource endpoint. Rollback removes the new web app and
returns dependency-unavailable for its port, not a fallback identity.

**Gherkin anchor.** [LMS-HTTP-02](#lms-http-02), primary scenario
`Start sign-in only for a safe LMS return path` in
`specs/apps/ose/lms-app-web/behaviours/authentication/sign-in.feature` belongs only to this indexed
operation. Supporting scenarios `Reject an unsafe sign-in start without contacting the issuer` and
`OSE ID unavailability never enables fallback identity` cover its stable failures. Unit, Integration,
and E2E are required.

### 3. Complete the LMS OIDC callback

`GET /auth/oidc/callback`

**Caller/auth/context.** OSE ID redirects the browser to the exact registered URI. Accepted query keys
are `state`, `code`, `error`, and `error_description`; exactly one of `code` or `error` is present. The
BFF ignores/redacts upstream description text.

**Request example.** Missing, duplicate, oversized, expired, replayed, or unbound values fail before
session creation.

```http
GET /auth/oidc/callback?state=<opaque>&code=<one-time> HTTP/1.1
Host: 127.0.0.1:3400
Cookie: lms_oidc_transaction=<opaque>
```

**Success.** The BFF validates state/nonce, redeems the code server-side with the original PKCE verifier,
validates the OSE ID response and LMS context, inserts one encrypted `lms_web_sessions` row, rotates the
opaque browser cookie, and returns `303 Location: /learning`. Session commit precedes redirect.

```http
HTTP/1.1 303 See Other
Location: /learning
Cache-Control: no-store
Referrer-Policy: no-referrer
Set-Cookie: lms_session=<opaque-rotated>; Path=/; Secure; HttpOnly; SameSite=Lax
Content-Length: 0
```

**Failures.** Cancellation redirects to `/auth/result?code=authorization_cancelled`; invalid/replayed/
expired transaction to the corresponding allowlisted safe result; lost entitlement/context to
`context_no_longer_eligible`; OSE ID outage to `dependency_unavailable`. The final URL, DOM, RSC payload,
storage, console, analytics, logs, trace, screenshot, and evidence contain no code/state/nonce/verifier/
token/upstream error/company detail.

**Concurrency/idempotency.** Atomic state consumption and unique cookie digest admit one successful
session. Concurrent callback replay creates no second row; the loser receives a safe replay result.
Instance A may start and instance B may complete using PostgreSQL/shared encryption configuration.

**Publication/rollback.** Add exact queries, redirects, and problem states to the LMS web OpenAPI contract.
Rollback revokes/retains encrypted rows for expiry; it never exports tokens or converts them to local
credentials.

**Gherkin anchor.** [LMS-HTTP-03](#lms-http-03), primary scenario
`Authorization Code with PKCE creates an opaque LMS session` in
`specs/apps/ose/lms-app-web/behaviours/authentication/sign-in.feature` belongs only to this indexed
operation. Supporting scenarios `A callback is consumed only once across web instances` and
`BFF failures use stable non-disclosing outcomes` cover replay and safe failures. Unit, Integration,
and E2E are required.

### 4. Read the current LMS session view

`GET /api/bff/auth/session`

**Request/auth.** Opaque LMS cookie; no query/body. The BFF loads only a non-revoked/non-expired row and
may revalidate upstream policy where the delivered contract requires it.

```http
GET /api/bff/auth/session HTTP/1.1
Host: 127.0.0.1:3400
Accept: application/json
Cookie: lms_session=<opaque>
```

**Success.** `200 application/json`:

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: private, no-store

{
  "authenticated": true,
  "context": {
    "type": "company",
    "companyId": "70000000-0000-4000-8000-000000000001",
    "displayName": "Company A"
  },
  "actions": {
    "switchContext": true,
    "logout": true
  }
}
```

The response body alone is:

```json
{
  "authenticated": true,
  "context": {
    "type": "company",
    "companyId": "70000000-0000-4000-8000-000000000001",
    "displayName": "Company A"
  },
  "actions": {
    "switchContext": true,
    "logout": true
  }
}
```

Personal context uses `companyId: null`. Signed-out/expired returns `401 authentication_required`, not
an account probe. No issuer subject email token role/permission/session-row field is serialized.

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/problem+json
Cache-Control: private, no-store

{
  "type": "urn:ose:lms:problem:authentication-required",
  "title": "Authentication required",
  "status": 401,
  "code": "authentication_required"
}
```

**Semantics.** Read-idempotent, non-paginated, no application rate limit, private/no-store. `actions` are
render hints; backend/API requests still authorize independently.

**Publication/compatibility/rollback.** Add the closed response/problem schemas and cookie security to
the LMS web OpenAPI contract. This additive BFF view has no predecessor consumer; field additions require
an explicit compatible version. Rollback removes the route, expires/retains encrypted session rows for
normal cleanup, and never serializes the stored access-token or ID-token-hint ciphertext.

**Gherkin anchor.** [LMS-HTTP-04](#lms-http-04), primary scenario
`Read only the safe current-session projection` in
`specs/apps/ose/lms-app-web/behaviours/authentication/sign-in.feature` belongs only to this indexed
operation. Supporting scenario `A missing or expired session is not an account probe` covers the stable
signed-out result. Unit, Integration, and E2E are required.

### 5. Start a fresh context switch

`POST /api/bff/auth/context-switch`

**Request/auth.** Current opaque session, exact origin/CSRF, and this closed JSON body:

```http
POST /api/bff/auth/context-switch HTTP/1.1
Host: 127.0.0.1:3400
Origin: http://127.0.0.1:3400
Content-Type: application/json
Cookie: lms_session=<opaque>
X-CSRF-Token: <session-bound-opaque>

{}
```

No company ID, context name, issuer, or return URL is accepted.

**Success.** The BFF revokes the old LMS session before creating a fresh upstream authorization
transaction, then returns `303` to OSE ID authorization with the same exact client/scopes and a context-
selection prompt. It does not copy Company A roles/data into the new transaction.

```http
HTTP/1.1 303 See Other
Location: http://127.0.0.1:8501/connect/authorize?<registered-opaque-query-with-context-selection>
Cache-Control: no-store
Referrer-Policy: no-referrer
Set-Cookie: lms_session=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0
Content-Length: 0
```

**Failures/lifecycle.** `401 authentication_required`; `403 csrf_invalid`; `429 rate_limited`; `503
dependency_unavailable`. If OSE ID later
denies/lost entitlement, the old session stays revoked and the safe result offers a fresh sign-in. One
concurrent old-session version wins; every other request receives authentication-required without
resurrecting it.

**Publication/rollback.** Add to LMS web OpenAPI. The operation is state-changing and never GET. Rollback
removes switching with the app; it does not permit header/query tenant selection.

**Gherkin anchor.** [LMS-HTTP-05](#lms-http-05), primary scenario
`Context switching carries no prior-company authority` in
`specs/apps/ose/lms-app-web/behaviours/authentication/context-switch.feature` belongs only to this
indexed operation. Supporting scenarios `Concurrent context-switch requests cannot resurrect the old
context` and `BFF failures use stable non-disclosing outcomes` cover concurrency and failures. Unit,
Integration, and E2E are required.

### 6. End an LMS session

`POST /api/bff/auth/logout`

**Request/auth.** Current session, origin/CSRF, and closed JSON:

```http
POST /api/bff/auth/logout HTTP/1.1
Host: 127.0.0.1:3400
Origin: http://127.0.0.1:3400
Content-Type: application/json
Cookie: lms_session=<opaque>
X-CSRF-Token: <session-bound-opaque>

{
  "mode": "lms_only"
}
```

`mode` is `lms_only` or `lms_and_ose_id`; unknown/extra fields fail.

**Success.** The BFF marks the LMS session revoked and clears the cookie before any redirect. `lms_only`
returns `200` with:

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
Set-Cookie: lms_session=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0

{
  "nextPath": "/"
}
```

`lms_and_ose_id` returns `200` with only the registered OSE ID end-session redirect descriptor; browser
navigation then uses it. Replaying an already revoked session is `204`/signed-out-equivalent and never
restores it.

The second mode uses the same request headers and a fresh current session:

```http
POST /api/bff/auth/logout HTTP/1.1
Host: 127.0.0.1:3400
Origin: http://127.0.0.1:3400
Content-Type: application/json
Cookie: lms_session=<opaque>
X-CSRF-Token: <session-bound-opaque>

{
  "mode": "lms_and_ose_id"
}
```

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
Set-Cookie: lms_session=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0

{
  "nextUrl": "http://127.0.0.1:8501/connect/logout?<registered-opaque-query>"
}
```

`nextUrl` is an absolute URL only because its origin and path are fixed by delivered OSE ID metadata and
the registered post-logout callback. The BFF rejects metadata drift; it never reflects a caller-provided
URL, state, or ID-token hint.

**Failures/lifecycle.** `401 authentication_required` for no recognizable session, `403 csrf_invalid`
for CSRF/origin, and `400 invalid_request` for invalid bodies.
Upstream logout failure after local revocation returns a safe `502 dependency_unavailable` recovery view
while LMS stays logged out. No ID-token hint appears in JSON/logs/browser storage; the BFF performs the
server-side redirect construction.

**Publication/rollback.** Add request enum, 200/204/4xx/502 schemas to LMS web OpenAPI. Rollback never
re-enables revoked rows.

**Gherkin anchor.** [LMS-HTTP-06](#lms-http-06), primary scenario outline
`Logout revokes LMS before leaving the app` in
`specs/apps/ose/lms-app-web/behaviours/authentication/logout.feature` belongs only to this indexed
operation and has one example per logout mode. Supporting scenario
`BFF failures use stable non-disclosing outcomes` covers safe failure branches. Unit, Integration, and
E2E are required.

### 7. Render the protected learning entry

`GET /learning`

**Caller/auth/context.** Browser with a valid opaque LMS session. It is a user-facing page contract, not
the backend resource API.

```http
GET /learning HTTP/1.1
Host: 127.0.0.1:3400
Accept: text/html
Cookie: lms_session=<opaque>
```

**Success.** `200 text/html` with current personal/company label and safe navigation; no protected domain
data is authorized solely by the page/BFF session. Signed-out redirects through operation 2 with exact
safe return. Expired/revoked/lost-context renders safe reauthorization. OSE ID unavailable is explicit
and offers retry/back without local credential controls.

```http
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Cache-Control: private, no-store

<main><h1>Learning</h1><p>Using Company A</p><nav aria-label="Account"><a href="/account">Account</a></nav></main>
```

**Failures.** Missing/expired/revoked session returns `303` to the safe sign-in start; lost context or
entitlement returns a `403` safe reauthorization page; identity dependency failure returns sanitized
`503`; render failure is sanitized `500`. No response authorizes learning data from a label.

**Privacy/cache/accessibility.** Private/no-store; no token/subject/company data beyond the selected safe
label in RSC payload/storage/logs. Keyboard/focus/status/responsive/localized states follow UI specs.

**Publication/compatibility/rollback.** Publish the page status/header/navigation/error contract under
the LMS web spec owner, outside the backend resource OpenAPI. This new protected route does not change
existing LMS API payloads. Rollback removes the page and BFF, revokes/expires its session rows, and never
adds a local credential or identity fallback.

**Gherkin anchor.** [LMS-HTTP-07](#lms-http-07), primary scenario
`Render protected learning content only for a current LMS session`
in `specs/apps/ose/lms-app-web/behaviours/authentication/sign-in.feature` belongs only to this indexed
operation. Supporting scenario `OSE ID unavailability never enables fallback identity` covers the
dependency failure. Component Unit, Next-server Integration, browser E2E, UI quality, and all three
live-web tester passes are required.

### 8. Retained OSE ID protocol contract

These operations remain owned by OSE ID and excluded from LMS OpenAPI. OSE ID discovery and protocol
specs are the machine-readable/standards ground truth; LMS adds no proxy endpoint. Every response is
non-cacheable when it carries user/protocol state, every limiter is privacy-preserving, and neither side
logs authorization codes, state, nonce, verifier, client secret, token, cookie, or private key.

#### 8.1 `GET /.well-known/openid-configuration`

**Request/auth/context.** Public `Accept: application/json`; no query, body, user, or company context.

```http
GET /.well-known/openid-configuration HTTP/1.1
Host: 127.0.0.1:8501
Accept: application/json
```

**Success and example.** `200 application/json` with a bounded public cache lifetime. The delivered
document advertises only Authorization Code, PKCE `S256`, the exact issuer/endpoints, supported scopes,
resources, and asymmetric algorithms. Representative subset:

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: public, max-age=300

{
  "issuer": "http://127.0.0.1:8501",
  "authorization_endpoint": "http://127.0.0.1:8501/connect/authorize",
  "token_endpoint": "http://127.0.0.1:8501/connect/token",
  "jwks_uri": "http://127.0.0.1:8501/connect/jwks",
  "response_types_supported": ["code"],
  "code_challenge_methods_supported": ["S256"]
}
```

**Errors/lifecycle.** `503 temporarily_unavailable` if complete safe metadata cannot be emitted. The
read is idempotent, non-paginated, race-free, and public-rate-limited. LMS validates issuer/endpoints/
algorithms before use and never accepts advertised drift silently.

**Gherkin anchor.** [LMS-HTTP-08](#lms-http-08), exact scenario
`Read the registered OSE ID discovery profile` in
`specs/apps/ose/lms-app-web/behaviours/authentication/sign-in.feature`; it belongs only to this retained
operation. LMS consumer Unit, Integration, and E2E plus retained OSE ID proof are required.

#### 8.2 `GET /connect/authorize`

**Request/auth/context.** Browser query contains the exact registered `client_id`, callback,
`response_type=code`, `scope`, `resource`, opaque `state`, `nonce`, PKCE challenge, and
`code_challenge_method=S256`; the authenticated person later chooses one server-offered personal or
company context. Representative request:

```http
GET /connect/authorize?client_id=ose-lms-app-web-local&redirect_uri=http%3A%2F%2F127.0.0.1%3A3400%2Fauth%2Foidc%2Fcallback&response_type=code&scope=openid%20profile%20ose.context%20ose.lms&resource=urn%3Aose%3Alms-api&state=%3Copaque%3E&nonce=%3Copaque%3E&code_challenge=%3CS256%3E&code_challenge_method=S256 HTTP/1.1
Host: 127.0.0.1:8501
```

**Success/errors/lifecycle.** One authorized decision returns `302` to the exact callback with one-time
code and original state. Untrusted redirect fails directly; redirect-safe failures use standard
`invalid_request`, `unauthorized_client`, `invalid_scope`, `access_denied`, or
`temporarily_unavailable`. Every start has a distinct expiring transaction; one terminal decision wins.
No caller-selected company becomes authority.

```http
HTTP/1.1 302 Found
Location: http://127.0.0.1:3400/auth/oidc/callback?code=<one-time>&state=<opaque>
Cache-Control: no-store
Pragma: no-cache
Content-Length: 0
```

**Gherkin anchor.** [LMS-HTTP-09](#lms-http-09), exact scenario
`Authorize only the registered LMS client` in
`specs/apps/ose/lms-app-web/behaviours/authentication/sign-in.feature`; it belongs only to this retained
operation. Unit, Integration, and E2E are required.

#### 8.3 `POST /connect/token`

**Request/auth/context.** Confidential LMS BFF uses `client_secret_basic` and form-encoded exact grant,
code, callback, and original verifier:

```http
POST /connect/token HTTP/1.1
Host: 127.0.0.1:8501
Content-Type: application/x-www-form-urlencoded
Authorization: Basic <redacted>

grant_type=authorization_code&code=<opaque>&redirect_uri=http%3A%2F%2F127.0.0.1%3A3400%2Fauth%2Foidc%2Fcallback&code_verifier=<43-128-character-verifier>
```

**Success and example.** `200 application/json`, `Cache-Control: no-store`, `Pragma: no-cache`:

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store
Pragma: no-cache

{
  "access_token": "<redacted-jwt>",
  "token_type": "Bearer",
  "expires_in": 300,
  "id_token": "<redacted-jwt>",
  "scope": "openid profile ose.context ose.lms"
}
```

**Errors/lifecycle.** `400 invalid_request|invalid_grant|unsupported_grant_type|invalid_scope`; client
failure is `401 invalid_client`. Atomic code consumption permits one success; replay/concurrent losers
receive `invalid_grant`. No refresh token is issued. The operation is non-paginated and client/network
rate-limited.

**Gherkin anchor.** [LMS-HTTP-10](#lms-http-10), exact scenario `Redeem one LMS authorization code` in
`specs/apps/ose/lms-app-web/behaviours/authentication/sign-in.feature`; it belongs only to this retained
operation. Unit, Integration, and E2E are required.

#### 8.4 `GET /connect/jwks`

**Request/auth/context.** Public `Accept: application/json`; no query/body/context.

```http
GET /connect/jwks HTTP/1.1
Host: 127.0.0.1:8501
Accept: application/json
```

**Success and example.** `200 application/json` with bounded public caching and only active/unexpired
verify-only public keys:

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: public, max-age=300

{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "kid": "<stable-key-id>",
      "alg": "RS256",
      "n": "<public-modulus>",
      "e": "AQAB"
    }
  ]
}
```

**Errors/lifecycle.** `503 temporarily_unavailable` instead of an empty/malformed set. Read-only,
idempotent, non-paginated, and public-rate-limited. Private/symmetric members are forbidden; safe key
overlap preserves validation during rotation.

**Gherkin anchor.** [LMS-HTTP-11](#lms-http-11), exact scenario `Load only OSE ID verification keys` in
`specs/apps/ose/lms-be/behaviours/security/resource-server.feature`; it belongs only to this retained
operation. Unit, Integration, and E2E are required.

#### 8.5 `POST /connect/revocation`

**Request/auth/context.** Owning confidential BFF, `client_secret_basic`, form token and optional hint:

```http
POST /connect/revocation HTTP/1.1
Host: 127.0.0.1:8501
Content-Type: application/x-www-form-urlencoded
Authorization: Basic <redacted>

token=<redacted>&token_type_hint=access_token
```

**Success/errors/lifecycle.** Standards `200` empty for valid, unknown, already-revoked, and concurrent
replay; malformed form is `400 invalid_request`, bad client is `401 invalid_client`. This intentional
non-oracular idempotency is non-paginated and client/network rate-limited. Rollback never resurrects
revoked state.

```http
HTTP/1.1 200 OK
Cache-Control: no-store
Pragma: no-cache
Content-Length: 0
```

**Gherkin anchor.** [LMS-HTTP-12](#lms-http-12), exact scenario `Revoke an LMS token without an oracle` in
`specs/apps/ose/lms-app-web/behaviours/authentication/logout.feature`; it belongs only to this retained
operation. Unit, Integration, and E2E are required.

#### 8.6 `GET /connect/logout`

**Request/auth/context.** Browser with OSE ID session and optional registered post-logout URI/state; no
body. GET only renders confirmation or a policy-approved continuation and never mutates the session.

```http
GET /connect/logout?post_logout_redirect_uri=http%3A%2F%2F127.0.0.1%3A3400%2Fauth%2Fsigned-out&state=<opaque> HTTP/1.1
Host: 127.0.0.1:8501
Accept: text/html
Cookie: ose_id_session=<opaque>
```

**Success/errors/lifecycle.** `200 text/html` or approved `302`, always `no-store`. An unregistered
return target is rejected/ignored with a safe local result, never followed. Read is idempotent,
non-paginated, and session/network rate-limited.

```http
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
Cache-Control: no-store
Referrer-Policy: no-referrer

<!doctype html><html lang="en"><body><main><h1>Sign out</h1><form method="post"><button type="submit">Sign out</button></form></main></body></html>
```

**Gherkin anchor.** [LMS-HTTP-13](#lms-http-13), exact scenario
`Render only a registered OSE ID logout continuation` in
`specs/apps/ose/lms-app-web/behaviours/authentication/logout.feature`; it belongs only to this retained
operation. Unit, Integration, and E2E are required.

#### 8.7 `POST /connect/logout`

**Request/auth/context.** Confirmed same-session form with exact origin, anti-forgery proof, and only a
registered return target:

```http
POST /connect/logout HTTP/1.1
Host: 127.0.0.1:8501
Content-Type: application/x-www-form-urlencoded

confirm=true&csrf=<redacted>&state=<opaque>
```

**Success/errors/lifecycle.** `302` only to the registered URI or `204` local completion after session/
grant consequences; `400 invalid_request`, `403 invalid_csrf`, or safe `401 session_absent`. Repeated/
concurrent submissions converge on signed-out state. The operation is non-paginated, per-session
rate-limited, `no-store`, and cannot be rolled back into an active session.

```http
HTTP/1.1 302 Found
Location: http://127.0.0.1:3400/auth/signed-out?state=<opaque>
Cache-Control: no-store
Set-Cookie: ose_id_session=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0
Content-Length: 0
```

**Gherkin anchor.** [LMS-HTTP-14](#lms-http-14), exact scenario
`Complete OSE ID logout without resurrecting a session` in
`specs/apps/ose/lms-app-web/behaviours/authentication/logout.feature`; it belongs only to this retained
operation. Unit, Integration, and E2E are required.

Phase 0 compares delivered metadata, registration, OpenID discovery, and protocol tests with these
packets. Any drift blocks for plan amendment; LMS never creates a second client, compatibility alias,
alternate issuer, grant, or unsigned-token fallback.

### 9. Retained local composition contract

The LMS runner consumes the Plan 09 JSON Schemas as machine-readable ground truth. It supplies only the
registered LMS client/resource, synthetic personal/company/entitlement fixtures, and collision-checked
outer ports; private descriptor contents never enter argv, stdout, evidence, or browser state.

#### 9.1 Start and hold

The outer runner invokes the exact versioned start target with absolute paths beneath its restrictive
owned temp root:

```bash
rtk ./hippo run --class service --disk-path . -- npm exec nx -- run ose-id-web-e2e:local-stack -- --input-manifest=/absolute/owned/input.json --public-descriptor=/absolute/owned/public.json
```

The closed input manifest is at most 256 KiB, mode `0600`, loopback-only, and schema-valid. It includes
schema version, unique stack ID, exact ports/client/audience/scopes, synthetic `.test` fixtures, and
feature switches—never real credentials, shell fragments, arbitrary SQL, cleanup selectors, or unsafe
paths. Exit codes remain `0`, `64`, `69`, `70`, `74`, and `78` with Plan 09 meanings. A duplicate stack
identity/resource fails without adoption or broad cleanup.

**Gherkin anchor.** [LMS-RUNNER-01](#lms-runner-01), exact scenario
`Start OSE ID through its public runner` in
`specs/apps/ose/lms-app-web/behaviours/local-stack/composition.feature`. Unit and E2E are required;
Integration uses the immediately preceding canonical per-scenario exemption comment and the E2E target
as alternative proof.

#### 9.2 Receive readiness and public descriptor

The parent passes a numeric inherited control descriptor out of band and accepts exactly one schema-
valid newline-delimited message:

```json
{
  "schemaVersion": "1.0",
  "kind": "ready",
  "stackId": "lms-auth-e2e-0001",
  "publicDescriptorPath": "/absolute/owned/public.json",
  "privateDescriptorPath": "/absolute/owned/private.json"
}
```

The atomic public descriptor may expose only loopback endpoints, registered client metadata, opaque
fixture references, and a sanitized diagnostic path. Readiness means every requested dependency and
both no-affinity paths are healthy; mismatched/duplicate/partial messages fail before LMS starts.

**Gherkin anchor.** [LMS-RUNNER-02](#lms-runner-02), exact scenario
`Accept one complete OSE ID ready message` in
`specs/apps/ose/lms-app-web/behaviours/local-stack/composition.feature`. Unit and E2E are required;
Integration uses the immediately preceding canonical per-scenario exemption comment and the E2E target
as alternative proof.

#### 9.3 Negotiate the runner contract version

Every manifest/message/descriptor/diagnostic uses `schemaVersion` major `1`. A compatible older `1.x`
minor is accepted only under its checked-in schema; unknown major or security-sensitive field returns
`64 unsupported_contract_version` before mutation. Removing/renaming fields, widening host/path rules,
or changing cleanup/exit semantics requires a new major plus consumer migration.

**Gherkin anchor.** [LMS-RUNNER-03](#lms-runner-03), exact scenario
`Reject an unsupported runner contract before mutation` in
`specs/apps/ose/lms-app-web/behaviours/local-stack/composition.feature`. Unit and E2E are required;
Integration uses the immediately preceding canonical per-scenario exemption comment and the E2E target
as alternative proof.

#### 9.4 Clean up the owned OSE ID stack

After stopping LMS-owned resources, the outer runner sends the exact private descriptor over the
control channel and invokes:

```bash
rtk ./hippo run --class transactional --disk-path . -- npm exec nx -- run ose-id-web-e2e:local-stack-cleanup -- --stack-id=lms-auth-e2e-0001
```

Cleanup validates stack ID, canonical path, owner/mode, labels, PID executable/start identity, and each
current target. Exit `0` means every manifest-owned process/container/network/volume/port/temp artifact
is gone; `64`, `70`, `74`, or `78` retains its Plan 09 meaning. Repetition with a valid terminal
diagnostic is idempotent. Failure diagnostics never replace the original causal exit code, expand a
glob/prefix, follow a symlink, or remove unowned resources.

**Gherkin anchor.** [LMS-RUNNER-04](#lms-runner-04), exact scenario
`Clean only the owned OSE ID stack` in
`specs/apps/ose/lms-app-web/behaviours/local-stack/composition.feature`. Unit and E2E are required;
Integration uses the immediately preceding canonical per-scenario exemption comment and the E2E target
as alternative proof.

The runner never copies OSE ID Compose/scripts, reads identity tables/private state, or kills inner
resources directly. App-only LMS points to the configured issuer and exposes a clear dependency failure,
not a fallback identity path. Rollback is allowed only after every owned stack is proven cleaned and no
consumer depends on the retained major version.

## Gherkin-Style Contract Scenarios

Canonical destinations are the LMS API and LMS web behavior files mapped in technical document 001.
These scenarios are app-scoped and copy-ready; plan requirement IDs stay outside the fences.

```gherkin
Feature: Protect LMS resources with OSE ID access tokens

  Scenario: A valid entitled personal token reaches the LMS API
    Given OSE ID issued an access token for the LMS audience and required scope and entitlement
    And the token carries one valid personal context without a company ID
    When the client requests GET /api/v1/hello with that token
    Then LMS returns the unchanged successful hello response
    And derives the request principal from OSE ID issuer and subject

  Scenario Outline: Invalid token evidence is rejected as authentication failure
    Given the presented bearer token has <fault>
    When the client requests GET /api/v1/hello
    Then LMS returns 401 with the generic invalid-access-token problem
    And creates no LMS session principal record tenant mapping or response detail

    Examples:
      | fault |
      | a wrong issuer |
      | a wrong audience |
      | an unapproved algorithm |
      | an invalid or unknown-key signature |
      | an expired or not-yet-valid time |
      | no subject |
      | an unknown context type |
      | personal context with a company ID |
      | company context without exactly one company ID |

  Scenario: A valid token without LMS entry authorization is forbidden
    Given a structurally valid OSE ID token lacks the required LMS scope or entitlement
    When the client requests GET /api/v1/hello
    Then LMS returns 403 with the generic insufficient-LMS-access problem
    And reveals no membership or entitlement detail

  Scenario: Role-like identity claims never grant LMS-domain authority
    Given a valid token contains a claim named instructor
    And the principal has no LMS-local instructor role
    When the principal requests an instructor-only LMS operation
    Then LMS returns the LMS-local authorization denial
    And does not treat the identity claim as a product role
```

```gherkin
Feature: Enter and leave LMS through OSE ID

  Scenario: Start sign-in only for a safe LMS return path
    Given a signed-out browser requests the protected learning page
    When LMS starts OIDC authorization for the safe relative return path /learning
    Then LMS stores one server-side state nonce and PKCE verifier transaction
    And redirects to the exact registered OSE ID authorization endpoint and callback
    And exposes no verifier client secret token or caller-selected company authority to the browser

  Scenario Outline: Reject an unsafe sign-in start without contacting the issuer
    Given the sign-in start request supplies <return-path>
    When LMS validates the requested return path
    Then LMS returns the stable invalid-request result
    And creates no OIDC transaction and performs no redirect

    Examples:
      | return-path |
      | an absolute cross-origin URL |
      | a scheme-relative URL |
      | an encoded cross-origin URL |
      | a control-character value |
      | a duplicate parameter |
      | an unknown local path |

  Scenario: Authorization Code with PKCE creates an opaque LMS session
    Given LMS is registered with its exact OSE ID callback audience scopes and PKCE S256
    When an entitled Person completes personal or company authorization
    Then LMS validates and redeems the callback server-side and redirects to the safe learning path
    And the browser stores only an opaque LMS session cookie
    And no authorization code verifier access refresh ID or provider token reaches browser JavaScript

  Scenario: A callback is consumed only once across web instances
    Given web instance A started one OIDC transaction
    When two callbacks for that state reach web instance B concurrently
    Then exactly one encrypted LMS session becomes active
    And the other callback receives the stable replay result
    And no protocol artifact appears in logs traces metrics or evidence

  Scenario: Read only the safe current-session projection
    Given the browser holds an active opaque LMS session for Company A
    When the browser requests the LMS session view
    Then LMS returns only authenticated state the safe Company A display context and available actions
    And returns private no-store cache controls
    And serializes no issuer subject email token role permission cookie digest or session-row field

  Scenario: A missing or expired session is not an account probe
    Given the browser cookie is absent expired revoked or unknown
    When the browser requests the LMS session view
    Then LMS returns the same stable authentication-required problem
    And reveals no account company membership entitlement or prior-session detail

  Scenario: Context switching carries no prior-company authority
    Given one OSE subject has an LMS session for Company A and eligibility for Company B
    When the browser starts a context switch and authorizes Company B at OSE ID
    Then LMS revokes the Company A session before binding a rotated session only to Company B
    And no Company A data or LMS role is carried into Company B

  Scenario: Concurrent context-switch requests cannot resurrect the old context
    Given the browser has one active LMS session for Company A
    When two valid context-switch commands race on that session version
    Then exactly one command revokes the Company A session and starts fresh OSE ID authorization
    And the other command receives the stable authentication-required result
    And neither command accepts a browser-supplied company ID or return URL

  Scenario Outline: Logout revokes LMS before leaving the app
    Given the browser has an active LMS session
    When the user chooses <mode>
    Then LMS revokes the local session and clears its cookie before redirecting
    And a protected LMS page requires authorization again

    Examples:
      | mode |
      | sign out of LMS only |
      | sign out of LMS and OSE ID |

  Scenario: OSE ID unavailability never enables fallback identity
    Given LMS cannot reach its configured OSE ID issuer
    When a person starts or refreshes an authenticated journey
    Then LMS shows the stable identity-dependency-unavailable result
    And accepts no local password debug principal trusted identity header unsigned token or alternate issuer

  Scenario: Render protected learning content only for a current LMS session
    Given a browser requests the protected learning page
    When LMS resolves the opaque browser session
    Then an active session renders only its selected safe context label with private no-store caching
    And an absent expired revoked or ineligible session follows the safe reauthorization journey
    And protected learning data is never authorized from a page label or browser-selected context

  Scenario Outline: BFF failures use stable non-disclosing outcomes
    Given an LMS authentication operation encounters <condition>
    When the BFF returns the operation result
    Then the response uses the documented safe status and stable code for <condition>
    And the response log trace metric browser storage and rendered page reveal no protocol artifact or hidden authority

    Examples:
      | condition |
      | malformed or extra input |
      | missing authentication |
      | invalid origin or CSRF proof |
      | expired or replayed OIDC state |
      | authorization cancellation |
      | context no longer eligible |
      | an unavailable identity dependency |
      | an exceeded privacy-preserving rate limit |
```

```gherkin
Feature: Consume the delivered OSE ID and local-runner contracts unchanged

  Scenario: Use only the registered OSE ID protocol profile
    Given OSE ID publishes the delivered discovery authorization token JWKS revocation and logout contract
    When LMS initializes its confidential client and resource verifier
    Then LMS uses the exact issuer client redirect audience scopes algorithms and PKCE S256 profile
    And creates no proxy issuer compatibility alias alternate grant or unsigned fallback

  Scenario: Read the registered OSE ID discovery profile
    Given LMS is configured for the delivered OSE ID issuer
    When LMS reads the OpenID discovery document
    Then it observes the exact issuer endpoints code flow scopes algorithms and PKCE S256 metadata
    And rejects incomplete conflicting or silently changed metadata

  Scenario: Authorize only the registered LMS client
    Given LMS starts authorization with its registered client callback audience scopes state nonce and PKCE challenge
    When OSE ID processes the authorization request
    Then OSE ID returns only to the exact callback with one one-time code and the original state
    And no caller-selected company or unregistered redirect becomes authority

  Scenario: Redeem one LMS authorization code
    Given LMS holds the matching callback transaction and PKCE verifier
    When LMS redeems the one-time authorization code
    Then OSE ID returns one no-store ID token and LMS access token response
    And concurrent or replayed redemption cannot create another successful result

  Scenario: Load only OSE ID verification keys
    Given LMS validates access tokens from the delivered OSE ID issuer
    When LMS loads the published JWKS
    Then it receives only bounded-cache verify-only public keys with safe overlap
    And never accepts an empty malformed private symmetric or unapproved key set

  Scenario: Revoke an LMS token without an oracle
    Given the confidential LMS client holds an OSE ID token reference
    When LMS submits that reference to the revocation endpoint
    Then OSE ID returns the same empty success for valid unknown already-revoked and concurrent requests
    And the response reveals no token state or owner

  Scenario: Render only a registered OSE ID logout continuation
    Given the browser has an OSE ID session reached through LMS
    When it opens the OSE ID logout endpoint
    Then OSE ID renders a no-store confirmation or only a registered continuation
    And does not mutate the session or follow an unregistered return target

  Scenario: Complete OSE ID logout without resurrecting a session
    Given the browser confirms logout with valid same-session anti-forgery proof
    When OSE ID completes the logout command
    Then it reaches signed-out state and returns only a registered continuation or empty completion
    And repeated or concurrent submission cannot restore the session

  # Exemption(integration): start and hold spans the external OSE ID process tree rather than an in-process local resource; alternative-proof: ose-lms-app-web-e2e:test:e2e / Start OSE ID through its public runner
  @integration-exempt
  Scenario: Start OSE ID through its public runner
    Given the LMS authenticated-stack runner has a valid OSE ID input manifest
    When the runner starts the dependent identity stack through the public versioned target
    Then OSE ID holds until the owning LMS runner requests cleanup
    And never copies OSE ID scripts reads its private state or kills its inner resources directly

  # Exemption(integration): readiness crosses the inherited control descriptor and external OSE ID process tree; alternative-proof: ose-lms-app-web-e2e:test:e2e / Accept one complete OSE ID ready message
  @integration-exempt
  Scenario: Accept one complete OSE ID ready message
    Given the LMS runner started OSE ID with an inherited control descriptor
    When OSE ID reports readiness
    Then LMS accepts exactly one schema-valid complete ready message and public descriptor
    And rejects a mismatched duplicate partial or private-value-bearing message before LMS starts

  # Exemption(integration): version admission belongs to the external OSE ID runner boundary; alternative-proof: ose-lms-app-web-e2e:test:e2e / Reject an unsupported runner contract before mutation
  @integration-exempt
  Scenario: Reject an unsupported runner contract before mutation
    Given the LMS runner provides an unknown major version or security-sensitive unknown field
    When OSE ID validates the local-stack input contract
    Then OSE ID returns the stable unsupported-contract result before creating a process file network or container
    And LMS creates no outer application resource

  # Exemption(integration): cleanup owns an external process container network and volume manifest; alternative-proof: ose-lms-app-web-e2e:test:e2e / Clean only the owned OSE ID stack
  @integration-exempt
  Scenario: Clean only the owned OSE ID stack
    Given LMS has stopped its resources and holds the exact OSE ID cleanup handle
    When LMS invokes the public OSE ID cleanup operation twice
    Then both calls preserve the primary status and remove only resources in that ownership manifest
    And no owned process port container network volume or temporary artifact remains

  # Exemption(integration): nested failure cleanup spans both external process trees; alternative-proof: ose-lms-app-web-e2e:test:e2e / A nested-stack failure preserves cause and complete cleanup
  @integration-exempt
  Scenario: A nested-stack failure preserves cause and complete cleanup
    Given one required OSE ID or LMS child fails readiness
    When the authenticated-stack runner unwinds
    Then it preserves the earliest causal exit status
    And attempts cleanup for every resource recorded in both ownership manifests
    And reports cleanup failures separately without exposing secrets or retaining owned resources
```

### Scenario Anchor Catalog

These plan-only IDs are stable Markdown targets for the detailed packets. IDs stay outside copy-ready
Gherkin; exact titles are the durable scenario identity.

#### LMS-HTTP-01

- **Operation:** `UPDATE GET /api/v1/hello`.
- **Exact title:** `A valid entitled personal token reaches the LMS API`.
- **Canonical destination:** `specs/apps/ose/lms-be/behaviours/security/resource-server.feature`.
- **Disposition:** Unit, Integration, and E2E required; no exemption.

#### LMS-HTTP-02

- **Operation:** `ADD GET /auth/oidc/start`.
- **Exact title:** `Start sign-in only for a safe LMS return path`.
- **Canonical destination:** `specs/apps/ose/lms-app-web/behaviours/authentication/sign-in.feature`.
- **Disposition:** Unit, Integration, and E2E required; no exemption.

#### LMS-HTTP-03

- **Operation:** `ADD GET /auth/oidc/callback`.
- **Exact title:** `Authorization Code with PKCE creates an opaque LMS session`.
- **Canonical destination:** `specs/apps/ose/lms-app-web/behaviours/authentication/sign-in.feature`.
- **Disposition:** Unit, Integration, and E2E required; no exemption.

#### LMS-HTTP-04

- **Operation:** `ADD GET /api/bff/auth/session`.
- **Exact title:** `Read only the safe current-session projection`.
- **Canonical destination:** `specs/apps/ose/lms-app-web/behaviours/authentication/sign-in.feature`.
- **Disposition:** Unit, Integration, and E2E required; no exemption.

#### LMS-HTTP-05

- **Operation:** `ADD POST /api/bff/auth/context-switch`.
- **Exact title:** `Context switching carries no prior-company authority`.
- **Canonical destination:**
  `specs/apps/ose/lms-app-web/behaviours/authentication/context-switch.feature`.
- **Disposition:** Unit, Integration, and E2E required; no exemption.

#### LMS-HTTP-06

- **Operation:** `ADD POST /api/bff/auth/logout`.
- **Exact title:** `Logout revokes LMS before leaving the app`.
- **Canonical destination:** `specs/apps/ose/lms-app-web/behaviours/authentication/logout.feature`.
- **Disposition:** Unit, Integration, and E2E required; no exemption.

#### LMS-HTTP-07

- **Operation:** `ADD GET /learning`.
- **Exact title:** `Render protected learning content only for a current LMS session`.
- **Canonical destination:** `specs/apps/ose/lms-app-web/behaviours/authentication/sign-in.feature`.
- **Disposition:** Unit, Integration, and E2E required; no exemption.

#### LMS-HTTP-08

- **Operation:** `RETAIN GET /.well-known/openid-configuration`.
- **Exact title:** `Read the registered OSE ID discovery profile`.
- **Canonical destination:** `specs/apps/ose/lms-app-web/behaviours/authentication/sign-in.feature`.
- **Disposition:** LMS consumer Unit, Integration, and E2E plus retained OSE ID proof; no exemption.

#### LMS-HTTP-09

- **Operation:** `RETAIN GET /connect/authorize`.
- **Exact title:** `Authorize only the registered LMS client`.
- **Canonical destination:** `specs/apps/ose/lms-app-web/behaviours/authentication/sign-in.feature`.
- **Disposition:** Unit, Integration, and E2E required; no exemption.

#### LMS-HTTP-10

- **Operation:** `RETAIN POST /connect/token`.
- **Exact title:** `Redeem one LMS authorization code`.
- **Canonical destination:** `specs/apps/ose/lms-app-web/behaviours/authentication/sign-in.feature`.
- **Disposition:** Unit, Integration, and E2E required; no exemption.

#### LMS-HTTP-11

- **Operation:** `RETAIN GET /connect/jwks`.
- **Exact title:** `Load only OSE ID verification keys`.
- **Canonical destination:** `specs/apps/ose/lms-be/behaviours/security/resource-server.feature`.
- **Disposition:** Unit, Integration, and E2E required; no exemption.

#### LMS-HTTP-12

- **Operation:** `RETAIN POST /connect/revocation`.
- **Exact title:** `Revoke an LMS token without an oracle`.
- **Canonical destination:** `specs/apps/ose/lms-app-web/behaviours/authentication/logout.feature`.
- **Disposition:** Unit, Integration, and E2E required; no exemption.

#### LMS-HTTP-13

- **Operation:** `RETAIN GET /connect/logout`.
- **Exact title:** `Render only a registered OSE ID logout continuation`.
- **Canonical destination:** `specs/apps/ose/lms-app-web/behaviours/authentication/logout.feature`.
- **Disposition:** Unit, Integration, and E2E required; no exemption.

#### LMS-HTTP-14

- **Operation:** `RETAIN POST /connect/logout`.
- **Exact title:** `Complete OSE ID logout without resurrecting a session`.
- **Canonical destination:** `specs/apps/ose/lms-app-web/behaviours/authentication/logout.feature`.
- **Disposition:** Unit, Integration, and E2E required; no exemption.

#### LMS-RUNNER-01

- **Operation:** `RETAIN ose-id-web-e2e:local-stack start/hold`.
- **Exact title:** `Start OSE ID through its public runner`.
- **Canonical destination:** `specs/apps/ose/lms-app-web/behaviours/local-stack/composition.feature`.
- **Disposition:** Unit and E2E required; Integration uses the scenario's canonical exemption comment and
  named E2E alternative proof.

#### LMS-RUNNER-02

- **Operation:** `RETAIN OSE ID runner ready/control message`.
- **Exact title:** `Accept one complete OSE ID ready message`.
- **Canonical destination:** `specs/apps/ose/lms-app-web/behaviours/local-stack/composition.feature`.
- **Disposition:** Unit and E2E required; Integration uses the scenario's canonical exemption comment and
  named E2E alternative proof.

#### LMS-RUNNER-03

- **Operation:** `RETAIN OSE ID runner schema-version negotiation`.
- **Exact title:** `Reject an unsupported runner contract before mutation`.
- **Canonical destination:** `specs/apps/ose/lms-app-web/behaviours/local-stack/composition.feature`.
- **Disposition:** Unit and E2E required; Integration uses the scenario's canonical exemption comment and
  named E2E alternative proof.

#### LMS-RUNNER-04

- **Operation:** `RETAIN ose-id-web-e2e:local-stack-cleanup`.
- **Exact title:** `Clean only the owned OSE ID stack`.
- **Canonical destination:** `specs/apps/ose/lms-app-web/behaviours/local-stack/composition.feature`.
- **Disposition:** Unit and E2E required; Integration uses the scenario's canonical exemption comment and
  named E2E alternative proof.

### Canonical destination and operation mapping

This mapping is outside the copy-ready fences so plan traceability does not enter durable product
language. Every indexed HTTP operation has exactly one unique primary scenario anchor. Supporting error,
replay, authorization, and privacy scenarios remain named in its detailed packet but are not reused as
the operation's primary anchor.

| Indexed operation                                 | Canonical destination                                                                                                                                                                                                          | Exact scenario title(s)                                            | Required adapters                                                                                 |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `UPDATE GET /api/v1/hello`                        | `specs/apps/ose/lms-be/behaviours/hello/hello.feature`; `specs/apps/ose/lms-be/behaviours/security/resource-server.feature`                                                                                                    | `A valid entitled personal token reaches the LMS API`              | Unit, Integration, E2E                                                                            |
| `ADD GET /auth/oidc/start`                        | `specs/apps/ose/lms-app-web/behaviours/authentication/sign-in.feature`                                                                                                                                                         | `Start sign-in only for a safe LMS return path`                    | Unit, Integration, E2E                                                                            |
| `ADD GET /auth/oidc/callback`                     | `specs/apps/ose/lms-app-web/behaviours/authentication/sign-in.feature`                                                                                                                                                         | `Authorization Code with PKCE creates an opaque LMS session`       | Unit, Integration, E2E                                                                            |
| `ADD GET /api/bff/auth/session`                   | `specs/apps/ose/lms-app-web/behaviours/authentication/sign-in.feature`                                                                                                                                                         | `Read only the safe current-session projection`                    | Unit, Integration, E2E                                                                            |
| `ADD POST /api/bff/auth/context-switch`           | `specs/apps/ose/lms-app-web/behaviours/authentication/context-switch.feature`                                                                                                                                                  | `Context switching carries no prior-company authority`             | Unit, Integration, E2E                                                                            |
| `ADD POST /api/bff/auth/logout`                   | `specs/apps/ose/lms-app-web/behaviours/authentication/logout.feature`                                                                                                                                                          | `Logout revokes LMS before leaving the app`                        | Unit, Integration, E2E                                                                            |
| `ADD GET /learning`                               | `specs/apps/ose/lms-app-web/behaviours/authentication/sign-in.feature`                                                                                                                                                         | `Render protected learning content only for a current LMS session` | Unit, Integration, E2E                                                                            |
| `RETAIN GET /.well-known/openid-configuration`    | `specs/apps/ose/lms-app-web/behaviours/authentication/sign-in.feature`; `specs/apps/ose/id-be/behaviours/authorization/request-validation.feature`                                                                             | `Read the registered OSE ID discovery profile`                     | Unit, Integration, E2E through LMS consumer proof plus retained OSE ID proof                      |
| `RETAIN GET /connect/authorize`                   | `specs/apps/ose/lms-app-web/behaviours/authentication/sign-in.feature`; `specs/apps/ose/id-be/behaviours/authorization/authorization-code.feature`; `specs/apps/ose/id-be/behaviours/authorization/request-validation.feature` | `Authorize only the registered LMS client`                         | Unit, Integration, E2E                                                                            |
| `RETAIN POST /connect/token`                      | `specs/apps/ose/lms-app-web/behaviours/authentication/sign-in.feature`; `specs/apps/ose/id-be/behaviours/tokens/token-safety.feature`                                                                                          | `Redeem one LMS authorization code`                                | Unit, Integration, E2E                                                                            |
| `RETAIN GET /connect/jwks`                        | `specs/apps/ose/lms-be/behaviours/security/resource-server.feature`; `specs/apps/ose/id-be/behaviours/keys/signing-key-lifecycle.feature`                                                                                      | `Load only OSE ID verification keys`                               | Unit, Integration, E2E                                                                            |
| `RETAIN POST /connect/revocation`                 | `specs/apps/ose/lms-app-web/behaviours/authentication/logout.feature`; `specs/apps/ose/id-be/behaviours/tokens/revocation.feature`                                                                                             | `Revoke an LMS token without an oracle`                            | Unit, Integration, E2E                                                                            |
| `RETAIN GET /connect/logout`                      | `specs/apps/ose/lms-app-web/behaviours/authentication/logout.feature`; `specs/apps/ose/id-be/behaviours/sessions/logout.feature`                                                                                               | `Render only a registered OSE ID logout continuation`              | Unit, Integration, E2E                                                                            |
| `RETAIN POST /connect/logout`                     | `specs/apps/ose/lms-app-web/behaviours/authentication/logout.feature`; `specs/apps/ose/id-be/behaviours/sessions/logout.feature`                                                                                               | `Complete OSE ID logout without resurrecting a session`            | Unit, Integration, E2E                                                                            |
| `RETAIN ose-id-web-e2e:local-stack start/hold`    | `specs/apps/ose/lms-app-web/behaviours/local-stack/composition.feature`                                                                                                                                                        | `Start OSE ID through its public runner`                           | Unit and E2E; Integration exemption uses the exact per-scenario comment in technical document 001 |
| `RETAIN OSE ID runner ready/control message`      | `specs/apps/ose/lms-app-web/behaviours/local-stack/composition.feature`                                                                                                                                                        | `Accept one complete OSE ID ready message`                         | Unit and E2E; Integration exemption uses the exact per-scenario comment in technical document 001 |
| `RETAIN OSE ID runner schema-version negotiation` | `specs/apps/ose/lms-app-web/behaviours/local-stack/composition.feature`                                                                                                                                                        | `Reject an unsupported runner contract before mutation`            | Unit and E2E; Integration exemption uses the exact per-scenario comment in technical document 001 |
| `RETAIN ose-id-web-e2e:local-stack-cleanup`       | `specs/apps/ose/lms-app-web/behaviours/local-stack/composition.feature`                                                                                                                                                        | `Clean only the owned OSE ID stack`                                | Unit and E2E; Integration exemption uses the exact per-scenario comment in technical document 001 |

## Proof, Contract Publication, and Rollback

| Surface          | Unit                                                                    | Integration                                                                       | E2E/live                                                              |
| ---------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| LMS resource API | token/claim/context/error/policy mapping                                | real Spring Security discovery/JWKS/filter                                        | built API full trust matrix and role-claim denial                     |
| LMS BFF          | return/redirect, state/nonce/PKCE, session/cookie/CSRF, error/redaction | real route handlers, OSE ID client, session PostgreSQL/encryption/instance switch | browser sign-in/cancel/switch/logout/unavailable/leak/a11y/responsive |
| Composition      | parser/lifecycle state machine                                          | nested descriptor/control/ownership adapters where applicable                     | full OSE ID + LMS stack twice plus injected failure/cleanup           |

The API quality gate runs in strict mode against the registered LMS backend default
`http://127.0.0.1:8303` with the LMS OpenAPI, and against `http://127.0.0.1:3400` with the LMS web OpenAPI. The
static UI gate and sequential live exploratory/usability/design testers cover the web source/rendered
surface separately. `partial`, `fail`, pending lifecycle evidence, or unresolved findings block delivery.

Rollback removes the LMS web app/registration integration and restores the predecessor LMS API only as
an explicitly reviewed rollback; session rows remain terminal while token/hint/CSRF material is erased. It never creates local
credentials, accepts unsigned/shared tokens, or weakens issuer/audience/context/role boundaries.
