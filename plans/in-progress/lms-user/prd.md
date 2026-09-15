# Product Requirements — LMS Authentication

## Product Overview

`ose-lms-be` gains four public authentication operations and protects its existing hello operation.
Registration creates an account but does not log it in. Login and refresh return JSON credentials
usable by mobile apps and API clients; a web BFF calls the same operations server-to-server and owns
the browser-facing cookie. Health operations remain anonymous.

## Personas

- **Account holder:** needs a predictable username/password journey and control over the current login.
- **Mobile/API client developer:** needs JSON bearer and refresh credentials with explicit lifetimes.
- **Web BFF developer:** needs the same server-to-server token contract without enabling browser CORS.
- **Operator:** needs safe defaults, validated configuration, throttling, and actionable health.

## User Stories

- As an account holder, I want to register with only a username and password so that unrelated
  personal data is not required.
- As an account holder, I want to log in and use a protected LMS operation so that the service can
  recognize me on later requests.
- As an account holder, I want my client to refresh without resending my password and to log out the
  current session so that long-lived use remains controlled.
- As a mobile/API client developer, I want JSON Bearer credentials and stable Problem Details so
  that native and automated clients integrate without browser-specific behavior.
- As a web BFF developer, I want the same server-to-server token contract with browser CORS denied
  so that the BFF—not browser JavaScript—owns credentials and cookie/CSRF policy.
- As an operator, I want validated secrets, token lifetimes, proxy trust, and shared throttles so
  that unsafe configuration fails closed and abuse controls work across replicas.

## Public Contract

| Operation                    | Request               | Success             | Contracted failures                             |
| ---------------------------- | --------------------- | ------------------- | ----------------------------------------------- |
| `POST /api/v1/auth/register` | `{username,password}` | `201 PublicUser`    | `400`, `409 username_unavailable`, `429`        |
| `POST /api/v1/auth/login`    | `{username,password}` | `200 TokenPair`     | `400`, generic `401 invalid_credentials`, `429` |
| `POST /api/v1/auth/refresh`  | `{refreshToken}`      | `200 TokenPair`     | `400`, generic `401 invalid_token`, `429`       |
| `POST /api/v1/auth/logout`   | Bearer access token   | `204`               | `401 invalid_token`                             |
| `GET /api/v1/hello`          | Bearer access token   | existing `200` body | `401 invalid_token`                             |

`PublicUser` contains `id`, canonical `username`, and `createdAt`. `TokenPair` contains
`accessToken`, `refreshToken`, `tokenType: "Bearer"`, `expiresInSeconds`, and
`refreshExpiresInSeconds`. Token responses carry `Cache-Control: no-store` and `Pragma: no-cache`.

Errors use `application/problem+json` with RFC 9457 `type`, `title`, `status`, `detail`, and
`instance`, plus stable `code` and optional `fieldErrors[{field,code,message}]`. Authentication
errors never echo credentials or distinguish an unknown username from a wrong password.

## User Stories and Acceptance Criteria

### AC-REG-01 — Create an account

As an account holder, I want to register with only a username and password so that I can use the LMS
without supplying unrelated personal information.

```gherkin
Scenario: Register with valid credentials
  Given no account has the canonical username "learner_one"
  When a client registers with username " Learner_One " and a valid password
  Then the response status is 201 with public user "learner_one"
  And the response contains no token, password, or password hash
  And the account exists after the service restarts
```

### AC-REG-02 — Validate credentials without changing passwords

```gherkin
Scenario Outline: Reject an invalid registration field
  Given no account has the submitted username
  When a client registers with <username> and <password>
  Then the response status is 400 with code "validation_failed"
  And the field error identifies <field>

  Examples:
    | username                              | password                  | field      |
    | "ab"                                  | "correct horse battery"   | "username" |
    | "a-name"                              | "correct horse battery"   | "username" |
    | "abcdefghijklmnopqrstuvwxyz1234567"    | "correct horse battery"   | "username" |
    | "valid_name"                          | "fourteen_chars"          | "password" |
    | "valid_name"                          | a 129-code-point password | "password" |
```

```gherkin
Scenario: Preserve a valid Unicode password including spaces
  Given no account has the canonical username "unicode_user"
  When a client registers with username "unicode_user" and a valid Unicode password containing spaces
  Then the response status is 201
  And login succeeds only with the password exactly as supplied
```

The password boundary is 15–128 Unicode code points. No character-class or composition rule applies.
The service trims and lowercases usernames with locale-independent rules before enforcing
`[a-z0-9_]{3,32}`; it never trims or normalizes the password.

### AC-REG-03 — Keep canonical usernames unique

