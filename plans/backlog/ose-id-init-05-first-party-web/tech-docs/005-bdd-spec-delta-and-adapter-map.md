# BDD Spec Delta and Adapter Map

## Purpose and enforcement

This copy-ready delta separates durable web behavior from delivery proof. Configure
`apps/ose-id-web/behaviour-coverage.json` and `apps/ose-id-web-e2e/behaviour-coverage.json` with corpus
`specs/apps/ose/id-web/behaviours` and named Unit, Integration, and E2E bindings. Static validation
rejects missing/duplicate scenarios, unresolved bindings, or unindexed exemptions. Every scenario here
requires all three adapters; there are no exemptions. Enforce **at least 99% Unit line coverage for
authored production code**, with only canonical repository exclusions; exclusions cannot dilute it.

## Delta index

| ID                | Action | Exact target feature                                                           | Scenario                                                    | Unit / Integration / E2E       |
| ----------------- | ------ | ------------------------------------------------------------------------------ | ----------------------------------------------------------- | ------------------------------ |
| ID05-SIGNIN-001   | ADD    | `specs/apps/ose/id-web/behaviours/sign-in/email-sign-in.feature`               | A verified user signs in through OSE ID web                 | required / required / required |
| ID05-SIGNIN-002   | ADD    | `specs/apps/ose/id-web/behaviours/sign-in/enumeration-safety.feature`          | Sign-in guidance does not enumerate an account              | required / required / required |
| ID05-VERIFY-001   | ADD    | `specs/apps/ose/id-web/behaviours/sign-in/email-verification.feature`          | An email-verification link has one safe outcome             | required / required / required |
| ID05-RECOVERY-001 | ADD    | `specs/apps/ose/id-web/behaviours/sign-in/recovery.feature`                    | Account recovery remains non-enumerating and single-use     | required / required / required |
| ID05-CONTEXT-001  | ADD    | `specs/apps/ose/id-web/behaviours/authorization/context-selection.feature`     | A companyless user selects personal access                  | required / required / required |
| ID05-CONTEXT-002  | ADD    | `specs/apps/ose/id-web/behaviours/authorization/context-selection.feature`     | A multi-company user selects one company                    | required / required / required |
| ID05-CONSENT-001  | ADD    | `specs/apps/ose/id-web/behaviours/authorization/consent.feature`               | A user decides a consent request                            | required / required / required |
| ID05-BFF-001      | ADD    | `specs/apps/ose/id-web/behaviours/security/browser-artifacts.feature`          | Browser inspection finds no token material                  | required / required / required |
| ID05-A11Y-001     | ADD    | `specs/apps/ose/id-web/behaviours/accessibility/authorization-journey.feature` | Complete authorization without visual or pointer dependence | required / required / required |
| ID05-STATE-001    | ADD    | `specs/apps/ose/id-web/behaviours/runtime/statelessness.feature`               | The web journey survives instance replacement               | required / required / required |
| ID05-SESSION-001  | ADD    | `specs/apps/ose/id-web/behaviours/account/sessions.feature`                    | Session revocation is owner-bound and idempotent            | required / required / required |
| ID05-METHOD-001   | ADD    | `specs/apps/ose/id-web/behaviours/sign-in/method-availability.feature`         | Only delivered sign-in methods are shown                    | required / required / required |
| ID05-GUARD-001    | ADD    | `specs/apps/ose/id-web/behaviours/config/production-guard.feature`             | Production mode rejects local web configuration             | required / required / required |
| ID05-AUDIT-001    | ADD    | `specs/apps/ose/id-web/behaviours/session/web-session-soft-delete.feature`     | Retire an expired web session                               | required / required / required |

No existing scenario is UPDATE, DELETE, or RETAIN by name because Init 04 has no first-party web
corpus. Phase 0 verifies that statement against the resolved archived predecessor; any collision changes
ADD to UPDATE without changing observable wording.

## Scenario packets

### Email sign-in — ID05-SIGNIN-001

**Action/path:** ADD; `specs/apps/ose/id-web/behaviours/sign-in/email-sign-in.feature`.
**Bindings:** Unit form/focus/session orchestration, Integration BFF/backend and
session store, E2E browser through built web/backend. No exemptions.

```gherkin
Feature: Email sign-in
  Rule: The first-party web journey authenticates without exposing protocol artifacts

    Scenario: A verified user signs in through OSE ID web
      Given the local client redirected a signed-out verified user to OSE ID
      When the user completes the identifier-first email and password journey
      Then OSE ID continues to context selection without revealing protocol tokens to browser storage
      And the page announces success and moves focus predictably
```

