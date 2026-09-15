# 005 — BDD Spec Delta and Adapter Map

## Durable Observable Spec Changes

Phase 0 reconciles these proposed `[N]` paths before RED:
`specs/apps/ose/id-be/behaviours/local-runtime/local-scale-and-composition.feature` and
`specs/apps/ose/id-web/behaviours/local-runtime/local-scale-and-composition.feature`. Every `ADD` requires Unit (`U`),
Integration (`I`), and E2E (`E`) adapters.

| Action | AC / scenario                                                                      | Exact target feature                                                                 | U        | I        | E        | Exemption |
| ------ | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | -------- | -------- | -------- | --------- |
| ADD    | AC-SCALE-01 — Complete authorization after instance replacement                    | `specs/apps/ose/id-be/behaviours/local-runtime/local-scale-and-composition.feature`  | required | required | required | none      |
| ADD    | AC-SCALE-02 — Share protection and signing keys                                    | `specs/apps/ose/id-be/behaviours/local-runtime/local-scale-and-composition.feature`  | required | required | required | none      |
| ADD    | AC-SCALE-03 — Complete a representative journey without affinity                   | `specs/apps/ose/id-web/behaviours/local-runtime/local-scale-and-composition.feature` | required | required | required | none      |
| ADD    | AC-STACK-01 — Start a deterministic complete stack                                 | `specs/apps/ose/id-be/behaviours/local-runtime/local-scale-and-composition.feature`  | required | required | required | none      |
| ADD    | AC-STACK-02 — Fail at the first unready dependency                                 | `specs/apps/ose/id-be/behaviours/local-runtime/local-scale-and-composition.feature`  | required | required | required | none      |
| ADD    | AC-STACK-03 — Clean every exit path                                                | `specs/apps/ose/id-be/behaviours/local-runtime/local-scale-and-composition.feature`  | required | required | required | none      |
| ADD    | AC-STACK-04 — Isolate concurrent ownership manifests                               | `specs/apps/ose/id-be/behaviours/local-runtime/local-scale-and-composition.feature`  | required | required | required | none      |
| ADD    | RUNNER-READY-01 — Publish one schema-valid ready descriptor                        | `specs/apps/ose/id-be/behaviours/local-runtime/local-scale-and-composition.feature`  | required | required | required | none      |
| ADD    | RUNNER-READY-02 — Fail without publishing a partial public descriptor              | `specs/apps/ose/id-be/behaviours/local-runtime/local-scale-and-composition.feature`  | required | required | required | none      |
| ADD    | AC-COMPOSE-01 — Compose a dependent application                                    | `specs/apps/ose/id-web/behaviours/local-runtime/local-scale-and-composition.feature` | required | required | required | none      |
| ADD    | AC-COMPOSE-02 — Reject fallback identity                                           | `specs/apps/ose/id-web/behaviours/local-runtime/local-scale-and-composition.feature` | required | required | required | none      |
| ADD    | RUNNER-VERSION-01 — Negotiate the highest mutually supported runner contract minor | `specs/apps/ose/id-web/behaviours/local-runtime/local-scale-and-composition.feature` | required | required | required | none      |
| ADD    | RUNNER-VERSION-02 — Reject an unsupported local runner contract before mutation    | `specs/apps/ose/id-web/behaviours/local-runtime/local-scale-and-composition.feature` | required | required | required | none      |
| ADD    | AC-BOUNDARY-01 — Reject non-local operation                                        | `specs/apps/ose/id-be/behaviours/local-runtime/local-scale-and-composition.feature`  | required | required | required | none      |
| ADD    | AC-AUDIT-01 — Verify every identity table rejects physical deletion                | `specs/apps/ose/id-be/behaviours/persistence/complete-audit-contract.feature`        | required | required | required | none      |

## Copy-Ready Scenario Packets

Every packet is `ADD`. The map above owns exact targets and plan traceability; copy-ready Gherkin is
application-scoped. All have required Unit, Integration, and E2E adapters and no exemption.

**Action/path:** ADD the following packet to
`specs/apps/ose/id-be/behaviours/local-runtime/local-scale-and-composition.feature`.

