# 005 — BDD Spec Delta and Adapter Map

## Durable Observable Spec Changes

Only `specs/apps/ose/id-web/behaviours/company-admin/company-admin.feature` is changed. Plan 03 remains sole owner of
`specs/apps/ose/id-be` company behavior. Every `ADD` below describes Plan 08's observable BFF/UI
projection and requires Unit (`U`), Integration (`I`), and E2E (`E`) adapters.

| Action | AC / scenario                                             | Exact target feature                                                   | U        | I        | E        | Exemption |
| ------ | --------------------------------------------------------- | ---------------------------------------------------------------------- | -------- | -------- | -------- | --------- |
| ADD    | AC-ADMIN-01 — project one active company                  | `specs/apps/ose/id-web/behaviours/company-admin/company-admin.feature` | required | required | required | none      |
| ADD    | AC-ADMIN-02 — map unauthorized contexts to safe denial    | `specs/apps/ose/id-web/behaviours/company-admin/company-admin.feature` | required | required | required | none      |
| ADD    | AC-ADMIN-03 — invoke and display invitation flow          | `specs/apps/ose/id-web/behaviours/company-admin/company-admin.feature` | required | required | required | none      |
| ADD    | AC-ADMIN-04 — render unusable invitation states           | `specs/apps/ose/id-web/behaviours/company-admin/company-admin.feature` | required | required | required | none      |
| ADD    | AC-ADMIN-05 — render authoritative last-admin conflict    | `specs/apps/ose/id-web/behaviours/company-admin/company-admin.feature` | required | required | required | none      |
| ADD    | AC-ADMIN-06 — submit/display entry entitlement only       | `specs/apps/ose/id-web/behaviours/company-admin/company-admin.feature` | required | required | required | none      |
| ADD    | AC-ADMIN-07 — leave route for fresh company authorization | `specs/apps/ose/id-web/behaviours/company-admin/company-admin.feature` | required | required | required | none      |
| ADD    | AC-ADMIN-08 — narrow keyboard journey remains accessible  | `specs/apps/ose/id-web/behaviours/company-admin/company-admin.feature` | required | required | required | none      |
| ADD    | AC-ADMIN-10 — company-admin web route fails closed        | `specs/apps/ose/id-web/behaviours/company-admin/company-admin.feature` | required | required | required | none      |

## Copy-Ready Scenario Packets

Target/action for every packet: `ADD` to
`specs/apps/ose/id-web/behaviours/company-admin/company-admin.feature`. The map above binds plan
requirements to durable scenario titles; the copy-ready Gherkin contains no plan identifier. Each
packet requires Unit=BFF/view/component, Integration=BFF-to-backend, and E2E=browser. Exemptions: none.

```gherkin
Feature: Company-scoped administration presentation
  Rule: The BFF projects only authoritative company-administration results

    Scenario: Project one active company
      Given a signed-in Person has Company A active and current company-admin authority
      When the Person opens the company administration route
      Then the BFF calls the company administration API with the server-side session context
      And the page shows only allowlisted Company A administration fields

    Scenario Outline: Map an unauthorized context to safe denial
      Given the browser session represents <context>
      When the browser opens the company administration route
      Then the BFF maps the authoritative result to a non-disclosing denial
      And no Company A row, count, upstream body, or identifier is rendered
      Examples:
        | context |
        | personal context |
        | ordinary Company A member |
        | suspended Company A admin |
        | Company B admin |

    Scenario: Invoke and display an invitation flow
      Given a recent-authenticated Company A admin uses invitee.a@example.test
      When the admin submits an invitation and follows its Mailpit-delivered link once
      Then the BFF invokes only the company invitation operations
      And the UI shows the authoritative result without a raw capability

    Scenario Outline: Render an unusable invitation safely
      Given the company administration API returns an invitation in <state>
      When the BFF maps that result
      Then the UI renders a safe status and recovery action
      And no raw capability or hidden account or company data is rendered
      Examples:
        | state |
        | expired |
        | revoked |
        | already used |
        | superseded |

    Scenario: Render the authoritative last-admin conflict
      Given Company A has exactly one active admin membership
      When the admin UI submits a mutation that would remove that authority
      Then the UI displays the last-admin conflict returned by the company administration API
      And no browser or BFF rule predicts or overrides the result

    Scenario: Submit and display an entry entitlement only
      Given a Company A member lacks the ose-lms entry entitlement
      When a recent-authenticated Company A admin submits the grant through the BFF
      Then the BFF sends only the company entitlement fields
      And the UI displays no LMS role or permission field

    Scenario: Leave administration for fresh company authorization
      Given a user administers Company A and Company B
      When the user chooses Company B while administering Company A
      Then the UI starts the existing fresh authorization flow for Company B
      And the Company A page never renders Company B data in the same session context

    Scenario: Complete a member action by keyboard on a narrow viewport
      Given the member list is rendered at 375 CSS pixels
      When the user completes a confirmed entitlement change by keyboard
      Then focus, labels, status, and error recovery remain programmatically clear
      And no action requires hover, color perception, or horizontal page scrolling

    Scenario: Fail closed outside the local runtime
      Given the runtime mode is neither Local nor Test
      When company administration is enabled
      Then startup or route enablement fails closed with a non-secret diagnostic
      And no company administration web route becomes ready
```

