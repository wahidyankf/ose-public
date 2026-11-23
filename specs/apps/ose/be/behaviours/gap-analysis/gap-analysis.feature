Feature: Gap analysis context
  As a product engineer
  I want gap analysis capabilities declared
  So that the bounded context boundary is established for future feature plans

  # Stub — detailed scenarios added in gap-analysis feature plan
  # Behaviour: OSB-006
  Scenario: GET /api/v1/gap-analysis/status reports the context ready
    Given the ose-be service is running
    When I send GET /api/v1/gap-analysis/status
    Then the response status is 200
    And the response body has a "state" field equal to "Ready"
