Feature: organiclever-be JetStream durable demo

  As an operations engineer
  I want organiclever-be to publish and durably consume messages via JetStream
  So that at-least-once delivery is verified end-to-end before the service handles real traffic

  # Behaviour: OBE-011
  Scenario: Messaging status endpoint reports the startup demo message delivered and acked
    Given NATS JetStream is running and organiclever-be is stopped
    When organiclever-be starts up
    Then the messaging status endpoint reports the startup demo delivered and acked
