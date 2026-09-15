# API Contract Delta

## Contract boundary

The issuer is `http://127.0.0.1:8501` in explicit local mode. OIDC/OAuth endpoints below are standards
endpoints implemented through OpenIddict request/response handling; they are **not generic REST** and
do not enter OpenAPI. JSON transaction endpoints are an internal application contract for the
first-party web BFF and synthetic test client. Browser input never becomes client, scope, resource,
subject, entitlement, or company authority.

## Operation index

Each operation has one action and one complete packet below. `ADD` introduces a contract, `UPDATE`
enables or changes an accepted contract, and `RETAIN` identifies only adjacent predecessor operations
whose unchanged behavior must be proved. There is no `DELETE` operation.

| Action | Exact operation                                                      | Detailed packet                                   |
| ------ | -------------------------------------------------------------------- | ------------------------------------------------- |
| ADD    | `GET /.well-known/openid-configuration`                              | [Discovery metadata](#discovery-metadata)         |
| UPDATE | `GET /connect/authorize`                                             | [Authorization endpoint](#authorization-endpoint) |
| UPDATE | `POST /connect/token`                                                | [Token endpoint](#token-endpoint)                 |
| ADD    | `GET /connect/jwks`                                                  | [JWKS endpoint](#jwks-endpoint)                   |
| ADD    | `POST /connect/revocation`                                           | [Revocation endpoint](#revocation-endpoint)       |
| ADD    | `GET /connect/logout`                                                | [Logout confirmation](#logout-confirmation)       |
| ADD    | `POST /connect/logout`                                               | [Logout command](#logout-command)                 |
| ADD    | `GET /internal/authorization-transactions/{transactionId}`           | [Transaction render](#transaction-render)         |
| ADD    | `POST /internal/authorization-transactions/{transactionId}/context`  | [Context selection](#context-selection)           |
| ADD    | `POST /internal/authorization-transactions/{transactionId}/decision` | [Consent decision](#consent-decision)             |
| RETAIN | `GET /health/live`                                                   | [Liveness](#liveness)                             |
| RETAIN | `GET /health/ready`                                                  | [Readiness](#readiness)                           |
| RETAIN | `GET /external/google/challenge`                                     | [Disabled Google seam](#disabled-google-seam)     |

## Delta summary

### ADD and UPDATE — OIDC/OAuth protocol surface

| Method and exact path                   | Caller                                       | Authentication and authorization                                                                                                  | Request and success semantics                                                                                                                                                                          | Error, replay, and traffic semantics                                                                                                                                              |
| --------------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /.well-known/openid-configuration` | registered clients/resources                 | public metadata; local issuer only                                                                                                | Advertise actual issuer/endpoints, `response_type=code`, grant `authorization_code`, scopes, asymmetric algorithms, and PKCE `S256`                                                                    | Cacheable for a short configured period; never advertises disabled endpoint/grant/algorithm                                                                                       |
| `GET /connect/authorize` — UPDATE       | browser carrying a registered client request | exact `client_id`, redirect, response type, resource/scope, state, nonce, and PKCE challenge; active user session before approval | Enable the previously fail-closed endpoint, validate first, create one opaque authorization transaction, then continue identity/context/consent; success returns a one-time code to the exact redirect | Invalid redirect gets a direct safe error; redirect-safe protocol errors preserve state; rate-limit abusive starts without account enumeration                                    |
| `POST /connect/token` — UPDATE          | confidential BFF                             | `client_secret_basic`, exact client, code, redirect, and PKCE verifier                                                            | Enable the previously fail-closed endpoint; form-encoded code exchange atomically consumes the code and returns standards token JSON for the exact LMS resource                                        | A code has one successful exchange; duplicate/concurrent redemption returns protocol `invalid_grant`; generic denial reveals no verifier/token value; shared client/network limit |
| `GET /connect/jwks`                     | clients/resources                            | public                                                                                                                            | Publish active and unexpired verify-only public JWKs with stable `kid`; discovery `jwks_uri` points here                                                                                               | Never emit private/symmetric material; unknown/retired key is absent after safe overlap                                                                                           |
| `POST /connect/revocation`              | owning confidential BFF                      | authenticated client; token ownership/type checked                                                                                | Form-encoded request revokes supported grant/token state and returns the standards success response                                                                                                    | Outcome is intentionally non-oracular for unknown/already-revoked values; mutation is idempotent and rate-limited                                                                 |
| `GET /connect/logout`                   | browser plus owning client/session           | active OSE ID session and exact registered post-logout URI/state when supplied                                                    | Render confirmation or an immediate safe policy-approved logout continuation; no state mutation from untrusted cross-site navigation                                                                   | `no-store`; unregistered return target is ignored/rejected rather than followed                                                                                                   |
| `POST /connect/logout`                  | confirmed same-session browser action        | session/correlation plus anti-forgery proof and exact registered return target                                                    | End the OSE ID session, apply documented grant consequences, and redirect only to the registered URI                                                                                                   | Repeated submission is safe/idempotent; per-session limit; no secret-bearing response                                                                                             |

`/connect/userinfo`, introspection, device authorization, dynamic registration, implicit/hybrid,
password grant, client credentials, and refresh-token endpoints are not added. Discovery must not
advertise them. `offline_access` remains unavailable unless execution formally amends the plan with the
rotation/family/reuse contract already required by the persistence design.

### ADD — internal authorization-transaction JSON surface

All responses use `application/json`; mutation requests require `Content-Type: application/json`. An
opaque `transactionId` is a lookup capability, never authorization by itself.

| Method and exact path                                                | Caller                              | Authentication, authorization, and context                                                                          | Request / success response                                                                                                                                                | Errors, idempotency, concurrency, rate limit                                                                                                                 |
| -------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET /internal/authorization-transactions/{transactionId}`           | first-party BFF or synthetic client | authenticated service channel plus active bound user session; reload client, expiry, entitlement, eligible contexts | No request body; `200` render model with opaque transaction/version, client display name, human-readable scopes, eligible personal/company choices, consent state, expiry | `404` for absent/not-visible; `409` stale/terminal; `410` expired; no membership beyond eligible choices; bounded polling rate                               |
| `POST /internal/authorization-transactions/{transactionId}/context`  | first-party BFF or synthetic client | same channel/session; choice must match a fresh backend offer                                                       | JSON choice reference and expected version; `200` updated render model                                                                                                    | `400` shape; `403` no longer entitled; `409` stale version/terminal; repeated same command returns current equivalent state without advancing twice          |
| `POST /internal/authorization-transactions/{transactionId}/decision` | first-party BFF or synthetic client | same channel/session, selected context, fresh consent authority                                                     | JSON decision is `allow` or `cancel` plus numeric `expectedVersion`; `200` safe terminal descriptor consumed by protocol handler                                          | `400` invalid decision; `403` changed authority; `409` stale/already terminal; `410` expired; exactly one concurrent decision wins; per-session/client limit |

Internal problems use repository `application/problem+json` with stable app-scoped type/code, safe
title/status, correlation ID, and field errors where applicable. They never include tokens, codes,
verifiers, secrets, raw request payload, provider subject, or hidden membership. Protocol endpoints use
the applicable OAuth/OIDC error fields and redirect rules instead of this JSON problem shape.

### UPDATE

`GET /connect/authorize` and `POST /connect/token` change from the bootstrap plan's explicit disabled,
fail-closed seams to the enabled contracts in their packets. No predecessor account, session, or
company endpoint is repurposed.

### DELETE

None. No predecessor endpoint, response field, discovery member, or supported behavior is removed.

### RETAIN

Only the adjacent liveness, readiness, and disabled Google-provider seam are enumerated here. Other
predecessor APIs are outside this delta and remain governed by their accepted contracts. Person
identity remains the opaque Person ID; email never becomes a protocol subject. Personal context has no
company ID; company context has exactly one backend-authorized opaque company ID.

## Detailed operation packets

Every packet is normative. Protocol requests use OpenIddict's standards parser and OAuth/OIDC errors;
internal JSON uses the repository problem envelope. Unless stated otherwise, writes are `no-store`,
identifiers are opaque, correlation IDs are safe to log, secrets/PII are not, and shared limits use a
privacy-preserving client/session/network key.

### Discovery metadata

- **Operation/action:** `GET /.well-known/openid-configuration` — `ADD`.

  ```http
  GET /.well-known/openid-configuration HTTP/1.1
  Host: 127.0.0.1:8501
  Accept: application/json
  ```

- **Caller/auth/context:** any local client; no user authentication or tenant context.
- **Request:** `Accept: application/json`; no query/body. Unknown query parameters cannot alter output.
- **Success:** `200 application/json` with bounded `Cache-Control`; schema contains issuer, endpoint
  URIs, supported response type `code`, grant `authorization_code`, exact scopes/algorithms, and PKCE
  method `S256`. Example:

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

- **Errors/traffic:** `503 temporarily_unavailable` if complete safe metadata cannot be produced.
  Read-only/idempotent; no pagination or mutation race; public-endpoint abuse protection only.
- **Privacy/publication/rollback:** log route/status/correlation only. This is discovery, excluded from
  OpenAPI/codegen. Changes are additive; rollback disables the whole issuer profile, never advertises
  dead operations.
- **Exact Gherkin proof:** [`ID04-AUTH-003` — “OSE ID rejects an unsafe authorization request”](./004-bdd-spec-delta-and-adapter-map.md#request-validation--id04-auth-003)
  → `specs/apps/ose/id-be/behaviours/authorization/request-validation.feature`;
  [`ID04-KEY-001` — “Tokens remain verifiable during key overlap”](./004-bdd-spec-delta-and-adapter-map.md#signing-keys--id04-key-001)
  → `specs/apps/ose/id-be/behaviours/keys/signing-key-lifecycle.feature`; and
  [`ID04-SEAM-001` — “No upstream provider is enabled”](./004-bdd-spec-delta-and-adapter-map.md#provider-seam--id04-seam-001)
  → `specs/apps/ose/id-be/behaviours/providers/provider-seam.feature`. Unit, Integration, and E2E are
  required for each; no exemption.

### Authorization endpoint

- **Operation/action:** `GET /connect/authorize` — `UPDATE`.

  ```http
  GET /connect/authorize?client_id=ose-lms-app-web-local&redirect_uri=http%3A%2F%2F127.0.0.1%3A3400%2Fauth%2Foidc%2Fcallback&response_type=code&scope=openid%20profile%20ose.context%20ose.lms&resource=urn%3Aose%3Alms-api&state=state_opaque&nonce=nonce_opaque&code_challenge=synthetic_s256_challenge&code_challenge_method=S256 HTTP/1.1
  Host: 127.0.0.1:8501
  Cookie: ose_id_session=<opaque>
  ```

  ```http
  HTTP/1.1 302 Found
  Location: http://127.0.0.1:3400/auth/oidc/callback?code=code_opaque&state=state_opaque
  Cache-Control: no-store
  ```

- **Caller/auth/context:** browser for registered `ose-lms-app-web-local`; active Person session before
  approval; personal or one freshly authorized company context.
- **Request:** query `client_id`, exact `redirect_uri`, `response_type=code`, `scope`,
  `resource=urn:ose:lms-api`, opaque `state`, `nonce`, `code_challenge`, and
  `code_challenge_method=S256`; no body. Example callback is
  `http://127.0.0.1:3400/auth/oidc/callback` with `openid profile ose.context ose.lms`.
- **Success:** after validation/approval, `302 Location: <exact-callback>?code=<opaque>&state=<opaque>`
  and `Cache-Control: no-store`; no token is browser-visible.
- **Errors/traffic:** direct safe `400 invalid_request` for an untrusted redirect; otherwise redirect-
  safe `invalid_request`, `unauthorized_client`, `unsupported_response_type`, `invalid_scope`,
  `access_denied`, or `temporarily_unavailable`. Validate exact registration, nonce, S256 syntax,
  entitlement, and fresh context. Repeated starts create distinct expiring transactions; one terminal
  decision wins. No pagination; client/session/network limits.
- **Privacy/publication/rollback:** log client, allowlisted scopes, outcome, correlation—not state,
  nonce, challenge, code, email, or company. Excluded from OpenAPI/codegen; published in discovery.
  Rollback expires unfinished transactions and disables the issuer.
- **Exact Gherkin proof:** [`ID04-AUTH-001` — “A personal user authorizes the LMS client” and
  `ID04-AUTH-002` — “A company member authorizes one company”](./004-bdd-spec-delta-and-adapter-map.md#authorization-code--id04-auth-001-and-id04-auth-002)
  → `specs/apps/ose/id-be/behaviours/authorization/authorization-code.feature`; and
  [`ID04-AUTH-003` — “OSE ID rejects an unsafe authorization request”](./004-bdd-spec-delta-and-adapter-map.md#request-validation--id04-auth-003)
  → `specs/apps/ose/id-be/behaviours/authorization/request-validation.feature`. Unit, Integration,
  and E2E are required for each; no exemption.

### Token endpoint

- **Operation/action:** `POST /connect/token` — `UPDATE`.

  ```http
  POST /connect/token HTTP/1.1
  Host: 127.0.0.1:8501
  Authorization: Basic <redacted-synthetic-client-credential>
  Content-Type: application/x-www-form-urlencoded

  grant_type=authorization_code&code=opaque_code&redirect_uri=http%3A%2F%2F127.0.0.1%3A3400%2Fauth%2Foidc%2Fcallback&code_verifier=synthetic_43_to_128_character_verifier_value
  ```

- **Caller/auth/context:** confidential LMS BFF using `client_secret_basic`; no browser or caller-
  selected company authority.
- **Request:** form fields `grant_type=authorization_code`, opaque `code`, exact `redirect_uri`, and
  `code_verifier`; example:

  ```http
  grant_type=authorization_code&code=opaque_code&redirect_uri=http%3A%2F%2F127.0.0.1%3A3400%2Fauth%2Foidc%2Fcallback&code_verifier=synthetic_43_to_128_character_verifier_value
  ```

- **Success:** `200 application/json`, `Cache-Control: no-store`, `Pragma: no-cache`; fields are string
  `access_token`, fixed `token_type` `Bearer`, integer `expires_in`, string `id_token`, and string
  `scope`. The response has no refresh token:

  ```json
  {
    "access_token": "synthetic.redacted.access-token",
    "token_type": "Bearer",
    "expires_in": 300,
    "id_token": "synthetic.redacted.id-token",
    "scope": "openid profile ose.context ose.lms"
  }
  ```

- **Errors/traffic:** `400 invalid_request|invalid_grant|unsupported_grant_type|invalid_scope`; client
  failure is `401 invalid_client` with standards challenge. Exact client/code/redirect/verifier,
  expiry, audience/context/entitlement must pass. Atomic consumption gives one concurrent success;
  replay is `invalid_grant`. No pagination; client/network limits.
- **Privacy/publication/rollback:** never log authorization/form secrets or tokens. Excluded from
  OpenAPI/codegen and advertised by discovery. Rollback never unconsumes/reissues.
- **Exact Gherkin proof:** [`ID04-TOKEN-001` — “An authorization code is consumed once” and
  `ID04-TOKEN-002` — “A resource receives a token for another audience”](./004-bdd-spec-delta-and-adapter-map.md#token-safety--id04-token-001-and-id04-token-002)
  → `specs/apps/ose/id-be/behaviours/tokens/token-safety.feature`; and
  [`ID04-AUTH-001/002` — the personal/company authorization scenarios](./004-bdd-spec-delta-and-adapter-map.md#authorization-code--id04-auth-001-and-id04-auth-002)
  → `specs/apps/ose/id-be/behaviours/authorization/authorization-code.feature`. Unit, Integration,
  and E2E are required for each; no exemption.

### JWKS endpoint

- **Operation/action:** `GET /connect/jwks` — `ADD`.

  ```http
  GET /connect/jwks HTTP/1.1
  Host: 127.0.0.1:8501
  Accept: application/json
  ```

- **Caller/auth/context:** public client/resource; no identity/context.
- **Request:** `Accept: application/json`; no parameters/body.
- **Success:** `200 application/json`, bounded public cache. The `keys` array contains only
  active/unexpired overlap keys with string `kty`, fixed signing use, `kid`, `alg`, `n`, and `e` fields.
  Synthetic public example:

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

- **Errors/traffic:** `503 temporarily_unavailable` instead of an empty/malformed set. Idempotent read,
  no replay/race/pagination; public abuse protection. Validate that no private/symmetric member exists.
- **Privacy/publication/rollback:** log route/status/key-set digest only. Excluded from OpenAPI/codegen;
  discovery owns `jwks_uri`. Rollback preserves overlap for issued tokens.
- **Exact Gherkin proof:** [`ID04-KEY-001` — “Tokens remain verifiable during key overlap”](./004-bdd-spec-delta-and-adapter-map.md#signing-keys--id04-key-001)
  → `specs/apps/ose/id-be/behaviours/keys/signing-key-lifecycle.feature`; Unit, Integration, and E2E
  required; no exemption.

### Revocation endpoint

- **Operation/action:** `POST /connect/revocation` — `ADD`.

  ```http
  POST /connect/revocation HTTP/1.1
  Host: 127.0.0.1:8501
  Authorization: Basic <redacted-synthetic-client-credential>
  Content-Type: application/x-www-form-urlencoded

  token=synthetic.redacted.access-token&token_type_hint=access_token
  ```

  ```http
  HTTP/1.1 200 OK
  Cache-Control: no-store
  Content-Length: 0
  ```

- **Caller/auth/context:** authenticated confidential BFF; token ownership is client-scoped.
- **Request:** form `token` plus optional `token_type_hint=access_token`; example token is redacted.
- **Success:** standards `200` empty, `no-store`, including unknown/already revoked values.
- **Errors/traffic:** malformed form `400 invalid_request`; client failure `401 invalid_client`.
  Outcome is non-oracular. Mutation is idempotent and concurrent calls converge; no pagination;
  client/network limit.
- **Privacy/publication/rollback:** never log token/auth header. Excluded from OpenAPI/codegen and
  advertised only when enabled. Rollback retains revocation state.
- **Exact Gherkin proof:** [`ID04-TOKEN-003` — “Revocation remains non-oracular and idempotent”](./004-bdd-spec-delta-and-adapter-map.md#revocation--id04-token-003)
  → `specs/apps/ose/id-be/behaviours/tokens/revocation.feature`; Unit, Integration, and E2E required;
  no exemption.

### Logout confirmation

- **Operation/action:** `GET /connect/logout` — `ADD`.

  ```http
  GET /connect/logout?post_logout_redirect_uri=http%3A%2F%2F127.0.0.1%3A3400%2Fauth%2Fsigned-out&state=state_opaque HTTP/1.1
  Host: 127.0.0.1:8501
  Cookie: ose_id_session=<opaque>
  ```

  ```http
  HTTP/1.1 200 OK
  Content-Type: text/html; charset=utf-8
  Cache-Control: no-store

  <main><h1>Sign out?</h1></main>
  ```

- **Caller/auth/context:** browser with OSE ID session and optional registered-client logout hint;
  Person-global, not company authority.
- **Request:** optional standards logout fields, registered `post_logout_redirect_uri`, opaque `state`;
  no body.
- **Success:** `200 text/html` confirmation using PRD Option A, or approved `302`; `no-store`; GET never
  mutates session. The HTML has one `h1`, associated consequence text, a confirmed POST form, a cancel
  link/action, visible focus, a named error/status region, and no identity/provider/token value.
- **Errors/traffic:** invalid return target gives safe local page or `400 invalid_request`, never open
  redirect. Idempotent read, no race/pagination; session/network limit.
- **Privacy/publication/rollback:** no session/token/hint/state logs or cache. Excluded from OpenAPI;
  discovery is authoritative. Rollback leaves session intact.
- **Exact Gherkin proof:** [`ID04-LOGOUT-001` — “Confirmed logout ends the bound session safely” and
  `ID04-LOGOUT-002` — “A keyboard user cancels OSE ID logout”](./004-bdd-spec-delta-and-adapter-map.md#logout--id04-logout-001)
  → `specs/apps/ose/id-be/behaviours/sessions/logout.feature`; Unit, Integration, and E2E required with
  Rule-9 browser evidence; no exemption.

### Logout command

- **Operation/action:** `POST /connect/logout` — `ADD`.

  ```http
  POST /connect/logout HTTP/1.1
  Host: 127.0.0.1:8501
  Cookie: ose_id_session=<opaque>
  Origin: http://127.0.0.1:8501
  Content-Type: application/x-www-form-urlencoded

  confirm=true&csrf=<opaque>&state=state_opaque
  ```

  ```http
  HTTP/1.1 302 Found
  Location: http://127.0.0.1:3400/auth/signed-out?state=state_opaque
  Cache-Control: no-store
  Set-Cookie: ose_id_session=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax
  ```

- **Caller/auth/context:** confirmed same-session browser; exact origin, anti-forgery, and registered
  return target.
- **Request:** form confirmation, anti-forgery value, and opaque state; no arbitrary URI.
- **Success:** `302` only to registered URI or `204` local completion; matching cookie deletion and
  documented grant consequences; `no-store`.
- **Errors/traffic:** `400 invalid_request`, `403 invalid_csrf`, safe `401 session_absent`; repeated/
  concurrent submissions converge on signed-out state. No pagination; session limit.
- **Privacy/publication/rollback:** never log CSRF/session/token/state. Excluded from OpenAPI/codegen.
  Rollback cannot resurrect session/grant.
- **Exact Gherkin proof:** [`ID04-LOGOUT-001` — “Confirmed logout ends the bound session safely” and
  `ID04-LOGOUT-002` — “A keyboard user cancels OSE ID logout”](./004-bdd-spec-delta-and-adapter-map.md#logout--id04-logout-001)
  → `specs/apps/ose/id-be/behaviours/sessions/logout.feature`; Unit, Integration, and E2E required,
  with E2E proving one mutation and zero cancel submissions; no exemption.

### Transaction render

- **Operation/action:** `GET /internal/authorization-transactions/{transactionId}` — `ADD`.

  ```http
  GET /internal/authorization-transactions/txn_opaque HTTP/1.1
  Host: 127.0.0.1:8501
  Accept: application/json
  Authorization: Bearer <redacted-synthetic-bff-capability>
  Cookie: ose_id_session=<opaque>
  ```

- **Caller/auth/context:** authenticated first-party BFF/synthetic service plus bound Person session;
  backend reloads entitlement and eligible personal/company contexts.
- **Request:** opaque path ID, `Accept: application/json`; no query/body.
- **Success:** `200`, `no-store`; schema carries opaque transaction/version, safe client display,
  described scopes, offered contexts, current selection/consent state, and expiry. Synthetic example:

  ```json
  {
    "transactionId": "txn_opaque",
    "version": 2,
    "client": { "name": "LMS" },
    "scopes": [{ "name": "ose.lms", "description": "Access LMS" }],
    "contexts": [{ "choiceId": "ctx_personal", "label": "Personal", "type": "personal" }],
    "selectedContext": null,
    "consentState": "pending",
    "expiresAt": "2026-09-15T02:00:00Z"
  }
  ```

  The response contains no raw company authority.

- **Errors/traffic:** stable problems `authorization_transaction_not_found` (`404`),
  `authorization_context_forbidden` (`403`), `authorization_transaction_terminal` (`409`),
  `authorization_transaction_expired` (`410`). Validate binding/fresh authority. Idempotent read,
  bounded polling, no pagination; races surface a newer `version`.
- **Privacy/publication/rollback:** log opaque digest/status/correlation, not labels/email. Add to
  OpenAPI and generated BFF client. Additive rollback lets rows expire.
- **Exact Gherkin proof:** [`ID04-AUTH-001/002` — the personal/company authorization scenarios](./004-bdd-spec-delta-and-adapter-map.md#authorization-code--id04-auth-001-and-id04-auth-002)
  → `specs/apps/ose/id-be/behaviours/authorization/authorization-code.feature`; and
  [`ID04-STATE-001` — “Another instance completes the transaction”](./004-bdd-spec-delta-and-adapter-map.md#statelessness--id04-state-001)
  → `specs/apps/ose/id-be/behaviours/runtime/statelessness.feature`. Unit, Integration, and E2E are
  required for each; no exemption.

### Context selection

- **Operation/action:** `POST /internal/authorization-transactions/{transactionId}/context` — `ADD`.

  ```http
  POST /internal/authorization-transactions/txn_opaque/context HTTP/1.1
  Host: 127.0.0.1:8501
  Authorization: Bearer <redacted-synthetic-bff-capability>
  Cookie: ose_id_session=<opaque>
  Content-Type: application/json

  {"choiceId":"ctx_opaque_company_a","expectedVersion":2}
  ```

  ```http
  HTTP/1.1 200 OK
  Content-Type: application/json
  Cache-Control: no-store

  {"transactionId":"txn_opaque","version":3,"selectedContext":{"choiceId":"ctx_opaque_company_a","type":"company"},"consentState":"pending"}
  ```

- **Caller/auth/context:** bound BFF/session; `choiceId` must be a freshly offered opaque option.
- **Request:** JSON with required non-empty string `choiceId` and non-negative integer
  `expectedVersion`; reject unknown fields. Example:

  ```json
  {
    "choiceId": "ctx_opaque_company_a",
    "expectedVersion": 2
  }
  ```

- **Success:** `200`, `no-store`, returns the render model above with selection and incremented version.
- **Errors/traffic:** `invalid_request` (`400`), `authorization_context_forbidden` (`403`),
  `authorization_transaction_stale|terminal` (`409`), `authorization_transaction_expired` (`410`),
  `rate_limited` (`429`, `Retry-After`). Same command/version is equivalent; competing versions have
  one winner. No pagination.
- **Privacy/publication/rollback:** never log path/body/membership. Add schema/statuses to OpenAPI and
  regenerate client. Rollback preserves row until expiry.
- **Exact Gherkin proof:** [`ID04-AUTH-001/002` — the personal/company authorization scenarios](./004-bdd-spec-delta-and-adapter-map.md#authorization-code--id04-auth-001-and-id04-auth-002)
  → `specs/apps/ose/id-be/behaviours/authorization/authorization-code.feature`; and
  [`ID04-STATE-001` — “Another instance completes the transaction”](./004-bdd-spec-delta-and-adapter-map.md#statelessness--id04-state-001)
  → `specs/apps/ose/id-be/behaviours/runtime/statelessness.feature`. Unit, Integration, and E2E are
  required for each; no exemption.

### Consent decision

- **Operation/action:** `POST /internal/authorization-transactions/{transactionId}/decision` — `ADD`.

  ```http
  POST /internal/authorization-transactions/txn_opaque/decision HTTP/1.1
  Host: 127.0.0.1:8501
  Authorization: Bearer <redacted-synthetic-bff-capability>
  Cookie: ose_id_session=<opaque>
  Content-Type: application/json

  {"decision":"allow","expectedVersion":3}
  ```

- **Caller/auth/context:** bound BFF/session after context selection; backend reloads all authority.
- **Request:** JSON with required enum `decision` (`allow` or `cancel`) and non-negative integer
  `expectedVersion`; reject unknown fields. Example:

  ```json
  {
    "decision": "allow",
    "expectedVersion": 3
  }
  ```

- **Success:** `200`, `no-store`. The response has authorized-or-cancelled `status` and a
  `continuation` whose `kind` is fixed to `protocol` and whose string `reference` is opaque and never a
  code or token. Example:

  ```json
  {
    "status": "authorized",
    "continuation": {
      "kind": "protocol",
      "reference": "continuation_opaque"
    }
  }
  ```

- **Errors/traffic:** `invalid_request` (`400`), `authorization_context_forbidden` (`403`),
  `authorization_transaction_stale|terminal` (`409`), `authorization_transaction_expired` (`410`),
  `rate_limited` (`429`). One terminal decision wins; replay never issues twice. No pagination.
- **Privacy/publication/rollback:** log decision class/outcome/correlation only. Add to OpenAPI/codegen.
  Rollback expires state and never reopens consent.
- **Exact Gherkin proof:** [`ID04-AUTH-001/002` — the personal/company authorization scenarios](./004-bdd-spec-delta-and-adapter-map.md#authorization-code--id04-auth-001-and-id04-auth-002)
  → `specs/apps/ose/id-be/behaviours/authorization/authorization-code.feature`;
  [`ID04-TOKEN-001` — “An authorization code is consumed once”](./004-bdd-spec-delta-and-adapter-map.md#token-safety--id04-token-001-and-id04-token-002)
  → `specs/apps/ose/id-be/behaviours/tokens/token-safety.feature`; and
  [`ID04-STATE-001` — “Another instance completes the transaction”](./004-bdd-spec-delta-and-adapter-map.md#statelessness--id04-state-001)
  → `specs/apps/ose/id-be/behaviours/runtime/statelessness.feature`. Unit, Integration, and E2E are
  required for each; no exemption.

### Liveness

- **Operation/action:** `GET /health/live` — `RETAIN`.

  ```http
  GET /health/live HTTP/1.1
  Host: 127.0.0.1:8501
  Accept: application/json
  ```

- **Caller/auth/context:** local orchestrator or developer; anonymous; no Person/company context.
- **Request:** `Accept: application/json`; no headers beyond normal HTTP metadata, query, or body.
- **Success:** `200 application/json` with the accepted minimal liveness status; the response asserts
  process life only and has no dependency, identity, or tenant fields:

  ```json
  {
    "status": "live",
    "service": "ose-id-be"
  }
  ```

- **Errors/traffic:** a non-listening process is the failure signal. The read is idempotent, has no
  replay, concurrency, pagination, or mutation contract, and uses the accepted local probe limit.
- **Privacy/publication/rollback:** log route/status/correlation only; no-store; retain the accepted
  backend OpenAPI operation and generated-client disposition byte- and semantics-compatible. Rollback
  does not change it.
- **Exact Gherkin proof:** [`ID04-RETAIN-LIVE-001` — “Liveness remains independent from dependency
  readiness”](#id04-retain-live-001--liveness-compatibility) →
  `specs/apps/ose/id-be/behaviours/foundation/health.feature`; Unit, Integration, and E2E are required,
  with no exemption.

### Readiness

- **Operation/action:** `GET /health/ready` — `RETAIN`.

  ```http
  GET /health/ready HTTP/1.1
  Host: 127.0.0.1:8501
  Accept: application/json
  ```

- **Caller/auth/context:** local orchestrator or developer; anonymous; no Person/company context.
- **Request:** `Accept: application/json`; no query or body.
- **Success:** `200 application/json` only when the accepted readiness dependencies are usable; the
  safe body contains dependency classes/statuses, never connection strings or credentials:

  ```json
  {
    "status": "ready",
    "components": {
      "postgresql": "ready",
      "schema": "compatible"
    }
  }
  ```

- **Errors/traffic:** retain the accepted `503` not-ready response and stable safe problem/status.
  Read-only and idempotent; no replay, mutation race, pagination, or caller retry promise.
- **Privacy/publication/rollback:** never log dependency secrets; no-store; retain its backend OpenAPI
  and generated-client contract unchanged. Rollback preserves the same dependency interpretation.
- **Exact Gherkin proof:** [`ID04-RETAIN-READY-001` — “Readiness continues to report dependency state
  safely”](#id04-retain-ready-001--readiness-compatibility) →
  `specs/apps/ose/id-be/behaviours/foundation/health.feature`; Unit, Integration, and E2E are required,
  with no exemption.

### Disabled Google seam

- **Operation/action:** `GET /external/google/challenge` — `RETAIN`.

  ```http
  GET /external/google/challenge HTTP/1.1
  Host: 127.0.0.1:8501
  Accept: application/problem+json
  ```

- **Caller/auth/context:** browser; anonymous; no Person/company/provider authority is accepted.
- **Request:** normal navigation only; no supported query parameter or body.
- **Success:** none while this seam is disabled. Retain `404 application/problem+json`, `no-store`, no
  `Location`, and:

  ```json
  {
    "status": 404,
    "code": "capability_disabled",
    "title": "Capability is not available",
    "correlationId": "correlation_opaque"
  }
  ```

- **Errors/traffic:** this stable fail-closed result covers every bounded query; it is idempotent, has
  no replay/concurrency/pagination effect, and keeps the accepted public-route limit.
- **Privacy/publication/rollback:** log route/status/correlation only; no email/provider identifier;
  no-store; retain OpenAPI operation `rejectDisabledGoogleSignIn` and its generated-client disposition,
  and remain outside OIDC discovery. Rollback cannot enable it.
- **Exact Gherkin proof:** [`ID04-RETAIN-SEAM-001` — “The disabled Google challenge remains
  unavailable”](#id04-retain-seam-001--disabled-google-compatibility) →
  `specs/apps/ose/id-be/behaviours/foundation/disabled-capabilities.feature`; Unit, Integration, and E2E
  are required, with no exemption.

### DELETE operation packet

There is no `DELETE` operation. A removal discovered during implementation is a contract amendment and
blocks delivery until it receives its own operation packet and compatibility strategy.

## Exact token and registration effect

The only initial client is `ose-lms-app-web-local`; only callback
`http://127.0.0.1:3400/auth/oidc/callback`, post-logout URI
`http://127.0.0.1:3400/auth/signed-out`, resource/audience `urn:ose:lms-api`, scopes `openid`,
`profile`, `ose.context`, and `ose.lms`, contexts `personal|company`, and entitlement `lms.access` are
allowed. Token
claims follow the allowlists in document 001. Extra claims are a breaking disclosure, not a harmless
addition.

## Copy-ready API and protocol contract scenarios

The scenario titles below are the mapping keys for every delta row. Copy them into the app-scoped
feature path named in the adjacent BDD delta and bind each to Unit, Integration, and E2E. No adapter
exemption applies.

| Delta operation or category                                          | Action | Full contract scenarios                                                                                                                                                                                             |
| -------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /.well-known/openid-configuration`                              | ADD    | Enabled operation returns its exact success contract; invalid authority or input returns a stable error; operation artifacts remain private and correctly cached                                                    |
| `GET /connect/authorize`                                             | UPDATE | Enabled operation returns its exact success contract; invalid authority or input returns a stable error; concurrent and replayed mutations converge safely; operation artifacts remain private and correctly cached |
| `POST /connect/token`                                                | UPDATE | Enabled operation returns its exact success contract; invalid authority or input returns a stable error; concurrent and replayed mutations converge safely; operation artifacts remain private and correctly cached |
| `GET /connect/jwks`                                                  | ADD    | Enabled operation returns its exact success contract; invalid authority or input returns a stable error; operation artifacts remain private and correctly cached                                                    |
| `POST /connect/revocation`                                           | ADD    | Enabled operation returns its exact success contract; invalid authority or input returns a stable error; concurrent and replayed mutations converge safely; operation artifacts remain private and correctly cached |
| `GET /connect/logout`                                                | ADD    | Enabled operation returns its exact success contract; invalid authority or input returns a stable error; operation artifacts remain private and correctly cached                                                    |
| `POST /connect/logout`                                               | ADD    | Enabled operation returns its exact success contract; invalid authority or input returns a stable error; concurrent and replayed mutations converge safely; operation artifacts remain private and correctly cached |
| `GET /internal/authorization-transactions/{transactionId}`           | ADD    | Enabled operation returns its exact success contract; invalid authority or input returns a stable error; operation artifacts remain private and correctly cached                                                    |
| `POST /internal/authorization-transactions/{transactionId}/context`  | ADD    | Enabled operation returns its exact success contract; invalid authority or input returns a stable error; concurrent and replayed mutations converge safely; operation artifacts remain private and correctly cached |
| `POST /internal/authorization-transactions/{transactionId}/decision` | ADD    | Enabled operation returns its exact success contract; invalid authority or input returns a stable error; concurrent and replayed mutations converge safely; operation artifacts remain private and correctly cached |
| `GET /health/live`                                                   | RETAIN | Retained adjacent operation keeps its accepted contract                                                                                                                                                             |
| `GET /health/ready`                                                  | RETAIN | Retained adjacent operation keeps its accepted contract                                                                                                                                                             |
| `GET /external/google/challenge`                                     | RETAIN | Retained adjacent operation keeps its accepted contract                                                                                                                                                             |
| No operation                                                         | DELETE | No accepted operation is removed                                                                                                                                                                                    |

```gherkin
Feature: OSE ID authorization-server operation success contracts
  Rule: Every enabled operation returns only its declared success shape

    Scenario Outline: Enabled operation returns its exact success contract
      Given the caller satisfies the registered client session and context contract for <operation>
      When the caller sends the valid request for <operation>
      Then the response status is <status>
      And the response contains <result> with the declared headers and no undeclared field

      Examples:
        | operation | status | result |
        | GET /.well-known/openid-configuration | 200 | exact issuer endpoint grant scope algorithm and PKCE metadata |
        | GET /connect/authorize | 302 | a one-time code and preserved state at the exact registered redirect |
        | POST /connect/token | 200 | an ID token and exact-audience access token without a refresh token |
        | GET /connect/jwks | 200 | active and unexpired verify-only public keys |
        | POST /connect/revocation | 200 | the standards empty non-oracular result |
        | GET /connect/logout | 200 | a confirmation document without session mutation |
        | POST /connect/logout | 302 | a cleared bound session and registered continuation |
        | GET /internal/authorization-transactions/{transactionId} | 200 | the safe current render model and version |
        | POST /internal/authorization-transactions/{transactionId}/context | 200 | the selected offered context and incremented version |
        | POST /internal/authorization-transactions/{transactionId}/decision | 200 | one opaque authorized or cancelled continuation |
```

```gherkin
Feature: OSE ID authorization-server contract failures
  Rule: Invalid input or authority fails with the stable non-leaking contract

    Scenario Outline: Invalid authority or input returns a stable error
      Given the caller sends <fault> to <operation>
      When OSE ID validates the request before changing authorization state
      Then the response is <status> with <error>
      And no grant token session context or consent authority is created or widened

      Examples:
        | operation | fault | status | error |
        | GET /.well-known/openid-configuration | an unsafe incomplete issuer profile | 503 | temporarily_unavailable |
        | GET /connect/authorize | an unregistered redirect URI | 400 | invalid_request without redirect |
        | POST /connect/token | a replayed authorization code | 400 | invalid_grant |
        | GET /connect/jwks | unavailable safe verification keys | 503 | temporarily_unavailable |
        | POST /connect/revocation | invalid client authentication | 401 | invalid_client |
        | GET /connect/logout | an unregistered post-logout URI | 400 | invalid_request |
        | POST /connect/logout | invalid anti-forgery proof | 403 | invalid_csrf |
        | GET /internal/authorization-transactions/{transactionId} | a transaction not visible to the bound session | 404 | authorization_transaction_not_found |
        | POST /internal/authorization-transactions/{transactionId}/context | a stale expected version | 409 | authorization_transaction_stale |
        | POST /internal/authorization-transactions/{transactionId}/decision | an expired transaction | 410 | authorization_transaction_expired |
```

```gherkin
Feature: OSE ID authorization-server replay and concurrency
  Rule: A one-time or state-changing operation has one authoritative outcome

    Scenario Outline: Concurrent and replayed mutations converge safely
      Given two callers race the same valid state for <operation>
      When both requests reach different stateless OSE ID instances
      Then <outcome>
      And a later replay cannot create another authorization effect

      Examples:
        | operation | outcome |
        | GET /connect/authorize | each start has a distinct expiring transaction and neither authorizes by itself |
        | POST /connect/token | exactly one request consumes the code and the other receives invalid_grant |
        | POST /connect/revocation | both requests receive the non-oracular success and the token remains revoked |
        | POST /connect/logout | both requests converge on the same signed-out session state |
        | POST /internal/authorization-transactions/{transactionId}/context | one version transition wins and the stale request cannot replace it |
        | POST /internal/authorization-transactions/{transactionId}/decision | one terminal decision wins and no second code is issued |
```

```gherkin
Feature: OSE ID authorization-server privacy and cache boundaries
  Rule: Protocol and identity material never crosses its declared exposure boundary

    Scenario Outline: Operation artifacts remain private and correctly cached
      Given a valid request completes at <operation>
      When logs caches browser-visible payloads and generated contracts are inspected
      Then <protected> is absent from every forbidden surface
      And the operation uses its declared no-store or bounded-public-cache policy

      Examples:
        | operation | protected |
        | GET /.well-known/openid-configuration | identity data and disabled protocol capabilities |
        | GET /connect/authorize | state nonce PKCE challenge authorization code and personal data in logs |
        | POST /connect/token | client secret code verifier and issued token in logs or caches |
        | GET /connect/jwks | private or symmetric key material |
        | POST /connect/revocation | client authentication and token value |
        | GET /connect/logout | session token logout hint and state in logs or caches |
        | POST /connect/logout | anti-forgery session token and state |
        | GET /internal/authorization-transactions/{transactionId} | raw identity company membership and transaction identifier in logs |
        | POST /internal/authorization-transactions/{transactionId}/context | raw choice transaction and membership data in logs |
        | POST /internal/authorization-transactions/{transactionId}/decision | raw transaction continuation and consent payload in logs |
```

```gherkin
Feature: OSE ID contract compatibility
  Rule: The new authorization server is additive to accepted identity operations

    Scenario: No accepted operation is removed
      Given the API delta declares no delete operation
      When the machine contracts are compared with the accepted predecessor
      Then no predecessor operation or schema member is repurposed or removed
      And any discovered drift blocks delivery as a contract amendment
```

### ID04-RETAIN-LIVE-001 — Liveness compatibility

**Canonical destination:** `specs/apps/ose/id-be/behaviours/foundation/health.feature`. Unit,
Integration, and E2E are required; exemptions: none.

```gherkin
Scenario: Liveness remains independent from dependency readiness
  Given the accepted anonymous liveness contract
  When the authorization-server contract is enabled
  Then liveness reports only whether the process is alive
  And no dependency identity or tenant state enters the response
```

### ID04-RETAIN-READY-001 — Readiness compatibility

**Canonical destination:** `specs/apps/ose/id-be/behaviours/foundation/health.feature`. Unit,
Integration, and E2E are required; exemptions: none.

```gherkin
Scenario: Readiness continues to report dependency state safely
  Given the accepted dependency-readiness contract
  When the authorization-server schema is present
  Then readiness reflects whether PostgreSQL and the schema are usable
  And no connection credential or secret enters the response
```

### ID04-RETAIN-SEAM-001 — Disabled Google compatibility

**Canonical destination:** `specs/apps/ose/id-be/behaviours/foundation/disabled-capabilities.feature`.
Unit, Integration, and E2E are required; exemptions: none.

```gherkin
Scenario: The disabled Google challenge remains unavailable
  Given the accepted Google challenge capability is disabled
  When the authorization-server contract is enabled
  Then the challenge route returns the stable capability-disabled problem
  And no redirect provider call correlation or identity record is created
```

## Discovery, OpenAPI, and code generation

- Discovery and JWKS are generated from the enabled OpenIddict profile and asserted as semantic JSON;
  snapshot ordering is not contractual.
- Protocol endpoints are excluded from OpenAPI and REST client generation. Standards-compliant clients
  consume discovery and OAuth/OIDC media types, and a separate protocol-conformance harness—not the
  REST/GraphQL API Quality Gate—proves their wire behavior.
- Updating `GET /connect/authorize` and `POST /connect/token` from fail-closed bootstrap placeholders to
  standards endpoints removes their old `capability_disabled` OpenAPI path operations. This is an
  OpenAPI publication change attached to the two `UPDATE` rows, not deletion of the HTTP operations.
- Add the three `/internal/authorization-transactions` operations and problem schemas to
  `specs/apps/ose/id-be/contracts/openapi.yaml`, split path/schema files per repository convention, and
  regenerate only the repository-owned backend-to-web client artifact.
- OpenAPI fails on an undocumented status, field, nullability change, or secret-bearing schema. The
  generated client is build-checked but never hand-edited.

## Compatibility and rollback

The database and API change is additive. Old account clients ignore discovery and new internal routes;
the synthetic OIDC client opts in through an exact registration. During rollback, prior backend code
runs against the retained additive schema while the client registration/issuer feature stays disabled;
never down-migrate, drop grants, or reuse a code. A protocol-shape defect is fixed forward or by
reverting this complete delivery unit. Production mode continues to reject local issuer/client/key
configuration before listen.

## Proof obligations

| Layer       | Required proof                                                                                                                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit        | Endpoint/profile registration, redirect/resource/scope/PKCE validation, safe error mapping, exact claim destinations, idempotent revocation/logout, transaction state and rate-limit policy                         |
| Integration | OpenIddict pipeline, custom-store/PostgreSQL atomic code/decision consumption, stale version, session/context/entitlement reload, discovery/OpenAPI/codegen agreement, key/JWKS overlap                             |
| E2E         | Built issuer plus synthetic BFF/resource completes allow/cancel, personal/company, wrong redirect/scope/audience/verifier, replay/concurrency, logout/revocation, instance A-to-B, and production no-listener cases |

Every durable scenario keeps the default Unit/Integration/E2E bindings from the BDD adapter map. There
are no contract-level exemptions. Sanitized evidence records status and allowlisted names only.
