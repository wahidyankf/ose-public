# BDD Spec Delta and Adapter Map

## Durable Tenancy Spec Delta

Plan 01 foundation and Plan 02 account scenarios/adapters are **RETAINED**. This plan adds only backend
tenancy behavior under `specs/apps/ose/id-be/behaviours/tenancy/`.

| Action | Feature path and scenario ID/name                                                                                                                              | Unit binding obligation                             | Integration binding obligation                             | Backend E2E binding obligation                             |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------- |
| ADD    | `specs/apps/ose/id-be/behaviours/tenancy/personal-context.feature` — `AC-TEN-01 Evaluate a personal-only eligible user`                                        | discriminated context and no-company invariant      | application/query-builder/endpoint composition             | built API/PostgreSQL proves zero Company rows              |
| ADD    | `specs/apps/ose/id-be/behaviours/tenancy/personal-context.feature` — `AC-TEN-02 Evaluate a company-required resource for a companyless Person`                 | resource-policy rejection                           | endpoint safe result and repositories                      | built API proves no synthetic membership/company           |
| ADD    | `specs/apps/ose/id-be/behaviours/tenancy/multi-company-context.feature` — `AC-TEN-03 Resolve separate company contexts`                                        | eligibility and one-selection policy                | transaction/repository/API mapping                         | real A/B rows and separate selections                      |
| ADD    | `specs/apps/ose/id-be/behaviours/tenancy/multi-company-context.feature` — `AC-TEN-03 Refuse to truncate an oversized context set`                              | bounded-enumeration policy                          | SqlKata/Npgsql query and safe error mapping                | built API/PostgreSQL proves stable overflow failure        |
| ADD    | `specs/apps/ose/id-be/behaviours/tenancy/invitations.feature` — `AC-TEN-04 Manage a company invitation lifecycle without exposing capabilities`                | projection, lifecycle, and capability redaction     | authorized endpoints and serializer                        | built create/list/resend/revoke API plus response/log scan |
| ADD    | `specs/apps/ose/id-be/behaviours/tenancy/invitations.feature` — `AC-TEN-04 Accept a company invitation concurrently`                                           | state/capability/idempotency                        | notification + atomic SqlKata/Npgsql transaction           | built concurrent API/PostgreSQL/Mailpit                    |
| ADD    | `specs/apps/ose/id-be/behaviours/tenancy/membership-admin.feature` — `AC-TEN-05 Filter and page recognizable members within one company`                       | query normalization, order, and cursor binding      | indexed joined projection and cursor codec                 | multi-page own/foreign-company and cursor misuse probes    |
| ADD    | `specs/apps/ose/id-be/behaviours/tenancy/membership-admin.feature` — `AC-TEN-05 List and update recognizable members without exposing private identity fields` | projection allowlist, transition, and authorization | real ASP.NET/SqlKata joined query and mutation             | built list/patch API plus response/log scan                |
| ADD    | `specs/apps/ose/id-be/behaviours/tenancy/membership-admin.feature` — `AC-TEN-05 Reject a Company A administrator using a Company B member identifier`          | authority/non-disclosure policy                     | real ASP.NET/Npgsql transaction setup                      | built API plus real RLS denial                             |
| ADD    | `specs/apps/ose/id-be/behaviours/tenancy/membership-admin.feature` — `AC-TEN-05 Leave one company without affecting another membership`                        | ownership and independent membership lifecycle      | authenticated conditional transition                       | built leave API with two real company memberships          |
| ADD    | `specs/apps/ose/id-be/behaviours/tenancy/membership-admin.feature` — `AC-TEN-06 Concurrently attempt to remove the final membership administrator`             | last-admin transition invariant                     | optimistic/transaction conflict mapping                    | concurrent built requests and final DB state               |
| ADD    | `specs/apps/ose/id-be/behaviours/tenancy/product-entitlements.feature` — `AC-TEN-07 List company product-entry entitlements`                                   | tenant-safe entry projection                        | repository/API serialization                               | real selected-company list and forbidden-field inspection  |
| ADD    | `specs/apps/ose/id-be/behaviours/tenancy/product-entitlements.feature` — `AC-TEN-07 Grant company access to the LMS fixture`                                   | entry entitlement contains no domain role           | conditional grant and serialization                        | real grant plus eligibility and forbidden-field inspection |
| ADD    | `specs/apps/ose/id-be/behaviours/tenancy/product-entitlements.feature` — `AC-TEN-07 Revoke company access to the LMS fixture`                                  | terminal revoke and context invalidation            | conditional revoke and serialization                       | real revoke plus fresh eligibility denial                  |
| ADD    | `specs/apps/ose/id-be/behaviours/tenancy/row-level-security.feature` — `AC-TEN-08 Query a tenant-owned table with an invalid database context`                 | explicit policy/operation matrix definition         | Npgsql transaction-context wiring                          | real PostgreSQL role across every table/operation/context  |
| ADD    | `specs/apps/ose/id-be/behaviours/tenancy/row-level-security.feature` — `AC-TEN-09 Reuse one pooled connection across companies`                                | context lifecycle has transaction scope             | controlled Npgsql pool/transaction integration             | physical connection A→B→personal proof                     |
| ADD    | `specs/apps/ose/id-be/behaviours/tenancy/context-revocation.feature` — `AC-TEN-10 Re-evaluate after access is revoked`                                         | membership/company/entitlement version consequences | atomic mutation/evaluation pipeline                        | built fresh evaluation after each persisted revocation     |
| ADD    | `specs/apps/ose/id-be/behaviours/tenancy/multi-instance-context.feature` — `AC-TEN-11 Evaluate and select through different backend instances`                 | shared-store port contract                          | two hosts over one controlled persistence adapter          | list on A, validate on B, stop A, reject stale context     |
| ADD    | `specs/apps/ose/id-be/behaviours/persistence/tenancy-soft-delete.feature` — `AC-TEN-12 Retire an expired company invitation`                                   | cleanup actor/time and tombstone policy             | all tenancy-table envelopes/guards/grants plus soft-delete | built cleanup retains unusable attributed invitation       |