Unit binds view-model mapping and component state; Integration binds BFF/session calls to unchanged Plan
03 APIs; E2E binds the browser journey. No exemption is currently justified. Any future per-scenario
adapter exemption must give a boundary-based reason, be indexed in behavior-coverage configuration, and
pass static validation. Blanket/implicit exemptions are forbidden.

## Retained Backend Contract

The following Plan 03 scenarios are exact `RETAIN` actions because they remain the backend authority;
Plan 08 does not copy or edit them:

| Action | Exact target                                                              | Exact scenario                                                            | Reason                                     |
| ------ | ------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------ |
| RETAIN | `specs/apps/ose/id-be/behaviours/tenancy/personal-context.feature`        | `AC-TEN-01 Evaluate a personal-only eligible user`                        | personal context authority stays Plan 03   |
| RETAIN | `specs/apps/ose/id-be/behaviours/tenancy/personal-context.feature`        | `AC-TEN-02 Evaluate a company-required resource for a companyless Person` | company requirement stays Plan 03          |
| RETAIN | `specs/apps/ose/id-be/behaviours/tenancy/multi-company-context.feature`   | `AC-TEN-03 Resolve separate company contexts`                             | context selection stays Plan 03            |
| RETAIN | `specs/apps/ose/id-be/behaviours/tenancy/invitations.feature`             | `AC-TEN-04 Accept a company invitation concurrently`                      | invitation aggregate/command stays Plan 03 |
| RETAIN | `specs/apps/ose/id-be/behaviours/tenancy/membership-admin.feature`        | `AC-TEN-05 Company A admin guesses a Company B member identifier`         | tenant authorization stays Plan 03         |
| RETAIN | `specs/apps/ose/id-be/behaviours/tenancy/membership-admin.feature`        | `AC-TEN-06 Concurrently remove the final membership administrator`        | last-admin rule stays Plan 03              |
| RETAIN | `specs/apps/ose/id-be/behaviours/tenancy/product-entitlements.feature`    | `AC-TEN-07 Grant company access to the LMS fixture`                       | entitlement command stays Plan 03          |
| RETAIN | `specs/apps/ose/id-be/behaviours/tenancy/row-level-security.feature`      | `AC-TEN-08 Query a tenant-owned table with an invalid database context`   | RLS stays Plan 03                          |
| RETAIN | `specs/apps/ose/id-be/behaviours/tenancy/row-level-security.feature`      | `AC-TEN-09 Reuse one pooled connection across companies`                  | pooled RLS safety stays Plan 03            |
| RETAIN | `specs/apps/ose/id-be/behaviours/tenancy/context-revocation.feature`      | `AC-TEN-10 Re-evaluate after access is revoked`                           | revocation stays Plan 03                   |
| RETAIN | `specs/apps/ose/id-be/behaviours/tenancy/multi-instance-context.feature`  | `AC-TEN-11 Evaluate and select through different backend instances`       | stateless backend authority stays Plan 03  |
| RETAIN | `specs/apps/ose/id-be/behaviours/persistence/tenancy-soft-delete.feature` | `AC-TEN-12 Retire an expired company invitation`                          | auditable deletion semantics stay Plan 03  |

Action `DELETE`: none. Action `UPDATE`: none in `specs/apps/ose/id-be`.

## Plan-Only Proof

Worktree identity/recovery, dependency/archived-path evidence, HIPPO/CI/PR transcripts, OpenAPI no-diff
proof, license audit, design-funnel evidence, semantic review, archival, cleanup, and the AC-ADMIN-09
proof that this web-only plan changes no backend/platform-admin surface stay in `delivery.md`; they are
not app behavior. Local route fail-closed and browser-visible safe outcomes are observable and remain
in specs. Authored production code requires at least 99% Unit line
coverage under the canonical metric; only repository-approved generated/test exclusions apply.
