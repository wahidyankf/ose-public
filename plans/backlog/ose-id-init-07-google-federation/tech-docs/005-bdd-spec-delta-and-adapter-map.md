# 005 — BDD Spec Delta and Adapter Map

## Durable Observable Spec Changes

`specs/apps/ose/id-be/behaviours/federation/google-federation.feature` and
`specs/apps/ose/id-web/behaviours/federation/google-federation.feature` are proposed `[N]` paths; Phase 0 reconciles exact
existing feature organization before RED. `ADD` means the behavior is new to the executable product
contract. Every row requires Unit (`U`), Integration (`I`), and E2E (`E`) adapters.

| Action | AC / scenario                                               | Exact target feature                                                         | U        | I        | E        | Exemption |
| ------ | ----------------------------------------------------------- | ---------------------------------------------------------------------------- | -------- | -------- | -------- | --------- |
| ADD    | AC-GOOGLE-01 — new provider subject completes first sign-in | `specs/apps/ose/id-be/behaviours/federation/google-federation.feature`       | required | required | required | none      |
| ADD    | AC-GOOGLE-02 — linked subject signs in again                | `specs/apps/ose/id-be/behaviours/federation/google-federation.feature`       | required | required | required | none      |
| ADD    | AC-GOOGLE-03 — matching email does not auto-link            | `specs/apps/ose/id-be/behaviours/federation/google-federation.feature`       | required | required | required | none      |
| ADD    | AC-GOOGLE-04 — recent session explicitly links Google       | `specs/apps/ose/id-be/behaviours/federation/google-federation.feature`       | required | required | required | none      |
| ADD    | AC-GOOGLE-05 — unsafe callback variants fail                | `specs/apps/ose/id-be/behaviours/federation/google-federation.feature`       | required | required | required | none      |
| ADD    | AC-GOOGLE-06 — cancel remains recoverable                   | `specs/apps/ose/id-web/behaviours/federation/google-federation.feature`      | required | required | required | none      |
| ADD    | AC-GOOGLE-06 — last method cannot be unlinked               | `specs/apps/ose/id-be/behaviours/federation/google-federation.feature`       | required | required | required | none      |
| ADD    | AC-GOOGLE-07 — non-local fake provider fails closed         | `specs/apps/ose/id-be/behaviours/federation/google-federation.feature`       | required | required | required | none      |
| ADD    | AC-GOOGLE-07 — only Google is implemented                   | `specs/apps/ose/id-web/behaviours/federation/google-federation.feature`      | required | required | required | none      |
| ADD    | AC-GOOGLE-08 — non-final provider link is soft-deleted      | `specs/apps/ose/id-be/behaviours/persistence/federation-soft-delete.feature` | required | required | required | none      |

## Copy-Ready Scenario Packets

Each scenario is `ADD`; the map above owns plan traceability and exact targets. The copy-ready
Gherkin is application-scoped and contains no plan or acceptance-criterion identifier. Unit,
Integration, and E2E are required for every packet; exemptions: none.

**Action/path:** ADD the following packet to
`specs/apps/ose/id-be/behaviours/federation/google-federation.feature`.

