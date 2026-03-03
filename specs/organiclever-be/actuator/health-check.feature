Feature: Service Health Check

  As an operations engineer
  I want to monitor the health of the OrganicLever backend
  So that I can detect service outages quickly

  Scenario: Health endpoint reports the service as UP
    Given the OrganicLever API is running
    When an operations engineer sends GET /actuator/health
    Then the response status code should be 200
    And the health status should be "UP"

  Scenario: Anonymous health check does not expose component details
    Given the OrganicLever API is running
    When an unauthenticated engineer sends GET /actuator/health
    Then the response status code should be 200
    And the health status should be "UP"
    And the response should not include detailed component health information
