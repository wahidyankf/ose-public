# BDD Spec Delta and Adapter Map

## Purpose and enforcement

This is the copy-ready delta for durable Init 04 behavior. Copy these packets into the named feature
files before production code. Configure `apps/ose-id-be/behaviour-coverage.json` and
`apps/ose-id-be-e2e/behaviour-coverage.json` with corpus `specs/apps/ose/id-be/behaviours` and named
Unit, Integration, and E2E bindings. Static validation must reject missing or duplicate scenarios,
unresolved bindings, and unindexed exemptions. Every scenario below requires all three adapters; there
are no exemptions. Enforce **at least 99% Unit line coverage for authored production code**, with only
canonical repository exclusions; excluded lines are reported separately and cannot dilute it.

## Delta index

| ID              | Action | Exact target feature                                                       | Scenario                                              | Unit / Integration / E2E       |
| --------------- | ------ | -------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------ |
| ID04-AUTH-001   | ADD    | `specs/apps/ose/id-be/behaviours/authorization/authorization-code.feature` | A personal user authorizes the LMS client             | required / required / required |
| ID04-AUTH-002   | ADD    | `specs/apps/ose/id-be/behaviours/authorization/authorization-code.feature` | A company member authorizes one company               | required / required / required |
| ID04-AUTH-003   | ADD    | `specs/apps/ose/id-be/behaviours/authorization/request-validation.feature` | OSE ID rejects an unsafe authorization request        | required / required / required |
| ID04-TOKEN-001  | ADD    | `specs/apps/ose/id-be/behaviours/tokens/token-safety.feature`              | An authorization code is consumed once                | required / required / required |
| ID04-TOKEN-002  | ADD    | `specs/apps/ose/id-be/behaviours/tokens/token-safety.feature`              | A resource receives a token for another audience      | required / required / required |
| ID04-TOKEN-003  | ADD    | `specs/apps/ose/id-be/behaviours/tokens/revocation.feature`                | Revocation remains non-oracular and idempotent        | required / required / required |
| ID04-LOGOUT-001 | ADD    | `specs/apps/ose/id-be/behaviours/sessions/logout.feature`                  | Confirmed logout ends the bound session safely        | required / required / required |
| ID04-LOGOUT-002 | ADD    | `specs/apps/ose/id-be/behaviours/sessions/logout.feature`                  | A keyboard user cancels OSE ID logout                 | required / required / required |
| ID04-KEY-001    | ADD    | `specs/apps/ose/id-be/behaviours/keys/signing-key-lifecycle.feature`       | Tokens remain verifiable during key overlap           | required / required / required |
| ID04-STATE-001  | ADD    | `specs/apps/ose/id-be/behaviours/runtime/statelessness.feature`            | Another instance completes the transaction            | required / required / required |
| ID04-GUARD-001  | ADD    | `specs/apps/ose/id-be/behaviours/config/production-guard.feature`          | Production mode receives local identity configuration | required / required / required |
| ID04-SEAM-001   | ADD    | `specs/apps/ose/id-be/behaviours/providers/provider-seam.feature`          | No upstream provider is enabled                       | required / required / required |
| ID04-AUDIT-001  | ADD    | `specs/apps/ose/id-be/behaviours/persistence/protocol-soft-delete.feature` | Retire an expired authorization token                 | required / required / required |

No existing scenario is UPDATE, DELETE, or RETAIN by name because Init 03 has no OIDC/OAuth behavior.
Phase 0 verifies that against its resolved archived path; a collision changes ADD to UPDATE without
changing the observable wording.

## Scenario packets

### Authorization code — ID04-AUTH-001 and ID04-AUTH-002

**Action/path:** ADD; `specs/apps/ose/id-be/behaviours/authorization/authorization-code.feature`.
**Bindings:** Unit policy/claims, Integration OpenIddict/PostgreSQL, E2E
built backend and synthetic LMS. No exemptions.

```gherkin
Feature: Authorization Code with PKCE
  Rule: One eligible personal or company context is bound to an authorization

    Scenario: A personal user authorizes the LMS client
      Given a verified user with a personal LMS entitlement and an active OSE ID session
      When the LMS BFF completes Authorization Code with PKCE S256 and consent
      Then OSE ID returns an ID token and an LMS-audience access token
      And the access token has personal context without a company identifier

    Scenario: A company member authorizes one company
      Given a verified user entitled to LMS through two active companies
      When the user authorizes LMS for one selected company
      Then the access token contains that one company and no other company
      And the backend recorded consent for the selected context and scopes
```

### Request validation — ID04-AUTH-003

**Action/path:** ADD; `specs/apps/ose/id-be/behaviours/authorization/request-validation.feature`.
**Bindings:** Unit validator examples, Integration
endpoint/store, E2E built-process HTTP. No exemptions.

```gherkin
Feature: Authorization request validation
  Rule: Invalid registered-client input never creates a grant or token

    Scenario Outline: OSE ID rejects an unsafe authorization request
      Given a registered local LMS client
      When the request contains <fault>
      Then OSE ID returns the protocol-safe failure for that request
      And no authorization grant or token is created

      Examples:
        | fault |
        | an unregistered redirect URI |
        | a missing PKCE challenge |
        | the plain PKCE method |
        | an unsupported response type |
        | an unregistered scope or resource |
```

### Token safety — ID04-TOKEN-001 and ID04-TOKEN-002

**Action/path:** ADD; `specs/apps/ose/id-be/behaviours/tokens/token-safety.feature`.
**Bindings:** Unit redemption/audience policy, Integration atomic store and
validator, E2E replay/wrong-audience built processes. No exemptions.