```gherkin
Feature: Google federation backend
  Rule: Google proof never weakens OSE identity ownership

    Scenario: A new provider subject completes first sign-in
      Given Google federation is enabled locally and no link exists for the validated issuer and subject
      When the user completes the Google response and confirms the new OSE account path
      Then OSE ID creates exactly one Person and one provider link
      And OSE ID continues with its own authorization-context rules

    Scenario: A linked provider subject signs in again
      Given one Person is linked to the validated Google issuer and subject
      When the same issuer and subject complete another valid response
      Then OSE ID signs in the same Person without creating another link
      And provider tokens never become OSE session state

    Scenario: Matching email does not auto-link
      Given an OSE Person and an unlinked Google subject share already-linked@example.test
      When the Google subject completes first sign-in
      Then OSE ID does not attach the provider to the existing Person by email
      And an explicit safe account path is required

    Scenario: A recent OSE session explicitly links Google
      Given a recently reauthenticated Person has no Google link
      When the Person proves Google control and explicitly confirms linking
      Then exactly one issuer-and-subject link is attached to that Person
      And the link action is audited without provider tokens

    Scenario Outline: Reject an unsafe callback
      Given a pending Google correlation exists
      When a callback has <defect>
      Then OSE ID creates no session Person or provider link
      And the response exposes no raw upstream error token or assertion
      Examples:
        | defect |
        | wrong issuer |
        | wrong audience |
        | invalid signature |
        | nonce mismatch |
        | expired correlation |
        | replayed authorization code |
        | missing subject |

    Scenario: Refuse unlinking the last usable method
      Given Google is the Person's only usable login method
      When the recently reauthenticated Person requests unlinking
      Then OSE ID refuses the unlink
      And the account remains usable through Google

    Scenario: Reject fake Google outside local or test runtime
      Given OSE ID starts outside its explicit local or test runtime
      When fake-provider configuration is present
      Then startup fails closed with a non-secret diagnostic
      And no identity endpoint becomes ready
```

**Action/path:** ADD the following packet to
`specs/apps/ose/id-web/behaviours/federation/google-federation.feature`.

```gherkin
Feature: Google federation web experience
  Rule: External-provider outcomes remain safe and recoverable

    Scenario: A user cancels Google
      Given the user started Google sign-in from an allowlisted OSE return path
      When the upstream provider returns a denial response
      Then OSE ID preserves no authenticated provider result
      And the user can retry or choose email sign-in

    Scenario: Offer only configured external providers
      Given external-provider sign-in is enabled with Google as the only configured provider
      When a user requests the available external-provider methods
      Then Google is offered
      And Facebook and every other unconfigured provider are not offered
```

**Action/path:** ADD the following packet to
`specs/apps/ose/id-be/behaviours/persistence/federation-soft-delete.feature`.

```gherkin
Feature: Federation persistence retirement
  Rule: Unlinked provider records remain auditable and unusable

    Scenario: Unlink a non-final Google login method without erasing it
      Given a recently reauthenticated Person has email and Google as usable login methods
      When the Person confirms Google unlinking
      Then ordinary provider-link lookup no longer returns the Google link
      And the retained row records matching deletion and update actor and time fields
      And provider tokens and correlation material cannot sign in or resume a transaction
      And the serving role cannot physically delete the link
```

Bindings are `FederationSoftDeleteSteps` at Unit, Integration, and built E2E; no exemption.

## Other Delta Actions

- `UPDATE`: none; the packets are new behavior.
- `DELETE`: none; Google does not replace email or another completed OSE method.
- `RETAIN`: none is claimed as a spec-file delta. Predecessor scenarios remain unchanged regression
  dependencies and Phase 0 records their actual moved paths; this plan does not duplicate their Gherkin.

Unit binds provider policy/callback/link state and UI view-state functions; Integration binds
OpenIddict/provider-adapter/persistence or BFF contracts; E2E binds HTTP/browser journeys against the
deterministic fake upstream. No exemption is currently justified. A future exception must identify one
scenario and adapter, give a boundary-based reason, be indexed in behavior-coverage configuration, and
pass static validation—never blanket or implicit.

## Plan-Only Proof

Worktree identity/recovery, HIPPO commands, CI/PR evidence, migration transcripts, license audit,
design-funnel evidence, semantic review, archival, and resource cleanup stay in `delivery.md`; they do
not enter app Gherkin unless they change observable runtime behavior. Production fail-closed and fake-
provider rejection are observable and therefore remain in specs.

Authored production code requires at least 99% Unit line coverage under the canonical
metric. Generated/test exclusions follow repository policy only. Static adapter-map validation must
prove every scenario has U/I/E ownership or an explicit indexed exemption.
