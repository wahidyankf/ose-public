# API Contract Delta

## Contract boundary

The first-party site is `http://127.0.0.1:3500` in explicit local mode. Browser page routes and
same-origin BFF commands are Next.js application contracts, not OIDC endpoints. The authoritative
OIDC/OAuth surface remains on `ose-id-be` at `http://127.0.0.1:8501`; the web never reimplements or
proxies its standards semantics into a new issuer. Browser responses contain render-safe state and an
opaque protected session cookie, never protocol artifacts.

## Operation index

Every operation has one action and one packet. `RETAIN` is limited to predecessor operations that a
new page or BFF command directly consumes. There is no `UPDATE` or `DELETE` operation.

| Action | Exact operation                                                      | Detailed packet                                                      |
| ------ | -------------------------------------------------------------------- | -------------------------------------------------------------------- |
| ADD    | `GET /sign-in`                                                       | [Sign-in page](#operation-05-sign-in)                                |
| ADD    | `GET /verify-email`                                                  | [Email verification page](#operation-05-verify-email)                |
| ADD    | `GET /recover`                                                       | [Recovery page](#operation-05-recover)                               |
| ADD    | `GET /authorize/context`                                             | [Context page](#operation-05-context-page)                           |
| ADD    | `GET /authorize/consent`                                             | [Consent page](#operation-05-consent-page)                           |
| ADD    | `GET /account/security`                                              | [Security page](#operation-05-security-page)                         |
| ADD    | `GET /account/sessions`                                              | [Sessions page](#operation-05-sessions-page)                         |
| ADD    | `POST /api/bff/sign-in/identify`                                     | [Identifier command](#operation-05-identify)                         |
| ADD    | `POST /api/bff/sign-in/password`                                     | [Password command](#operation-05-password)                           |
| ADD    | `POST /api/bff/recovery/request`                                     | [Recovery request](#operation-05-recovery-request)                   |
| ADD    | `POST /api/bff/authorization/context`                                | [Context command](#operation-05-context-command)                     |
| ADD    | `POST /api/bff/authorization/decision`                               | [Consent command](#operation-05-decision-command)                    |
| ADD    | `POST /api/bff/sessions/{sessionId}/revoke`                          | [Session revoke command](#operation-05-session-revoke)               |
| RETAIN | `GET /connect/authorize`                                             | [Authorization protocol dependency](#operation-05-retain-authorize)  |
| RETAIN | `GET /internal/authorization-transactions/{transactionId}`           | [Transaction render dependency](#operation-05-retain-transaction)    |
| RETAIN | `POST /internal/authorization-transactions/{transactionId}/context`  | [Context dependency](#operation-05-retain-context)                   |
| RETAIN | `POST /internal/authorization-transactions/{transactionId}/decision` | [Decision dependency](#operation-05-retain-decision)                 |
| RETAIN | `POST /api/v1/accounts/email-verifications`                          | [Verification dependency](#operation-05-retain-verification)         |
| RETAIN | `POST /api/v1/account-sessions`                                      | [Session-creation dependency](#operation-05-retain-session-create)   |
| RETAIN | `DELETE /api/v1/account-sessions/{sessionId}`                        | [Session-revocation dependency](#operation-05-retain-session-delete) |
| RETAIN | `POST /api/v1/accounts/password-recovery-requests`                   | [Recovery dependency](#operation-05-retain-recovery)                 |

## Delta summary

### ADD — browser page routes

| Method and exact route   | Caller                                                              | Authentication, authorization, and context                                                 | Success behavior                                                                | Error/cache behavior                                                                        |
| ------------------------ | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `GET /sign-in`           | browser redirected from an authorization transaction                | signed-out or resumable web session; opaque transaction resolves server-side               | Identifier-first page naming OSE ID and the registered client                   | `no-store`; safe restart for absent/expired transaction; no account/provider enumeration    |
| `GET /verify-email`      | browser following local Mailpit link from the email-account service | one-time capability exchanged server-side; raw capability is removed from navigation state | Generic verified/already-handled/invalid-or-expired state and safe continuation | `no-store`; same visible guidance for unsafe/expired values; no token in RSC/log/analytics  |
| `GET /recover`           | browser requesting or following local recovery                      | public request is enumeration-safe; completion needs one-time capability                   | Request, accepted, completion, or invalid/expired state                         | `no-store`; stable safe errors and restart path                                             |
| `GET /authorize/context` | authenticated browser web session                                   | backend transaction offers eligible personal/company contexts                              | Render only opaque choices returned by backend                                  | Redirect to sign-in when session absent; `409/410` becomes safe stale/expired page          |
| `GET /authorize/consent` | authenticated session with backend-selected context                 | client, scopes, context, entitlement, expiry reloaded server-side                          | Visible client/context/all scope descriptions with Allow and Cancel             | `no-store`; no action for stale/changed authority; safe client return when protocol permits |
| `GET /account/security`  | authenticated account owner                                         | global Person scope, never company scope                                                   | Email/password and delivered account-security state only                        | No future provider/MFA action; safe dependency error without cached identity state          |
| `GET /account/sessions`  | authenticated account owner with recent-auth policy for mutation    | global Person scope                                                                        | Current/other session summaries and revocation controls                         | Identifiers are opaque; revoked/concurrent state refreshes safely                           |

Page navigation is GET-only. All state changes use the BFF commands below; query strings and hidden
fields never select company, scope, redirect, or client authority.

### ADD — same-origin BFF command surface

All mutation routes require the opaque `HttpOnly` session cookie, exact allowed origin, CSRF proof,
`Content-Type: application/json`, and request size limits. Success bodies are render-safe JSON; errors
use the repository `application/problem+json` shape with stable app-scoped codes and correlation ID.

| Method and exact path                       | Caller        | Request / success                                                                                                  | Authorization, errors, idempotency, concurrency, rate limit                                                                                              |
| ------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/bff/sign-in/identify`            | sign-in form  | JSON email request; `202` generic next-step descriptor                                                             | Public but CSRF/origin protected; registered/unregistered parity; per-address/network safe limiter; repeated request gives equivalent guidance           |
| `POST /api/bff/sign-in/password`            | password step | JSON password request; `200` safe next route                                                                       | Bound opaque attempt/session only; rotate session on success; generic `401`; bounded attempts; concurrent success creates one current session transition |
| `POST /api/bff/recovery/request`            | recovery form | JSON email request; `202` generic accepted state                                                                   | Same enumeration-safe body/status/timing class; Mailpit delivery belongs to the email-account service; limiter is shared                                 |
| `POST /api/bff/authorization/context`       | context form  | JSON transaction, choice, and version request; `200` safe next route                                               | Backend revalidates context; `403` lost authority, `409` stale, `410` expired; one version transition wins                                               |
| `POST /api/bff/authorization/decision`      | consent form  | JSON carries opaque transaction, `allow` or `cancel`, and numeric expected version; `200` safe redirect descriptor | Backend owns callback/code; duplicate/concurrent submission never issues twice; per-session/client limiter                                               |
| `POST /api/bff/sessions/{sessionId}/revoke` | sessions page | empty JSON object; `204` after server-side revocation                                                              | Owner plus recent-auth when policy requires; current-session revoke rotates/clears cookie; repeated revoke is idempotent; stale version is safe          |

The browser never receives or submits a client secret, PKCE verifier, authorization code, access/ID/
refresh token, recovery capability, backend session identifier, raw company ID, or arbitrary return
URL. The BFF follows only backend-provided opaque choices and registered redirect outcomes.

### UPDATE

None for OIDC/OAuth protocol endpoints, discovery, token claims, or backend authorization semantics.
The backend may receive a narrow render-model/OpenAPI correction only when Phase 0 proves the existing
contract cannot represent the selected UI; such a change requires an explicit plan amendment before
implementation rather than an implicit widening.

### DELETE

None. No backend/account/protocol route or response field is removed.

### RETAIN

The index lists only the eight predecessor operations directly consumed by the selected web journeys.
Their protocol or REST contracts stay unchanged. Mailpit delivery remains owned by the predecessor
email-account service; the web only presents its result. Personal/company discrimination, backend
consent/context authority, exact LMS audience/scopes, and the absence of provider/passkey/MFA controls
remain invariant.

## Detailed operation packets

Every page response uses `Cache-Control: no-store`, semantic HTML, a safe correlation reference, and
no serialized backend/session/protocol secret. Every BFF mutation requires exact same origin, CSRF,
JSON content type, size limit, and the opaque `HttpOnly; Secure; SameSite=Lax` session cookie when its
packet requires a session. Problems are `application/problem+json` with required type, title, status,
code, and correlation ID plus optional field errors; logs contain route, stable code, timing bucket,
and correlation only. BFF commands have no pagination and never retry one-time mutations automatically.

### Operation 05 sign in

- **Operation/action:** `GET /sign-in` — `ADD`.

  ```http
  GET /sign-in HTTP/1.1
  Host: 127.0.0.1:3500
  Accept: text/html
  ```

  ```http
  HTTP/1.1 200 OK
  Content-Type: text/html; charset=utf-8
  Cache-Control: no-store

  <!doctype html>
  <main>
    <h1>Sign in to continue to LMS</h1>
    <form method="post" action="/api/bff/sign-in/identify">
      <label for="email">Email</label>
      <input id="email" name="email" type="email" autocomplete="email" required />
      <button type="submit">Continue</button>
    </form>
  </main>
  ```

- **Caller/auth/context/request:** browser, signed out or resumable opaque transaction; optional opaque
  transaction reference only, no body. `Accept: text/html`.
- **Success/schema/example:** `200 text/html`; render this model:

  ```json
  {
    "clientDisplayName": "LMS",
    "identifierValue": "",
    "nextAction": "identify",
    "methods": ["email"]
  }
  ```

  The heading is “Sign in to continue to LMS”; Google, Facebook, and MFA are absent.

- **Errors/traffic:** absent/expired transaction becomes safe restart (`authorization_not_found` `404`
  or `authorization_expired` `410` from dependency, rendered without detail). Read idempotent;
  concurrent tabs remain transaction-bound; network/session limit; no pagination.
- **Privacy/publication/rollback:** no untrusted email prefill, PII cache, or PII logs. Outside backend
  OpenAPI/codegen. Additive local-gated route; rollback removes it.
- **Exact Gherkin proof:** [`ID05-SIGNIN-001` — “A verified user signs in through OSE ID web”](./005-bdd-spec-delta-and-adapter-map.md#email-sign-in--id05-signin-001)
  → `specs/apps/ose/id-web/behaviours/sign-in/email-sign-in.feature`;
  [`ID05-SIGNIN-002` — “Sign-in guidance does not enumerate an account”](./005-bdd-spec-delta-and-adapter-map.md#enumeration-safety--id05-signin-002)
  → `specs/apps/ose/id-web/behaviours/sign-in/enumeration-safety.feature`; and
  [`ID05-METHOD-001` — “Only delivered sign-in methods are shown”](./005-bdd-spec-delta-and-adapter-map.md#delivered-methods--id05-method-001)
  → `specs/apps/ose/id-web/behaviours/sign-in/method-availability.feature`; U/I/E required, no exemption.

### Operation 05 verify email

- **Operation/action:** `GET /verify-email` — `ADD`.

  ```http
  GET /verify-email?capability=%3Cone-time-capability%3E HTTP/1.1
  Host: 127.0.0.1:3500
  Accept: text/html
  ```

  ```http
  HTTP/1.1 200 OK
  Content-Type: text/html; charset=utf-8
  Cache-Control: no-store

  <!doctype html>
  <main>
    <h1>Email verified</h1>
    <p role="status">Your email address is ready to use.</p>
    <a href="/sign-in">Continue signing in</a>
  </main>
  ```

- **Caller/auth/context/request:** browser from local Mailpit; one-time capability exchanges only at a
  server boundary and is stripped by immediate safe redirect; no tenant context/body.
- **Success/schema/example:** `200 text/html`; render one accepted state and safe continuation:

  ```json
  {
    "state": "verified",
    "continuation": "/sign-in"
  }
  ```

  The visible example is “Email verified — continue signing in.”

- **Errors/traffic:** `verification_invalid_or_expired` for malformed/expired/replayed values and
  `verification_unavailable` for dependency failure. One exchange wins concurrent opens; later opens
  get equivalent safe guidance; network limit; no pagination.
- **Privacy/publication/rollback:** capability never enters RSC/history/analytics/cache/log. Outside
  OpenAPI; generated predecessor client. Rollback keeps backend verification.
- **Exact Gherkin proof:** [`ID05-VERIFY-001` — “An email-verification link has one safe outcome”](./005-bdd-spec-delta-and-adapter-map.md#email-verification--id05-verify-001)
  → `specs/apps/ose/id-web/behaviours/sign-in/email-verification.feature`; U/I/E required, no exemption.

### Operation 05 recover

- **Operation/action:** `GET /recover` — `ADD`.

  ```http
  GET /recover HTTP/1.1
  Host: 127.0.0.1:3500
  Accept: text/html
  ```

  ```http
  HTTP/1.1 200 OK
  Content-Type: text/html; charset=utf-8
  Cache-Control: no-store

  <!doctype html>
  <main>
    <h1>Recover your account</h1>
    <form method="post" action="/api/bff/recovery/request">
      <label for="recovery-email">Email</label>
      <input id="recovery-email" name="email" type="email" autocomplete="email" required />
      <button type="submit">Send recovery email</button>
    </form>
  </main>
  ```

- **Caller/auth/context/request:** public browser for request state or one-time link exchange; no
  company context/body.
- **Success/schema/example:** `200 text/html`; render request, accepted, complete, or
  invalid-or-expired state with equal guidance. Example:

  ```json
  {
    "state": "accepted",
    "email": ""
  }
  ```

- **Errors/traffic:** `recovery_invalid_or_expired`, `recovery_unavailable`; one-time completion, one
  concurrent winner; address/network limiter; no pagination.
- **Privacy/publication/rollback:** email/capability/password never logged/cached. Outside OpenAPI;
  rollback removes presentation only.
- **Exact Gherkin proof:** [`ID05-SIGNIN-002` — “Sign-in guidance does not enumerate an account”](./005-bdd-spec-delta-and-adapter-map.md#enumeration-safety--id05-signin-002)
  → `specs/apps/ose/id-web/behaviours/sign-in/enumeration-safety.feature`; and
  [`ID05-RECOVERY-001` — “Account recovery remains non-enumerating and single-use”](./005-bdd-spec-delta-and-adapter-map.md#account-recovery--id05-recovery-001)
  → `specs/apps/ose/id-web/behaviours/sign-in/recovery.feature`; U/I/E required, no exemption.

### Operation 05 context page

- **Operation/action:** `GET /authorize/context` — `ADD`.

  ```http
  GET /authorize/context HTTP/1.1
  Host: 127.0.0.1:3500
  Accept: text/html
  Cookie: ose_id_session=<opaque>
  ```

  ```http
  HTTP/1.1 200 OK
  Content-Type: text/html; charset=utf-8
  Cache-Control: no-store

  <!doctype html>
  <main>
    <h1>Choose how to continue</h1>
    <form method="post" action="/api/bff/authorization/context">
      <fieldset>
        <legend>Access context</legend>
        <label><input type="radio" name="choiceId" value="ctx_personal" /> Personal</label>
        <label><input type="radio" name="choiceId" value="ctx_company" /> Example Company</label>
      </fieldset>
      <button type="submit">Continue</button>
    </form>
  </main>
  ```

- **Caller/auth/context/request:** authenticated browser bound to opaque transaction; no query-selected
  company/body.
- **Success/schema/example:** `200 text/html`; render only backend-offered choices. Synthetic example:

  ```json
  {
    "transactionRef": "txn_opaque",
    "version": 2,
    "choices": [
      { "choiceRef": "ctx_personal", "label": "Personal", "type": "personal" },
      { "choiceRef": "ctx_company", "label": "Example Company", "type": "company" }
    ],
    "selected": null
  }
  ```

- **Errors/traffic:** `session_required` (`401`), `context_forbidden` (`403`),
  `authorization_stale` (`409`), `authorization_expired` (`410`), `dependency_unavailable` (`503`).
  Idempotent read; concurrent changes refresh version; bounded reloads; no pagination.
- **Privacy/publication/rollback:** no raw Person/company ID in browser/log/cache. Outside OpenAPI;
  generated client. Rollback lets transaction expire.
- **Exact Gherkin proof:** [`ID05-CONTEXT-001` — “A companyless user selects personal access” and
  `ID05-CONTEXT-002` — “A multi-company user selects one company”](./005-bdd-spec-delta-and-adapter-map.md#context-selection--id05-context-001-and-id05-context-002)
  → `specs/apps/ose/id-web/behaviours/authorization/context-selection.feature`; and
  [`ID05-STATE-001` — “The web journey survives instance replacement”](./005-bdd-spec-delta-and-adapter-map.md#stateless-web-session--id05-state-001)
  → `specs/apps/ose/id-web/behaviours/runtime/statelessness.feature`; U/I/E required, no exemption.

### Operation 05 consent page

- **Operation/action:** `GET /authorize/consent` — `ADD`.

  ```http
  GET /authorize/consent HTTP/1.1
  Host: 127.0.0.1:3500
  Accept: text/html
  Cookie: ose_id_session=<opaque>
  ```

  ```http
  HTTP/1.1 200 OK
  Content-Type: text/html; charset=utf-8
  Cache-Control: no-store

  <!doctype html>
  <main>
    <h1>Allow LMS access?</h1>
    <p>LMS is requesting access to your Personal context.</p>
    <ul>
      <li>Access LMS</li>
    </ul>
    <form method="post" action="/api/bff/authorization/decision">
      <button name="decision" value="allow" type="submit">Allow</button>
      <button name="decision" value="cancel" type="submit">Cancel</button>
    </form>
  </main>
  ```

- **Caller/auth/context/request:** authenticated transaction-bound browser after backend selection; no
  body or caller-defined client/scope/redirect.
- **Success/schema/example:** `200 text/html`; render exact client, context, scope, version, and actions:

  ```json
  {
    "clientDisplayName": "LMS",
    "contextLabel": "Personal",
    "scopes": [{ "name": "ose.lms", "description": "Access LMS" }],
    "version": 3,
    "actions": ["allow", "cancel"]
  }
  ```

- **Errors/traffic:** `session_required` (`401`), `consent_forbidden` (`403`),
  `authorization_stale` (`409`), `authorization_expired` (`410`), `dependency_unavailable` (`503`).
  Idempotent read; changed authority invalidates render; session/client limit; no pagination.
- **Privacy/publication/rollback:** no hidden authority/artifact in browser/log/cache. Outside OpenAPI;
  rollback expires transaction.
- **Exact Gherkin proof:** [`ID05-CONSENT-001` — “A user decides a consent request”](./005-bdd-spec-delta-and-adapter-map.md#consent--id05-consent-001)
  → `specs/apps/ose/id-web/behaviours/authorization/consent.feature`;
  [`ID05-BFF-001` — “Browser inspection finds no token material”](./005-bdd-spec-delta-and-adapter-map.md#browser-artifact-safety--id05-bff-001)
  → `specs/apps/ose/id-web/behaviours/security/browser-artifacts.feature`; and
  [`ID05-A11Y-001` — “Complete authorization without visual or pointer dependence”](./005-bdd-spec-delta-and-adapter-map.md#accessible-responsive-journey--id05-a11y-001)
  → `specs/apps/ose/id-web/behaviours/accessibility/authorization-journey.feature`; U/I/E required, no exemption.

### Operation 05 security page

- **Operation/action:** `GET /account/security` — `ADD`.

  ```http
  GET /account/security HTTP/1.1
  Host: 127.0.0.1:3500
  Accept: text/html
  Cookie: ose_id_session=<opaque>
  ```

  ```http
  HTTP/1.1 200 OK
  Content-Type: text/html; charset=utf-8
  Cache-Control: no-store

  <!doctype html>
  <main>
    <h1>Account security</h1>
    <section aria-labelledby="email-method"><h2 id="email-method">Email verified</h2></section>
    <section aria-labelledby="password-method"><h2 id="password-method">Password configured</h2></section>
    <a href="/account/sessions">Review sessions</a>
  </main>
  ```

- **Caller/auth/context/request:** authenticated account owner, global Person scope; no query/body.
- **Success/schema/example:** `200 text/html`; render only delivered email/password state and sessions:

  ```json
  {
    "emailStatus": "verified",
    "passwordStatus": "configured",
    "sessionsHref": "/account/sessions"
  }
  ```

- **Errors/traffic:** `session_required` (`401`), `recent_auth_required` (`403`) for guarded action,
  `dependency_unavailable` (`503`). Idempotent read; concurrent changes refresh; account limit; no
  pagination.
- **Privacy/publication/rollback:** no provider/MFA placeholder, credential/session/company detail in
  log/cache. Outside OpenAPI; rollback removes page.
- **Exact Gherkin proof:** [`ID05-METHOD-001` — “Only delivered sign-in methods are shown”](./005-bdd-spec-delta-and-adapter-map.md#delivered-methods--id05-method-001)
  → `specs/apps/ose/id-web/behaviours/sign-in/method-availability.feature`; and
  [`ID05-BFF-001` — “Browser inspection finds no token material”](./005-bdd-spec-delta-and-adapter-map.md#browser-artifact-safety--id05-bff-001)
  → `specs/apps/ose/id-web/behaviours/security/browser-artifacts.feature`; U/I/E required, no exemption.

### Operation 05 sessions page

- **Operation/action:** `GET /account/sessions` — `ADD`.

  ```http
  GET /account/sessions HTTP/1.1
  Host: 127.0.0.1:3500
  Accept: text/html
  Cookie: ose_id_session=<opaque>
  ```

  ```http
  HTTP/1.1 200 OK
  Content-Type: text/html; charset=utf-8
  Cache-Control: no-store

  <!doctype html>
  <main>
    <h1>Your sessions</h1>
    <article>
      <h2>Current browser</h2>
      <p>Active now</p>
      <form method="post" action="/api/bff/sessions/session_opaque_current/revoke">
        <button type="submit">Sign out this session</button>
      </form>
    </article>
  </main>
  ```

- **Caller/auth/context/request:** authenticated Person owner; no company context/body.
- **Success/schema/example:** `200 text/html`; render bounded safe session summaries with opaque refs:

  ```json
  {
    "sessions": [
      {
        "sessionRef": "session_opaque_current",
        "current": true,
        "createdAt": "2026-09-15T01:00:00Z",
        "lastSeenAt": "2026-09-15T01:30:00Z",
        "deviceLabel": "Current browser"
      }
    ]
  }
  ```

- **Errors/traffic:** `session_required` (`401`), `dependency_unavailable` (`503`). Idempotent read;
  concurrent revocation refreshes. Initial bounded list rejects pagination parameters; account limit.
- **Privacy/publication/rollback:** minimize device data; no raw ID/log/cache. Outside OpenAPI; rollback
  retains backend sessions.
- **Exact Gherkin proof:** [`ID05-BFF-001` — “Browser inspection finds no token material”](./005-bdd-spec-delta-and-adapter-map.md#browser-artifact-safety--id05-bff-001)
  → `specs/apps/ose/id-web/behaviours/security/browser-artifacts.feature`;
  [`ID05-STATE-001` — “The web journey survives instance replacement”](./005-bdd-spec-delta-and-adapter-map.md#stateless-web-session--id05-state-001)
  → `specs/apps/ose/id-web/behaviours/runtime/statelessness.feature`; and
  [`ID05-SESSION-001` — “Session revocation is owner-bound and idempotent”](./005-bdd-spec-delta-and-adapter-map.md#session-revocation--id05-session-001)
  → `specs/apps/ose/id-web/behaviours/account/sessions.feature`; U/I/E required, no exemption.

### Operation 05 identify

- **Operation/action:** `POST /api/bff/sign-in/identify` — `ADD`.

- **Caller/auth/context/request:** same-origin public form with CSRF; JSON requires one valid email no
  longer than 254 characters:

  ```json
  {
    "email": "person.personal@example.test"
  }
  ```

- **Success/schema/example:** `202 application/json`, `no-store`, equal for known/unknown accounts:

  ```json
  {
    "next": "check-or-enter-credentials",
    "message": "Continue with the available sign-in step."
  }
  ```

- **Errors/traffic:** `invalid_request` (`400` fields), `csrf_invalid` (`403`), `rate_limited` (`429`,
  `Retry-After`), `identity_unavailable` (`503`). Repeats equivalent; concurrent attempts isolated;
  address/network limit.
- **Privacy/publication/rollback:** normalized email only to backend, never log/cache. Add to id-web
  OpenAPI; validate/generate the handler boundary and use the separate backend client. Rollback removes
  route.
- **Exact Gherkin proof:** [`ID05-SIGNIN-001` — “A verified user signs in through OSE ID web”](./005-bdd-spec-delta-and-adapter-map.md#email-sign-in--id05-signin-001),
  [`ID05-SIGNIN-002` — “Sign-in guidance does not enumerate an account”](./005-bdd-spec-delta-and-adapter-map.md#enumeration-safety--id05-signin-002),
  and [`ID05-BFF-001` — “Browser inspection finds no token material”](./005-bdd-spec-delta-and-adapter-map.md#browser-artifact-safety--id05-bff-001)
  → their exact indexed `specs/apps/ose/id-web/behaviours/{sign-in,security}/**/*.feature` destinations;
  U/I/E required, no exemption.

### Operation 05 password

- **Operation/action:** `POST /api/bff/sign-in/password` — `ADD`.

- **Caller/auth/context/request:** same-origin form bound to opaque attempt; JSON requires a non-empty
  password within the repository limit:

  ```json
  {
    "password": "synthetic-password"
  }
  ```

- **Success/schema/example:** `200 application/json`, rotated protected cookie, `no-store`, with an
  allowlisted relative location:

  ```json
  {
    "next": "authorization",
    "location": "/authorize/context"
  }
  ```

- **Errors/traffic:** `invalid_request` (`400`), `invalid_credentials` (`401`), `attempt_stale` (`409`),
  `rate_limited` (`429`), `identity_unavailable` (`503`). One rotation wins; no retry; attempt/network limit.
- **Privacy/publication/rollback:** password/cookie/attempt never log/cache/serialize. Add to id-web
  OpenAPI and validate/generate its boundary; rollback invalidates partial web attempts.
- **Exact Gherkin proof:** [`ID05-SIGNIN-001/002` — the verified sign-in and enumeration-safety scenarios](./005-bdd-spec-delta-and-adapter-map.md#email-sign-in--id05-signin-001),
  [`ID05-BFF-001` — “Browser inspection finds no token material”](./005-bdd-spec-delta-and-adapter-map.md#browser-artifact-safety--id05-bff-001),
  and [`ID05-STATE-001` — “The web journey survives instance replacement”](./005-bdd-spec-delta-and-adapter-map.md#stateless-web-session--id05-state-001)
  → their exact indexed `specs/apps/ose/id-web/behaviours/{sign-in,security,runtime}/**/*.feature`
  destinations; U/I/E required, no exemption.

### Operation 05 recovery request

- **Operation/action:** `POST /api/bff/recovery/request` — `ADD`.

- **Caller/auth/context/request:** same-origin public form; JSON requires one valid email no longer than
  254 characters:

  ```json
  {
    "email": "person.personal@example.test"
  }
  ```

- **Success/schema/example:** `202 application/json`, `no-store`, with equal known/unknown
  status/body/timing:

  ```json
  {
    "accepted": true,
    "message": "If recovery is available, check your email."
  }
  ```

- **Errors/traffic:** `invalid_request` (`400`), `csrf_invalid` (`403`), `rate_limited` (`429`),
  `recovery_unavailable` (`503`). Repeat safe but limited; concurrency follows predecessor invalidation.
- **Privacy/publication/rollback:** no email/existence/capability logs/cache. Add to id-web OpenAPI;
  Mailpit is predecessor-owned. Rollback removes route.
- **Exact Gherkin proof:** [`ID05-SIGNIN-002` — “Sign-in guidance does not enumerate an account”](./005-bdd-spec-delta-and-adapter-map.md#enumeration-safety--id05-signin-002)
  → `specs/apps/ose/id-web/behaviours/sign-in/enumeration-safety.feature`; and
  [`ID05-RECOVERY-001` — “Account recovery remains non-enumerating and single-use”](./005-bdd-spec-delta-and-adapter-map.md#account-recovery--id05-recovery-001)
  → `specs/apps/ose/id-web/behaviours/sign-in/recovery.feature`; U/I/E required, no exemption.

### Operation 05 context command

- **Operation/action:** `POST /api/bff/authorization/context` — `ADD`.

- **Caller/auth/context/request:** authenticated same-origin session; JSON requires opaque transaction
  and choice references plus a non-negative version:

  ```json
  {
    "transactionId": "txn_opaque",
    "choiceId": "ctx_personal",
    "expectedVersion": 2
  }
  ```

- **Success/schema/example:** `200 application/json`, `no-store`:

  ```json
  {
    "next": "consent",
    "location": "/authorize/consent"
  }
  ```

- **Errors/traffic:** `invalid_request` (`400`), `session_required` (`401`), `context_forbidden` (`403`),
  `authorization_stale` (`409`), `authorization_expired` (`410`), `rate_limited` (`429`),
  `dependency_unavailable` (`503`). Same version/command equivalent; one competing winner.
- **Privacy/publication/rollback:** opaque refs not logged/cached. Add to id-web OpenAPI; map one-to-one
  through the generated backend client. Rollback leaves expiry.
- **Exact Gherkin proof:** [`ID05-CONTEXT-001/002` — the companyless and multi-company selection scenarios](./005-bdd-spec-delta-and-adapter-map.md#context-selection--id05-context-001-and-id05-context-002)
  → `specs/apps/ose/id-web/behaviours/authorization/context-selection.feature`; and
  [`ID05-STATE-001` — “The web journey survives instance replacement”](./005-bdd-spec-delta-and-adapter-map.md#stateless-web-session--id05-state-001)
  → `specs/apps/ose/id-web/behaviours/runtime/statelessness.feature`; U/I/E required, no exemption.

### Operation 05 decision command

- **Operation/action:** `POST /api/bff/authorization/decision` — `ADD`.

- **Caller/auth/context/request:** authenticated bound session; JSON requires opaque transaction,
  allow/cancel decision, and non-negative expected version:

  ```json
  {
    "transactionId": "txn_opaque",
    "decision": "allow",
    "expectedVersion": 3
  }
  ```

- **Success/schema/example:** `200 application/json`, `no-store`, with a backend-authorized allowlisted
  location:

  ```json
  {
    "next": "registered-client",
    "location": "http://127.0.0.1:3400/auth/oidc/callback"
  }
  ```

- **Errors/traffic:** `invalid_request` (`400`), `session_required` (`401`), `consent_forbidden` (`403`),
  `authorization_stale` (`409`), `authorization_expired` (`410`), `rate_limited` (`429`),
  `dependency_unavailable` (`503`). One terminal winner; duplicate never issues twice.
- **Privacy/publication/rollback:** no code/token/redirect authority/refs in logs/cache. Add to id-web
  OpenAPI; use the separate generated backend client. Rollback cannot reopen consent.
- **Exact Gherkin proof:** [`ID05-CONSENT-001` — “A user decides a consent request”](./005-bdd-spec-delta-and-adapter-map.md#consent--id05-consent-001),
  [`ID05-BFF-001` — “Browser inspection finds no token material”](./005-bdd-spec-delta-and-adapter-map.md#browser-artifact-safety--id05-bff-001),
  and [`ID05-A11Y-001` — “Complete authorization without visual or pointer dependence”](./005-bdd-spec-delta-and-adapter-map.md#accessible-responsive-journey--id05-a11y-001)
  → their exact indexed `specs/apps/ose/id-web/behaviours/{authorization,security,accessibility}/**/*.feature`
  destinations; U/I/E required, no exemption.

### Operation 05 session revoke

- **Operation/action:** `POST /api/bff/sessions/{sessionId}/revoke` — `ADD`.

- **Caller/auth/context/request:** authenticated owner, recent auth when required; opaque path ref and
  an empty JSON request:

  ```json
  {}
  ```

- **Success/schema/example:** `204` empty, `no-store`; current-session revoke clears/rotates cookie.
- **Errors/traffic:** `invalid_request` (`400`), `session_required` (`401`),
  `session_forbidden|recent_auth_required` (`403`), `session_not_found` (`404`), `session_stale` (`409`),
  `rate_limited` (`429`), `dependency_unavailable` (`503`). Idempotent; concurrent revokes converge.
- **Privacy/publication/rollback:** ref/cookie not logged/cached. Add to id-web OpenAPI and map to the
  generated backend operation. Rollback never resurrects.
- **Exact Gherkin proof:** [`ID05-BFF-001` — “Browser inspection finds no token material”](./005-bdd-spec-delta-and-adapter-map.md#browser-artifact-safety--id05-bff-001),
  [`ID05-STATE-001` — “The web journey survives instance replacement”](./005-bdd-spec-delta-and-adapter-map.md#stateless-web-session--id05-state-001),
  and [`ID05-SESSION-001` — “Session revocation is owner-bound and idempotent”](./005-bdd-spec-delta-and-adapter-map.md#session-revocation--id05-session-001)
  → their exact indexed `specs/apps/ose/id-web/behaviours/{security,runtime,account}/**/*.feature`
  destinations; U/I/E required, no exemption.

### Operation 05 retain authorize

- **Operation/action:** `GET /connect/authorize` — `RETAIN`.

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

- **Caller/auth/context:** browser carrying the exact registered LMS request; active Person session and
  backend-authorized personal or company context before approval.
- **Request:** retain the exact registered `client_id`, callback, `response_type=code`, allowlisted
  scopes/resource, opaque state/nonce, and PKCE S256 challenge; no JSON body.
- **Success:** retain the one-time-code `302` to the exact callback with preserved state and `no-store`.
- **Errors/semantics:** retain direct `400 invalid_request` for unsafe redirect and redirect-safe OAuth
  errors otherwise. Starts remain distinct; only a terminal backend decision authorizes. No pagination;
  client/session/network limits remain.
- **Privacy/publication/rollback:** browser never sees verifier, client secret, or tokens; sensitive
  parameters are not logged. Remain in discovery and outside OpenAPI/codegen. Rollback preserves the
  accepted backend endpoint.
- **Exact Gherkin proof:** [`ID05-RETAIN-AUTHORIZE-001` — “Authorization remains compatible with the
  first-party web”](#id05-retain-authorize-001--authorization-compatibility) →
  `specs/apps/ose/id-be/behaviours/authorization/authorization-code.feature`; Unit, Integration, and
  E2E are required, with no exemption.

### Operation 05 retain transaction

- **Operation/action:** `GET /internal/authorization-transactions/{transactionId}` — `RETAIN`.

  ```http
  GET /internal/authorization-transactions/txn_opaque HTTP/1.1
  Host: 127.0.0.1:8501
  Accept: application/json
  Authorization: Bearer <redacted-synthetic-bff-capability>
  Cookie: ose_id_session=<opaque>
  ```

- **Caller/auth/context:** authenticated first-party BFF and bound Person session; backend reloads
  entitlement and eligible contexts.
- **Request:** opaque path reference and `Accept: application/json`; no query/body.
- **Success:** retain `200 application/json`, `no-store`, and the accepted render model containing only
  opaque transaction/version, client display, human-readable scopes, eligible context choices,
  selection/consent state, and expiry. Synthetic example:

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

- **Errors/semantics:** retain `403 authorization_context_forbidden`, `404
authorization_transaction_not_found`, `409 authorization_transaction_terminal`, `410
authorization_transaction_expired`, and bounded polling. Read is idempotent and not paginated.
- **Privacy/publication/rollback:** no identity/membership/path value in logs or caches. Retain the
  backend OpenAPI schema and generated client unchanged; rollback preserves it.
- **Exact Gherkin proof:** [`ID05-RETAIN-TRANSACTION-001` — “Transaction rendering remains safe for the
  first-party web”](#id05-retain-transaction-001--transaction-rendering-compatibility) →
  `specs/apps/ose/id-be/behaviours/authorization/authorization-code.feature`; Unit, Integration, and
  E2E are required, with no exemption.

### Operation 05 retain context

- **Operation/action:** `POST /internal/authorization-transactions/{transactionId}/context` — `RETAIN`.

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

- **Caller/auth/context:** authenticated BFF and bound session; only a freshly offered choice is valid.
- **Request:** `application/json`, opaque path reference, exact origin/service authentication, and:

  ```json
  {
    "choiceId": "ctx_opaque_company_a",
    "expectedVersion": 2
  }
  ```

- **Success:** retain `200 application/json`, `no-store`, selected offered context, and incremented
  render-model version.
- **Errors/semantics:** retain `400 invalid_request`, `403 authorization_context_forbidden`, `409
authorization_transaction_stale` or terminal, `410 authorization_transaction_expired`, and `429
rate_limited`. One version transition wins; the same command is equivalent; no pagination.
- **Privacy/publication/rollback:** no path/body/membership data in logs/cache. Retain backend OpenAPI
  and generated client byte- and semantics-compatible; rollback leaves expiry authoritative.
- **Exact Gherkin proof:** [`ID05-RETAIN-CONTEXT-001` — “Context selection remains authority-bound and
  versioned”](#id05-retain-context-001--context-command-compatibility) →
  `specs/apps/ose/id-be/behaviours/authorization/authorization-code.feature`; Unit, Integration, and
  E2E are required, with no exemption.

### Operation 05 retain decision

- **Operation/action:** `POST /internal/authorization-transactions/{transactionId}/decision` — `RETAIN`.

  ```http
  POST /internal/authorization-transactions/txn_opaque/decision HTTP/1.1
  Host: 127.0.0.1:8501
  Authorization: Bearer <redacted-synthetic-bff-capability>
  Cookie: ose_id_session=<opaque>
  Content-Type: application/json

  {"decision":"allow","expectedVersion":3}
  ```

  ```http
  HTTP/1.1 200 OK
  Content-Type: application/json
  Cache-Control: no-store

  {"status":"authorized","continuation":{"kind":"protocol","reference":"continuation_opaque"}}
  ```

- **Caller/auth/context:** authenticated BFF and bound session after selected context; backend reloads
  consent authority.
- **Request:** `application/json`, opaque path reference, service/session proof, and:

  ```json
  {
    "decision": "allow",
    "expectedVersion": 3
  }
  ```

- **Success:** retain `200 application/json`, `no-store`, and the opaque authorized/cancelled protocol
  continuation; it is never an authorization code or token.
- **Errors/semantics:** retain `400 invalid_request`, `403 authorization_context_forbidden`, `409
authorization_transaction_stale` or terminal, `410 authorization_transaction_expired`, and `429
rate_limited`. One terminal decision wins; replay cannot issue twice; no pagination.
- **Privacy/publication/rollback:** log decision class/outcome/correlation only. Retain backend OpenAPI
  and generated client unchanged; rollback never reopens consent.
- **Exact Gherkin proof:** [`ID05-RETAIN-DECISION-001` — “Consent decisions retain one terminal
  outcome”](#id05-retain-decision-001--decision-command-compatibility) →
  `specs/apps/ose/id-be/behaviours/authorization/authorization-code.feature`; Unit, Integration, and
  E2E are required, with no exemption.

### Operation 05 retain verification

- **Operation/action:** `POST /api/v1/accounts/email-verifications` — `RETAIN`.

  ```http
  POST /api/v1/accounts/email-verifications HTTP/1.1
  Host: 127.0.0.1:8501
  Content-Type: application/json

  {"capability":"synthetic-one-time-capability"}
  ```

  ```http
  HTTP/1.1 204 No Content
  Cache-Control: no-store
  Content-Length: 0
  ```

- **Caller/auth/context:** anonymous holder of one purpose-bound verification capability; no company
  context or browser session authority.
- **Request:** `Content-Type: application/json`, optional correlation header, no cookie/query, and:

  ```json
  {
    "capability": "synthetic-one-time-capability"
  }
  ```

- **Success:** retain `204`, empty body, `no-store`, and safe correlation headers.
- **Errors/semantics:** retain `400 invalid_request`, `400 capability_unavailable` for every unsafe
  capability state, and `429 rate_limited`. One atomic winner; replay/concurrent losers share the safe
  problem; no idempotency key or pagination.
- **Privacy/publication/rollback:** capability is never logged, echoed, cached, or serialized to RSC.
  Retain backend OpenAPI and generated client unchanged; rollback keeps backend verification usable.
- **Exact Gherkin proof:** [`ID05-RETAIN-VERIFY-001` — “Email verification remains single-use and
  non-leaking”](#id05-retain-verify-001--email-verification-compatibility) →
  `specs/apps/ose/id-be/behaviours/account/verification.feature`; Unit, Integration, and E2E are
  required, with no exemption.

### Operation 05 retain session create

- **Operation/action:** `POST /api/v1/account-sessions` — `RETAIN`.

  ```http
  POST /api/v1/account-sessions HTTP/1.1
  Host: 127.0.0.1:8501
  Content-Type: application/json

  {"email":"person.personal@example.test","password":"synthetic-password"}
  ```

- **Caller/auth/context:** anonymous BFF service call bound to the web attempt; no company context.
- **Request:** `Content-Type: application/json`, optional correlation header, no idempotency key, and:

  ```json
  {
    "email": "person.personal@example.test",
    "password": "synthetic-password"
  }
  ```

- **Success:** retain `201`, `no-store`, rotated backend session/CSRF cookies, and a safe summary
  consumed only by the BFF:

  ```json
  {
    "status": "authenticated",
    "session": {
      "id": "00000000-0000-4000-8000-000000000001",
      "createdAt": "2026-09-15T01:00:00Z",
      "idleExpiresAt": "2026-09-15T01:30:00Z",
      "absoluteExpiresAt": "2026-09-15T09:00:00Z",
      "current": true
    }
  }
  ```

- **Errors/semantics:** retain `400 invalid_request`, one generic `401 invalid_credentials`, and `429
rate_limited` with `Retry-After`. Success is not retry-idempotent; concurrency creates/rotates one
  authoritative transition; no pagination.
- **Privacy/publication/rollback:** credentials/cookies never enter logs, cache, browser JSON, or
  evidence. Retain backend OpenAPI/generated client; rollback invalidates partial web attempts only.
- **Exact Gherkin proof:** [`ID05-RETAIN-SESSION-CREATE-001` — “Account-session creation remains generic
  and protected”](#id05-retain-session-create-001--session-creation-compatibility) →
  `specs/apps/ose/id-be/behaviours/account/password-sign-in.feature`; Unit, Integration, and E2E are
  required, with no exemption.

### Operation 05 retain session delete

- **Operation/action:** `DELETE /api/v1/account-sessions/{sessionId}` — `RETAIN`.

  ```http
  DELETE /api/v1/account-sessions/00000000-0000-4000-8000-000000000002 HTTP/1.1
  Host: 127.0.0.1:8501
  Cookie: ose_id_session=<opaque>
  X-CSRF-Token: <opaque>
  ```

  ```http
  HTTP/1.1 204 No Content
  Cache-Control: no-store
  Content-Length: 0
  ```

- **Caller/auth/context:** authenticated active Person through the BFF with matching CSRF and session
  ownership; global Person scope, never company scope.
- **Request:** opaque UUID path, session/CSRF headers and cookies; no query or body.
- **Success:** retain `204` empty, `no-store`, for active or already-revoked owned session.
- **Errors/semantics:** retain `400 invalid_request`, `401 authentication_required`, `403
csrf_required`, and `404 session_not_found` for missing/foreign. Revocation is atomic/idempotent;
  concurrent calls cannot reactivate; no pagination or new retry policy.
- **Privacy/publication/rollback:** only opaque-ID diagnostics; no cookie/raw identifier logs. Retain
  backend OpenAPI/generated client; rollback never resurrects a revoked session.
- **Exact Gherkin proof:** [`ID05-RETAIN-SESSION-DELETE-001` — “Session revocation remains owner-bound
  and idempotent”](#id05-retain-session-delete-001--session-revocation-compatibility) →
  `specs/apps/ose/id-be/behaviours/account/account-sessions.feature`; Unit, Integration, and E2E are
  required, with no exemption.

### Operation 05 retain recovery

- **Operation/action:** `POST /api/v1/accounts/password-recovery-requests` — `RETAIN`.

  ```http
  POST /api/v1/accounts/password-recovery-requests HTTP/1.1
  Host: 127.0.0.1:8501
  Content-Type: application/json

  {"email":"person.personal@example.test"}
  ```

- **Caller/auth/context:** anonymous BFF request; no tenant/company context.
- **Request:** `Content-Type: application/json`, optional correlation header, and:

  ```json
  {
    "email": "person.personal@example.test"
  }
  ```

- **Success:** retain the same `202 application/json` generic accepted response for every account state:

  ```json
  {
    "accepted": true,
    "message": "If recovery is available, check your email."
  }
  ```

- **Errors/semantics:** retain `400 invalid_request` and `429 rate_limited` with `Retry-After`.
  Response is idempotent; cooldown/deduplication and shared cross-instance limiter prevent mail
  multiplication; no pagination.
- **Privacy/publication/rollback:** no email, account-existence result, or capability in logs/cache.
  Retain backend OpenAPI/generated client. Mailpit delivery remains Plan 02-owned; rollback removes only
  the presentation/BFF adapter.
- **Exact Gherkin proof:** [`ID05-RETAIN-RECOVERY-001` — “Password recovery remains
  non-enumerating”](#id05-retain-recovery-001--password-recovery-compatibility) →
  `specs/apps/ose/id-be/behaviours/account/password-recovery.feature`; Unit, Integration, and E2E are
  required, with no exemption.

### UPDATE and DELETE operation packets

There is no `UPDATE` or `DELETE` operation. Any render-model correction or removal needs a plan
amendment, compatibility assessment, its own packet, OpenAPI/codegen update, and U/I/E mapping.

## Copy-ready web and BFF contract scenarios

The scenario titles are the mapping keys for every delta row. Copy these app-scoped scenarios into the
feature paths selected by the BDD delta. Unit, Integration, and E2E are required for each scenario; no
adapter exemption applies.

| Delta operation or category                                          | Action | Full contract scenarios                                                                                                                                                                                                            |
| -------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /sign-in`                                                       | ADD    | Web or BFF operation returns its exact success contract; invalid web or BFF authority returns a stable safe error; concurrent and repeated state changes converge safely; web and BFF artifacts stay within their privacy boundary |
| `GET /verify-email`                                                  | ADD    | Web or BFF operation returns its exact success contract; invalid web or BFF authority returns a stable safe error; concurrent and repeated state changes converge safely; web and BFF artifacts stay within their privacy boundary |
| `GET /recover`                                                       | ADD    | Web or BFF operation returns its exact success contract; invalid web or BFF authority returns a stable safe error; concurrent and repeated state changes converge safely; web and BFF artifacts stay within their privacy boundary |
| `GET /authorize/context`                                             | ADD    | Web or BFF operation returns its exact success contract; invalid web or BFF authority returns a stable safe error; web and BFF artifacts stay within their privacy boundary                                                        |
| `GET /authorize/consent`                                             | ADD    | Web or BFF operation returns its exact success contract; invalid web or BFF authority returns a stable safe error; web and BFF artifacts stay within their privacy boundary                                                        |
| `GET /account/security`                                              | ADD    | Web or BFF operation returns its exact success contract; invalid web or BFF authority returns a stable safe error; web and BFF artifacts stay within their privacy boundary                                                        |
| `GET /account/sessions`                                              | ADD    | Web or BFF operation returns its exact success contract; invalid web or BFF authority returns a stable safe error; web and BFF artifacts stay within their privacy boundary                                                        |
| `POST /api/bff/sign-in/identify`                                     | ADD    | Web or BFF operation returns its exact success contract; invalid web or BFF authority returns a stable safe error; concurrent and repeated state changes converge safely; web and BFF artifacts stay within their privacy boundary |
| `POST /api/bff/sign-in/password`                                     | ADD    | Web or BFF operation returns its exact success contract; invalid web or BFF authority returns a stable safe error; concurrent and repeated state changes converge safely; web and BFF artifacts stay within their privacy boundary |
| `POST /api/bff/recovery/request`                                     | ADD    | Web or BFF operation returns its exact success contract; invalid web or BFF authority returns a stable safe error; concurrent and repeated state changes converge safely; web and BFF artifacts stay within their privacy boundary |
| `POST /api/bff/authorization/context`                                | ADD    | Web or BFF operation returns its exact success contract; invalid web or BFF authority returns a stable safe error; concurrent and repeated state changes converge safely; web and BFF artifacts stay within their privacy boundary |
| `POST /api/bff/authorization/decision`                               | ADD    | Web or BFF operation returns its exact success contract; invalid web or BFF authority returns a stable safe error; concurrent and repeated state changes converge safely; web and BFF artifacts stay within their privacy boundary |
| `POST /api/bff/sessions/{sessionId}/revoke`                          | ADD    | Web or BFF operation returns its exact success contract; invalid web or BFF authority returns a stable safe error; concurrent and repeated state changes converge safely; web and BFF artifacts stay within their privacy boundary |
| `GET /connect/authorize`                                             | RETAIN | Retained dependency remains compatible with the first-party web                                                                                                                                                                    |
| `GET /internal/authorization-transactions/{transactionId}`           | RETAIN | Retained dependency remains compatible with the first-party web                                                                                                                                                                    |
| `POST /internal/authorization-transactions/{transactionId}/context`  | RETAIN | Retained dependency remains compatible with the first-party web                                                                                                                                                                    |
| `POST /internal/authorization-transactions/{transactionId}/decision` | RETAIN | Retained dependency remains compatible with the first-party web                                                                                                                                                                    |
| `POST /api/v1/accounts/email-verifications`                          | RETAIN | Retained dependency remains compatible with the first-party web                                                                                                                                                                    |
| `POST /api/v1/account-sessions`                                      | RETAIN | Retained dependency remains compatible with the first-party web                                                                                                                                                                    |
| `DELETE /api/v1/account-sessions/{sessionId}`                        | RETAIN | Retained dependency remains compatible with the first-party web                                                                                                                                                                    |
| `POST /api/v1/accounts/password-recovery-requests`                   | RETAIN | Retained dependency remains compatible with the first-party web                                                                                                                                                                    |
| No operation                                                         | UPDATE | No accepted operation is updated or deleted                                                                                                                                                                                        |
| No operation                                                         | DELETE | No accepted operation is updated or deleted                                                                                                                                                                                        |

```gherkin
Feature: OSE ID first-party web operation success contracts
  Rule: Every page and BFF operation returns only its declared success shape

    Scenario Outline: Web or BFF operation returns its exact success contract
      Given the browser session and authorization context satisfy the contract for <operation>
      When the browser sends the valid request for <operation>
      Then the response status is <status>
      And the response contains <result> with the declared headers and no undeclared authority

      Examples:
        | operation | status | result |
        | GET /sign-in | 200 | identifier-first email sign-in with only delivered methods |
        | GET /verify-email | 200 | one verified already-handled or invalid-or-expired render state |
        | GET /recover | 200 | non-enumerating request accepted completion or restart guidance |
        | GET /authorize/context | 200 | only backend-offered personal or company choices |
        | GET /authorize/consent | 200 | exact client context scopes and Allow and Cancel actions |
        | GET /account/security | 200 | delivered email password and account-security state |
        | GET /account/sessions | 200 | owned opaque current and other session summaries |
        | POST /api/bff/sign-in/identify | 202 | the generic next-step descriptor |
        | POST /api/bff/sign-in/password | 200 | a rotated protected session and safe next route |
        | POST /api/bff/recovery/request | 202 | the generic accepted descriptor |
        | POST /api/bff/authorization/context | 200 | the safe consent route after backend revalidation |
        | POST /api/bff/authorization/decision | 200 | one backend-authorized registered-client continuation |
        | POST /api/bff/sessions/{sessionId}/revoke | 204 | an empty successful revocation result |
```

```gherkin
Feature: OSE ID first-party web contract failures
  Rule: Invalid input session or context returns a stable non-leaking result

    Scenario Outline: Invalid web or BFF authority returns a stable safe error
      Given <fault> applies to <operation>
      When the browser sends the request
      Then the response is <status> with <error>
      And no account session company consent or protocol authority is created or widened

      Examples:
        | operation | fault | status | error |
        | GET /sign-in | the authorization transaction expired | 410 | authorization_expired rendered as safe restart guidance |
        | GET /verify-email | the capability was malformed expired or replayed | 200 | verification_invalid_or_expired render state |
        | GET /recover | the recovery capability was malformed expired or replayed | 200 | recovery_invalid_or_expired render state |
        | GET /authorize/context | the session no longer owns the transaction | 403 | context_forbidden |
        | GET /authorize/consent | the transaction version is stale | 409 | authorization_stale |
        | GET /account/security | the protected session is absent | 401 | session_required |
        | GET /account/sessions | the session dependency is unavailable | 503 | dependency_unavailable |
        | POST /api/bff/sign-in/identify | the email is syntactically invalid | 400 | invalid_request |
        | POST /api/bff/sign-in/password | the credential is invalid | 401 | invalid_credentials |
        | POST /api/bff/recovery/request | the shared request limit is exceeded | 429 | rate_limited with Retry-After |
        | POST /api/bff/authorization/context | the expected version is stale | 409 | authorization_stale |
        | POST /api/bff/authorization/decision | the selected authority was withdrawn | 403 | consent_forbidden |
        | POST /api/bff/sessions/{sessionId}/revoke | the session belongs to another Person | 403 | session_forbidden |
```

```gherkin
Feature: OSE ID first-party web replay and concurrency
  Rule: Browser retries and concurrent submissions have one safe authoritative effect

    Scenario Outline: Concurrent and repeated state changes converge safely
      Given two browser requests race the same state for <operation>
      When different stateless web instances forward both requests
      Then <outcome>
      And a later replay cannot create another privileged effect

      Examples:
        | operation | outcome |
        | GET /sign-in | each tab remains bound to its own opaque authorization transaction |
        | GET /verify-email | one request verifies and the other receives equivalent already-handled guidance |
        | GET /recover | one valid completion changes the credential and the other receives safe expired guidance |
        | POST /api/bff/sign-in/identify | both requests receive enumeration-equivalent guidance without sharing attempts |
        | POST /api/bff/sign-in/password | one successful transition rotates the session and the stale attempt cannot rotate it again |
        | POST /api/bff/recovery/request | accepted requests follow the backend capability invalidation and shared limit policy |
        | POST /api/bff/authorization/context | one expected version selects context and the other becomes stale |
        | POST /api/bff/authorization/decision | one terminal decision wins and no second code is created |
        | POST /api/bff/sessions/{sessionId}/revoke | repeated requests converge on revoked state and never resurrect the session |
```

```gherkin
Feature: OSE ID first-party web privacy and cache boundaries
  Rule: A browser receives only render-safe state and one protected opaque session

    Scenario Outline: Web and BFF artifacts stay within their privacy boundary
      Given a valid request completes at <operation>
      When URLs history storage RSC payloads responses caches analytics and logs are inspected
      Then <protected> is absent from every forbidden surface
      And the response is no-store and exposes only the declared render or BFF schema

      Examples:
        | operation | protected |
        | GET /sign-in | account existence protocol state and undelivered provider controls |
        | GET /verify-email | raw verification capability and account detail |
        | GET /recover | email existence recovery capability and new credential |
        | GET /authorize/context | raw Person company and membership identifiers |
        | GET /authorize/consent | authorization code token and hidden redirect authority |
        | GET /account/security | credential data company data and future-method state |
        | GET /account/sessions | raw session identifier cookie and excessive device data |
        | POST /api/bff/sign-in/identify | submitted email and account-existence signal |
        | POST /api/bff/sign-in/password | password attempt identifier and session cookie value |
        | POST /api/bff/recovery/request | submitted email and recovery capability |
        | POST /api/bff/authorization/context | raw transaction choice and membership identifiers |
        | POST /api/bff/authorization/decision | code token transaction and arbitrary return URL |
        | POST /api/bff/sessions/{sessionId}/revoke | raw session identifier and cookie value |
```

```gherkin
Feature: OSE ID first-party web contract compatibility
  Rule: The first-party web adds presentation without changing accepted backend protocols

    Scenario Outline: Retained dependency remains compatible with the first-party web
      Given the accepted backend contract for <operation>
      When the first-party page and BFF contracts are added
      Then <outcome>
      And the retained Unit Integration and E2E adapters still pass

      Examples:
        | operation | outcome |
        | GET /connect/authorize | the exact client redirect scopes resource PKCE and protocol errors remain unchanged |
        | GET /internal/authorization-transactions/{transactionId} | the safe transaction render model and visibility errors remain unchanged |
        | POST /internal/authorization-transactions/{transactionId}/context | offered-choice validation version concurrency and errors remain unchanged |
        | POST /internal/authorization-transactions/{transactionId}/decision | terminal allow or cancel concurrency and safe continuation remain unchanged |
        | POST /api/v1/accounts/email-verifications | one-time capability exchange and non-leaking errors remain unchanged |
        | POST /api/v1/account-sessions | generic credential denial and protected session rotation remain unchanged |
        | DELETE /api/v1/account-sessions/{sessionId} | ownership-safe idempotent revocation remains unchanged |
        | POST /api/v1/accounts/password-recovery-requests | enumeration-equivalent acceptance and Mailpit handoff remain unchanged |

    Scenario: No accepted operation is updated or deleted
      Given the web API delta declares no update or delete operation
      When accepted backend and protocol contracts are compared after the web is added
      Then no accepted operation schema discovery member scope or claim is changed or removed
      And any discovered drift blocks delivery as a contract amendment
```

### ID05-RETAIN-AUTHORIZE-001 — Authorization compatibility

**Canonical destination:** `specs/apps/ose/id-be/behaviours/authorization/authorization-code.feature`.
Unit, Integration, and E2E are required; exemptions: none.

```gherkin
Scenario: Authorization remains compatible with the first-party web
  Given the accepted registered-client authorization request
  When the first-party web completes context and consent
  Then the exact callback receives one code with preserved state
  And redirect PKCE error replay and privacy behavior remain unchanged
```

### ID05-RETAIN-TRANSACTION-001 — Transaction rendering compatibility

**Canonical destination:** `specs/apps/ose/id-be/behaviours/authorization/authorization-code.feature`.
Unit, Integration, and E2E are required; exemptions: none.

```gherkin
Scenario: Transaction rendering remains safe for the first-party web
  Given the BFF owns a bound authorization transaction
  When it reloads that transaction through another stateless instance
  Then it receives only the accepted render-safe model and version
  And identity membership and protocol secrets remain absent
```

### ID05-RETAIN-CONTEXT-001 — Context command compatibility

**Canonical destination:** `specs/apps/ose/id-be/behaviours/authorization/authorization-code.feature`.
Unit, Integration, and E2E are required; exemptions: none.

```gherkin
Scenario: Context selection remains authority-bound and versioned
  Given the backend offered an eligible context at the current transaction version
  When the BFF submits that opaque choice
  Then the selected context and transaction version advance once
  And stale foreign or withdrawn authority cannot replace it
```

### ID05-RETAIN-DECISION-001 — Decision command compatibility

**Canonical destination:** `specs/apps/ose/id-be/behaviours/authorization/authorization-code.feature`.
Unit, Integration, and E2E are required; exemptions: none.

```gherkin
Scenario: Consent decisions retain one terminal outcome
  Given a bound transaction has current context and consent authority
  When concurrent allow or cancel decisions arrive
  Then exactly one terminal decision returns an opaque protocol continuation
  And replay cannot issue a second authorization effect
```

### ID05-RETAIN-VERIFY-001 — Email-verification compatibility

**Canonical destination:** `specs/apps/ose/id-be/behaviours/account/verification.feature`. Unit,
Integration, and E2E are required; exemptions: none.

```gherkin
Scenario: Email verification remains single-use and non-leaking
  Given one purpose-bound email-verification capability
  When two browser exchanges submit it concurrently
  Then one exchange verifies the email and the other receives equivalent safe guidance
  And the capability is absent from responses caches logs and rendered state
```

### ID05-RETAIN-SESSION-CREATE-001 — Session-creation compatibility

**Canonical destination:** `specs/apps/ose/id-be/behaviours/account/password-sign-in.feature`. Unit,
Integration, and E2E are required; exemptions: none.

```gherkin
Scenario: Account-session creation remains generic and protected
  Given the BFF submits an email and password through its server boundary
  When the backend validates the credentials
  Then success rotates one protected session and invalid credentials receive generic denial
  And credentials cookies and account existence remain absent from browser-visible artifacts
```

### ID05-RETAIN-SESSION-DELETE-001 — Session-revocation compatibility

**Canonical destination:** `specs/apps/ose/id-be/behaviours/account/account-sessions.feature`. Unit,
Integration, and E2E are required; exemptions: none.

```gherkin
Scenario: Session revocation remains owner-bound and idempotent
  Given an authenticated Person owns the referenced session
  When that session is revoked repeatedly or concurrently
  Then it remains revoked without affecting another Person's session
  And no opaque identifier or cookie value is disclosed
```

### ID05-RETAIN-RECOVERY-001 — Password-recovery compatibility

**Canonical destination:** `specs/apps/ose/id-be/behaviours/account/password-recovery.feature`. Unit,
Integration, and E2E are required; exemptions: none.

```gherkin
Scenario: Password recovery remains non-enumerating
  Given one registered email and one unregistered email are syntactically valid
  When each requests password recovery through the first-party web
  Then both receive the same accepted status body and timing class
  And only an eligible registered account may receive a single-use Mailpit capability
```

## Discovery, OpenAPI, and code generation

- OIDC discovery/JWKS are byte-order-insensitive and semantically unchanged. The first-party web reads
  discovery through its server boundary; it does not publish another discovery document.
- Browser page routes are excluded from OpenAPI. Add every BFF operation, request/response/problem
  schema, header, and status to `specs/apps/ose/id-web/contracts/openapi.yaml`; validate or generate its
  TypeScript handler boundary through the owning target and never hand-edit generated output.
- Consume the repository-generated client for the backend internal authorization/account APIs. If its
  authoritative OpenAPI changes, update split path/schema files, regenerate through the owning target,
  and never hand-edit output.
- RSC payloads, Next.js action serialization, cookies, and redirect descriptors are tested explicitly;
  they are not treated as undocumented implementation details when browser-observable.

## Compatibility and rollback

All routes are additive and hidden behind the temporary local/test gate until the full journey is
complete. Existing backend and synthetic protocol clients remain compatible. Rollback reverts the
whole web delivery, disables/removes the local web route gate, and leaves backend transactions to
expire safely; it never invents an email/password fallback inside another product. Production startup
continues to reject localhost backend/session configuration before serving a page.

## Proof obligations

| Layer       | Required proof                                                                                                                                                                                                        |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit        | Route/view-state mapping, safe return path, session/cookie/CSRF policy, enumeration-equivalent output, opaque context/decision commands, focus/error/status semantics, future-method absence                          |
| Integration | Next.js handlers with shared session store and real backend contract fixtures, generated-client validation, session rotation/revocation, Mailpit email-account handoff, stale/expired/concurrent transaction behavior |
| E2E         | Built browser+BFF+backend completes email, recovery, personal/company, allow/cancel, account/session, instance A-to-B, browser leak inspection, responsive/a11y matrix, dependency errors, and production no-listener |

Every durable scenario retains the default Unit/Integration/E2E bindings in the BDD adapter map. There
are no contract-level exemptions and no positive layer tags.