```gherkin
Scenario: Reject an unavailable canonical username
  Given account "learner_one" already exists
  When a client registers username " LEARNER_ONE " with another valid password
  Then the response status is 409 with code "username_unavailable"
  And the existing credential remains unchanged
```

```gherkin
Scenario: Serialize concurrent registration for one username
  Given no account has the canonical username "racing_user"
  When two clients concurrently register canonical username "racing_user"
  Then exactly one response is 201 and the other is 409
  And exactly one active account has that canonical username
```

### AC-LOGIN-01 — Issue client-neutral credentials

```gherkin
Scenario: Log in with valid credentials
  Given an active account has username "learner_one" and a known password
  When a client logs in with that username and password
  Then the response status is 200 with a Bearer access token and an opaque refresh token
  And the access lifetime is 900 seconds
  And the refresh lifetime is no more than 2592000 seconds
  And the credentials are marked not cacheable
```

```gherkin
Scenario: Allow independent concurrent logins
  Given an active account has valid credentials and one active session
  When the account logs in again with the same username and password
  Then a second independent session is created successfully
  And neither session is evicted because no device or login cap exists
```

### AC-LOGIN-02 — Conceal credential validity

```gherkin
Scenario Outline: Reject invalid credentials identically
  Given the submitted credentials are <condition>
  When a client attempts to log in
  Then the response status is 401 with code "invalid_credentials"
  And the public response is identical to every other invalid-credential response

  Examples:
    | condition                       |
    | an unknown canonical username  |
    | a known username with a wrong password |
    | a soft-deleted account          |
```

```gherkin
Scenario: Reject a malformed login document
  Given a login request is missing username or password or is not valid JSON
  When a client submits the login request
  Then the response status is 400 with code "validation_failed"
  And the content type is "application/problem+json"
```

### AC-ACCESS-01 — Authorize protected access

```gherkin
Scenario: Use an active access token
  Given a client holds a valid access token for an active session
  When the client requests GET /api/v1/hello with that Bearer token
  Then the response status is 200 with message "Hello, world!"
```

```gherkin
Scenario Outline: Reject an unusable access token
  Given the Bearer access token is <condition>
  When the client requests GET /api/v1/hello
  Then the response status is 401 with code "invalid_token"
  And the response includes a Bearer authentication challenge

  Examples:
    | condition                    |
    | missing                      |
    | malformed                    |
    | expired                      |
    | signed by another key        |
    | signed with another algorithm |
    | issued by another issuer     |
    | for another audience         |
    | linked to a revoked session  |
```

### AC-ACCESS-02 — Keep health public

```gherkin
Scenario Outline: Read a health operation anonymously
  Given the client has no access token
  When the client requests <operation>
  Then the response status is 200

  Examples:
    | operation          |
    | GET /api/v1/health |
    | GET /actuator/health |
```

### AC-REFRESH-01 — Rotate refresh credentials

```gherkin
Scenario: Refresh an active session
  Given a client holds the current refresh token for an active session family
  When the client refreshes the session
  Then the response status is 200 with a new access token and a new refresh token
  And the submitted refresh token can never succeed again
  And the original absolute family expiry is unchanged
```

```gherkin
Scenario: Serialize concurrent refresh attempts
  Given two clients hold the same current refresh token
  When both clients concurrently refresh the session
  Then exactly one refresh returns 200
  And the losing reuse revokes the entire session family
```

### AC-REFRESH-02 — Contain refresh-token replay

```gherkin
Scenario: Reuse a rotated refresh token
  Given a session has successfully rotated its refresh token
  When a client reuses the consumed refresh token
  Then the response status is 401 with code "invalid_token"
  And the entire session family is revoked
  And its latest access and refresh tokens are unusable immediately
```

```gherkin
Scenario: Reject a malformed refresh document
  Given a refresh request is missing refreshToken or is not valid JSON
  When a client submits the refresh request
  Then the response status is 400 with code "validation_failed"
  And no session family is changed
```

```gherkin
Scenario Outline: Reject another unusable refresh token
  Given the refresh token is <condition>
  When a client refreshes the session
  Then the response status is 401 with code "invalid_token"
  And the response does not disclose the token condition

  Examples:
    | condition                    |
    | malformed                    |
    | unknown                      |
    | expired                      |
    | linked to a revoked session  |
```

### AC-LOGOUT-01 — Revoke only the current login

```gherkin
Scenario: Log out one of two sessions
  Given an account has two active session families
  When the first session logs out with its access token
  Then the response status is 204
  And the first session's access and refresh tokens are unusable immediately
  And the second session remains usable
```

