Feature: Disabled OSE ID capabilities

  As a security reviewer
  I want every unfinished identity capability to answer as if it does not exist
  So that no caller can reach or persist identity state the service does not yet own

  Rule: Unsupported identity capabilities fail closed without persistent changes

    Scenario Outline: Reject a disabled identity capability through its exact route
      Given OSE ID is ready with <capability> disabled
      When a client requests <method> <path>
      Then the response status is 404 with the stable capability-disabled problem code
      And the refusal is uncacheable and carries a correlation value
      And no redirect, token, cookie, identity resource, or tenant fact is returned
      And no identity or authorization record is created

      Examples:
        | capability                | method | path                       |
        | OIDC authorization        | GET    | /connect/authorize         |
        | OAuth token issuance      | POST   | /connect/token             |
        | external-provider sign-in | GET    | /external/google/challenge |
        | SCIM user provisioning    | POST   | /scim/v2/Users             |
        | platform administration   | GET    | /platform/admin/companies  |