Binding paths are exactly `apps/ose-id-be/tests/OseId.Be.Unit/Features/Tenancy/*Steps.cs`,
`apps/ose-id-be/tests/OseId.Be.Integration/Features/Tenancy/*Steps.cs`, and
`apps/ose-id-be-e2e/tests/OseId.Be.E2E/Features/Tenancy/*Steps.cs`.

No exemption applies: even RLS/pooling scenarios retain Unit proof for policy/context decisions,
Integration for Npgsql/application composition, and E2E for the real PostgreSQL boundary. Any future
exemption must be attached to the exact scenario with canonical `Exemption(integration|e2e)` comment/tag,
a fundamental boundary reason, and named alternative proof; cost, speed, difficulty, or flakiness is invalid.

## Copy-Ready Scenario Packets

### AC-TEN-01 — Personal-only context

- **Action:** ADD
- **Target:** `specs/apps/ose/id-be/behaviours/tenancy/personal-context.feature`
- **Bindings:** `PersonalContextSteps.cs` in the Unit, Integration, and backend E2E tenancy feature directories.
- **Exemptions:** none.

```gherkin
Feature: Personal authorization context
  A companyless Person can enter a product through an explicit personal context
  without the identity service inventing a tenant.

  Rule: Personal eligibility never creates company state

    Scenario: Evaluate a personal-only eligible user
      Given a verified active Person has no memberships and has an active personal LMS fixture entitlement
      When the Person requests eligible contexts for the LMS fixture resource
      Then exactly one personal context is returned
      And the context has no company identifier
      And no Company or Membership row is created
```

### AC-TEN-02 — Company-required resource