```gherkin
Scenario: Reject logout without a usable access token
  Given the logout Bearer token is missing, invalid, expired, or linked to a revoked session
  When the client requests POST /api/v1/auth/logout
  Then the response status is 401 with code "invalid_token"
  And no other session family is changed
```

### AC-HTTP-01 — Return exact client-safe metadata

```gherkin
Scenario: Return a complete Problem Details response
  Given an authentication request fails with stable code "invalid_credentials"
  When the client reads the error response
  Then the content type is "application/problem+json"
  And the body contains exactly type, title, status, detail, instance, and code
  And fieldErrors is absent when no field validation failed
```

```gherkin
Scenario: Return field validation details
  Given an authentication request has more than one invalid field
  When the client reads the 400 response
  Then fieldErrors contains one field, code, and message object per invalid field
  And the response contains no password, hash, token, or secret value
```

```gherkin
Scenario: Prevent authentication credentials from being cached
  Given a login or refresh request succeeds
  When the client reads the token response headers
  Then Cache-Control is exactly "no-store"
  And Pragma is exactly "no-cache"
```

### AC-CLIENT-01 — Keep browser credential ownership at the BFF

```gherkin
Scenario: Deny an unconfigured browser cross-origin request
  Given an origin is not explicitly configured for the LMS backend
  When a browser sends a cross-origin preflight request to an authentication operation
  Then the response grants no Access-Control-Allow-Origin value
  And the LMS response sets no browser session cookie
```

### AC-THROTTLE-01 — Limit repeated authentication attempts

```gherkin
Scenario: Exhaust the username login-failure allowance
  Given fewer than five failed login attempts exist for one canonical username in the current 15-minute window
  When the fifth failure and one additional login attempt occur
  Then the fifth failure returns 401 and the additional attempt returns 429
  And the throttled response includes the remaining-window Retry-After seconds
```

```gherkin
Scenario: Exhaust the source authentication allowance
  Given fewer than twenty login or refresh attempts exist for one source in the current 15-minute window
  When the twentieth attempt and one additional authentication attempt occur
  Then the twentieth attempt is processed normally and the additional attempt returns 429
```

```gherkin
Scenario: Exhaust the source registration allowance
  Given fewer than ten registration attempts exist for one source in the current one-hour window
  When the tenth attempt and one additional registration attempt occur
  Then the tenth attempt is processed normally and the additional attempt returns 429
```

Limits and windows are configurable positive values. A successful login clears that username's
failure bucket but does not clear its source bucket. By default the source is the direct peer;
forwarded addresses are honored only when the peer belongs to the configured trusted-proxy CIDRs.

### AC-CONFIG-01 — Fail closed on unsafe configuration

```gherkin
Scenario Outline: Reject invalid authentication configuration at startup
  Given the authentication configuration contains <condition>
  When the LMS backend starts
  Then startup fails with a configuration error that names the setting but not its secret value

  Examples:
    | condition                              |
    | a JWT secret shorter than 32 decoded bytes |
    | a throttle-key secret shorter than 32 decoded bytes |
    | a non-positive token lifetime          |
    | a refresh lifetime not longer than the access lifetime |
    | a non-positive throttle limit or window |
    | a malformed trusted-proxy CIDR         |
```

## Product Boundaries

- JSON token responses are the only LMS session interface; the service sets no browser cookie.
- Direct browser CORS remains deny-by-default. Web clients integrate through a BFF that stores the
  LMS credentials server-side and applies its own cookie and CSRF policy.
- Concurrent session families are unrestricted. There is no `deviceId` request field, device table,
  session count check, eviction order, or maximum-three default.
- Authorization is binary: public operations versus a valid authenticated account. Roles and
  permission claims are deferred.

## Product Risks

| Risk                                                     | Observable mitigation                                                                                                                             |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| A web integrator stores LMS tokens in browser JavaScript | Contract and docs state BFF-only browser integration; CORS and Set-Cookie scenarios fail if the LMS becomes browser-facing.                       |
| Clients depend on unstable error prose                   | Clients key on stable `code`/`fieldErrors`; tests assert the complete Problem shape and generic authentication bodies.                            |
| Refresh retries look like attacks                        | The server prioritizes containment: reuse revokes that family; docs tell clients to serialize refresh and reauthenticate after ambiguous failure. |
| Immediate access revocation adds database dependency     | Health and auth integration tests exercise database readiness; protected access fails closed when session state cannot be validated.              |
| Unlimited logins are mistaken for an omitted cap         | Gherkin explicitly proves a second independent login and the corpus/code search rejects device-cap fields and eviction behavior.                  |
