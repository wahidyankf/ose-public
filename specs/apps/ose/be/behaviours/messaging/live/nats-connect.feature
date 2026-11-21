Feature: ose-be NATS connection

  As an operations engineer
  I want ose-be to connect to NATS on startup
  So that messaging infrastructure is available before the API accepts requests

  # Behaviour: OSB-008
  # Behaviour: OSB-016
  Scenario: Backend reports healthy after starting with a reachable NATS server
    Given OSE_BE_NATS_URL points to a running NATS server with JetStream enabled
    When ose-be starts up
    Then the backend reports healthy after connecting

  Scenario: Messaging status endpoint reports the failure when NATS is unreachable and the HTTP service still starts
    Given OSE_BE_NATS_URL points to a NATS server that is not reachable
    When ose-be starts up
    Then the messaging status endpoint reports the failure
    And the health endpoint still reports healthy