- **Action:** ADD
- **Target:** `specs/apps/ose/id-be/behaviours/tenancy/personal-context.feature`
- **Bindings:** `PersonalContextSteps.cs` in the Unit, Integration, and backend E2E tenancy feature directories.
- **Exemptions:** none.

```gherkin
Feature: Personal authorization context
  Product policy determines whether a companyless Person may use a personal context.

  Rule: Company-required products reject companyless access without synthesizing a tenant

    Scenario: Evaluate a company-required resource for a companyless Person
      Given a verified active Person has no memberships
      And the resource allows only company context
      When eligible contexts are evaluated
      Then no eligible context is returned with the documented safe reason
      And the system does not create a synthetic company
```

### AC-TEN-03 — Multiple independent companies

- **Action:** ADD
- **Target:** `specs/apps/ose/id-be/behaviours/tenancy/multi-company-context.feature`
- **Bindings:** `MultiCompanyContextSteps.cs` in the Unit, Integration, and backend E2E tenancy feature directories.
- **Exemptions:** none.

#### AC-TEN-03 — Resolve separate company contexts

```gherkin
Feature: Multi-company authorization context
  A Person may be eligible in multiple companies while every selected context remains tenant-specific.

  Rule: A selected company context represents exactly one company

    Scenario: Resolve separate company contexts
      Given a Person is an active entitled member of Company A and Company B
      When eligible contexts are evaluated for a resource that accepts company context
      Then Company A and Company B appear as separate eligible choices
      And selecting Company A returns only Company A context
      And no result represents both companies
```

#### AC-TEN-03 — Refuse to truncate an oversized context set

```gherkin
Scenario: Refuse to truncate an oversized context set
  Given a Person has 101 eligible company contexts for one resource
  When eligible contexts are evaluated for that resource
  Then the request fails with the stable reason "context_limit_exceeded"
  And no partial context list or continuation is returned
```

### AC-TEN-04 — Invitation administration and concurrent acceptance

- **Action:** ADD
- **Target:** `specs/apps/ose/id-be/behaviours/tenancy/invitations.feature`
- **Bindings:** `InvitationSteps.cs` in the Unit, Integration, and backend E2E tenancy feature directories.
- **Exemptions:** none.

```gherkin
Feature: Company invitations
  Company administrators manage invitations, and a verified Person can consume one exactly once.

  Rule: Administration is tenant-bound and capability consumption is identity-bound and atomic

    Scenario: Manage a company invitation lifecycle without exposing capabilities
      Given a Person is MembershipAdmin in Company A
      When the Person creates, lists, resends, and revokes an invitation for "invitee@example.test"
      Then every administrative result identifies the invitation by recipient email
      And the resend invalidates the previous capability
      And the revoke prevents either capability from creating a membership
      And no result contains a capability, provider subject, login identifier, or credential field
      And the same Person cannot manage invitations from an unauthorized company

    Scenario: Accept a company invitation concurrently
      Given an unexpired invitation targets an email verified by the authenticated Person
      When the invitation capability is submitted concurrently twice
      Then exactly one active Membership is created in the intended company
      And the other request receives the documented idempotent terminal result
      And the capability cannot create membership for another Person or Company
```

### AC-TEN-05 — Recognizable tenant-bound administration

- **Action:** ADD
- **Target:** `specs/apps/ose/id-be/behaviours/tenancy/membership-admin.feature`
- **Bindings:** `MembershipAdminSteps.cs` in the Unit, Integration, and backend E2E tenancy feature directories.
- **Exemptions:** none.