```gherkin
Feature: OSE ID local scale and runner behavior
  Rule: No process instance owns correctness state

    Scenario: Complete authorization after instance replacement
      Given authorization starts through backend A and its correlation is persisted in shared state
      When backend A stops and the callback and token request reach backend B
      Then the authorization completes exactly once
      And no affinity cookie or instance-local correctness state is required

    Scenario: Share protection and signing keys
      Given backend A and backend B use the same declared key generation
      When either instance protects or signs an artifact
      Then the other instance can unprotect or validate it within the overlap policy
      And divergent key configuration fails readiness

    Scenario: Start a deterministic complete stack
      Given a valid unique stack ID and the declared loopback ports are unclaimed
      When the owning runner starts the local identity stack
      Then PostgreSQL Mailpit fake Google two backends two webs and proxies become ready in dependency order
      And a sanitized public consumer descriptor is emitted

    Scenario: Fail at the first unready dependency
      Given one required owned dependency cannot become ready
      When the owning runner starts the local identity stack
      Then the runner reports that dependency with a non-secret diagnostic
      And later services do not report false readiness

  Rule: Readiness is an atomic validated parent-child contract

    Scenario: Publish one schema-valid ready descriptor
      Given every owned dependency and both identity instances are healthy
      And the public and private descriptor destinations are validated and empty
      When the child publishes readiness on the inherited control channel
      Then exactly one ready message names the matching stack and descriptor paths
      And the atomically written public descriptor matches its schema and the live public endpoints
      And no credential capability private path or topology identity appears in public evidence

    Scenario: Fail without publishing a partial public descriptor
      Given one owned dependency fails before full-stack readiness
      When the child reports the stable failure on the inherited control channel
      Then no ready message or partial public descriptor is observable
      And the failure preserves a non-secret diagnostic and the primary exit status

  Rule: Cleanup is complete and ownership-scoped

    Scenario Outline: Clean every exit path
      Given the owned stack is running
      When the runner exits by <cause>
      Then every resource in its ownership manifest is removed
      And no fixed port process container network volume or temporary secret remains
      Examples:
        | cause |
        | success |
        | test failure |
        | child crash |
        | interrupt |

    Scenario: Isolate concurrent ownership manifests
      Given two stacks have different valid stack IDs and non-conflicting declared port maps
      When the first stack cleans up
      Then only the first ownership manifest resources are removed
      And the second stack remains ready

    Scenario: Reject non-local operation
      Given the runtime mode is neither Local nor Test or the local bind address is not loopback
      When OSE ID starts
      Then startup fails closed before readiness
      And no public listener becomes ready or external endpoint is contacted
```

**Action/path:** ADD the following packet to
`specs/apps/ose/id-web/behaviours/local-runtime/local-scale-and-composition.feature`.

```gherkin
Feature: No-affinity browser and dependent application
  Rule: Browser and consumer behavior survives instance replacement

    Scenario Outline: Complete a representative journey without affinity
      Given <journey> starts through instance A
      When instance A stops before the next protocol step
      Then the journey completes through instance B exactly once
      And no browser-stored token key or correlation is introduced
      Examples:
        | journey |
        | email verification |
        | Google callback |
        | passkey or MFA |
        | consent |
        | company administration mutation |

  Rule: Runner contract negotiation completes before authority is granted

    Scenario: Negotiate the highest mutually supported runner contract minor
      Given the runner and consumer support overlapping minor versions in contract major one
      When the consumer negotiates the runner contract
      Then the highest mutually supported minor is selected without starting an operation
      And optional fields use only their schema-declared safe defaults

    Scenario: Reject an unsupported local runner contract before mutation
      Given the runner input has an unsupported major or no mutually supported minor
      When the consumer negotiates the runner contract
      Then the runner returns the stable unsupported-contract result
      And no filesystem network process container fixture or descriptor is created or changed
      And no manifest content path environment value capability credential or ownership handle is logged

  Rule: Dependent applications consume only the protected identity contract

    Scenario: Compose a dependent application
      Given a versioned input requests one client resource personal entitlement and Company A fixture
      When the outer runner starts OSE ID and then the synthetic dependent app
      Then the app receives only allowlisted issuer and client configuration through the protected contract
      And personal and Company A OIDC journeys succeed without copied OSE ID lifecycle code

    Scenario: Reject fallback identity
      Given the dependent app is configured for OSE ID and OSE ID is unavailable
      When a user opens an authenticated route
      Then the app returns an identity-dependency-unavailable result
      And no local credential debug identity trusted header or alternate issuer is accepted
```

**Action/path:** ADD the following packet to
`specs/apps/ose/id-be/behaviours/persistence/complete-audit-contract.feature`.

```gherkin
Feature: Complete identity database auditability
  Rule: Scale and composition cannot weaken retained audit evidence

    Scenario: Verify every identity table rejects physical deletion
      Given the complete local OSE ID stack has representative active and terminal records
      When the audit verifier inventories every persisted table and probes each serving role
      Then every table has all six audit columns and lifecycle constraints
      And every foreign key uses restrictive delete behavior
      And every serving role is denied physical deletion
      And representative soft-deleted records remain attributed and unusable after instance replacement
```

Bindings are complete-catalog Unit policy, real PostgreSQL Integration, and built-stack E2E; no
exemption. The verifier discovers tables from `pg_catalog` rather than maintaining a handpicked allowlist.

## Other Delta Actions

- `UPDATE`: none at authoring; Phase 0 amends this map before RED if predecessor behavior already owns an
  exact no-affinity scenario.
- `DELETE`: none; the runner does not replace identity behavior.
- `RETAIN`: none is claimed as a spec-file delta. Plans 06–08 scenarios remain unchanged regression
  dependencies and Phase 0 records their actual moved paths; this plan does not duplicate their Gherkin.

Unit binds runner parsing/state-machine/ownership/allowlist functions; Integration binds process,
database/key/provider/mail and consumer contracts; E2E binds two-backend/two-web browser/API journeys.
No exemption is currently justified. Any later exemption must name the scenario and adapter, give a
boundary-based reason, be indexed in behavior-coverage configuration, and pass static validation.

## Plan-Only Proof

Worktree provisioning/recovery, CI/PR transcripts, migration evidence that does not change behavior,
license audit, capacity claims, semantic review, archival, and post-PR worktree cleanup remain in
`delivery.md`. Startup/readiness/failure/cleanup contracts that callers observe remain Gherkin behavior.
Authored production code requires at least 99% Unit line coverage; canonical generated/
test exclusions only. Static adapter-map validation proves complete U/I/E ownership.