### Enumeration safety — ID05-SIGNIN-002

**Action/path:** ADD; `specs/apps/ose/id-web/behaviours/sign-in/enumeration-safety.feature`.
**Bindings:** Unit safe-copy/result mapping, Integration backend response
normalization, E2E paired email requests and visible/network comparison. No exemptions.

```gherkin
Feature: Account-enumeration safety
  Rule: Public sign-in and recovery guidance does not reveal account existence

    Scenario: Sign-in guidance does not enumerate an account
      Given two syntactically valid emails where only one is registered
      When each email starts sign-in or recovery
      Then the public page presents the same safe accepted guidance
      And neither response identifies which account exists
```

### Email verification — ID05-VERIFY-001

**Action/path:** ADD; `specs/apps/ose/id-web/behaviours/sign-in/email-verification.feature`.
**Bindings:** Unit route-state/capability-redaction, Integration BFF/email-account exchange, E2E local
Mailpit link and browser history/storage inspection. No exemptions.

```gherkin
Feature: Email verification
  Rule: A verification capability has one safe server-side exchange

    Scenario: An email-verification link has one safe outcome
      Given a user receives one local email-verification link
      When the link is opened twice concurrently
      Then one request verifies the email and the other shows equivalent already-handled guidance
      And the capability is absent from browser history storage logs and rendered payloads
```

### Account recovery — ID05-RECOVERY-001

**Action/path:** ADD; `specs/apps/ose/id-web/behaviours/sign-in/recovery.feature`. **Bindings:** Unit
enumeration-safe route/result mapping, Integration BFF/email-account capability lifecycle, E2E paired
known/unknown requests and single-use completion. No exemptions.

```gherkin
Feature: Account recovery
  Rule: Public recovery is non-enumerating and completion is single-use

    Scenario: Account recovery remains non-enumerating and single-use
      Given one registered email and one unregistered email are syntactically valid
      When each email requests recovery and the issued link is opened twice
      Then both requests receive equivalent accepted guidance
      And only the first valid completion can change the registered account credential
```

### Context selection — ID05-CONTEXT-001 and ID05-CONTEXT-002

**Action/path:** ADD; `specs/apps/ose/id-web/behaviours/authorization/context-selection.feature`.
**Bindings:** Unit rendering/opaque-choice handling, Integration BFF
offer/revalidation, E2E personal and multi-company browser journeys. No exemptions.

```gherkin
Feature: Authorization-context selection
  Rule: A user submits exactly one backend-offered personal or company context

    Scenario: A companyless user selects personal access
      Given the backend offers personal context for the requesting client
      When the user selects personal and continues
      Then the consent page names the personal context
      And no synthetic company is displayed or submitted

    Scenario: A multi-company user selects one company
      Given the backend offers two eligible company contexts
      When the user chooses one company
      Then the web submits only the opaque offered choice
      And the consent page names exactly that company
```

### Consent — ID05-CONSENT-001

**Action/path:** ADD; `specs/apps/ose/id-web/behaviours/authorization/consent.feature`.
**Bindings:** Unit view/action mapping, Integration BFF transaction,
E2E allow/cancel callback. No exemptions.

```gherkin
Feature: Authorization consent
  Rule: Allow and cancel return only protocol-safe registered callbacks

    Scenario Outline: A user decides a consent request
      Given the consent page names the client context and requested scopes
      When the user chooses <decision>
      Then the exact registered client callback receives <result>

      Examples:
        | decision | result |
        | Allow | a one-time authorization code |
        | Cancel | a safe access-denied result |
```

### Browser artifact safety — ID05-BFF-001

**Action/path:** ADD; `specs/apps/ose/id-web/behaviours/security/browser-artifacts.feature`.
**Bindings:** Unit serializer/cookie policy, Integration BFF session boundary,
E2E URL/RSC/log/storage/network inspection. No exemptions.

```gherkin
Feature: Browser artifact safety
  Rule: Protocol and recovery secrets stay server-side

    Scenario: Browser inspection finds no token material
      Given a user completed email authorization through the BFF
      When the tester inspects storage cookies URLs RSC payloads logs and analytics
      Then only an opaque protected session cookie is present in the browser
      And no access ID refresh authorization or recovery token is exposed
```

