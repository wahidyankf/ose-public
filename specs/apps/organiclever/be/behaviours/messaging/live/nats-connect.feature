Feature: organiclever-be NATS connection

  As an operations engineer
  I want organiclever-be to connect to NATS on startup
  So that messaging infrastructure is available before the API accepts requests

  # Behaviour: OBE-024
  Scenario: Backend reports healthy after starting with a reachable NATS server
    Given ORGANICLEVER_BE_NATS_URL points to a running NATS server with JetStream enabled
    When organiclever-be starts up
    Then the backend reports healthy after connecting

  # Behaviour: OBE-011
  Scenario: Messaging status endpoint reports the failure when NATS is unreachable and the HTTP service still starts
    Given ORGANICLEVER_BE_NATS_URL points to a NATS server that is unreachable
    When organiclever-be starts up
    Then the backend still serves its health endpoint
    And the messaging status endpoint reports NATS as unavailable
