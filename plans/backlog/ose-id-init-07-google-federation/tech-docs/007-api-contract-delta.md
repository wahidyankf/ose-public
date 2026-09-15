# API Contract Delta

## Contract Boundary

The authoritative account/federation API remains `ose-id-be` at `http://127.0.0.1:8501`. The
first-party browser uses same-origin `ose-id-web` routes at `http://127.0.0.1:3500`; it never calls the
backend or Google token endpoint directly. Backend operations consume the server-side session transport
already delivered by the first-party web slice—this plan adds no browser-supplied identity header,
client secret, bearer-token storage, or alternate issuer.

`specs/apps/ose/id-be/contracts/google-federation.openapi.yaml` is the machine-readable backend
contract. `specs/apps/ose/id-web/contracts/google-federation.openapi.yaml` is the machine-readable contract for the
same-origin BFF operations. The browser callback and page routes are documented extensions in the BFF
file so the running-surface gate has one OpenAPI ground truth, even though they are not backend REST
operations.

Google is an upstream login mechanism. These operations do not change OSE ID's downstream OIDC/OAuth
issuer, discovery metadata, token endpoint, audience, scopes, claims, or client registrations.

## Operation Index

| Action | Method and exact path                                    | Owner/caller                 | Detailed section                                                          |
| ------ | -------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------- |
| ADD    | `POST /api/v1/federation/google/challenges`              | backend; first-party BFF     | [Create a challenge](#1-create-a-google-challenge)                        |
| ADD    | `POST /api/v1/federation/google/callbacks`               | backend; first-party BFF     | [Consume a callback](#2-consume-a-google-callback)                        |
| ADD    | `GET /api/v1/account/provider-links`                     | backend; authenticated BFF   | [List provider links](#3-list-current-person-provider-links)              |
| ADD    | `DELETE /api/v1/account/provider-links/{providerLinkId}` | backend; authenticated BFF   | [Unlink a provider](#4-unlink-a-provider)                                 |
| ADD    | `POST /api/bff/federation/google/start`                  | web; same-origin browser     | [Start sign-in](#5-start-google-sign-in-in-the-bff)                       |
| ADD    | `GET /auth/google/callback`                              | web; Google/browser callback | [Browser callback](#6-complete-the-browser-callback)                      |
| ADD    | `POST /api/bff/account/federation/google/link`           | web; authenticated browser   | [Start linking](#7-start-google-linking-in-the-bff)                       |
| ADD    | `DELETE /api/bff/account/federation/google`              | web; authenticated browser   | [Unlink in the BFF](#8-unlink-google-in-the-bff)                          |
| UPDATE | `GET /sign-in`                                           | web page                     | [Sign-in presentation](#9-update-sign-in-presentation)                    |
| UPDATE | `GET /account/security`                                  | web page                     | [Account-security presentation](#10-update-account-security-presentation) |
| RETAIN | `GET /.well-known/openid-configuration`                  | backend; registered clients  | [Discovery](#11-retain-discovery-metadata)                                |
| RETAIN | `GET /connect/authorize`                                 | backend; registered clients  | [Authorization](#12-retain-the-authorization-endpoint)                    |
| RETAIN | `POST /connect/token`                                    | backend; registered clients  | [Token](#13-retain-the-token-endpoint)                                    |
| RETAIN | `GET /connect/jwks`                                      | backend; registered clients  | [JWKS](#14-retain-the-jwks-endpoint)                                      |
| RETAIN | `POST /connect/revocation`                               | backend; registered clients  | [Revocation](#15-retain-the-revocation-endpoint)                          |
| RETAIN | `GET /connect/logout`                                    | backend; registered clients  | [Logout confirmation](#16-retain-the-logout-confirmation-endpoint)        |
| RETAIN | `POST /connect/logout`                                   | backend; registered clients  | [Logout command](#17-retain-the-logout-command-endpoint)                  |
| RETAIN | `GET /external/google/challenge`                         | backend; unsupported callers | [Legacy disabled seam](#18-retain-the-legacy-disabled-google-seam)        |

There is no contract deletion.

## Shared Wire and Safety Rules

- Backend JSON requests and successes use `application/json`; failures use
  `application/problem+json` with only the fields `type`, `title`, `status`, `code`, and
  `correlationId`, and no upstream body.
- BFF mutations require exact same origin, the Plan 05 CSRF proof, JSON content type, request-size
  limit, and an opaque `HttpOnly` web-session cookie when authentication is required.
- Every response is `Cache-Control: no-store`. Redirects also carry `Referrer-Policy: no-referrer`.
- `returnPath` accepts only `/authorize/context`, `/authorize/consent`, `/account/security`, or `/`.
  Absolute, scheme-relative, encoded cross-origin, control-character, and unregistered values fail.
- `providerLinkId`, `transactionId`, and `correlationId` are opaque UUIDs. Browser responses never
  contain provider subject, provider tokens, authorization code, nonce, state, protected payload,
  upstream body, backend session identifier, company data, or email-as-identity.
- Rate limits use shared PostgreSQL buckets. The exact numeric policy is configuration, but tests bind
  accepted/boundary/blocked behavior and `Retry-After`; per-instance counters are forbidden.

## Detailed Operation Contracts

### 1. Create a Google challenge

`POST /api/v1/federation/google/challenges`

**Caller/auth/context.** Only the first-party BFF through the delivered server-side backend client.
`purpose=sign_in` may be signed out; `purpose=link` requires the current active Person and recent
authentication. Company context is ignored because provider links are Person-global.

**Headers and request.** `Content-Type: application/json` and `Idempotency-Key` containing 16–128
visible ASCII characters are required. Unknown JSON fields fail.

```json
{
  "purpose": "sign_in",
  "callbackUri": "http://127.0.0.1:3500/auth/google/callback",
  "returnPath": "/authorize/context"
}
```

`purpose` is exactly `sign_in` or `link`; `callbackUri` must equal the locally registered Google
callback; `returnPath` follows the shared allowlist.

**Success.** `201 Created`, `Location: /api/v1/federation/google/challenges/{transactionId}` and:

```json
{
  "transactionId": "10000000-0000-4000-8000-000000000007",
  "authorizationUrl": "http://127.0.0.1:8502/authorize?<provider-generated-query>",
  "expiresAt": "2026-09-15T10:05:00Z"
}
```

The authorization URL uses only registered issuer/client/callback values and fresh state, nonce, and
PKCE. It is never logged. Repeating the same idempotency key and canonical request in the same session
returns the same unconsumed transaction; reusing the key with a different request returns `409
idempotency_conflict`.

**Failures.** `400 invalid_request`; `401 unauthenticated` for link without a Person; `403
recent_auth_required`; `409 idempotency_conflict`; `429 rate_limited` with `Retry-After`; `503
provider_disabled` or `provider_temporarily_unavailable`. No failure reveals provider registration,
account existence, link ownership, or upstream text.

**Publication/compatibility.** Add the path, schemas, examples, problem codes, and operation ID
`createGoogleFederationChallenge` to split backend OpenAPI; regenerate the first-party client through
its owner target. The route is additive and disabled by default. Rollback disables it and lets pending
transactions expire; it never deletes rows.

**Exact Gherkin proof.** [“A sign-in challenge uses only registered and allowlisted values” and “A
link challenge requires the current Person and recent authentication”](#google-challenge-contract-scenarios)
target `specs/apps/ose/id-be/behaviours/federation/google-federation.feature`; Unit, Integration, and
E2E required, no exemption.

### 2. Consume a Google callback

`POST /api/v1/federation/google/callbacks`

**Caller/auth/context.** First-party BFF only. The backend derives purpose, Person, callback, and safe
return path from the single-use transaction; caller fields cannot override them.

**Headers and request.** `Content-Type: application/json`. Exactly one of `code` or `error` is allowed;
`state` is always required. Values are bounded opaque strings and are redacted before logging.

```json
{
  "state": "<opaque-provider-state>",
  "code": "<one-time-provider-code>"
}
```

Denial uses:

```json
{
  "state": "<opaque-provider-state>",
  "error": "access_denied"
}
```

Unknown error values normalize to `provider_response_invalid`.

**Success.** `200 OK`. A sign-in response is:

```json
{
  "outcome": "signed_in",
  "nextPath": "/authorize/context"
}
```

A link response is:

```json
{
  "outcome": "linked",
  "nextPath": "/account/security"
}
```

The server-side session transport rotates only after provider-link/Person transaction commit. A new provider subject creates
one Person and link transactionally; an existing active subject loads its Person; matching email alone
never links. Upstream tokens are disposed before return.

**Failures.** `400 invalid_request` or `provider_response_invalid`; `401 unauthenticated` when a link
transaction's Person session is no longer valid; `403 recent_auth_required`; `409
provider_transaction_replayed` or `provider_link_conflict`; `410 provider_transaction_expired`; `429
rate_limited`; `502 provider_temporarily_unavailable`. Denial is a safe `400 provider_denied`. Every
failure consumes only its own valid transaction according to the physical state machine and never
creates a session, Person, or link.

**Replay/concurrency/privacy.** The state digest atomic update admits one callback. Concurrent
first-sign-in callbacks for the same issuer/subject produce one Person/link and one generic conflict.
State, code, nonce, issuer subject, claims, tokens, and provider errors are absent from response, logs,
metrics labels, traces, audit payload, and evidence.

**Publication/compatibility.** OpenAPI operation ID `consumeGoogleFederationCallback`; request fields are
`writeOnly`. The generated client marks the method server-only. Rollback disables callbacks; already
created OSE accounts remain valid through their other methods, and provider rows are retained.

**Exact Gherkin proof.** [“One valid callback creates one account result”, “Matching email never links
an upstream subject”, and “Unsafe callback input fails without a session or link”](#google-callback-contract-scenarios)
target `specs/apps/ose/id-be/behaviours/federation/google-federation.feature`; Unit, Integration, and
E2E required, no exemption.

### 3. List current-Person provider links

`GET /api/v1/account/provider-links`

**Caller/auth/context.** Authenticated first-party BFF. The Person comes only from the current server
session. Query, header, or company selection cannot choose another Person.

**Request.** No body, path parameter, or query parameter. `Accept: application/json` is optional.

**Success.** `200 OK`:

```json
{
  "items": [
    {
      "providerLinkId": "20000000-0000-4000-8000-000000000007",
      "provider": "google",
      "displayName": "Google",
      "lastAuthenticatedAt": "2026-09-15T10:00:00Z",
      "canUnlink": true,
      "version": 3
    }
  ]
}
```

The list is non-paginated because the plan permits one provider and one active link. It returns an
empty `items` array, never `404`. `canUnlink` is a hint; the delete operation re-evaluates last-method
and recent-auth policy.

**Failures and privacy.** `401 unauthenticated`; `503 dependency_unavailable`. No provider issuer,
subject, email hint, profile snapshot, tokens, company, credential inventory, or hidden-owner field is
serialized. `ETag` is omitted; `no-store` is mandatory.

**Publication/compatibility.** Add `listCurrentProviderLinks` to OpenAPI and regenerate the client. The
additive response may later gain providers only through a separately planned compatible enum/schema
update. Rollback removes the view operation while retaining links.

**Exact Gherkin proof.** [“Provider links are listed only for the current Person”](#provider-link-listing-contract-scenario)
targets `specs/apps/ose/id-be/behaviours/federation/google-federation.feature`; Unit, Integration, and
E2E required, no exemption.

### 4. Unlink a provider

`DELETE /api/v1/account/provider-links/{providerLinkId}`

**Caller/auth/context.** Authenticated current Person with recent authentication. Ownership is derived
from the session and row; no company authority applies.

**Headers/parameters.** `providerLinkId` is a UUID path parameter. `If-Match: "3"` carries the exact
version returned by the list operation. No body is accepted.

**Success.** `204 No Content`, empty body. The link moves atomically to revoked, version increments,
affected OSE sessions/grants are revoked according to account policy, and no Google token/revocation
call occurs because none is retained. Repeating an unlink for the same owned, already-revoked link is
also `204` without another audit effect.

**Failures.** `400 invalid_request`; `401 unauthenticated`; `403 recent_auth_required`; enumeration-safe
`404 provider_link_not_found` for absent/not-owned IDs; `409 last_authentication_method` or
`version_conflict`; `429 rate_limited`; `503 dependency_unavailable`. `last_authentication_method`
returns a safe recovery action and performs no partial revocation.

**Concurrency/privacy.** One matching version wins. Concurrent stale requests return
`version_conflict`; session/grant revocation and link mutation share the required transaction/outbox
boundary. The path ID may appear in access logs only through the repository's opaque-ID redaction
policy; upstream identity never does.

**Publication/compatibility.** Add `unlinkCurrentProvider` to OpenAPI; generated clients require an
explicit version. The API quality tester must not perform successful destructive unlink in its
non-destructive discovery run; Integration/E2E and the isolated manual fixture own success proof.
Rollback retains revoked rows and does not reactivate them.

**Exact Gherkin proof.** [“The last authentication method cannot be unlinked”](#backend-unlink-contract-scenario)
targets `specs/apps/ose/id-be/behaviours/federation/google-federation.feature`; Unit, Integration, and
E2E required, no exemption.

### 5. Start Google sign-in in the BFF

`POST /api/bff/federation/google/start`

**Caller/auth/context.** Same-origin signed-out or signed-in browser. The opaque web session may bind an
existing authorization transaction but never chooses a Person by request field.

**Headers/request.** Plan 05 CSRF/origin/cookie rules, `Content-Type: application/json`, and optional
`Idempotency-Key`. Request:

```json
{
  "returnPath": "/authorize/context"
}
```

**Success.** `303 See Other` with `Location` equal to the backend-returned registered Google
authorization URL; empty body, `no-store`, and `no-referrer`. The BFF does not parse/rebuild the provider
query and does not expose it to a client component or RSC payload.

```http
HTTP/1.1 303 See Other
Location: https://accounts.google.test/o/oauth2/v2/auth?<registered-opaque-query>
Cache-Control: no-store
Referrer-Policy: no-referrer
Content-Length: 0
```

**Failures.** Safe local page redirects for `provider_disabled`, `provider_temporarily_unavailable`,
`invalid_request`, and `rate_limited`; invalid CSRF/origin is `403`. No response distinguishes account
existence or exposes backend/upstream bodies.

**Compatibility/publication.** Add this operation and redirect response to
`specs/apps/ose/id-web/contracts/google-federation.openapi.yaml`; it remains absent from backend
OpenAPI. Rollback hides the Google
action and returns the existing sign-in page without changing local-email behavior.

**Exact Gherkin proof.** [“The browser starts Google sign-in through the same-origin boundary”](#bff-google-start-contract-scenario)
targets `specs/apps/ose/id-web/behaviours/federation/google-federation.feature`; Unit, Integration, and
E2E required, no exemption.

### 6. Complete the browser callback

`GET /auth/google/callback`

**Caller/auth/context.** Google redirects the user agent to the exact registered loopback callback.
The BFF accepts only the query keys `state`, `code`, `error`, and `error_description`; it never trusts
`error_description` for output.

**Request example.** Missing/duplicate/oversized parameters fail before the backend call.

```http
GET /auth/google/callback?state=<opaque>&code=<one-time> HTTP/1.1
Host: 127.0.0.1:3500
Cookie: ose_id_web_session=<opaque>
```

**Success.** After server-to-server callback consumption, `303 See Other` to the backend-returned
allowlisted relative `nextPath`, with the rotated opaque `HttpOnly` cookie where applicable. The final
URL never carries code, state, nonce, subject, provider error text, token, or email.

```http
HTTP/1.1 303 See Other
Location: /authorize/context
Cache-Control: no-store
Referrer-Policy: no-referrer
Set-Cookie: ose_id_web_session=<opaque-rotated>; Path=/; HttpOnly; SameSite=Lax
Content-Length: 0
```

**Failures.** Every known safe backend code maps to `303` for `/sign-in?result=<allowlisted-code>` or
`/account/security?result=<allowlisted-code>`. Unknown/upstream text maps to
`provider_response_invalid`. A malformed callback may return a generic `400` HTML page before any
transaction exists. All responses use `no-store` and `no-referrer`.

**Replay/privacy.** Browser refresh cannot create a second effect; the backend returns the stable replay
failure and the BFF renders recovery. Query strings are redacted from access logs, traces, analytics,
screenshots, and error reporting.

**Compatibility/publication.** This is a provider callback contract, not backend REST. Document its
query/redirect/error surface in `specs/apps/ose/id-web/contracts/google-federation.openapi.yaml` and register it only for the
explicit local real/fake Google client. Rollback disables registration and retains local-email sign-in.

**Exact Gherkin proof.** [“A successful callback returns without provider artifacts” and “Provider
denial has a safe recovery path”](#browser-callback-contract-scenarios) target
`specs/apps/ose/id-web/behaviours/federation/google-federation.feature`; Unit, Integration, and E2E
required, no exemption.

### 7. Start Google linking in the BFF

`POST /api/bff/account/federation/google/link`

**Caller/auth/context.** Same-origin authenticated browser on `/account/security`, with recent
authentication in server state. Company context is irrelevant.

**Headers/request.** CSRF/origin/session rules; optional `Idempotency-Key`; and this exact empty object:

```json
{}
```

Unknown fields fail.

**Success.** `303 See Other` to the registered Google authorization URL from a backend challenge with
`purpose=link`, callback `/auth/google/callback`, and return `/account/security`.

```http
HTTP/1.1 303 See Other
Location: https://accounts.google.test/o/oauth2/v2/auth?<registered-opaque-link-query>
Cache-Control: no-store
Referrer-Policy: no-referrer
Content-Length: 0
```

**Failures.** `401 unauthenticated`; `403` for CSRF/origin; safe page redirect for
`recent_auth_required`, `provider_disabled`, `provider_link_conflict`, `rate_limited`, or dependency
failure. No response reveals the current or conflicting upstream subject.

**Compatibility/publication.** Add the operation to
`specs/apps/ose/id-web/contracts/google-federation.openapi.yaml`. Rollback
removes only the Google link action; existing links remain valid for sign-in unless the feature is
disabled, and other authentication methods remain unchanged.

**Exact Gherkin proof.** [“Account linking never accepts browser identity authority”](#bff-google-link-contract-scenario)
targets `specs/apps/ose/id-web/behaviours/federation/google-federation.feature`; Unit, Integration, and
E2E required, no exemption.

### 8. Unlink Google in the BFF

`DELETE /api/bff/account/federation/google`

**Caller/auth/context.** Same-origin authenticated browser with recent authentication. The BFF resolves
the current Person's active Google link using the backend list; the browser cannot submit a link ID.

**Headers/request.** CSRF/origin/session rules and `If-Match` containing the version rendered by the
account-security page. No body.

**Success.** `204 No Content`, clear/rotate affected session cookie as directed by backend, then client
navigation reloads authoritative account-security state.

```http
HTTP/1.1 204 No Content
Cache-Control: no-store
Set-Cookie: ose_id_web_session=<opaque-rotated>; Path=/; HttpOnly; SameSite=Lax
Content-Length: 0
```

**Failures.** `401`; `403`; `409 last_authentication_method` or `version_conflict`; safe `404` when no
active link exists; `429`; `503`. Problem bodies contain only stable BFF codes, correlation ID, and a
safe recovery action.

**Idempotency/privacy/publication.** Repeated already-unlinked request is `204`. No provider-link ID,
subject, upstream response, or credential inventory reaches the browser. Add the operation to
`specs/apps/ose/id-web/contracts/google-federation.openapi.yaml`; backend OpenAPI remains the source for
its internal delete call.
The live API tester leaves successful unlink to the isolated Integration/E2E fixture because its
quality-gate discovery is non-destructive.

**Exact Gherkin proof.** [“Browser unlink preserves the final sign-in method”](#bff-google-unlink-contract-scenario)
targets `specs/apps/ose/id-web/behaviours/federation/google-federation.feature`; Unit, Integration, and
E2E required, no exemption.

### 9. Update sign-in presentation

- **Operation/action:** `GET /sign-in` — `UPDATE`.
- **Caller/auth/context:** anonymous or signed-out browser with an optional server-bound authorization
  transaction; no company context or provider selector is accepted from the request.
- **Request:** no body and no provider query; only the existing allowlisted authorization continuation
  state may be resolved from the protected web session.

  ```http
  GET /sign-in HTTP/1.1
  Host: 127.0.0.1:3500
  Accept: text/html
  Cookie: ose_id_web_session=<opaque>
  ```

- **Success:** `200 text/html`, `Cache-Control: no-store`; retains identifier/password and conditionally
  renders exactly one labelled Google action when server-side enablement and configuration are valid.

  ```http
  HTTP/1.1 200 OK
  Content-Type: text/html; charset=utf-8
  Cache-Control: no-store

  <main><h1>Sign in</h1><form><!-- existing email flow --></form><form><button>Continue with Google</button></form></main>
  ```

- **Errors/validation:** backend/provider unavailability renders the existing safe sign-in page with a
  stable status and usable local-email action; render failure is sanitized `500`. Facebook, generic
  provider selectors, upstream error text, account existence, subject, email hint, and token are absent.
- **Replay/limits/state/privacy:** GET is read-idempotent and unpaginated; concurrent reads do not create
  provider state. The Google POST owns challenge rate limits. No query/cookie/provider detail is cached,
  logged, or placed in an RSC payload.
- **Publication/compatibility/rollback:** UPDATE the id-web rendered-page contract, not backend OpenAPI.
  The additive action preserves local-email clients. Rollback hides Google and preserves the prior page.
- **Exact Gherkin proof:** [“Google is the only social provider presented for sign-in”](#sign-in-presentation-contract-scenario)
  targets `specs/apps/ose/id-web/behaviours/federation/google-federation.feature`; component Unit,
  Next-server Integration, and browser E2E plus UI/live-web gates are required; no exemption.

### 10. Update account-security presentation

- **Operation/action:** `GET /account/security` — `UPDATE`.
- **Caller/auth/context:** authenticated current Person using the protected first-party session; company
  context is irrelevant and cannot widen the provider-link lookup.
- **Request:** no query/body; the BFF resolves the current Person and provider-link view server-side.

  ```http
  GET /account/security HTTP/1.1
  Host: 127.0.0.1:3500
  Accept: text/html
  Cookie: ose_id_web_session=<opaque>
  ```

- **Success:** `200 text/html`, `Cache-Control: no-store`; retains email, passkey, TOTP, recovery-code,
  and session controls and renders only Google `Linked`/`Not linked` plus the eligible link/unlink action.

  ```http
  HTTP/1.1 200 OK
  Content-Type: text/html; charset=utf-8
  Cache-Control: no-store

  <main><h1>Account security</h1><section aria-labelledby="google-status"><h2 id="google-status">Google</h2><p>Not linked</p><button>Link Google</button></section></main>
  ```

- **Errors/validation:** `401` redirects only to the safe local sign-in start; provider-view failure
  renders stable unavailable status without subject/email/token/company data. Stale version on mutation
  is handled by its command packet, not guessed by this read.
- **Replay/limits/state/privacy:** read-idempotent, unpaginated, account-bound, and safe under concurrent
  link changes because reload is authoritative. No provider subject, email hint, token, company scope,
  or credential inventory is cached, logged, or serialized.
- **Publication/compatibility/rollback:** UPDATE the id-web rendered-page contract outside backend
  OpenAPI. Existing security controls and URLs remain compatible. Rollback hides Google controls while
  retained provider links remain durable and other authentication methods keep working.
- **Exact Gherkin proof:** [“Account security presents only the current Person's Google link”](#account-security-presentation-contract-scenario)
  targets `specs/apps/ose/id-web/behaviours/federation/google-federation.feature`; component Unit,
  Next-server Integration, and browser E2E plus UI/live-web gates are required; no exemption.

### 11. Retain discovery metadata

- **Operation/action:** `GET /.well-known/openid-configuration` — `RETAIN`.
- **Caller/auth/request:** anonymous local client; no Person, company, cookie, query, or body.

  ```http
  GET /.well-known/openid-configuration HTTP/1.1
  Host: 127.0.0.1:8501
  Accept: application/json
  ```

- **Success/example:** `200 application/json` with the same issuer, endpoints, response/grant types,
  PKCE methods, scopes, claims, signing algorithms, and bounded cache policy as Plan 04.

  ```json
  {
    "issuer": "http://127.0.0.1:8501",
    "authorization_endpoint": "http://127.0.0.1:8501/connect/authorize",
    "token_endpoint": "http://127.0.0.1:8501/connect/token",
    "jwks_uri": "http://127.0.0.1:8501/connect/jwks",
    "response_types_supported": ["code"],
    "code_challenge_methods_supported": ["S256"]
  }
  ```

- **Errors/state/privacy:** retain `503 temporarily_unavailable`; read-idempotent, no mutation,
  pagination, tenant, provider, or replay state. Google is not a downstream scope, claim, issuer, or
  endpoint. Logs contain route, status, and correlation only.
- **Compatibility/rollback:** semantic discovery snapshot must remain equal before and after Google
  enablement. A difference is an undeclared `UPDATE` and blocks delivery. Rollback disables Google
  without changing discovery.
- **Exact Gherkin proof:** [`API07-RETAIN-DISCOVERY-001` — “Google authentication does not change OIDC
  discovery”](#api07-retain-discovery-001--discovery-compatibility) →
  `specs/apps/ose/id-be/behaviours/authorization/request-validation.feature`; Unit, Integration, and
  E2E are required, with no exemption.

### 12. Retain the authorization endpoint

- **Operation/action:** `GET /connect/authorize` — `RETAIN`.
- **Caller/auth/request:** registered LMS browser request; exact callback, authorization-code flow,
  PKCE S256, allowlisted resource/scopes, opaque state/nonce, and an authenticated OSE Person. Google may
  satisfy Person authentication but supplies no protocol authority.

  ```http
  GET /connect/authorize?client_id=ose-lms-app-web-local&redirect_uri=http%3A%2F%2F127.0.0.1%3A3400%2Fauth%2Foidc%2Fcallback&response_type=code&scope=openid%20profile%20ose.context%20ose.lms&resource=urn%3Aose%3Alms-api&state=state_opaque&nonce=nonce_opaque&code_challenge=synthetic_s256_challenge&code_challenge_method=S256 HTTP/1.1
  Host: 127.0.0.1:8501
  Cookie: ose_id_session=<opaque>
  ```

- **Success/example:** after OSE context selection and consent, one `302` returns one opaque code to
  the exact registered callback.

  ```http
  HTTP/1.1 302 Found
  Location: http://127.0.0.1:3400/auth/oidc/callback?code=code_opaque&state=state_opaque
  Cache-Control: no-store
  ```

- **Errors/state/privacy:** retain direct `400 invalid_request` for unsafe redirects and redirect-safe
  OAuth errors otherwise. One terminal decision issues at most one code; repeated starts are distinct.
  No Google code, state, subject, token, company choice, or provider profile enters redirects or logs.
- **Compatibility/rollback:** discovery, registered-client validation, redirects, limits, and
  error/replay semantics remain Plan 04-owned. Rollback removes Google authentication only.
- **Exact Gherkin proof:** [`API07-RETAIN-AUTHORIZE-001` — “Google authentication does not change
  authorization”](#api07-retain-authorize-001--authorization-compatibility) →
  `specs/apps/ose/id-be/behaviours/authorization/authorization-code.feature`; Unit, Integration, and
  E2E are required, with no exemption.

### 13. Retain the token endpoint

- **Operation/action:** `POST /connect/token` — `RETAIN`.
- **Caller/auth/request:** confidential LMS BFF using client authentication, a one-time authorization
  code, exact redirect URI, and PKCE verifier.

  ```http
  POST /connect/token HTTP/1.1
  Host: 127.0.0.1:8501
  Authorization: Basic <redacted-synthetic-client-credential>
  Content-Type: application/x-www-form-urlencoded

  grant_type=authorization_code&code=code_opaque&redirect_uri=http%3A%2F%2F127.0.0.1%3A3400%2Fauth%2Foidc%2Fcallback&code_verifier=synthetic_43_to_128_character_verifier_value
  ```

- **Success/example:** `200 application/json`, `no-store`; no refresh token is issued.

  ```json
  {
    "access_token": "synthetic.redacted.access-token",
    "token_type": "Bearer",
    "expires_in": 300,
    "id_token": "synthetic.redacted.id-token",
    "scope": "openid profile ose.context ose.lms"
  }
  ```

- **Errors/state/privacy:** retain `400 invalid_request|invalid_grant|unsupported_grant_type|invalid_scope`
  and `401 invalid_client`. Code consumption has one atomic winner; replay is `invalid_grant`.
  Google issuer, subject, access token, ID token, profile, and keys are never copied into OSE tokens,
  logs, traces, or evidence.
- **Compatibility/rollback:** OSE issuer, subject, audience, context, consent, scopes, algorithms,
  expiry, and revocation stay unchanged. Rollback cannot unconsume a code.
- **Exact Gherkin proof:** [`API07-RETAIN-TOKEN-001` — “Google authentication does not change token
  issuance”](#api07-retain-token-001--token-compatibility) →
  `specs/apps/ose/id-be/behaviours/tokens/token-safety.feature`; Unit, Integration, and E2E are
  required, with no exemption.

### 14. Retain the JWKS endpoint

- **Operation/action:** `GET /connect/jwks` — `RETAIN`.
- **Caller/auth/request:** anonymous resource/client; no query/body or identity context.

  ```http
  GET /connect/jwks HTTP/1.1
  Host: 127.0.0.1:8501
  Accept: application/json
  ```

- **Success/example:** `200 application/json` with current OSE public signing keys and Plan 04 cache
  policy.

  ```json
  {
    "keys": [
      {
        "kty": "RSA",
        "use": "sig",
        "kid": "local-signing-key-01",
        "alg": "RS256",
        "n": "synthetic-modulus",
        "e": "AQAB"
      }
    ]
  }
  ```

- **Errors/state/privacy:** retain `503 temporarily_unavailable` rather than a malformed/empty set.
  Read-idempotent; key rotation overlap is shared state. Google verification keys never enter OSE JWKS,
  logs, screenshots, or consumer artifacts.
- **Compatibility/rollback:** schema, cache, algorithms, and discovery link remain equal; compare
  normalized key metadata without binding nondeterministic order. Google rollback changes no OSE key.
- **Exact Gherkin proof:** [`API07-RETAIN-JWKS-001` — “Google authentication does not change OSE signing
  keys”](#api07-retain-jwks-001--jwks-compatibility) →
  `specs/apps/ose/id-be/behaviours/keys/signing-key-lifecycle.feature`; Unit, Integration, and E2E are
  required, with no exemption.

### 15. Retain the revocation endpoint

- **Operation/action:** `POST /connect/revocation` — `RETAIN`.
- **Caller/auth/request:** authenticated confidential OSE client; form-encoded OSE token and optional
  access-token hint. Google tokens are invalid inputs.

  ```http
  POST /connect/revocation HTTP/1.1
  Host: 127.0.0.1:8501
  Authorization: Basic <redacted-synthetic-client-credential>
  Content-Type: application/x-www-form-urlencoded

  token=synthetic.redacted.access-token&token_type_hint=access_token
  ```

- **Success/example:** unknown, already-revoked, and newly revoked OSE values share the non-oracular
  response.

  ```http
  HTTP/1.1 200 OK
  Cache-Control: no-store
  Content-Length: 0
  ```

- **Errors/state/privacy:** retain `400 invalid_request` and `401 invalid_client`; idempotent and
  concurrency-safe shared revocation state, client/network limit, no pagination. Tokens and client
  credentials never enter logs/evidence.
- **Compatibility/rollback:** provider-link removal may invoke existing domain revocation but cannot
  change this wire contract. Rollback retains revocation state.
- **Exact Gherkin proof:** [`API07-RETAIN-REVOCATION-001` — “Google authentication does not change OSE
  token revocation”](#api07-retain-revocation-001--revocation-compatibility) →
  `specs/apps/ose/id-be/behaviours/tokens/revocation.feature`; Unit, Integration, and E2E are required,
  with no exemption.

### 16. Retain the logout confirmation endpoint

- **Operation/action:** `GET /connect/logout` — `RETAIN`.
- **Caller/auth/request:** browser with OSE session; only registered post-logout URI and opaque state;
  no Google logout URL, provider token, or body.

  ```http
  GET /connect/logout?post_logout_redirect_uri=http%3A%2F%2F127.0.0.1%3A3400%2Fauth%2Fsigned-out&state=state_opaque HTTP/1.1
  Host: 127.0.0.1:8501
  Cookie: ose_id_session=<opaque>
  ```

- **Success/example:** bodyless reads do not revoke; render the same no-store confirmation.

  ```http
  HTTP/1.1 200 OK
  Content-Type: text/html; charset=utf-8
  Cache-Control: no-store

  <main><h1>Sign out?</h1></main>
  ```

- **Errors/state/privacy:** unsafe return target remains safe local `400 invalid_request`; repeated
  reads do not mutate. Provider state, hint, session, and state are excluded from logs/cache.
- **Compatibility/rollback:** registered redirect/cancellation semantics remain Plan 04-owned.
  Rollback keeps the OSE session intact.
- **Exact Gherkin proof:** [`API07-RETAIN-LOGOUT-GET-001` — “Google authentication does not change logout
  confirmation”](#api07-retain-logout-get-001--logout-confirmation-compatibility) →
  `specs/apps/ose/id-be/behaviours/sessions/logout.feature`; Unit, Integration, and E2E are required,
  with no exemption.

### 17. Retain the logout command endpoint

- **Operation/action:** `POST /connect/logout` — `RETAIN`.
- **Caller/auth/request:** same OSE browser session with exact origin, antiforgery proof, bound logout
  request, and registered post-logout destination.

  ```http
  POST /connect/logout HTTP/1.1
  Host: 127.0.0.1:8501
  Cookie: ose_id_session=<opaque>
  Origin: http://127.0.0.1:8501
  Content-Type: application/x-www-form-urlencoded

  confirm=true&csrf=<opaque>&state=state_opaque
  ```

- **Success/example:** revoke only the OSE session/grants and complete through a registered URI.

  ```http
  HTTP/1.1 302 Found
  Location: http://127.0.0.1:3400/auth/signed-out?state=state_opaque
  Cache-Control: no-store
  Set-Cookie: ose_id_session=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax
  ```

- **Errors/state/privacy:** retain `400 invalid_request`, `403 invalid_csrf`, and safe `401
session_absent`; repeated/concurrent submissions converge. No provider call, token, identity, or URL
  enters output/logs.
- **Compatibility/rollback:** Plan 04 revocation/redirect/replay semantics remain exact. Rollback never
  resurrects a session or contacts Google.
- **Exact Gherkin proof:** [`API07-RETAIN-LOGOUT-POST-001` — “Google authentication does not change
  confirmed logout”](#api07-retain-logout-post-001--logout-command-compatibility) →
  `specs/apps/ose/id-be/behaviours/sessions/logout.feature`; Unit, Integration, and E2E are required,
  with no exemption.

### 18. Retain the legacy disabled Google seam

`GET /external/google/challenge` remains the exact fail-closed placeholder from the foundation plan;
the new browser flow does not repurpose it. Unsupported callers send no body, cookie, tenant context,
provider selector, or return URL:

```http
GET /external/google/challenge HTTP/1.1
Host: 127.0.0.1:8501
Accept: application/problem+json
```

It retains `404 application/problem+json`, `Cache-Control: no-store`, no `Location`, and the closed
non-redirecting response:

```json
{
  "status": 404,
  "code": "capability_disabled",
  "title": "Capability is not available",
  "correlationId": "corr_synthetic_legacy"
}
```

Unknown query/body input is bounded and cannot select a provider or redirect. The read is idempotent,
has no replay/concurrency/pagination effect, and retains its public-route rate policy. Logs contain only
route, status, and correlation ID; no email, provider identity, URL, or secret. The operation remains in
the backend OpenAPI with its existing generated-client disposition and outside OIDC discovery. Rollback
keeps the same disabled response.

**Exact Gherkin proof:** [`API07-RETAIN-SEAM-001` — “The legacy backend challenge route remains
disabled”](#api07-retain-seam-001--legacy-disabled-seam-compatibility) →
`specs/apps/ose/id-be/behaviours/providers/provider-seam.feature`; Unit, Integration, and E2E are
required, with no exemption.

## Gherkin-Style Contract Scenarios

Each operation packet above links one-to-one to one section below. The headings are stable anchors; each
section names its canonical app-scoped destination and contains the complete scenario text. Unit,
Integration, and E2E are required for every scenario; exemptions: none.

### Google challenge contract scenarios

**Canonical destination:** `specs/apps/ose/id-be/behaviours/federation/google-federation.feature`.

```gherkin
Scenario: A sign-in challenge uses only registered and allowlisted values
  Given Google federation is enabled for the local identity runtime
  When the first-party web server requests a sign-in challenge with a registered callback and safe return path
  Then the identity API returns one expiring authorization URL
  And the transaction is persisted for single use
  And no provider credential or upstream token is returned or logged

Scenario: A link challenge requires the current Person and recent authentication
  Given the first-party web server has no recent authenticated Person session
  When it requests a Google challenge for account linking
  Then the identity API rejects the request with the stable recent-authentication result
  And no provider transaction or link is created
```

### Google callback contract scenarios

**Canonical destination:** `specs/apps/ose/id-be/behaviours/federation/google-federation.feature`.

```gherkin
Scenario: One valid callback creates one account result
  Given a pending sign-in transaction and a valid response for an unlinked Google subject
  When two callers submit the same callback concurrently
  Then exactly one Person and one active provider link exist
  And exactly one caller receives a successful signed-in result
  And the other caller receives the stable replay or conflict result

Scenario: Matching email never links an upstream subject
  Given a local account and an unlinked Google subject share the same email text
  When the Google callback is validated for sign-in
  Then the identity service does not attach the subject to the local account by email
  And it follows the explicit new-account or linking policy without disclosing the match

Scenario Outline: Unsafe callback input fails without a session or link
  Given a pending Google transaction
  When the callback has <fault>
  Then the identity API returns the stable provider-response failure
  And no Person provider link or account session is created
  And the raw callback values are absent from logs traces metrics audit and evidence

  Examples:
    | fault |
    | wrong state |
    | expired state |
    | wrong nonce |
    | wrong issuer |
    | wrong audience |
    | invalid signature |
    | reused code |
```

### Provider-link listing contract scenario

**Canonical destination:** `specs/apps/ose/id-be/behaviours/federation/google-federation.feature`.

```gherkin
Scenario: Provider links are listed only for the current Person
  Given the authenticated Person has an active Google link
  When the first-party web server requests current provider links
  Then the API returns the Google display label last-authentication instant unlink hint and version
  And it omits issuer subject email hint tokens profile snapshot company and other Persons
```

### Backend unlink contract scenario

**Canonical destination:** `specs/apps/ose/id-be/behaviours/federation/google-federation.feature`.

```gherkin
Scenario: The last authentication method cannot be unlinked
  Given Google is the current Person's last usable authentication method
  When an unlink request uses the current provider-link version
  Then the identity API returns the stable last-authentication-method conflict
  And the link sessions and grants remain unchanged
```

### BFF Google-start contract scenario

**Canonical destination:** `specs/apps/ose/id-web/behaviours/federation/google-federation.feature`.

```gherkin
Scenario: The browser starts Google sign-in through the same-origin boundary
  Given Google sign-in is available on the sign-in page
  When the user activates Continue with Google
  Then the browser is redirected only to the registered provider authorization endpoint
  And provider request details are absent from rendered payloads browser storage logs and analytics
```

### Browser callback contract scenarios

**Canonical destination:** `specs/apps/ose/id-web/behaviours/federation/google-federation.feature`.

```gherkin
Scenario: A successful callback returns without provider artifacts
  Given the browser returns with a valid one-time Google callback
  When the first-party web server completes the callback
  Then it redirects to the allowlisted identity continuation with a rotated opaque session cookie
  And the final URL DOM storage console trace and screenshot contain no code state nonce subject assertion or token

Scenario: Provider denial has a safe recovery path
  Given the user cancels at Google
  When the browser returns to the registered callback
  Then the sign-in page shows an allowlisted denial result
  And another delivered sign-in method remains available
  And upstream error text is not rendered
```

### BFF Google-link contract scenario

**Canonical destination:** `specs/apps/ose/id-web/behaviours/federation/google-federation.feature`.

```gherkin
Scenario: Account linking never accepts browser identity authority
  Given a recently authenticated Person opens account security
  When the user starts and completes Google linking
  Then the first-party web server derives the Person from its opaque session
  And the browser submits no Person company provider-subject or arbitrary-return value
```

### BFF Google-unlink contract scenario

**Canonical destination:** `specs/apps/ose/id-web/behaviours/federation/google-federation.feature`.

```gherkin
Scenario: Browser unlink preserves the final sign-in method
  Given a recently authenticated Person has Google as the final usable sign-in method
  When the browser requests Google unlink through the same-origin BFF
  Then the BFF returns the stable last-sign-in-method conflict
  And no provider link session or grant is changed
```

### Sign-in presentation contract scenario

**Canonical destination:** `specs/apps/ose/id-web/behaviours/federation/google-federation.feature`.

```gherkin
Scenario: Google is the only social provider presented for sign-in
  Given the sign-in page is rendered with Google enabled
  When the user inspects every sign-in action
  Then Google is the only social provider action
  And email remains available
  And no Facebook or generic dormant-provider action is present
```

### Account-security presentation contract scenario

**Canonical destination:** `specs/apps/ose/id-web/behaviours/federation/google-federation.feature`.

```gherkin
Scenario: Account security presents only the current Person's Google link
  Given a Person with a Google link opens account security
  When the page renders provider methods
  Then it shows Google link status and the policy-allowed unlink action
  And it exposes no issuer subject token email hint company or other Person data
```

### API07-RETAIN-DISCOVERY-001 — Discovery compatibility

**Canonical destination:** `specs/apps/ose/id-be/behaviours/authorization/request-validation.feature`.
Unit, Integration, and E2E are required; exemptions: none.

```gherkin
Scenario: Google authentication does not change OIDC discovery
  Given a Person authenticated through Google
  When a client reads OSE ID discovery metadata
  Then the delivered issuer endpoints grants scopes claims algorithms and PKCE methods remain unchanged
  And no Google issuer subject token claim key or endpoint enters the document
```

### API07-RETAIN-AUTHORIZE-001 — Authorization compatibility

**Canonical destination:** `specs/apps/ose/id-be/behaviours/authorization/authorization-code.feature`.
Unit, Integration, and E2E are required; exemptions: none.

```gherkin
Scenario: Google authentication does not change authorization
  Given a registered client and a Person who authenticated through Google
  When the client sends its accepted authorization request
  Then the delivered redirect validation context consent error and replay contract remains unchanged
  And no Google issuer subject token claim or key enters the redirect log or evidence
```

### API07-RETAIN-TOKEN-001 — Token compatibility

**Canonical destination:** `specs/apps/ose/id-be/behaviours/tokens/token-safety.feature`. Unit,
Integration, and E2E are required; exemptions: none.

```gherkin
Scenario: Google authentication does not change token issuance
  Given a registered client holds a one-time OSE authorization code for a Google-authenticated Person
  When the client exchanges the code with its PKCE verifier
  Then OSE issuer audience scope subject context consent expiry and revocation policy remain authoritative
  And no Google issuer subject token claim profile or key enters the token log or evidence
```

### API07-RETAIN-JWKS-001 — JWKS compatibility

**Canonical destination:** `specs/apps/ose/id-be/behaviours/keys/signing-key-lifecycle.feature`. Unit,
Integration, and E2E are required; exemptions: none.

```gherkin
Scenario: Google authentication does not change OSE signing keys
  Given Google verification keys are available to the federation adapter
  When a client reads the OSE ID JWKS document
  Then only active and overlapping OSE verification keys are returned
  And no Google verification key private key or symmetric key material enters the response
```

### API07-RETAIN-REVOCATION-001 — Revocation compatibility

**Canonical destination:** `specs/apps/ose/id-be/behaviours/tokens/revocation.feature`. Unit,
Integration, and E2E are required; exemptions: none.

```gherkin
Scenario: Google authentication does not change OSE token revocation
  Given an authenticated OSE client submits an OSE token or an unknown value
  When the value is revoked after Google federation is enabled
  Then the response preserves the non-oracular idempotent revocation contract
  And a Google token is never accepted logged or persisted as an OSE token
```

### API07-RETAIN-LOGOUT-GET-001 — Logout-confirmation compatibility

**Canonical destination:** `specs/apps/ose/id-be/behaviours/sessions/logout.feature`. Unit,
Integration, and E2E are required; exemptions: none.

```gherkin
Scenario: Google authentication does not change logout confirmation
  Given a Google-authenticated Person has an OSE session and registered post-logout destination
  When the browser opens the OSE logout confirmation
  Then the read preserves the delivered no-store confirmation without ending the session
  And no Google logout endpoint token state or profile is contacted or exposed
```

### API07-RETAIN-LOGOUT-POST-001 — Logout-command compatibility

**Canonical destination:** `specs/apps/ose/id-be/behaviours/sessions/logout.feature`. Unit,
Integration, and E2E are required; exemptions: none.

```gherkin
Scenario: Google authentication does not change confirmed logout
  Given a Google-authenticated Person confirms an OSE logout with valid antiforgery proof
  When concurrent commands reach stateless OSE ID instances
  Then they converge on the same cleared OSE session and registered continuation
  And no Google session provider token or arbitrary destination is changed or exposed
```

### API07-RETAIN-SEAM-001 — Legacy disabled-seam compatibility

**Canonical destination:** `specs/apps/ose/id-be/behaviours/providers/provider-seam.feature`.

```gherkin
Scenario: The legacy backend challenge route remains disabled
  Given the supported Google journey starts only through the first-party web server
  When a caller requests the legacy backend Google challenge route
  Then the identity API returns the stable capability-disabled problem without a redirect
  And no provider transaction network call identity record or session is created
```

## Layer and Quality-Gate Proof

| Proof            | Required evidence                                                                                                                                                                             |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit             | serializers, allowlists, status/problem mapping, idempotency keys, callback validation policy, account/link decision matrix, redaction, list projection, unlink/version/last-method rules     |
| Integration      | real ASP.NET routes/OpenAPI, PostgreSQL transactions/uniqueness/single-use/rate limits/audit, BFF generated client/session/CSRF mapping, fake-provider HTTP/JWKS/token exchange               |
| E2E              | built web+BFF+backend+PostgreSQL+fake Google for new/repeat/deny/fault/replay/link/unlink/responsive/a11y/leak and instance-handoff journeys                                                  |
| API quality gate | `api-exploratory-tester`, `output-mode: delivery`, strict threshold, running backend/BFF URLs, backend OpenAPI plus these scenarios; destructive unlink success remains Integration/E2E-owned |
| UI/live web      | static UI gate plus sequential exploratory, usability, and design testers over `/sign-in`, callback result, and `/account/security` at every supported locale/breakpoint                      |

There are no default layer exemptions. Any genuinely inapplicable Integration/E2E adapter is declared
only per canonical scenario with the repository exemption comment and static behavior-coverage proof.