### Accessible responsive journey — ID05-A11Y-001

**Action/path:** ADD; `specs/apps/ose/id-web/behaviours/accessibility/authorization-journey.feature`.
**Bindings:** Unit component semantics/focus, Integration rendered
routes, E2E keyboard/browser at every example width. No exemptions.

```gherkin
Feature: Accessible authorization journey
  Rule: Authorization remains operable without sight or pointer precision

    Scenario Outline: Complete authorization without visual or pointer dependence
      Given the sign-in page is shown at <width> CSS pixels
      When the user completes sign-in context and consent using only the keyboard
      Then focus labels errors and status remain understandable
      And the page has no clipped control or horizontal scrolling

      Examples:
        | width |
        | 320 |
        | 768 |
        | 1280 |
```

### Stateless web session — ID05-STATE-001

**Action/path:** ADD; `specs/apps/ose/id-web/behaviours/runtime/statelessness.feature`.
**Bindings:** Unit no-process-state guards, Integration shared
session/transaction store, E2E A-to-B continuation after A stops. No exemptions.

```gherkin
Feature: Stateless web journey
  Rule: Instance replacement does not become user-visible session loss

    Scenario: The web journey survives instance replacement
      Given web instance A started an email authorization journey
      When instance A stops and instance B receives the next request
      Then the user continues without signing in again because of instance loss
      And no sticky-session routing is required
```

### Session revocation — ID05-SESSION-001

**Action/path:** ADD; `specs/apps/ose/id-web/behaviours/account/sessions.feature`. **Bindings:** Unit
owner/idempotency/cookie policy, Integration BFF/shared session store, E2E current/other-session
revocation across web instances. No exemptions.

```gherkin
Feature: Account sessions
  Rule: A user can revoke only an owned session and repeated revocation is safe

    Scenario: Session revocation is owner-bound and idempotent
      Given a signed-in user has a current session and another owned session
      When the user revokes the other session twice
      Then the other session cannot authorize another request
      And both revocation attempts reveal no session outside the user account
```

### Delivered methods — ID05-METHOD-001

**Action/path:** ADD; `specs/apps/ose/id-web/behaviours/sign-in/method-availability.feature`.
**Bindings:** Unit method registry/rendering, Integration runtime config,
E2E visible/DOM absence. No exemptions.

```gherkin
Feature: Sign-in method availability
  Rule: The interface offers only methods implemented in the current delivery

    Scenario: Only delivered sign-in methods are shown
      Given OSE ID is running in local mode
      When a signed-out person opens the sign-in page
      Then email and recovery actions are available
      And Google Facebook passkey TOTP and recovery-code actions are absent
```

### Production guard — ID05-GUARD-001

**Action/path:** ADD; `specs/apps/ose/id-web/behaviours/config/production-guard.feature`.
**Bindings:** Unit config predicate, Integration Next.js startup,
E2E child process and no-listener assertion. No exemptions.

```gherkin
Feature: Production web configuration guard
  Rule: Local backend and session material cannot start production mode

    Scenario: Production mode rejects local web configuration
      Given the web is configured for production mode with a localhost backend or local session key
      When the process starts
      Then startup fails before serving a page
```

### Web-session soft delete — ID05-AUDIT-001

**Action/path:** ADD; `specs/apps/ose/id-web/behaviours/session/web-session-soft-delete.feature`.
**Bindings:** Unit Kysely query/actor policy, Integration PostgreSQL catalog/cleanup, E2E built web
cleanup and rejected runtime-role delete. No exemptions.

```gherkin
Feature: Web-session persistence retirement
  Rule: Terminal web sessions remain auditable and unusable

    Scenario: Retire an expired web session
      Given an expired terminal web session has complete audit metadata
      When the web-session cleanup worker retires it as an identified system actor
      Then ordinary session lookup no longer returns it
      And the retained row records matching deletion and update actor and time fields
      And its handle and protected continuation cannot authorize or resume a request
      And the web runtime role cannot physically delete it
```

## Plan-only proof

Worktree provisioning/inventory, design-funnel artifacts and selection record, HIPPO admission, CI and
exact-head review, screenshots as delivery evidence, MIT/dependency-license bookkeeping, Knowledge
Capture, archival/index edits, terminal audit, and worktree/branch cleanup stay only in `delivery.md`.
Visible layout, responsiveness, focus, method availability, and browser-secret absence remain durable
spec behavior as defined above.
