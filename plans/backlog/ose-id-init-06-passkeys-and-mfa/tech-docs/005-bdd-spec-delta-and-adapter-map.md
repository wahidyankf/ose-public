# BDD Spec Delta and Adapter Map

## Purpose and enforcement

This copy-ready delta separates durable authenticator behavior from plan execution proof. Configure
`apps/ose-id-be/behaviour-coverage.json`, `apps/ose-id-be-e2e/behaviour-coverage.json`,
`apps/ose-id-web/behaviour-coverage.json`, and `apps/ose-id-web-e2e/behaviour-coverage.json` for the
named `specs/apps/ose/id-be/behaviours` and `specs/apps/ose/id-web/behaviours` corpora. Static validation
rejects missing/duplicate scenarios, unresolved bindings, and unindexed exemptions. Every scenario
below requires Unit, Integration, and E2E adapters; there are no exemptions. Enforce **at least 99%
Unit line coverage for authored production code**, with only canonical repository exclusions;
exclusions are reported separately and cannot dilute the denominator.

## Delta index

| ID                | Action | Exact target feature                                                             | Scenario                                                  | Unit / Integration / E2E       |
| ----------------- | ------ | -------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------ |
| ID06-PASSKEY-001  | ADD    | `specs/apps/ose/id-web/behaviours/passkeys/passkey-lifecycle.feature`            | A recently authenticated user adds a passkey              | required / required / required |
| ID06-PASSKEY-002  | ADD    | `specs/apps/ose/id-web/behaviours/passkeys/passkey-lifecycle.feature`            | A user signs in with a passkey                            | required / required / required |
| ID06-PASSKEY-003  | ADD    | `specs/apps/ose/id-be/behaviours/passkeys/assertion-validation.feature`          | A passkey assertion fails closed                          | required / required / required |
| ID06-TOTP-001     | ADD    | `specs/apps/ose/id-web/behaviours/mfa/totp-enrollment.feature`                   | TOTP activates after confirmation                         | required / required / required |
| ID06-TOTP-002     | ADD    | `specs/apps/ose/id-be/behaviours/mfa/totp-enrollment.feature`                    | An unconfirmed TOTP secret cannot authenticate            | required / required / required |
| ID06-RECOVERY-001 | ADD    | `specs/apps/ose/id-be/behaviours/recovery/recovery-codes.feature`                | A recovery code works once                                | required / required / required |
| ID06-RECOVERY-002 | ADD    | `specs/apps/ose/id-be/behaviours/recovery/recovery-codes.feature`                | Regeneration invalidates the old set                      | required / required / required |
| ID06-METHOD-001   | ADD    | `specs/apps/ose/id-web/behaviours/account-security/method-removal.feature`       | A user cannot remove the final safe access path           | required / required / required |
| ID06-STEPUP-001   | ADD    | `specs/apps/ose/id-be/behaviours/mfa/step-up.feature`                            | A TOTP policy requires a second factor                    | required / required / required |
| ID06-STATE-001    | ADD    | `specs/apps/ose/id-be/behaviours/runtime/authenticator-statelessness.feature`    | Another instance completes an authenticator ceremony      | required / required / required |
| ID06-A11Y-001     | ADD    | `specs/apps/ose/id-web/behaviours/accessibility/account-hardening.feature`       | Account hardening has an accessible fallback              | required / required / required |
| ID06-GUARD-001    | ADD    | `specs/apps/ose/id-web/behaviours/config/authenticator-production-guard.feature` | Production mode rejects local authenticator configuration | required / required / required |
| ID05-METHOD-001   | UPDATE | `specs/apps/ose/id-web/behaviours/sign-in/method-availability.feature`           | Only delivered and eligible sign-in methods are shown     | required / required / required |
| ID06-AUDIT-001    | ADD    | `specs/apps/ose/id-be/behaviours/persistence/authenticator-soft-delete.feature`  | Retire a superseded authenticator challenge               | required / required / required |

