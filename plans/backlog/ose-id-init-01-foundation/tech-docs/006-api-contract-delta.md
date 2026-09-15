# OSE ID Foundation API Contract Delta

## Operation Index and Traceability

Requirement IDs stay in this plan-only table and do not enter OpenAPI operation IDs, routes, schemas,
or executable behavior names.

| Action | Plan traceability | Durable API contract                                                  |
| ------ | ----------------- | --------------------------------------------------------------------- |
| ADD    | AC-FND-04-BE      | [Backend startup guard; no HTTP listener](#backend-startup-guard)     |
| ADD    | AC-FND-04-WEB     | [Web startup guard; no HTTP listener](#web-startup-guard)             |
| ADD    | AC-FND-02         | [`GET /health/live`](#liveness-operation)                             |
| ADD    | AC-FND-02         | [`GET /health/ready`](#readiness-operation)                           |
| ADD    | AC-FND-06         | [`GET /connect/authorize`](#disabled-oidc-authorization-operation)    |
| ADD    | AC-FND-06         | [`POST /connect/token`](#disabled-token-operation)                    |
| ADD    | AC-FND-06         | [`GET /external/google/challenge`](#disabled-google-operation)        |
| ADD    | AC-FND-06         | [`POST /scim/v2/Users`](#disabled-scim-operation)                     |
| ADD    | AC-FND-06         | [`GET /platform/admin/companies`](#disabled-platform-admin-operation) |
| ADD    | AC-FND-07         | [`GET /` on `ose-id-web`](#web-status-operation)                      |

## Contract-Wide Rules

- Backend base URL is `http://127.0.0.1:8501`; web base URL is `http://127.0.0.1:3500`.
- JSON endpoints use `application/json`; problem responses use `application/problem+json` and contain
  only the numeric `status` plus string `code`, `title`, and `correlationId` fields. A representative
  response is:

  ```json
  {
    "status": 404,
    "code": "capability_disabled",
    "title": "Capability is not available",
    "correlationId": "corr_synthetic_01"
  }
  ```

- Health and disabled-capability responses require no authentication, authorization, tenant, cookie,
  CSRF token, request body, or caller-controlled redirect.
- Every response carries a generated or validated `X-Correlation-ID`; no secret, connection string,
  database host, stack trace, or absolute machine path is returned.
- Backend API responses use `Cache-Control: no-store`. The status page may use `no-cache` but cannot be
  served outside Local or Test mode.

## ADD Contracts

### Health API

| Method and path     | Caller and context                         | Success response        | Error response                                                                                       | Idempotency, concurrency, and limits                                            |
| ------------------- | ------------------------------------------ | ----------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `GET /health/live`  | Anonymous local runner/operator; no tenant | `200 LivenessResponse`  | No dependency-derived error; an absent process has no HTTP response                                  | Safe and idempotent; concurrent reads share no mutable state; no rate limit     |
| `GET /health/ready` | Anonymous local runner/operator; no tenant | `200 ReadinessResponse` | `503` with code `database_unavailable` or `schema_incompatible`; component values remain allowlisted | Safe and idempotent; each request evaluates current shared state; no rate limit |

The liveness operation never queries PostgreSQL. Readiness performs a bounded database/schema check and
never mutates migration history. Configuration invalidity prevents listener binding rather than adding
an HTTP state.

### Disabled Identity Capabilities

Each exact request below is registered as disabled while the corresponding capability is unavailable.
It returns `404` with code `capability_disabled`, title `Capability is not available`, and no state
change. Paths accept no request body except where the server must drain/reject a bounded body safely.

| Method | Path                         | Capability                | Caller/authn/authz/tenant     | Idempotency, concurrency, and limits                                   |
| ------ | ---------------------------- | ------------------------- | ----------------------------- | ---------------------------------------------------------------------- |
| `GET`  | `/connect/authorize`         | OIDC authorization        | Anonymous; none               | Repeated/concurrent calls have the same no-write result; no rate limit |
| `POST` | `/connect/token`             | OAuth token issuance      | Anonymous client; none        | Same no-write result; bounded body; no rate limit                      |
| `GET`  | `/external/google/challenge` | External-provider sign-in | Anonymous; none               | Same no-write result; no redirect; no rate limit                       |
| `POST` | `/scim/v2/Users`             | SCIM user provisioning    | No bearer scheme is enabled   | Same no-write result; bounded body; no rate limit                      |
| `GET`  | `/platform/admin/companies`  | Platform administration   | No operator scheme is enabled | Same no-write result; no rate limit                                    |

The dispatcher matches only these exact method/path pairs. Unknown routes use the framework's ordinary
`404` contract without a capability code. Later work that enables a capability must UPDATE or DELETE its
exact matrix row and retain the others; it must not weaken the catch-all route behavior.

### Web Status Surface

`GET /` on `ose-id-web` accepts an anonymous browser request with no tenant context. It returns `200
text/html; charset=utf-8` containing one page heading, a named textual service-status region, and no
form, authentication control, provider link, company control, or session cookie. Backend-status
unavailability returns a sanitized `503 text/html; charset=utf-8` status page; an unhandled render
failure returns the sanitized framework `500` page. Neither exposes secrets. The read is idempotent,
has no mutation race, and is not application-rate-limited.

## Per-Operation Contract Packets

### Backend startup guard

- **Caller/auth/context:** local runner or test harness starting `ose-id-be`; no request principal or tenant exists.
- **Input:** process environment and configuration, including runtime mode and `OSE_ID_BE_PORT`; there
  are no HTTP headers, parameters, body, or JSON schema because validation occurs before listener binding.
- **Serialized examples:** the runner supplies and observes the closed process contract:

  ```text
  input:  OSE_RUNTIME_MODE=Local OSE_ID_BE_PORT=8501
  result: process-running; listener=http://127.0.0.1:8501
  ```

  ```text
  input:  OSE_RUNTIME_MODE=Production OSE_ID_BE_PORT=8501
  result: exit-code=1; diagnostic-code=runtime_mode_disabled; listener=absent
  ```

- **Success/result:** Local/Test with valid configuration may bind `http://127.0.0.1:8501`; an unsupported
  mode exits non-zero with a stable `runtime_mode_disabled` diagnostic and produces no HTTP response.
- **Problems/validation:** missing, unknown, Production, Staging, or equivalent production-like mode
  fails closed before database migration or socket binding. Configuration values and machine paths are redacted.
- **Semantics/privacy:** repeated/concurrent starts cannot convert an invalid mode into service; no
  pagination, replay key, application rate limit, state write, secret log, or cache applies.
- **Discovery/proof:** deliberately absent from OpenAPI because no listener exists. The
  [runtime-guard contract](#runtime-guard-contract) scenario outline “Reject an unsupported service
  runtime before listener binding”, restricted to its `ose-id-be` example rows, targets
  `specs/apps/ose/id-be/behaviours/foundation/runtime-mode.feature`; Unit mode decision, Integration
  host startup, and E2E port/no-row proof are mandatory.
- **Compatibility/rollback:** ADD is backward-compatible because no prior backend exists. Rollback removes
  the inert host and listener together; it cannot enable an unsupported mode or require data rollback.

### Web startup guard

- **Caller/auth/context:** local runner or test harness starting `ose-id-web`; no browser principal or tenant exists.
- **Input:** process environment and configuration, including runtime mode and `OSE_ID_WEB_PORT`; no HTTP
  request/JSON schema exists before listener binding.
- **Serialized examples:** the runner supplies and observes the closed process contract:

  ```text
  input:  OSE_RUNTIME_MODE=Local OSE_ID_WEB_PORT=3500
  result: process-running; listener=http://127.0.0.1:3500
  ```

  ```text
  input:  OSE_RUNTIME_MODE=missing OSE_ID_WEB_PORT=3500
  result: exit-code=1; diagnostic-code=runtime_mode_disabled; listener=absent
  ```

- **Success/result:** Local/Test may bind `http://127.0.0.1:3500`; an unsupported mode exits non-zero with
  stable `runtime_mode_disabled` output and returns no status page or HTTP body.
- **Problems/validation:** missing, unknown, Production, Staging, or equivalent production-like mode
  fails closed; the diagnostic omits environment values, secrets, stack traces, and absolute paths.
- **Semantics/privacy:** deterministic under replay/concurrency with no state, pagination, rate limit,
  cache, cookie, or logging of protected configuration.
- **Discovery/proof:** deliberately absent from backend OpenAPI. The
  [runtime-guard contract](#runtime-guard-contract) scenario outline “Reject an unsupported service
  runtime before listener binding”, restricted to its `ose-id-web` example rows, targets
  `specs/apps/ose/id-web/behaviours/foundation/runtime-mode.feature`; Unit configuration decision,
  Integration Next startup, and E2E port/no-cookie proof are mandatory.
- **Compatibility/rollback:** ADD introduces no prior-client break. Rollback removes the inert web host;
  no session, cache, or data conversion exists to reverse.

### Liveness operation

- **Caller/auth/context:** anonymous local runner or operator; no authorization or tenant context.
- **Request:** optional validated `X-Correlation-ID`; no path/query/body or cookie is accepted.
- **Success:** `200 application/json`, `Cache-Control: no-store`, correlation header, and:

  ```json
  {
    "status": "live",
    "service": "ose-id-be"
  }
  ```

- **Problems/validation:** none from a running process; malformed correlation input is replaced, not
  reflected. Process absence is connection failure, not a synthetic API response.
- **Semantics/privacy:** read-idempotent, concurrency-safe, unpaginated, unlimited, no dependency call,
  and allowlisted logs only.
- **Discovery/proof:** OpenAPI operation `getLiveness`; the [health contract](#health-contract) scenario
  “Report liveness without consulting dependencies” targets
  `specs/apps/ose/id-be/behaviours/foundation/health.feature`. Unit maps liveness state, Integration
  exercises the health pipeline, and E2E proves database loss does not redefine liveness.

### Readiness operation

- **Caller/auth/context:** anonymous local runner or operator; no authorization or tenant context.
- **Request:** optional validated correlation header; no parameters/body/cookie.
- **Success:** `200 application/json`, no-store/correlation headers, and:

  ```json
  {
    "status": "ready",
    "components": {
      "postgresql": "ready",
      "schema": "compatible"
    }
  }
  ```

- **Problems/validation:** `503 database_unavailable` or `503 schema_incompatible` in the common problem
  body. Component/code values are closed enums; no connection/schema detail is serialized.
- **Semantics/privacy:** read-idempotent, bounded fresh evaluation under concurrency, unpaginated, not
  rate-limited, no mutation, and safe status/code logging only.
- **Discovery/proof:** OpenAPI `getReadiness`; the [health contract](#health-contract) scenario outline
  “Report current dependency readiness safely” targets
  `specs/apps/ose/id-be/behaviours/foundation/health.feature`. Unit maps dependency states, Integration
  covers the database adapter, and E2E proves outage/recovery and incompatible-schema behavior.

### Disabled OIDC authorization operation

- **Caller/auth/context:** anonymous; no client, user, authorization, or tenant is accepted.
- **Request:** optional correlation header; all query input is bounded then ignored; no body.
- **Result:** `404 application/problem+json`, no-store/correlation headers, and:

  ```json
  {
    "status": 404,
    "code": "capability_disabled",
    "title": "Capability is not available",
    "correlationId": "<opaque>"
  }
  ```

- **Semantics/privacy:** deterministic/no-write under retry/concurrency, no pagination/rate limit,
  no redirect or query logging.
- **Discovery/proof:** OpenAPI `rejectDisabledOidcAuthorization`; the
  [disabled-capability contract](#disabled-capability-contract) scenario outline “Reject a disabled
  identity capability through its exact route”, restricted to its OIDC authorization row, targets
  `specs/apps/ose/id-be/behaviours/foundation/disabled-capabilities.feature`. Unit inventory,
  Integration router/serializer, and E2E built-host/no-row proof are mandatory.

### Disabled token operation

- **Caller/auth/context:** anonymous; no client authentication, grant, user, or tenant is recognized.
- **Request:** optional correlation header; bounded content is drained/rejected without parsing a grant.
- **Result:** the exact `404 capability_disabled` problem and headers above; no token-shaped field.
- **Semantics/privacy:** replay/concurrency safe, no idempotency key/pagination/rate limit, and no body log.
- **Discovery/proof:** OpenAPI `rejectDisabledTokenIssuance`; the
  [disabled-capability contract](#disabled-capability-contract) scenario outline “Reject a disabled
  identity capability through its exact route”, restricted to its OAuth token-issuance row, targets
  `specs/apps/ose/id-be/behaviours/foundation/disabled-capabilities.feature`. Unit inventory,
  Integration pipeline, and E2E no-token/no-row proof are mandatory.

### Disabled Google operation

- **Caller/auth/context:** anonymous; no provider configuration, session, authorization, or tenant.
- **Request:** optional correlation header; bounded query ignored; no body/cookie.
- **Result:** exact `404 capability_disabled`; no `Location`, state, nonce, or correlation-provider data.
- **Semantics/privacy:** deterministic/no-write under retry/concurrency, no pagination/rate limit or
  provider logging.
- **Discovery/proof:** OpenAPI `rejectDisabledGoogleSignIn`; the
  [disabled-capability contract](#disabled-capability-contract) scenario outline “Reject a disabled
  identity capability through its exact route”, restricted to its Google sign-in row, targets
  `specs/apps/ose/id-be/behaviours/foundation/disabled-capabilities.feature`. Unit inventory,
  Integration no-redirect pipeline, and E2E no-cookie/no-row proof are mandatory.

### Disabled SCIM operation

- **Caller/auth/context:** anonymous; no bearer scheme, provisioning authority, or tenant is enabled.
- **Request:** optional correlation header; bounded body is not parsed into a user.
- **Result:** exact `404 capability_disabled`; no SCIM resource/error body or identifier.
- **Semantics/privacy:** replay/concurrency safe, no idempotency key/pagination/rate limit, no body log.
- **Discovery/proof:** OpenAPI `rejectDisabledScimUserProvisioning`; the
  [disabled-capability contract](#disabled-capability-contract) scenario outline “Reject a disabled
  identity capability through its exact route”, restricted to its SCIM row, targets
  `specs/apps/ose/id-be/behaviours/foundation/disabled-capabilities.feature`. Unit inventory,
  Integration media/router behavior, and E2E no-Person/no-row proof are mandatory.

### Disabled platform admin operation

- **Caller/auth/context:** anonymous; no operator authentication/authorization or company context exists.
- **Request:** optional correlation header; bounded query ignored; no body/cookie.
- **Result:** exact `404 capability_disabled`; no company list/count/identifier.
- **Semantics/privacy:** deterministic/no-write, unpaginated, unlimited, safe route/code logging only.
- **Discovery/proof:** OpenAPI `rejectDisabledPlatformAdministration`; the
  [disabled-capability contract](#disabled-capability-contract) scenario outline “Reject a disabled
  identity capability through its exact route”, restricted to its platform-administration row, targets
  `specs/apps/ose/id-be/behaviours/foundation/disabled-capabilities.feature`. Unit inventory,
  Integration pipeline, and E2E zero-company/no-disclosure proof are mandatory.

### Web status operation

- **Caller/auth/context:** anonymous browser; no account, authorization, or tenant context.
- **Request:** optional correlation header; no query/body/cookie required.
- **Serialized request and success:**

  ```http
  GET / HTTP/1.1
  Host: 127.0.0.1:3500
  Accept: text/html
  ```

  ```http
  HTTP/1.1 200 OK
  Content-Type: text/html; charset=utf-8
  Cache-Control: no-cache

  <main><h1>OSE ID service status</h1><section aria-label="Service status">Backend ready</section></main>
  ```

- **Success:** `200 text/html; charset=utf-8`, `Cache-Control: no-cache`, one page heading and named
  textual status region; example visible text is `OSE ID service status` and `Backend ready`.
- **Problems/validation:** backend-status unavailability returns the sanitized `503` status page;
  unhandled rendering returns sanitized framework `500`. Neither contains a stack, backend host,
  machine path, cookie, or identity field. Unsupported runtime mode binds no listener.
- **Semantics/privacy:** read-idempotent, concurrency-safe, unpaginated/unlimited, no cookie or user data.
- **Discovery/proof:** id-web status specification rather than backend OpenAPI. The
  [web status contract](#web-status-contract) scenarios “Render the service status without identity
  controls” and “Sanitize a status-rendering failure” target
  `specs/apps/ose/id-web/behaviours/foundation/status-shell.feature`; component Unit, Next-server
  Integration, and browser E2E accessibility/responsive proof are mandatory.
- **Compatibility/rollback:** the new local-only page has no predecessor. Rollback removes the page and
  leaves no cookie, browser storage, server session, or durable record.

## Copy-Ready API Contract Scenarios

These packets are app-scoped additions to the exact foundation feature files named below. They are the
executable contract companion to the operation packets above. Each scenario binds once to Unit,
Integration, and E2E; no adapter exemption applies.

| Action and operation                 | Exact target                                                               | Full scenario packet                                                                     |
| ------------------------------------ | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| ADD backend startup guard            | `specs/apps/ose/id-be/behaviours/foundation/runtime-mode.feature`          | Reject an unsupported service runtime before listener binding — backend examples         |
| ADD web startup guard                | `specs/apps/ose/id-web/behaviours/foundation/runtime-mode.feature`         | Reject an unsupported service runtime before listener binding — web examples             |
| ADD `GET /health/live`               | `specs/apps/ose/id-be/behaviours/foundation/health.feature`                | Report liveness without consulting dependencies                                          |
| ADD `GET /health/ready`              | `specs/apps/ose/id-be/behaviours/foundation/health.feature`                | Report current dependency readiness safely                                               |
| ADD `GET /connect/authorize`         | `specs/apps/ose/id-be/behaviours/foundation/disabled-capabilities.feature` | Reject a disabled identity capability through its exact route — OIDC row                 |
| ADD `POST /connect/token`            | `specs/apps/ose/id-be/behaviours/foundation/disabled-capabilities.feature` | Reject a disabled identity capability through its exact route — token row                |
| ADD `GET /external/google/challenge` | `specs/apps/ose/id-be/behaviours/foundation/disabled-capabilities.feature` | Reject a disabled identity capability through its exact route — provider row             |
| ADD `POST /scim/v2/Users`            | `specs/apps/ose/id-be/behaviours/foundation/disabled-capabilities.feature` | Reject a disabled identity capability through its exact route — SCIM row                 |
| ADD `GET /platform/admin/companies`  | `specs/apps/ose/id-be/behaviours/foundation/disabled-capabilities.feature` | Reject a disabled identity capability through its exact route — administration row       |
| ADD web `GET /`                      | `specs/apps/ose/id-web/behaviours/foundation/status-shell.feature`         | Render the service status without identity controls; Sanitize a status-rendering failure |

UPDATE, DELETE, and RETAIN operations are none because this is the first OSE ID contract.

### Runtime-guard contract

```gherkin
Feature: OSE ID runtime guard contract
  OSE ID listeners are available only in explicitly local or test execution modes.

  Rule: Unsupported runtime configuration fails before observable service state

    Scenario Outline: Reject an unsupported service runtime before listener binding
      Given <service> is configured with runtime mode <runtime mode>
      When the service process starts
      Then the process exits non-zero with code "runtime_mode_disabled"
      And no configured HTTP listener is bound
      And no database or identity row is changed
      And the diagnostic contains no secret, configuration value, stack trace, or absolute path

      Examples:
        | service   | runtime mode |
        | ose-id-be | missing      |
        | ose-id-be | Production   |
        | ose-id-web | missing     |
        | ose-id-web | Production  |
```

### Health contract

```gherkin
Feature: OSE ID health API contract
  Local operators receive current allowlisted health without authentication or sensitive details.

  Rule: Liveness is process-only and readiness reflects current shared dependencies

    Scenario: Report liveness without consulting dependencies
      Given the backend listener is running and PostgreSQL is unavailable
      When an anonymous caller sends GET "/health/live" without user or tenant context
      Then the response is 200 JSON with status "live" and service "ose-id-be"
      And the response has no-store and correlation headers
      And no dependency is queried or state is changed
      And no connection, schema, secret, stack trace, or absolute path is returned or logged

    Scenario Outline: Report current dependency readiness safely
      Given the backend listener is running with <dependency state>
      When an anonymous caller sends GET "/health/ready" without parameters, body, user, or tenant context
      Then the response status is <status>
      And the response reports <result> using only the closed health or problem schema
      And a repeated or concurrent request re-evaluates current state without mutation
      And no connection, migration name, secret, stack trace, or absolute path is returned or logged

      Examples:
        | dependency state               | status | result               |
        | PostgreSQL and schema ready    | 200    | ready                 |
        | PostgreSQL unavailable         | 503    | database_unavailable  |
        | schema version incompatible    | 503    | schema_incompatible   |
```

### Disabled-capability contract

```gherkin
Feature: Disabled OSE ID capability API contract
  Identity capabilities that are not implemented fail closed through exact registered routes.

  Rule: A disabled capability has one stable no-write response

    Scenario Outline: Reject a disabled identity capability through its exact route
      Given <capability> is disabled and no authentication or tenant scheme exists for it
      When an anonymous caller sends <method> <path> with bounded input
      Then the response is 404 with code "capability_disabled"
      And the response has no-store and correlation headers
      And no redirect, token, cookie, identity resource, or tenant fact is returned
      And repeated and concurrent requests create no identity, authorization, or audit row
      And request values, secrets, and provider data are absent from logs and metrics

      Examples:
        | method | path                        | capability                 |
        | GET    | /connect/authorize          | OIDC authorization         |
        | POST   | /connect/token              | OAuth token issuance       |
        | GET    | /external/google/challenge  | Google sign-in             |
        | POST   | /scim/v2/Users              | SCIM user provisioning     |
        | GET    | /platform/admin/companies   | platform administration    |
```

### Web status contract

```gherkin
Feature: OSE ID web status contract
  The local web root reports service state without becoming an identity interface.

  Rule: Status rendering is accessible, read-only, and sanitized

    Scenario: Render the service status without identity controls
      Given the local web and backend services are ready
      When an anonymous browser sends GET "/" to ose-id-web without user or tenant context
      Then the response is 200 HTML with a page heading and named textual status region
      And the response has no-cache and no session cookie
      And no login, provider, company, consent, or administration control is rendered
      And repeated and concurrent reads change no state or server-local correctness data

    Scenario: Sanitize a status-rendering failure
      Given the local web listener is running and its backend status dependency fails
      When an anonymous browser sends GET "/" to ose-id-web
      Then the response is the documented sanitized Next.js error result
      And no backend host, secret, stack trace, absolute path, cookie, or user data is returned or logged
```

## UPDATE, DELETE, and RETAIN Contracts

- **UPDATE:** none; no OSE ID API predates this slice.
- **DELETE:** none.
- **RETAIN:** none. The generic framework unknown-route behavior is prior platform behavior, not an OSE
  ID-owned contract.

## OpenAPI and Code Generation

Add the machine-readable OpenAPI 3.1.0 source of truth at
`specs/apps/ose/id-be/contracts/openapi.yaml`, with only the two health operations and the five exact
disabled-capability operations. Give every operation a durable domain name such as `getLiveness`,
`getReadiness`, or `rejectDisabledTokenIssuance`; never embed plan IDs. Define closed response schemas,
content types, headers, status codes, and zero security requirements. The web HTML route is documented
under the `id-web` architecture/spec owner and is not forced into backend OpenAPI.

Run the repository OpenAPI validator and any configured code generator. Generated artifacts may change
only at the exact project-owned path registered by execution; generated clients cannot be imported by
the backend implementation. A generated diff outside the approved file-impact ledger stops execution
for reconciliation.

## Compatibility and Recovery

All operations are additive. Pre-OSE-ID code ignores them and remains compatible with the additive
schema. New code against an unavailable/incompatible database keeps liveness truthful, returns readiness
`503`, and admits no identity work. Rollback removes the new listeners/routes with the code while
retaining the additive migration history; clients must treat disappearance as unavailable. A later
capability replaces only its exact disabled row through an explicit OpenAPI change and compatibility
review. Fix a shipped contract defect forward; do not silently change a code or response shape.

## Unit, Integration, and E2E Proof

| Contract concern           | Unit obligation                                   | Integration obligation                                  | E2E obligation                                            |
| -------------------------- | ------------------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------- |
| Liveness/readiness mapping | Pure dependency-state-to-response tests           | Real ASP.NET health pipeline with controlled dependency | Built backend plus real PostgreSQL outage/recovery        |
| Disabled-capability matrix | Exact method/path inventory and no-write decision | Real router/problem serialization                       | Built host probes every row and verifies zero domain rows |
| Runtime guard              | Mode parser/decision tests                        | Host startup with controlled modes                      | Process exits before either fixed listener binds          |
| Web status surface         | Semantic component/status rendering               | Next server/backend-error wiring                        | Keyboard, screen-reader semantics, and 320-pixel viewport |

Every row has mandatory Unit, Integration, and E2E proof with no exemption. Static behavior coverage
maps the same durable scenario names to exactly one adapter per layer.
