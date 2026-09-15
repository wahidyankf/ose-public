# BDD Spec Delta and Adapter Map

## Durable Account Spec Delta

Plan 01 foundation scenarios are **RETAINED** unchanged under the same `id-be`/`id-web` owners. This
plan adds only backend account behavior under `specs/apps/ose/id-be/behaviours/account/`.

| Action | Feature path and scenario ID/name                                                                                                      | Unit binding obligation                                     | Integration binding obligation                                               | Backend E2E binding obligation                             |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------- |
| ADD    | `specs/apps/ose/id-be/behaviours/account/registration.feature` — `AC-ACC-01 Register a new personal account`                           | Person/email/password invariants and generic result         | ASP.NET endpoint + Identity password primitives + SqlKata/Npgsql transaction | Built API/PostgreSQL/Mailpit; prove no company row         |
| ADD    | `specs/apps/ose/id-be/behaviours/account/verification.feature` — `AC-ACC-02 Consume a valid verification capability`                   | Purpose/expiry/single-use/concurrency result                | Endpoint + transaction + notification mapping                                | Two concurrent built requests and real database result     |
| ADD    | `specs/apps/ose/id-be/behaviours/account/password-sign-in.feature` — `AC-ACC-03 Attempt password sign-in`                              | State table, password verifier result, session creation     | Cookie/auth pipeline, Identity password verifier, and query adapter          | Built API across pending/active/suspended fixtures         |
| ADD    | `specs/apps/ose/id-be/behaviours/account/enumeration-resistance.feature` — `AC-ACC-04 Request a public account action`                 | Generic result/log/rate policy for every state              | Real endpoint headers/status/schema and logger sink                          | Built API plus PostgreSQL/Mailpit known/unknown comparison |
| ADD    | `specs/apps/ose/id-be/behaviours/account/password-recovery.feature` — `AC-ACC-05 Reset a forgotten password`                           | Capability/password/security-version/session invalidation   | Atomic SqlKata/Npgsql transaction + Identity password primitives + endpoints | Mailpit recovery, old-password and old-session denial      |
| ADD    | `specs/apps/ose/id-be/behaviours/account/account-sessions.feature` — `AC-ACC-06 Revoke another session`                                | session lifecycle/idempotency                               | Cookie/CSRF/current-account pipeline                                         | Two real sessions across built instances                   |
| ADD    | `specs/apps/ose/id-be/behaviours/account/instance-handoff.feature` — `AC-ACC-07 Complete account actions through different instances`  | shared-state port contract; no process-local repository     | two application hosts over one controlled shared store                       | registration A then verification/sign-in/revoke B          |
| ADD    | `specs/apps/ose/id-be/behaviours/account/local-email.feature` — `AC-ACC-08 Capture and clean verification mail`                        | typed notification/config/local-only policy                 | SMTP adapter wiring with controlled transport boundary                       | real Mailpit 1026/8026, production rejection, cleanup      |
| ADD    | `specs/apps/ose/id-be/behaviours/account/secret-redaction.feature` — `AC-ACC-09 Emit only allowlisted account-operation observability` | allowlist/redaction functions                               | HTTP/log/audit serialization through real host                               | built account operations plus runtime-output secret scan   |
| ADD    | `specs/apps/ose/id-be/behaviours/persistence/account-soft-delete.feature` — `AC-ACC-10 Retire an expired account capability`           | lifecycle command stamps actor/time and excludes tombstones | PostgreSQL proves all account-table envelopes/guards/grants and soft-delete  | built cleanup makes the capability unusable but auditable  |

Binding paths are
`apps/ose-id-be/tests/OseId.Be.Unit/Features/Account/*Steps.cs`,
`apps/ose-id-be/tests/OseId.Be.Integration/Features/Account/*Steps.cs`, and
`apps/ose-id-be-e2e/tests/OseId.Be.E2E/Features/Account/*Steps.cs`.

