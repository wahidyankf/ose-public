Feature: OSE ID health

  As a local developer
  I want liveness and readiness to answer two different questions
  So that work is only sent to an instance whose dependencies are actually usable

  Rule: Liveness is independent from dependency readiness

    Scenario: Report liveness without consulting dependencies
      Given the backend listener is running and PostgreSQL is unavailable
      When an anonymous caller asks whether the service is live
      Then liveness answers successfully with the fixed service identity
      And the liveness answer is uncacheable and carries a correlation value
      And no dependency is consulted and no state is changed
      And no connection, schema, secret, stack trace, or absolute path is disclosed

    Scenario: Report PostgreSQL becoming unavailable after startup
      Given the local backend is live and ready
      When its owned PostgreSQL dependency is stopped
      Then liveness remains successful
      And readiness becomes unsuccessful with a stable database component code
      And no secret or connection detail is returned

  Rule: Readiness reports the current state of the dependencies it needs

    Scenario Outline: Report current dependency readiness safely
      Given the backend listener is running with <dependency state>
      When an anonymous caller asks whether the service is ready
      Then the readiness status is <status>
      And readiness reports <result> through the closed health or problem schema
      And a repeated request re-evaluates the current state without mutating it
      And no connection, schema, secret, stack trace, or absolute path is disclosed

      Examples:
        | dependency state            | status | result               |
        | PostgreSQL and schema ready | 200    | ready                |
        | PostgreSQL unavailable      | 503    | database_unavailable |
        | schema version incompatible | 503    | schema_incompatible  |