```gherkin
Feature: Tenant-bound membership administration
  Membership administrators can act only inside their current authorized company.

  Rule: Cross-company identifiers disclose and mutate nothing

    Scenario: Filter and page recognizable members within one company
      Given a Person is MembershipAdmin in Company A
      And Company A and Company B have distinct members with the same verified-email prefix
      When the Person pages Company A members with that prefix and a limit of one
      Then only matching Company A members appear in normalized-email and membership-ID order
      And every next cursor continues that exact company, prefix, and order
      And reusing a cursor with Company B or another prefix is rejected without disclosure

    Scenario: List and update recognizable members without exposing private identity fields
      Given a Person is MembershipAdmin in Company A
      And Company A has an active member with verified email "member@example.test"
      When the Person lists, suspends, and reactivates that Company A member
      Then the result identifies the member by verified contact email
      And the result contains no provider subject, login identifier, credential, or session field
      And the verified contact email is absent from logs, traces, metrics, and audit payloads

    Scenario: Leave one company without affecting another membership
      Given a Person has active memberships in Company A and Company B
      When the Person leaves the Company A membership with its current row version
      Then the Company A membership is left
      And the Company B membership remains active
      And no administrator can use the leave operation for another Person

    Scenario: Reject a Company A administrator using a Company B member identifier
      Given a Person is MembershipAdmin in Company A and an ordinary member in Company B
      When the Person uses Company A context to read or mutate the Company B member identifier
      Then the operation is denied without disclosing Company B ownership
      And no Company B row or audit payload is changed
```

### AC-TEN-06 — Last administrator safety

- **Action:** ADD
- **Target:** `specs/apps/ose/id-be/behaviours/tenancy/membership-admin.feature`
- **Bindings:** `MembershipAdminSteps.cs` in the Unit, Integration, and backend E2E tenancy feature directories.
- **Exemptions:** none.

```gherkin
Feature: Tenant-bound membership administration
  A company always retains an active administrator unless authority is transferred safely.

  Rule: Concurrent mutations cannot remove the final active MembershipAdmin

    Scenario: Concurrently attempt to remove the final membership administrator
      Given a company has exactly one active MembershipAdmin
      When concurrent requests suspend that membership and downgrade its authority
      Then both operations cannot commit a state with zero active MembershipAdmin
      And at least one safe conflict result identifies the required transfer action
```

### AC-TEN-07 — Entry entitlement boundary

- **Action:** ADD
- **Target:** `specs/apps/ose/id-be/behaviours/tenancy/product-entitlements.feature`
- **Bindings:** `ProductEntitlementSteps.cs` in the Unit, Integration, and backend E2E tenancy feature directories.
- **Exemptions:** none.

```gherkin
Feature: Product entry entitlements
  OSE ID records product-entry eligibility without owning product-domain roles.

  Rule: Company entitlement contains no LMS role or permission

    Scenario: List company product-entry entitlements
      Given a MembershipAdmin acts in Company A
      And Company A has an active LMS fixture product entitlement
      When the admin lists Company A product entitlements
      Then the LMS fixture entry entitlement is returned for Company A only
      And no learner, instructor, course, or product-domain role is returned

    Scenario: Grant company access to the LMS fixture
      Given a MembershipAdmin acts in Company A
      When the admin grants the LMS fixture product entitlement
      Then active Company A members may become eligible for Company A LMS context
      And no learner, instructor, course, or product-domain role is stored or returned by OSE ID

    Scenario: Revoke company access to the LMS fixture
      Given Company A has an active LMS fixture product entitlement
      And a MembershipAdmin acts in Company A
      When the admin revokes the LMS fixture product entitlement
      Then active Company A members are no longer eligible for Company A LMS context
      And repeating the revoke changes no additional state
```

### AC-TEN-08 — RLS invalid-context matrix

- **Action:** ADD
- **Target:** `specs/apps/ose/id-be/behaviours/tenancy/row-level-security.feature`
- **Bindings:** `RowLevelSecuritySteps.cs` in the Unit, Integration, and backend E2E tenancy feature directories.
- **Exemptions:** none.

