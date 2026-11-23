Feature: Internal policy context
  As a product engineer
  I want internal policy capabilities declared
  So that the bounded context boundary is established for future feature plans

  # Stub — detailed scenarios added in internal-policy feature plan
  # Behaviour: OSB-005
  Scenario: GET /api/v1/internal-policy/status reports the context ready
    Given the ose-be service is running
    When I send GET /api/v1/internal-policy/status
    Then the response status is 200
    And the response body has a "state" field equal to "Ready"