No existing scenario is DELETE. The following direct-predecessor scenarios are RETAIN because
email fallback, authorization continuity, and production fail-closed behavior remain required:

| Retained ID      | Exact target feature                                                           | Exact scenario                                              | Reason                           |
| ---------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------- | -------------------------------- |
| ID05-SIGNIN-001  | `specs/apps/ose/id-web/behaviours/sign-in/email-sign-in.feature`               | A verified user signs in through OSE ID web                 | Keep email fallback              |
| ID05-SIGNIN-002  | `specs/apps/ose/id-web/behaviours/sign-in/enumeration-safety.feature`          | Sign-in guidance does not enumerate an account              | Preserve enumeration defense     |
| ID05-CONTEXT-001 | `specs/apps/ose/id-web/behaviours/authorization/context-selection.feature`     | A companyless user selects personal access                  | Preserve personal context        |
| ID05-CONTEXT-002 | `specs/apps/ose/id-web/behaviours/authorization/context-selection.feature`     | A multi-company user selects one company                    | Preserve company isolation       |
| ID05-CONSENT-001 | `specs/apps/ose/id-web/behaviours/authorization/consent.feature`               | A user decides a consent request                            | Preserve consent                 |
| ID05-BFF-001     | `specs/apps/ose/id-web/behaviours/security/browser-artifacts.feature`          | Browser inspection finds no token material                  | Preserve BFF boundary            |
| ID05-A11Y-001    | `specs/apps/ose/id-web/behaviours/accessibility/authorization-journey.feature` | Complete authorization without visual or pointer dependence | Preserve accessible base journey |
| ID05-STATE-001   | `specs/apps/ose/id-web/behaviours/runtime/statelessness.feature`               | The web journey survives instance replacement               | Preserve no-affinity behavior    |
| ID05-GUARD-001   | `specs/apps/ose/id-web/behaviours/config/production-guard.feature`             | Production mode rejects local web configuration             | Preserve fail-closed startup     |

RETAIN means the existing full Gherkin is not copied or edited. Phase 0 verifies the exact paths, IDs,
and wording against the resolved archived predecessor.

## Scenario packets

### Available methods — ID05-METHOD-001

**Action/path:** UPDATE;
`specs/apps/ose/id-web/behaviours/sign-in/method-availability.feature`. Replace the predecessor scenario
with the following exact scenario.
**Bindings:** Unit eligibility/method registry, Integration backend enrollment and runtime config, E2E
visible/DOM presence and absence for enrolled and unenrolled users. No exemptions.

```gherkin
Feature: Sign-in method availability
  Rule: The interface offers only methods implemented and eligible for the current user

    Scenario: Only delivered and eligible sign-in methods are shown
      Given OSE ID is running locally and the signed-out person has an enrolled passkey
      When the person opens the sign-in page
      Then email and passkey sign-in actions are available
      And Google Facebook and ineligible factor actions are absent
```

### Passkey lifecycle — ID06-PASSKEY-001 and ID06-PASSKEY-002

**Action/path:** ADD; `specs/apps/ose/id-web/behaviours/passkeys/passkey-lifecycle.feature`.
**Bindings:** Unit UI/domain orchestration, Integration browser-option BFF
and credential store, E2E real browser virtual authenticator. No exemptions.

```gherkin
Feature: Passkey lifecycle
  Rule: A passkey belongs to one user and records only public credential material

    Scenario: A recently authenticated user adds a passkey
      Given a user has a fresh OSE ID session and another usable recovery path
      When the user completes a valid passkey registration ceremony
      Then OSE ID stores only the public credential material for that user
      And account security lists the new passkey by its user-provided label

    Scenario: A user signs in with a passkey
      Given the user owns an active passkey
      When the authenticator returns a valid assertion for the current OSE ID challenge
      Then OSE ID creates an authenticated session with truthful passkey method evidence
      And the user can continue the existing context and consent journey
```

