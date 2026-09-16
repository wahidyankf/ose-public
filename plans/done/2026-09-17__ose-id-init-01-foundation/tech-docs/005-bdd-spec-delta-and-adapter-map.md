# BDD Spec Delta and Adapter Map

## Durable Spec Delta

These observable behaviors enter the deployed-surface owners. Requirement IDs remain only in this plan's
mapping table and packet headings; copied specs and adapter declarations use durable domain language.
Unit is mandatory; Integration/E2E are mapped because
each listed scenario crosses an in-process host, built process/database, or browser boundary.

| Action | Feature path and scenario ID/name                                                                                                                | Unit obligation                                                                                 | Integration obligation                                                                                             | E2E obligation / exemption                                                                                |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| ADD    | `specs/apps/ose/id-be/behaviours/foundation/local-stack.feature` — `AC-FND-01 Start OSE ID from a clean checkout`                                | `OseId.Be.Unit/Features/Foundation/LocalStackPolicySteps.cs` proves order/cleanup state machine | `OseId.Be.Integration/Features/Foundation/LocalStackCompositionSteps.cs` proves host/runner composition with ports | `OseId.Be.E2E/Features/Foundation/LocalStackSteps.cs` owns built processes/PostgreSQL and final inventory |
| ADD    | `specs/apps/ose/id-be/behaviours/foundation/health.feature` — `AC-FND-02 Report PostgreSQL becoming unavailable after startup`                   | Unit maps dependency states to live/ready codes                                                 | Integration exercises real ASP.NET health pipeline with controlled dependency port                                 | Backend E2E stops/restarts owned PostgreSQL and observes both endpoints                                   |
| ADD    | `specs/apps/ose/id-be/behaviours/foundation/database-privilege.feature` — `AC-FND-03 Deny a schema change attempted by the application role`     | Unit validates the explicit grant/deny manifest                                                 | Integration validates migration/runtime-role configuration wiring without network                                  | Backend E2E uses real PostgreSQL runtime role for DDL denial                                              |
| ADD    | `specs/apps/ose/id-be/behaviours/foundation/runtime-mode.feature` — `AC-FND-04-BE Reject an unsupported backend runtime mode`                    | Unit covers every mode/parser branch                                                            | Integration starts the backend host for allowed/denied mode configuration                                          | Backend E2E proves non-zero exit before listener binding                                                  |
| ADD    | `specs/apps/ose/id-web/behaviours/foundation/runtime-mode.feature` — `AC-FND-04-WEB Reject an unsupported web runtime mode`                      | Web Unit covers mode/config decision                                                            | Web Integration starts Next server boundary with controlled config                                                 | Web E2E proves non-zero/non-serving behavior                                                              |
| ADD    | `specs/apps/ose/id-be/behaviours/foundation/stateless-instances.feature` — `AC-FND-05 Alternate requests between backend instances`              | Unit proves no instance-owned correctness port/state                                            | Integration uses two in-process hosts over one controlled persistence port                                         | Backend E2E alternates two built instances and stops one                                                  |
| ADD    | `specs/apps/ose/id-be/behaviours/foundation/disabled-capabilities.feature` — `AC-FND-06 Reject a disabled identity capability`                   | Unit validates the disabled-capability inventory and no-write policy                            | Integration probes the real ASP.NET pipeline                                                                       | Backend E2E probes every disabled capability and verifies zero identity/authorization writes              |
| ADD    | `specs/apps/ose/id-web/behaviours/foundation/status-shell.feature` — `AC-FND-07 Read service status without a mouse`                             | Web Unit/component adapter proves semantic status rendering                                     | Web Integration proves Next server data/error wiring                                                               | Web E2E owns keyboard, screen reader semantics, and 320px viewport                                        |
| ADD    | `specs/apps/ose/id-be/behaviours/persistence/database-audit-and-soft-delete.feature` — `AC-FND-08 Reject physical deletion of migration history` | Unit proves immutable metadata policy and no hard-delete command path                           | Integration proves columns, constraints, trigger, grants, and rejected SQL `DELETE` in PostgreSQL                  | Backend E2E starts the service, attacks with the serving role, and proves readiness remains valid         |

No scenario has an Integration/E2E exemption in this plan. If an implementation discovers that a
boundary fundamentally cannot express one, amend that exact scenario with the canonical immediately
adjacent `Exemption(integration|e2e): ...; alternative-proof: <target> / <scenario>` comment/tag and add
the exemption to the owner adapter map. Runtime cost, missing code, CI speed, or flakiness is never valid.