```gherkin
Feature: Tenant row-level security
  The unprivileged runtime role cannot observe or mutate tenant rows outside its transaction context.

  Rule: Missing, wrong, and stale contexts fail closed for every tenant operation

    Scenario Outline: Query a tenant-owned table with an invalid database context
      Given Company A and Company B contain distinct rows
      And the unprivileged runtime role uses <context>
      When a query attempts to read, write, join, or soft-delete Company B rows
      Then PostgreSQL returns no Company B data and performs no Company B mutation

      Examples:
        | context                    |
        | Company A                  |
        | no company                 |
        | stale Company B membership |
```

### AC-TEN-09 — Pooled connection isolation

- **Action:** ADD
- **Target:** `specs/apps/ose/id-be/behaviours/tenancy/row-level-security.feature`
- **Bindings:** `RowLevelSecuritySteps.cs` in the Unit, Integration, and backend E2E tenancy feature directories.
- **Exemptions:** none.

```gherkin
Feature: Tenant row-level security
  Tenant context is transaction-local and never survives connection-pool reuse.

  Rule: Every transaction starts without inherited tenant state

    Scenario: Reuse one pooled connection across companies
      Given one connection serves a Company A transaction and returns to the pool
      When the same physical connection next serves Company B and then a personal request
      Then each transaction observes only its explicitly set context
      And no Company A or Company B context survives transaction completion
```

### AC-TEN-10 — Fresh authorization after revocation

- **Action:** ADD
- **Target:** `specs/apps/ose/id-be/behaviours/tenancy/context-revocation.feature`
- **Bindings:** `ContextRevocationSteps.cs` in the Unit, Integration, and backend E2E tenancy feature directories.
- **Exemptions:** none.

```gherkin
Feature: Authorization-context revocation
  Every new context evaluation uses current membership, company, and entitlement state.

  Rule: Revoked access disappears before the next evaluation succeeds

    Scenario Outline: Re-evaluate after access is revoked
      Given a Person previously had an eligible Company A context
      When <change> occurs before the next evaluation
      Then Company A is no longer eligible
      And the stored security or authorization version signals later sessions and grants to reauthorize

      Examples:
        | change                         |
        | membership is suspended        |
        | company is suspended           |
        | product entitlement is revoked |
```

### AC-TEN-11 — Multi-instance context handoff

- **Action:** ADD
- **Target:** `specs/apps/ose/id-be/behaviours/tenancy/multi-instance-context.feature`
- **Bindings:** `MultiInstanceContextSteps.cs` in the Unit, Integration, and backend E2E tenancy feature directories.
- **Exemptions:** none.

```gherkin
Feature: Stateless multi-instance authorization context
  Any healthy backend instance can validate a selection from shared durable state.

  Rule: Authorization context never depends on process memory or affinity

    Scenario: Evaluate and select through different backend instances
      Given two instances share PostgreSQL without affinity
      When instance A lists eligible personal and company contexts and instance B validates one selection
      Then instance B uses current database state rather than instance A memory
      And stopping instance A cannot preserve a stale or unauthorized context
```

### AC-TEN-12 — Tenancy soft delete

- **Action:** ADD.
- **Target:** `specs/apps/ose/id-be/behaviours/persistence/tenancy-soft-delete.feature`.
- **Bindings:** `TenancySoftDeleteSteps.cs` in Unit, Integration, and E2E adapter roots.
- **Exemptions:** none.

```gherkin
Feature: Tenancy persistence retirement
  Rule: Terminal company records remain auditable and unusable

    Scenario: Retire an expired company invitation
      Given an expired terminal invitation belongs to a company and has complete audit metadata
      When the invitation cleanup worker retires it as an identified system actor
      Then ordinary invitation lookup no longer returns it
      And the retained row records matching deletion and update actor and time fields
      And its capability digest cannot create a membership
      And the serving role cannot physically delete it
```

## Retained and Deleted Scenarios

Tenancy must not weaken foundation/account behavior. The following exact scenarios and all three
adapter obligations remain in the maps. The binding triplets are Unit / Integration / E2E:

| Action | Exact target and scenario                                                                                                                        | Binding triplet retained                                                                                  |
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
| RETAIN | `specs/apps/ose/id-be/behaviours/account/registration.feature` — `AC-ACC-01 Register a new personal account`                                     | Unit / Integration / E2E `RegistrationSteps.cs`                                                           |
| RETAIN | `specs/apps/ose/id-be/behaviours/account/verification.feature` — `AC-ACC-02 Consume a valid verification capability`                             | Unit / Integration / E2E `VerificationSteps.cs`                                                           |
| RETAIN | `specs/apps/ose/id-be/behaviours/account/password-sign-in.feature` — `AC-ACC-03 Attempt password sign-in`                                        | Unit / Integration / E2E `PasswordSignInSteps.cs`                                                         |
| RETAIN | `specs/apps/ose/id-be/behaviours/account/enumeration-resistance.feature` — `AC-ACC-04 Request a public account action`                           | Unit / Integration / E2E `EnumerationResistanceSteps.cs`                                                  |
| RETAIN | `specs/apps/ose/id-be/behaviours/account/password-recovery.feature` — `AC-ACC-05 Reset a forgotten password`                                     | Unit / Integration / E2E `PasswordRecoverySteps.cs`                                                       |
| RETAIN | `specs/apps/ose/id-be/behaviours/account/account-sessions.feature` — `AC-ACC-06 Revoke another session`                                          | Unit / Integration / E2E `AccountSessionSteps.cs`                                                         |
| RETAIN | `specs/apps/ose/id-be/behaviours/account/instance-handoff.feature` — `AC-ACC-07 Complete account actions through different instances`            | Unit / Integration / E2E `InstanceHandoffSteps.cs`                                                        |
| RETAIN | `specs/apps/ose/id-be/behaviours/account/local-email.feature` — `AC-ACC-08 Capture and clean verification mail`                                  | Unit / Integration / E2E `LocalEmailSteps.cs`                                                             |
| RETAIN | `specs/apps/ose/id-be/behaviours/account/secret-redaction.feature` — `AC-ACC-09 Inspect a complete failed and successful journey`                | Unit / Integration / E2E `SecretRedactionSteps.cs`                                                        |
| RETAIN | `specs/apps/ose/id-be/behaviours/persistence/account-soft-delete.feature` — `AC-ACC-10 Retire an expired account capability`                     | Unit / Integration / E2E `AccountSoftDeleteSteps.cs`                                                      |

DELETE none; this additive slice supersedes no durable scenario or adapter.

## Adapter-Map Delta and Coverage

- UPDATE `apps/ose-id-be/behaviour-coverage.json` with recursive tenancy corpus plus Unit/Integration bindings.
- UPDATE `apps/ose-id-be-e2e/behaviour-coverage.json` with that corpus plus E2E bindings.
- RETAIN all foundation/account scenario and adapter entries; DELETE none.
- `ose-id-be:test:unit` enforces **at least 99% Unit line coverage for authored production code**, with
  canonical exclusions only. Exact wholly generated/resource/process-boundary files with substantive
  Integration/E2E proof may leave the
  denominator; broad/mixed-logic exclusions are forbidden.
- Static `test:coverage:unit`, `:integration`, `:e2e`, and `:behaviour` prove recursive corpus closure,
  exactly-one bindings, all applicable adapters, no unused/ambiguous steps, and valid exemptions. They
  run through source-owner `test:quick`; complete Integration/E2E runtime runs separately.

## Plan-Only Proof

Worktree provisioning/recovery, dependency/license/port checks, migration catalog and no-loss digests,
rules propagation, CI/exact-head/leak/semantic review, knowledge capture, preliminary/terminal audit,
archive/index moves, and cleanup remain in `delivery.md` and evidence. Company, membership, invitation,
entitlement, context, RLS denial, pooling, revocation, and instance-handoff outcomes remain durable
specs because clients/operators can observe them through supported APIs or database security behavior.