### Passkey validation — ID06-PASSKEY-003

**Action/path:** ADD; `specs/apps/ose/id-be/behaviours/passkeys/assertion-validation.feature`.
**Bindings:** Unit validator example matrix, Integration challenge
and credential store, E2E malformed authenticator assertions. No exemptions.

```gherkin
Feature: Passkey assertion validation
  Rule: Invalid ceremonies fail without revealing credential ownership

    Scenario Outline: A passkey assertion fails closed
      Given a valid user and registered passkey
      When the assertion has <fault>
      Then OSE ID denies authentication without revealing credential ownership
      And no authenticated session is created

      Examples:
        | fault |
        | an expired or reused challenge |
        | an unapproved origin |
        | the wrong relying-party identifier |
        | a credential owned by another user |
        | an invalid signature or client-data type |
```

### TOTP enrollment — ID06-TOTP-001

**Action/path:** ADD; `specs/apps/ose/id-web/behaviours/mfa/totp-enrollment.feature`.
**Bindings:** Unit form/state machine, Integration BFF/backend protected
secret lifecycle, E2E QR/manual entry and first recovery display. No exemptions.

```gherkin
Feature: TOTP enrollment
  Rule: A TOTP factor activates only after proof of possession

    Scenario: TOTP activates after confirmation
      Given a recently authenticated user started TOTP setup
      When the user submits a valid current code for the presented secret
      Then TOTP becomes active
      And OSE ID presents a new recovery-code set exactly once
```

### Unconfirmed TOTP — ID06-TOTP-002

**Action/path:** ADD; `specs/apps/ose/id-be/behaviours/mfa/totp-enrollment.feature`.
**Bindings:** Unit factor-state policy, Integration secret persistence, E2E
abandon-then-submit API/browser flow. No exemptions.

```gherkin
Feature: Unconfirmed TOTP enrollment
  Rule: An abandoned setup never becomes an authentication factor

    Scenario: An unconfirmed TOTP secret cannot authenticate
      Given a user abandoned TOTP setup before confirmation
      When a code from that setup is submitted later
      Then OSE ID denies the challenge
      And the abandoned secret is not an active factor
```

### Recovery codes — ID06-RECOVERY-001 and ID06-RECOVERY-002

**Action/path:** ADD; `specs/apps/ose/id-be/behaviours/recovery/recovery-codes.feature`.
**Bindings:** Unit generation/consumption policy, Integration atomic
verifier store, E2E cross-instance reuse and regeneration. No exemptions.

```gherkin
Feature: Recovery-code lifecycle
  Rule: Recovery codes are one-time and one generation is active

    Scenario: A recovery code works once
      Given a TOTP-enabled user has an unused recovery code
      When the code completes the fallback challenge
      Then OSE ID consumes the code atomically and authenticates the user
      And the same code cannot be used again on another instance

    Scenario: Regeneration invalidates the old set
      Given a recently authenticated user regenerates recovery codes
      When any unused code from the prior set is submitted
      Then OSE ID denies it
      And only the newly generated set remains usable
```

### Final access path — ID06-METHOD-001

**Action/path:** ADD; `specs/apps/ose/id-web/behaviours/account-security/method-removal.feature`.
**Bindings:** Unit last-path policy/UI, Integration method inventory
and recent-auth check, E2E removal refusal and visible guidance. No exemptions.

```gherkin
Feature: Sign-in method removal
  Rule: A user retains at least one safe sign-in and recovery path

    Scenario: A user cannot remove the final safe access path
      Given removing one method would leave no usable sign-in and recovery path
      When the user confirms removal after recent authentication
      Then OSE ID refuses the removal with actionable guidance
      And the existing method remains active
```

### Step-up — ID06-STEPUP-001

**Action/path:** ADD; `specs/apps/ose/id-be/behaviours/mfa/step-up.feature`.
**Bindings:** Unit factor/claim policy, Integration OIDC transaction plus
factor state, E2E password-to-TOTP/recovery consent journey. No exemptions.

