Feature: Service Health Check

  As an operations engineer
  I want to monitor the health of the OrganicLever backend
  So that I can detect service outages quickly

  Background:
    Given the API is running

  # Behaviour: OBE-001
  Scenario: Anonymous health check reports ok without component details
    When an unauthenticated engineer sends GET /health
    Then the response status code should be 200
    And the health status should be "ok"
    And the response should not include detailed component health information

  # Behaviour: OBE-002
  Scenario: GET /api/v1/health reports the service as ok
    When an operations engineer sends GET /api/v1/health
    Then the response status code should be 200
    And the health status should be "ok"