## Copy-Ready Scenario Packets

Each packet is an **ADD**. Its three adapter metadata entries are **required, no exemption** and point to
the Unit/Integration/E2E obligations in the index above.

### AC-FND-01 — Local stack startup

- Action: ADD
- Target: `specs/apps/ose/id-be/behaviours/foundation/local-stack.feature`
- Bindings: `LocalStackPolicySteps.cs`, `LocalStackCompositionSteps.cs`, `LocalStackSteps.cs`

```gherkin
Feature: OSE ID local service lifecycle
  Rule: The runner owns dependency order and cleanup

    Scenario: Start OSE ID from a clean checkout
      Given the documented local prerequisites are available and no OSE ID resources are running
      When the developer starts OSE ID locally
      Then PostgreSQL, the migrated backend, and the web shell become ready in dependency order
      And stopping the runner leaves no owned process, container, network, volume, or port reservation
```

### AC-FND-02 — Truthful health

- Action: ADD
- Target: `specs/apps/ose/id-be/behaviours/foundation/health.feature`
- Bindings: Unit `HealthSteps.cs`; Integration `HealthPipelineSteps.cs`; E2E `HealthProcessSteps.cs`

```gherkin
Feature: OSE ID health
  Rule: Liveness is independent from dependency readiness

    Scenario: Report PostgreSQL becoming unavailable after startup
      Given the local backend is live and ready
      When its owned PostgreSQL dependency is stopped
      Then liveness remains successful
      And readiness becomes unsuccessful with a stable database component code
      And no secret or connection detail is returned
```

### AC-FND-03 — Database privilege

- Action: ADD
- Target: `specs/apps/ose/id-be/behaviours/foundation/database-privilege.feature`
- Bindings: Unit `DatabasePrivilegeSteps.cs`; Integration `MigrationRoleSteps.cs`; E2E `DatabasePrivilegeProcessSteps.cs`

```gherkin
Feature: OSE ID database privilege separation
  Rule: The serving role cannot change schema

    Scenario: Deny a schema change attempted by the application role
      Given the migration role has applied the current empty OSE ID schema
      When the application role attempts to create or alter a table
      Then PostgreSQL denies the operation
      And the application role can execute only the granted runtime health query
```

### AC-FND-04-BE — Backend runtime guard

- Action: ADD
- Target: `specs/apps/ose/id-be/behaviours/foundation/runtime-mode.feature`
- Bindings: Unit `RuntimeModeSteps.cs`; Integration `RuntimeModeHostSteps.cs`; E2E `RuntimeModeProcessSteps.cs`

```gherkin
Feature: OSE ID backend runtime mode guard
  Rule: Backend serving is disabled outside Local or Test

    Scenario Outline: Reject an unsupported backend runtime mode
      Given the backend runtime mode is <mode>
      When the backend process starts
      Then startup exits non-zero before serving the application
      And the diagnostic returns the stable runtime-mode-disabled code

      Examples:
        | mode       |
        | Staging    |
        | Production |
        | missing    |
        | unknown    |
```

### AC-FND-04-WEB — Web runtime guard

- Action: ADD
- Target: `specs/apps/ose/id-web/behaviours/foundation/runtime-mode.feature`
- Bindings: web Unit `RuntimeModeSteps.ts`; Integration `RuntimeModeServerSteps.ts`; E2E `runtime-mode.steps.ts`

```gherkin
Feature: OSE ID web runtime mode guard
  Rule: Web serving is disabled outside Local or Test

    Scenario Outline: Reject an unsupported web runtime mode
      Given the web runtime mode is <mode>
      When the web process starts
      Then startup exits non-zero before serving the application
      And the diagnostic returns the stable runtime-mode-disabled code

      Examples:
        | mode       |
        | Staging    |
        | Production |
        | missing    |
        | unknown    |
```

### AC-FND-05 — Stateless instances

- Action: ADD
- Target: `specs/apps/ose/id-be/behaviours/foundation/stateless-instances.feature`
- Bindings: Unit `StatelessInstanceSteps.cs`; Integration `SharedStoreHostSteps.cs`; E2E `StatelessInstanceProcessSteps.cs`

```gherkin
Feature: OSE ID stateless backend instances
  Rule: Correctness does not depend on affinity

    Scenario: Alternate requests between backend instances
      Given two backend instances share the same PostgreSQL schema and immutable configuration
      When health and database-backed diagnostic requests alternate between the instances
      Then every response is consistent with the shared dependency state
      And stopping either instance does not change the surviving instance's correctness
```

