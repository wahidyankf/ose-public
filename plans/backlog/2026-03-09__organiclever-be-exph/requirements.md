# Requirements: organiclever-be-exph

All acceptance criteria are expressed in Gherkin and directly correspond to the scenarios in
`specs/apps/organiclever-be/`. Acceptance is verified at two layers:

- **Integration tests** (`test:integration`): Phoenix.ConnTest + Mox for the Accounts context —
  fully in-process, no external services, safe to cache. Matches the monorepo convention
  established by `organiclever-be-jasb` (MockMvc) and `golang-commons` (mock closures).
- **E2E tests** (`test:e2e`): Playwright via `organiclever-be-e2e` against the live Dockerised
  stack at port 8201 — exercises the full stack including real PostgreSQL.

---

## Feature: Health Check

_Source: `specs/apps/organiclever-be/health/health-check.feature`_

```gherkin
Feature: Service Health Check

  Scenario: Health endpoint reports the service as UP
    Given the OrganicLever API is running
    When an operations engineer sends GET /health
    Then the response status code should be 200
    And the health status should be "UP"

  Scenario: Anonymous health check does not expose component details
    Given the OrganicLever API is running
    When an unauthenticated engineer sends GET /health
    Then the response status code should be 200
    And the health status should be "UP"
    And the response should not include detailed component health information
```

---

## Feature: Hello Endpoint

_Source: `specs/apps/organiclever-be/hello/hello-endpoint.feature`_

```gherkin
Feature: Hello World Endpoint

  Background:
    Given the OrganicLever API is running
    And a user "hellouser" is already registered with password "s3cur3Pass!"
    And the client has logged in as "hellouser" and stored the JWT token

  Scenario: Successful response returns greeting message
    When a client sends GET /api/v1/hello with the stored Bearer token
    Then the response status code should be 200
    And the response body should be {"message":"world!"}
    And the response Content-Type should be application/json

  Scenario: Cross-origin request from localhost is permitted
    When a client sends GET /api/v1/hello with the stored Bearer token and Origin header http://localhost:3200
    Then the response status code should be 200
    And the response should include an Access-Control-Allow-Origin header permitting the request
```

---

## Feature: User Registration

_Source: `specs/apps/organiclever-be/auth/register.feature`_

```gherkin
Feature: User Registration

  Background:
    Given the OrganicLever API is running

  Scenario: Successful registration with valid credentials
    When a client sends POST /api/v1/auth/register with body:
      """
      { "username": "alice", "password": "s3cur3Pass!" }
      """
    Then the response status code should be 201
    And the response body should contain "username" equal to "alice"
    And the response body should not contain a "password" field
    And the response body should contain a non-null "id" field

  Scenario: Reject registration when username already exists
    Given a user "alice" is already registered
    When a client sends POST /api/v1/auth/register with body:
      """
      { "username": "alice", "password": "anotherPass1!" }
      """
    Then the response status code should be 409
    And the response body should contain an error message about duplicate username

  Scenario: Reject registration with empty username
    When a client sends POST /api/v1/auth/register with body:
      """
      { "username": "", "password": "s3cur3Pass!" }
      """
    Then the response status code should be 400
    And the response body should contain a validation error for "username"

  Scenario: Reject registration with username below minimum length
    When a client sends POST /api/v1/auth/register with body:
      """
      { "username": "ab", "password": "s3cur3Pass!" }
      """
    Then the response status code should be 400
    And the response body should contain a validation error for "username"

  Scenario: Reject registration with empty password
    When a client sends POST /api/v1/auth/register with body:
      """
      { "username": "validuser", "password": "" }
      """
    Then the response status code should be 400
    And the response body should contain a validation error for "password"

  Scenario: Reject registration with password below minimum length
    When a client sends POST /api/v1/auth/register with body:
      """
      { "username": "validuser", "password": "short" }
      """
    Then the response status code should be 400
    And the response body should contain a validation error for "password"

  Scenario: Reject registration with weak password (no uppercase)
    When a client sends POST /api/v1/auth/register with body:
      """
      { "username": "validuser", "password": "alllower1!" }
      """
    Then the response status code should be 400
    And the response body should contain a validation error for "password"

  Scenario: Reject registration with weak password (no special character)
    When a client sends POST /api/v1/auth/register with body:
      """
      { "username": "validuser", "password": "NoSpecial1" }
      """
    Then the response status code should be 400
    And the response body should contain a validation error for "password"

  Scenario: Reject registration with invalid username format
    When a client sends POST /api/v1/auth/register with body:
      """
      { "username": "invalid user!", "password": "s3cur3Pass!" }
      """
    Then the response status code should be 400
    And the response body should contain a validation error for "username"
```