No account scenario has an Integration or E2E exemption: all cross HTTP, Identity password primitives,
SqlKata/Npgsql, SMTP, built
process, PostgreSQL, or Mailpit boundaries. A later exemption requires a scenario-local canonical
comment/tag with a boundary-based reason and named alternative Unit/higher-layer proof. Difficulty,
runtime, missing implementation, and flakiness are invalid.

## Copy-Ready Scenario Packets

All packets are **ADD** with required Unit, Integration, and E2E bindings and no exemption. Feature
paths below are relative to `specs/apps/ose/id-be/behaviours/account/`.

### AC-ACC-01 — Personal registration

- Action: ADD
- Target: `specs/apps/ose/id-be/behaviours/account/registration.feature`
- Bindings: Unit/Integration/E2E `RegistrationSteps.cs` in the exact adapter roots above.

```gherkin
Feature: Local email account registration
  Rule: A Person can register without a Company

    Scenario: Register a new personal account
      Given no account exists for a synthetic test email
      When a caller submits a policy-compliant email and password
      Then a pending Person is stored without a company or membership
      And the public response is the generic accepted response
      And one verification message is captured by the owned Mailpit instance
```

### AC-ACC-02 — Single-use verification

- Action: ADD
- Target: `specs/apps/ose/id-be/behaviours/account/verification.feature`
- Bindings: each adapter's `VerificationSteps.cs`.

```gherkin
Feature: Email verification
  Rule: A verification capability activates exactly once

    Scenario: Consume a valid verification capability
      Given a pending Person has an unexpired verification capability
      When the capability is submitted concurrently twice
      Then exactly one request activates the account
      And the other receives the documented safe terminal result
      And neither response nor log exposes the capability value
```

### AC-ACC-03 — Verified password sign-in

- Action: ADD
- Target: `specs/apps/ose/id-be/behaviours/account/password-sign-in.feature`
- Bindings: each adapter's `PasswordSignInSteps.cs`.

```gherkin
Feature: Password sign-in
  Rule: Only active verified accounts establish sessions

    Scenario Outline: Attempt password sign-in
      Given the email account is <state>
      When the correct password is submitted
      Then sign-in is <result>

      Examples:
        | state                | result                                  |
        | pending verification | rejected generically                    |
        | active and verified  | accepted with a rotated opaque session  |
        | suspended            | rejected generically                    |
```

### AC-ACC-04 — Enumeration resistance

- Action: ADD
- Target: `specs/apps/ose/id-be/behaviours/account/enumeration-resistance.feature`
- Bindings: each adapter's `EnumerationResistanceSteps.cs`.

```gherkin
Feature: Public account-action privacy
  Rule: Anonymous responses do not reveal account existence

    Scenario Outline: Request a public account action
      Given the submitted email is <kind>
      When a caller requests verification resend or password recovery
      Then the status and response schema equal the generic accepted contract
      And no account existence detail appears in logs, metrics labels, or audit visible to the caller

      Examples:
        | kind      |
        | unknown   |
        | pending   |
        | verified  |
        | suspended |
```

### AC-ACC-05 — Recovery and revocation

- Action: ADD
- Target: `specs/apps/ose/id-be/behaviours/account/password-recovery.feature`
- Bindings: each adapter's `PasswordRecoverySteps.cs`.

```gherkin
Feature: Password recovery
  Rule: Reset is single-use and invalidates prior authentication

    Scenario: Reset a forgotten password
      Given an active account has an unexpired unused recovery capability and two active sessions
      When the capability sets a policy-compliant new password
      Then the capability becomes unusable
      And the previous password no longer signs in
      And every prior session is revoked
      And the new password can establish a fresh session
```

### AC-ACC-06 — Session management

- Action: ADD
- Target: `specs/apps/ose/id-be/behaviours/account/account-sessions.feature`
- Bindings: each adapter's `AccountSessionSteps.cs`.

