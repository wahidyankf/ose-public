Feature: OSE ID health

  As a local developer
  I want liveness and readiness to answer two different questions
  So that work is only sent to an instance whose dependencies are actually usable

  Rule: Liveness is independent from dependency readiness

    Scenario: Report PostgreSQL becoming unavailable after startup
      Given the local backend is live and ready
      When its owned PostgreSQL dependency is stopped
      Then liveness remains successful
      And readiness becomes unsuccessful with a stable database component code
      And no secret or connection detail is returned