```gherkin
Feature: Token and authorization-code safety
  Rule: Single-use codes and exact audiences are enforced before domain authorization

    Scenario: An authorization code is consumed once
      Given a valid authorization code has already been redeemed
      When any instance receives the code again
      Then token issuance is denied
      And the denial reveals no token or verifier value

    Scenario: A resource receives a token for another audience
      Given a valid token was issued for a different OSE resource
      When the LMS API validates that token
      Then access is denied before LMS domain authorization runs
```

### Revocation — ID04-TOKEN-003

**Action/path:** ADD; `specs/apps/ose/id-be/behaviours/tokens/revocation.feature`. **Bindings:** Unit
non-oracular/idempotency policy, Integration token/grant stores, E2E confidential-client protocol.
No exemptions.

```gherkin
Feature: Token revocation
  Rule: Revocation does not disclose token existence and converges safely

    Scenario: Revocation remains non-oracular and idempotent
      Given an authenticated client owns one issued access token
      When the client revokes the issued token an unknown token and the issued token again
      Then every well-formed revocation request receives the same protocol success shape
      And the issued token remains revoked after concurrent repeated requests

```

### Logout — ID04-LOGOUT-001

**Action/path:** ADD; `specs/apps/ose/id-be/behaviours/sessions/logout.feature`. **Bindings:** Unit
return-target/anti-forgery/idempotency policy, Integration session/grant stores, E2E browser protocol.
No exemptions.

```gherkin
Feature: Session logout
  Rule: Session termination requires confirmation and a registered return target

    Scenario: Confirmed logout ends the bound session safely
      Given a signed-in user opens logout for a registered client
      When the user confirms logout with valid anti-forgery proof
      Then the bound OSE ID session ends exactly once
      And continuation uses only the registered post-logout URI

    Scenario: A keyboard user cancels OSE ID logout
      Given a signed-in user opens logout for a registered client
      When the user reviews the consequence and activates Cancel with the keyboard
      Then the OSE ID session and related grants remain active
      And focus and continuation return through the validated safe path
      And no identity token session or provider value is rendered or stored by the browser
```

### Signing keys — ID04-KEY-001

**Action/path:** ADD; `specs/apps/ose/id-be/behaviours/keys/signing-key-lifecycle.feature`.
**Bindings:** Unit key-selection policy, Integration shared store/JWKS, E2E
old/new token validation across rotation. No exemptions.

```gherkin
Feature: Signing-key lifecycle
  Rule: Rotation overlaps verification without issuing from an old key

    Scenario: Tokens remain verifiable during key overlap
      Given one key is verify-only and another key is active
      When a client validates an unexpired token signed by either key
      Then the matching public key is available from JWKS
      And new tokens use only the active key
```

### Statelessness — ID04-STATE-001

**Action/path:** ADD; `specs/apps/ose/id-be/behaviours/runtime/statelessness.feature`.
**Bindings:** Unit state-authority guard, Integration shared
transaction store, E2E A-to-B completion after A stops. No exemptions.

```gherkin
Feature: Stateless authorization processing
  Rule: Correctness state survives process replacement in shared stores

    Scenario: Another instance completes the transaction
      Given backend instance A created an authorization transaction
      When instance B confirms consent and redeems its code after instance A stops
      Then the authorization completes without session affinity
      And the audit trail contains one completed transaction
```

### Production guard — ID04-GUARD-001

**Action/path:** ADD; `specs/apps/ose/id-be/behaviours/config/production-guard.feature`.
**Bindings:** Unit configuration predicate, Integration host
startup, E2E child-process no-listener assertion. No exemptions.

```gherkin
Feature: Production configuration guard
  Rule: Local identity material cannot start production mode

    Scenario: Production mode receives local identity configuration
      Given OSE ID is configured for production mode
      When startup finds a localhost client or local signing key provider
      Then startup fails before listening on a network port
```

### Provider seam — ID04-SEAM-001

**Action/path:** ADD; `specs/apps/ose/id-be/behaviours/providers/provider-seam.feature`.
**Bindings:** Unit registration graph, Integration discovery/config,
E2E email authorization and provider absence. No exemptions.

```gherkin
Feature: Dormant upstream-provider seam
  Rule: No upstream provider is enabled by this delivery

    Scenario: No upstream provider is enabled
      Given OSE ID is running in its supported local configuration
      When a client reads discovery and completes local email authorization
      Then no Google or Facebook handler is registered
      And no social-provider environment variable is required
```

### Protocol soft delete — ID04-AUDIT-001

**Action/path:** ADD; `specs/apps/ose/id-be/behaviours/persistence/protocol-soft-delete.feature`.
**Bindings:** Unit custom-store policy/SQL, Integration PostgreSQL catalog/cleanup, E2E built cleanup
and rejected serving-role delete. No exemptions.

```gherkin
Feature: Authorization protocol persistence retirement
  Rule: Terminal protocol records remain auditable and unusable

    Scenario: Retire an expired authorization token
      Given an expired terminal protocol token has complete audit metadata
      When the protocol cleanup worker prunes it as an identified system actor
      Then ordinary token lookup no longer returns it
      And the retained row records matching deletion and update actor and time fields
      And its reference and protected payload cannot redeem or authorize
      And the serving role cannot physically delete it
```

## Plan-only proof

Worktree provisioning/inventory, HIPPO admission, CI and exact-head review, migration evidence capture,
MIT/dependency-license bookkeeping, Knowledge Capture, plan archival/index edits, terminal audit, and
worktree/branch cleanup stay only in `delivery.md`. Observable migration consequences—atomic use,
shared-state completion, and fail-closed startup—are already specified above; proof mechanics are not.