---

## Feature: User Login

_Source: `specs/apps/organiclever-be/auth/login.feature`_

```gherkin
Feature: User Login

  Background:
    Given the OrganicLever API is running
    And a user "alice" is already registered with password "s3cur3Pass!"

  Scenario: Successful login with valid credentials
    When a client sends POST /api/v1/auth/login with body:
      """
      { "username": "alice", "password": "s3cur3Pass!" }
      """
    Then the response status code should be 200
    And the response body should contain a "token" field
    And the response body should contain "type" equal to "Bearer"

  Scenario: Reject login with wrong password
    When a client sends POST /api/v1/auth/login with body:
      """
      { "username": "alice", "password": "wrongPass" }
      """
    Then the response status code should be 401
    And the response body should contain an error message about invalid credentials

  Scenario: Reject login for non-existent user
    When a client sends POST /api/v1/auth/login with body:
      """
      { "username": "ghost", "password": "doesNotMatter" }
      """
    Then the response status code should be 401
    And the response body should contain an error message about invalid credentials

  Scenario: Reject login with empty username
    When a client sends POST /api/v1/auth/login with body:
      """
      { "username": "", "password": "s3cur3Pass!" }
      """
    Then the response status code should be 400
    And the response body should contain a validation error for "username"

  Scenario: Reject login with empty password
    When a client sends POST /api/v1/auth/login with body:
      """
      { "username": "alice", "password": "" }
      """
    Then the response status code should be 400
    And the response body should contain a validation error for "password"
```

---

## Feature: JWT-Protected Endpoints

_Source: `specs/apps/organiclever-be/auth/jwt-protection.feature`_

```gherkin
Feature: JWT Protected Endpoints

  Background:
    Given the OrganicLever API is running

  Scenario: Request to protected endpoint without token is rejected
    When a client sends GET /api/v1/hello without an Authorization header
    Then the response status code should be 401

  Scenario: Request to protected endpoint with valid JWT is accepted
    Given a user "alice" is already registered with password "s3cur3Pass!"
    And the client has logged in as "alice" and stored the JWT token
    When a client sends GET /api/v1/hello with the stored Bearer token
    Then the response status code should be 200

  Scenario: Request to protected endpoint with expired JWT is rejected
    When a client sends GET /api/v1/hello with an expired Bearer token
    Then the response status code should be 401

  Scenario: Request to protected endpoint with malformed JWT is rejected
    When a client sends GET /api/v1/hello with Authorization header "Bearer not.a.jwt"
    Then the response status code should be 401

  Scenario: Health endpoint is accessible without authentication
    When a client sends GET /health
    Then the response status code should be 200

  Scenario: Auth endpoints are accessible without authentication
    When a client sends POST /api/v1/auth/register with body:
      """
      { "username": "newuser99", "password": "Passw0rd!!" }
      """
    Then the response status code should be 201
```

---

## Non-Functional Requirements

- Coverage ≥ 90% (enforced by `rhino-cli test-coverage validate`)
- All Nx mandatory targets present: `build`, `dev`, `test:quick`, `test:unit`,
  `test:integration`, `lint`, `typecheck`
- Linting passes with zero violations (`mix credo --strict`)
- Dialyzer passes with zero warnings (`mix dialyzer`)
- All CORS origins configured the same as `organiclever-be-jasb` (`http://localhost:3200`,
  `http://localhost:3000`, production URL)
- Password constraints identical to JASB: min 8 chars, uppercase, special character
- Username constraints identical to JASB: min 3 chars, alphanumeric + underscore only