### AC-FND-06 — Disabled identity capabilities

- Action: ADD
- Target: `specs/apps/ose/id-be/behaviours/foundation/disabled-capabilities.feature`
- Bindings: Unit `DisabledCapabilitySteps.cs`; Integration `DisabledCapabilityPipelineSteps.cs`; E2E `DisabledCapabilityProcessSteps.cs`

```gherkin
Feature: Disabled OSE ID capabilities
  Rule: Unsupported identity capabilities fail closed without persistent changes

    Scenario Outline: Reject a disabled identity capability
      Given OSE ID is ready with <capability> disabled
      When a client requests <method> <path>
      Then the response status is 404 with the stable capability-disabled problem code
      And no identity or authorization record is created

      Examples:
        | capability                  | method | path                       |
        | OIDC authorization          | GET    | /connect/authorize         |
        | OAuth token issuance        | POST   | /connect/token             |
        | external-provider sign-in   | GET    | /external/google/challenge |
        | SCIM user provisioning      | POST   | /scim/v2/Users             |
        | platform administration     | GET    | /platform/admin/companies  |
```

### AC-FND-07 — Accessible status shell

- Action: ADD
- Target: `specs/apps/ose/id-web/behaviours/foundation/status-shell.feature`
- Bindings: web Unit `StatusShellSteps.tsx`; Integration `StatusShellServerSteps.ts`; E2E `status-shell.steps.ts`

```gherkin
Feature: OSE ID service status
  Rule: Service status is accessible without a mouse or color perception

    Scenario: Read service status without a mouse
      Given the OSE ID web shell is running at a 320 pixel viewport
      When a keyboard and screen-reader user reviews its status
      Then the page has one descriptive heading and named status region
      And status is conveyed by text rather than color alone
```

### AC-FND-08 — Auditable immutable metadata

- Action: ADD
- Target: `specs/apps/ose/id-be/behaviours/persistence/database-audit-and-soft-delete.feature`
- Bindings: Unit `DatabaseAuditSteps.cs`; Integration `DatabaseAuditPostgresSteps.cs`; E2E `DatabaseAuditProcessSteps.cs`

```gherkin
Feature: OSE ID database record lifecycle
  Rule: Migration history remains attributable and cannot be physically deleted

    Scenario: Reject physical deletion of migration history
      Given the migrated OSE ID database contains an active migration-history record
      When the serving role attempts to physically delete that record
      Then PostgreSQL rejects the operation
      And the record remains stored with all six audit columns
      And an ordinary readiness check still sees the active migration state
```

## Retain and Delete Ledger

- RETAIN: none; Plan 01 creates the owner corpora.
- DELETE: none; no predecessor OSE ID behavior exists.

## Exact Adapter-Map Files and Static Gates

- `apps/ose-id-be/behaviour-coverage.json`: recursive backend corpus plus Unit/Integration binding globs.
- `apps/ose-id-be-e2e/behaviour-coverage.json`: same backend corpus plus E2E bindings/exemptions.
- `apps/ose-id-web/behaviour-coverage.json`: recursive web corpus plus Unit/Integration bindings.
- `apps/ose-id-web-e2e/behaviour-coverage.json`: same web corpus plus E2E bindings/exemptions.
- Source-owner `test:unit` collects native coverage and enforces **at least 99% Unit line coverage for
  authored production code**, with canonical exclusions only. Any excluded exact
  generated/resource/process-boundary file must be named in config and
  proven by Integration/E2E; no broad glob or mixed logic exclusion.
- `test:coverage:unit`, `:integration`, `:e2e`, and `:behaviour` statically enforce recursive corpus,
  exactly-one bindings, unused/ambiguous steps, complete adapters, and valid scenario-local exemptions.
  Every applicable static target runs inside source-owner `test:quick`.

## Plan-Only Proof That Does Not Enter Gherkin

Worktree provisioning/recovery, dependency installation, CI polling, exact-head PR/leak/semantic review,
license evidence, migration catalog/no-loss evidence, rules propagation, preliminary/terminal audits,
plan archival, branch/worktree cleanup, and knowledge triage remain in `delivery.md`. They are delivery
mechanics rather than stable application behavior. Migration/readiness/privilege effects themselves are
observable and therefore remain in the foundation specs; only evidence collection and lifecycle bookkeeping stay plan-only.
