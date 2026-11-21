Feature: BE health endpoint
  As a system operator
  I want the BE to advertise liveness
  So that orchestrators can route traffic only to healthy instances

  # Behaviour: OSB-001
  Scenario: Health endpoint returns 200
    Given the ose-be service is running
    When I send GET /api/v1/health
    Then the response status is 200
    And the response body has a "status" field equal to "healthy"
