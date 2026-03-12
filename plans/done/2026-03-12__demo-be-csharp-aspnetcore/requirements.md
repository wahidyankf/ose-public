# Requirements: demo-be-csharp-aspnetcore

All acceptance criteria are expressed in Gherkin and directly correspond to the scenarios in
`specs/apps/demo-be/gherkin/`. Acceptance is verified at two layers:

- **Integration tests** (`test:integration`): Reqnroll step definitions with
  `WebApplicationFactory` (in-process — no live server needed) with EF Core bound to a SQLite
  in-memory database — fully in-process, no external services, safe to cache. Matches the
  monorepo convention established by `demo-be-java-springboot` (MockMvc + InMemoryDataStore),
  `demo-be-elixir-phoenix` (InMemoryStore contexts), `demo-be-fsharp-giraffe` (TickSpec + WebApplicationFactory +
  SQLite in-memory), `demo-be-golang-gin` (Godog + httptest), `demo-be-python-fastapi` (pytest-bdd +
  TestClient), `demo-be-rust-axum` (Cucumber + Tower TestClient), and `demo-be-kotlin-ktor`
  (Cucumber JVM + Ktor testApplication).
- **E2E tests** (`test:e2e`): Playwright via `demo-be-e2e` against the live Dockerised stack
  at port 8201 — exercises the full stack including real PostgreSQL.

---

## Feature: Health Check

_Source: `specs/apps/demo-be/gherkin/health/health-check.feature`_ (2 scenarios)

- Health endpoint reports the service as UP
- Anonymous health check does not expose component details

---

## Feature: Password Login

_Source: `specs/apps/demo-be/gherkin/authentication/password-login.feature`_ (5 scenarios)

- Successful login returns access token and refresh token
- Successful login response includes token type "Bearer"
- Reject login with wrong password
- Reject login for non-existent user
- Reject login for deactivated account

---

## Feature: Token Lifecycle

_Source: `specs/apps/demo-be/gherkin/authentication/token-lifecycle.feature`_ (7 scenarios)

- Successful refresh returns a new access token and refresh token
- Reject refresh with an expired refresh token
- Original refresh token is rejected after rotation (single-use)
- Refresh fails for a deactivated user
- Logout current session invalidates the access token
- Logout all devices invalidates tokens from all sessions
- Logout is idempotent — repeating logout on the same token returns 200

---

## Feature: Registration

_Source: `specs/apps/demo-be/gherkin/user-lifecycle/registration.feature`_ (6 scenarios)

- Successful registration returns created user profile without password
- Successful registration response includes non-null user ID
- Reject registration when username already exists
- Reject registration with invalid email format
- Reject registration with empty password
- Reject registration with weak password — no uppercase letter

---

## Feature: User Account

_Source: `specs/apps/demo-be/gherkin/user-lifecycle/user-account.feature`_ (6 scenarios)

- Get own profile returns username, email, and display name
- Update display name succeeds
- Successful password change returns 200
- Reject password change with incorrect old password
- Authenticated user self-deactivates their account
- Self-deactivated user cannot log in with previous credentials

---

## Feature: Security

_Source: `specs/apps/demo-be/gherkin/security/security.feature`_ (5 scenarios)

- Reject password shorter than 12 characters
- Reject password with no special character
- Account is locked after exceeding the maximum failed login threshold
- Admin unlocks a locked account
- Unlocked account can log in with correct password

---

## Feature: Token Management

_Source: `specs/apps/demo-be/gherkin/token-management/tokens.feature`_ (6 scenarios)

- Access token payload contains user ID claim
- Access token payload contains issuer claim
- JWKS endpoint returns the public key for token signature verification
- Logout blacklists the access token
- Blacklisted access token is rejected with 401 on protected endpoints
- Deactivating a user revokes all their active tokens

---

## Feature: Admin

_Source: `specs/apps/demo-be/gherkin/admin/admin.feature`_ (6 scenarios)

- List all users returns a paginated response
- Search users by email returns matching results
- Admin disables a user account
- Disabled user's access token is rejected with 401
- Admin re-enables a disabled user account
- Admin generates a password-reset token for a user

---

## Feature: Expense Management

_Source: `specs/apps/demo-be/gherkin/expenses/expense-management.feature`_ (7 scenarios)

- Create expense entry with amount and currency returns 201 with entry ID
- Create income entry with amount and currency returns 201 with entry ID
- Get own entry by ID returns amount, currency, category, description, date, and type
- List own entries returns a paginated response
- Update an entry amount and description returns 200
- Delete an entry returns 204
- Unauthenticated request to create an entry returns 401

---

## Feature: Currency Handling

_Source: `specs/apps/demo-be/gherkin/expenses/currency-handling.feature`_ (6 scenarios)

- USD expense amount preserves two decimal places
- IDR expense amount is stored and returned as a whole number
- Unsupported currency code returns 400
- Malformed currency code returns 400
- Expense summary groups totals by currency without cross-currency mixing
- Negative amount is rejected with 400

---

## Feature: Unit Handling

_Source: `specs/apps/demo-be/gherkin/expenses/unit-handling.feature`_ (4 scenarios)

- Create expense with metric unit "liter" stores quantity and unit correctly
- Create expense with imperial unit "gallon" stores quantity and unit correctly
- Create expense with an unsupported unit returns 400
- Expense without quantity and unit fields is accepted

---

## Feature: Reporting

_Source: `specs/apps/demo-be/gherkin/expenses/reporting.feature`_ (6 scenarios)

- P&L summary returns income total, expense total, and net for a period
- P&L breakdown includes category-level amounts for income and expenses
- Income entries are excluded from expense total
- Expense entries are excluded from income total
- P&L summary filters by currency without cross-currency mixing
- P&L summary for a period with no entries returns zero totals

---

## Feature: Attachments

_Source: `specs/apps/demo-be/gherkin/expenses/attachments.feature`_ (10 scenarios)

- Upload JPEG image returns 201 with attachment metadata
- Upload PDF document returns 201 with attachment metadata
- List attachments for an entry returns all uploaded files with metadata
- Delete attachment returns 204
- Upload unsupported file type returns 415
- Upload file exceeding the size limit returns 413
- Upload attachment to another user's entry returns 403
- List attachments on another user's entry returns 403
- Delete attachment on another user's entry returns 403
- Delete non-existent attachment returns 404

---

## Non-Functional Requirements

- Coverage ≥ 90% (enforced by `rhino-cli test-coverage validate` applied to LCOV output from
  Coverlet)
- All Nx mandatory targets present: `build`, `dev`, `start`, `test:quick`, `test:unit`,
  `test:integration`, `lint`, `typecheck`
- `dotnet format --verify-no-changes` passes with zero formatting violations
- Roslyn analyzers (NetAnalyzers + SonarAnalyzer.CSharp) pass with zero warnings
  (`<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`)
- All 76 Gherkin scenarios pass in integration tests
- All 76 Gherkin scenarios pass in E2E tests (via `demo-be-e2e`)
- Port 8201 (mutually exclusive with all other demo-be variants)
- Password constraints: min 12 chars, must include uppercase and special character
- Supported currencies: USD (2 decimal places), IDR (0 decimal places)
- SDK version pinned in `global.json`
- NuGet packages locked via `packages.lock.json`