```gherkin
Feature: Multi-factor step-up
  Rule: Consent waits for required factors and claims report only completed factors

    Scenario: A TOTP policy requires a second factor
      Given a TOTP-enabled user signed in with password for a step-up client request
      When the user has not completed a current second factor
      Then OSE ID requires TOTP or a recovery code before consent
      And issued authentication claims describe only factors actually completed
```

### Stateless authenticator challenge — ID06-STATE-001

**Action/path:** ADD;
`specs/apps/ose/id-be/behaviours/runtime/authenticator-statelessness.feature`.
**Bindings:** Unit state-authority/replay guard, Integration shared
challenge transaction, E2E A-to-B completion and replay. No exemptions.

```gherkin
Feature: Stateless authenticator ceremonies
  Rule: Shared state allows one completion after process replacement

    Scenario: Another instance completes an authenticator ceremony
      Given instance A created a passkey or TOTP challenge in shared state
      When instance A stops and instance B receives the valid response
      Then instance B completes the ceremony without sticky routing
      And a replay at either instance is denied
```

### Accessible fallback — ID06-A11Y-001

**Action/path:** ADD; `specs/apps/ose/id-web/behaviours/accessibility/account-hardening.feature`.
**Bindings:** Unit component semantics/state, Integration rendered
routes and fallback APIs, E2E keyboard/assistive-technology matrix at every width. No exemptions.

```gherkin
Feature: Accessible account hardening
  Rule: Every authenticator flow has an understandable operable fallback

    Scenario Outline: Account hardening has an accessible fallback
      Given the account-security page is shown at <width> CSS pixels
      When the user manages a passkey TOTP and recovery codes with keyboard and assistive technology
      Then every prompt status error and fallback remains understandable and operable
      And no control is clipped or dependent on color alone

      Examples:
        | width |
        | 320 |
        | 768 |
        | 1280 |
```

### Production guard — ID06-GUARD-001

**Action/path:** ADD;
`specs/apps/ose/id-web/behaviours/config/authenticator-production-guard.feature`.
**Bindings:** Unit backend/web predicates, Integration dual-process
startup, E2E no-listener/provider-registration assertion. No exemptions.

```gherkin
Feature: Authenticator production guard
  Rule: Local origins and test authenticators cannot start production mode

    Scenario: Production mode rejects local authenticator configuration
      Given OSE ID is configured for production with localhost RP origins or test authenticators
      When the backend and web start
      Then they fail before listening on network ports
      And no Google or Facebook provider is registered
```

### Authenticator soft delete — ID06-AUDIT-001

**Action/path:** ADD;
`specs/apps/ose/id-be/behaviours/persistence/authenticator-soft-delete.feature`.
**Bindings:** Unit query/actor policy, Integration PostgreSQL catalog/cleanup, E2E built cleanup and
rejected runtime-role delete. No exemptions.

```gherkin
Feature: Authenticator persistence retirement
  Rule: Terminal authenticator records remain auditable and unusable

    Scenario: Retire a superseded authenticator challenge
      Given a terminal authenticator challenge has complete audit metadata
      When the authenticator cleanup worker retires it as an identified system actor
      Then ordinary challenge lookup no longer returns it
      And the retained row records matching deletion and update actor and time fields
      And its verifier and protected payload cannot authenticate or resume a ceremony
      And the serving role cannot physically delete it
```

## Plan-only proof

Worktree provisioning/inventory, design-funnel artifacts, HIPPO admission, CI and exact-head review,
physical migration/no-loss evidence, screenshot files, MIT/dependency-license bookkeeping, Knowledge
Capture, archival/index edits, terminal audit, and worktree/branch cleanup stay only in `delivery.md`.
Credential behavior, shared-state consequences, secret absence, accessibility, and fail-closed startup
are application-observable and therefore remain in the durable specs above.