```gherkin
Feature: Account session management
  Rule: A Person can revoke another session without losing the current one

    Scenario: Revoke another session
      Given an active Person has a current session and another active session
      When the current session revokes the other session
      Then the other opaque cookie is rejected on its next request
      And revoking that session again returns the same safe terminal result
      And the current session remains active
```

### AC-ACC-07 — Instance handoff

- Action: ADD
- Target: `specs/apps/ose/id-be/behaviours/account/instance-handoff.feature`
- Bindings: each adapter's `InstanceHandoffSteps.cs`.

```gherkin
Feature: Stateless account instances
  Rule: Account journeys do not require affinity

    Scenario: Complete account actions through different instances
      Given two backend instances share PostgreSQL and no sticky routing
      When registration starts on instance A and verification and sign-in complete on instance B
      Then one Person and one current account state exist
      And session validation and revocation have identical results on either instance
```

### AC-ACC-08 — Mail remains local

- Action: ADD
- Target: `specs/apps/ose/id-be/behaviours/account/local-email.feature`
- Bindings: each adapter's `LocalEmailSteps.cs`.

```gherkin
Feature: Local account email delivery
  Rule: Local messages never leave the owned Mailpit stack

    Scenario: Capture and clean verification mail
      Given the owned local stack uses the Mailpit notification adapter with no relay
      When registration and recovery send messages
      Then messages are visible only through the loopback Mailpit inbox and API
      And stack cleanup removes the messages and all owned Mailpit resources
      And Production or Staging mode rejects the adapter before serving
```

### AC-ACC-09 — Secret-free observability

- Action: ADD
- Target: `specs/apps/ose/id-be/behaviours/account/secret-redaction.feature`
- Bindings: each adapter's `SecretRedactionSteps.cs`.

```gherkin
Feature: Account secret redaction
  Rule: Account journeys do not leak authentication material

    Scenario Outline: Emit only allowlisted account-operation observability
      Given an account operation receives a synthetic <secret kind>
      When the operation completes with <outcome>
      Then its response contains no submitted secret or stored authentication material
      And its application log event trace attributes and metric labels contain only allowlisted operation outcome timing bucket and correlation fields
      And no plaintext password password hash capability cookie SMTP body or connection secret is emitted

      Examples:
        | secret kind             | outcome                         |
        | registration password   | generic registration acceptance |
        | verification capability | successful capability use       |
        | sign-in password        | invalid credentials             |
        | account session cookie  | authenticated account read      |
        | recovery capability     | unavailable capability          |
```

### AC-ACC-10 — Account soft delete

- Action: ADD
- Target: `specs/apps/ose/id-be/behaviours/persistence/account-soft-delete.feature`
- Bindings: each adapter's `AccountSoftDeleteSteps.cs`.

```gherkin
Feature: Account persistence retirement
  Rule: Terminal account records remain auditable and unusable

    Scenario: Retire an expired account capability
      Given an expired terminal account capability has complete audit metadata
      When the account cleanup worker retires the capability
      Then ordinary capability lookup no longer returns it
      And the row remains stored with matching deletion and update actor and time fields
      And the capability digest cannot authorize an account action
      And a physical delete through the serving role is rejected
```

## Retain and Delete Ledger

Account behavior extends rather than replaces foundation/runtime safety. Retain these exact scenario
and adapter obligations unchanged; every row remains required at Unit, Integration, and E2E:

| Action | Exact target and scenario                                                                                                                        | Unit / Integration / E2E bindings retained                                                                |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| RETAIN | `specs/apps/ose/id-be/behaviours/foundation/local-stack.feature` — `AC-FND-01 Start OSE ID from a clean checkout`                                | `LocalStackPolicySteps.cs` / `LocalStackCompositionSteps.cs` / `LocalStackSteps.cs`                       |
| RETAIN | `specs/apps/ose/id-be/behaviours/foundation/health.feature` — `AC-FND-02 Report PostgreSQL becoming unavailable after startup`                   | `HealthSteps.cs` / `HealthPipelineSteps.cs` / `HealthProcessSteps.cs`                                     |
| RETAIN | `specs/apps/ose/id-be/behaviours/foundation/database-privilege.feature` — `AC-FND-03 Deny a schema change attempted by the application role`     | `DatabasePrivilegeSteps.cs` / `MigrationRoleSteps.cs` / `DatabasePrivilegeProcessSteps.cs`                |
| RETAIN | `specs/apps/ose/id-be/behaviours/foundation/runtime-mode.feature` — `AC-FND-04-BE Reject an unsupported backend runtime mode`                    | `RuntimeModeSteps.cs` / `RuntimeModeHostSteps.cs` / `RuntimeModeProcessSteps.cs`                          |
| RETAIN | `specs/apps/ose/id-web/behaviours/foundation/runtime-mode.feature` — `AC-FND-04-WEB Reject an unsupported web runtime mode`                      | `RuntimeModeSteps.ts` / `RuntimeModeServerSteps.ts` / `runtime-mode.steps.ts`                             |
| RETAIN | `specs/apps/ose/id-be/behaviours/foundation/stateless-instances.feature` — `AC-FND-05 Alternate requests between backend instances`              | `StatelessInstanceSteps.cs` / `SharedStoreHostSteps.cs` / `StatelessInstanceProcessSteps.cs`              |
| RETAIN | `specs/apps/ose/id-be/behaviours/foundation/disabled-capabilities.feature` — `AC-FND-06 Reject a disabled identity capability`                   | `DisabledCapabilitySteps.cs` / `DisabledCapabilityPipelineSteps.cs` / `DisabledCapabilityProcessSteps.cs` |
| RETAIN | `specs/apps/ose/id-web/behaviours/foundation/status-shell.feature` — `AC-FND-07 Read service status without a mouse`                             | `StatusShellSteps.tsx` / `StatusShellServerSteps.ts` / `status-shell.steps.ts`                            |
| RETAIN | `specs/apps/ose/id-be/behaviours/persistence/database-audit-and-soft-delete.feature` — `AC-FND-08 Reject physical deletion of migration history` | `DatabaseAuditSteps.cs` / `DatabaseAuditPostgresSteps.cs` / `DatabaseAuditProcessSteps.cs`                |

DELETE none; no durable scenario or adapter is superseded by this plan.

## Adapter Maps, Coverage, and Validation

- UPDATE `apps/ose-id-be/behaviour-coverage.json` with the recursive account corpus, Unit and Integration adapters.
- UPDATE `apps/ose-id-be-e2e/behaviour-coverage.json` with the same corpus and E2E adapter.
- RETAIN Plan 01 entries and exact-one bindings; DELETE no scenario or adapter.
- `ose-id-be:test:unit` gathers native coverage and enforces **at least 99% Unit line coverage for
  authored production code**, with canonical exclusions only. Any excluded exact
  generated/resource/process-boundary file must have matching
  Integration/E2E proof; broad exclusions are forbidden.
- `test:coverage:unit`, `test:coverage:integration`, `test:coverage:e2e`, and
  `test:coverage:behaviour` validate recursive corpus membership, exactly-one bindings, complete adapters,
  unused/ambiguous steps, and exemption syntax. Every applicable static gate runs in `test:quick`.

## Plan-Only Proof

Worktree setup/recovery, dependency and license verification, port availability, raw RED transcripts,
migration catalog/count/digest manifests, pre-push/CI/PR reviews, rule propagation, knowledge capture,
preliminary/terminal audits, archive move, and worktree/branch cleanup stay only in `delivery.md` and
evidence. Registration, email, session, readiness, non-local rejection, and redaction outcomes are
application-observable and therefore cannot be hidden as plan-only checks.
