---
title: "Auth Register and Login - Requirements"
---

# Requirements

## Objectives

1. Provide a `POST /api/v1/auth/register` endpoint that creates a new user account with a BCrypt-hashed password and returns the created user's public data.
2. Provide a `POST /api/v1/auth/login` endpoint that validates credentials and returns a signed JWT Bearer token.
3. Configure Spring Security so that `/api/v1/auth/**` and `/actuator/**` are publicly accessible while all other endpoints require a valid JWT.
4. Persist users in PostgreSQL with Liquibase-managed schema; use H2 for the test profile so integration tests remain in-process and cacheable.
5. Cover all new code paths with integration tests to maintain the 95% JaCoCo line-coverage gate.

## Non-Functional Requirements

- Passwords must never be stored in plaintext (BCrypt, strength 10).
- JWT tokens are signed with HS256; the signing secret is injected via environment variable (`APP_JWT_SECRET`), not hardcoded.
- JWT tokens expire after 24 hours.
- Validation failures return structured JSON error bodies consistent with Spring's existing error format.
- Integration tests must not require an external database or network call.
- The Liquibase changelog must be idempotent when re-run against an empty schema.
- SQL injection must be prevented via parameterized queries (Spring Data JPA derived methods only; no string-concatenated SQL). `@Pattern` on input fields provides a secondary defense at the HTTP boundary.

## Constraints

- Spring Boot 4.0.3, Java 25, Maven.
- `@NullMarked` on all new packages (JSpecify).
- `package-info.java` required for every new package.
- No wildcard imports (Checkstyle).
- Functional style preferred: immutable DTOs (records), pure service methods.
- All REST API endpoints must be versioned under `/api/v1/` (e.g., `/api/v1/auth/register`).
- No `RuntimeException` subclasses in application code: use checked exceptions (`extends Exception`) so error paths are visible in method signatures.
- Every database table MUST include 6 audit trail columns: `created_at`, `created_by`, `updated_at`, `updated_by`, `deleted_at` (nullable), `deleted_by` (nullable). Deletion is always soft (set `deleted_at`/`deleted_by`; never `DELETE` rows).
- CORS must explicitly whitelist `organiclever-web` origins only: `http://localhost:3200` (dev) and `https://www.organiclever.com` (production). Wildcard origins are forbidden.

## User Stories

### Story 1 - Register a new account

As a new user,
I want to create an account with a username and password,
so that I can authenticate and use the OrganicLever platform.

#### Acceptance Criteria

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
      { "username": "alice", "password": "anotherPass1" }
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

### Story 2 - Log in and receive a JWT token

As a registered user,
I want to log in with my username and password,
so that I receive a JWT token I can use to access protected resources.

#### Acceptance Criteria

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

### Story 3 - JWT protects other endpoints

As an API maintainer,
I want all non-auth endpoints to require a valid JWT Bearer token,
so that unauthenticated users cannot access protected resources.

#### Acceptance Criteria

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

  Scenario: Actuator health endpoint is accessible without authentication
    When a client sends GET /actuator/health
    Then the response status code should be 200

  Scenario: Auth endpoints are accessible without authentication
    When a client sends POST /api/v1/auth/register with body:
      """
      { "username": "newuser99", "password": "passw0rd!!" }
      """
    Then the response status code should be 201
```

## Validation Rules

### RegisterRequest

| Field    | Rule                                                                                                                                        | HTTP status on violation |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| username | Not blank, min 5 chars, max 50, alphanumeric + underscore only (regex: `^[a-zA-Z0-9_]{5,50}$`)                                              | 400                      |
| password | Not blank, min 8 chars, max 128, must contain at least one uppercase, one lowercase, one digit, one special character (see password policy) | 400                      |

**Password policy regex**: `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\,.<>/?]).{8,128}$`

Accepted special characters: `! @ # $ % ^ & * ( ) _ + - = [ ] { } ; ' : " \ , . < > / ?`

### LoginRequest

| Field    | Rule      | HTTP status on violation |
| -------- | --------- | ------------------------ |
| username | Not blank | 400                      |
| password | Not blank | 400                      |

## HTTP Response Contracts

### POST /api/v1/auth/register - 201 Created

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "alice",
  "createdAt": "2026-03-09T10:00:00Z"
}
```

### POST /api/v1/auth/login - 200 OK

```json
{
  "token": "<signed-jwt>",
  "type": "Bearer"
}
```

### Error shape (400 / 401 / 409)

Spring Boot's default `/error` JSON shape is used. The `message` field carries a human-readable description. For 400 Bean Validation errors the `errors` array from `MethodArgumentNotValidException` is present.
