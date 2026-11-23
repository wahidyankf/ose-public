Feature: ose-be JetStream durable demo

  As an operations engineer
  I want ose-be to publish and durably consume messages via JetStream
  So that at-least-once delivery is verified end-to-end before the service handles real traffic

  # Behaviour: OSB-003
  Scenario: Messaging status endpoint reports the startup demo message delivered and acked
    Given NATS JetStream is running and ose-be is stopped
    When ose-be starts up
    Then the messaging status surface reports the demo delivered and acked
