Feature: Regulatory source context
  As a product engineer
  I want regulatory source capabilities declared
  So that the bounded context boundary is established for future feature plans

  # Stub — detailed scenarios added in regulatory-source feature plan
  # Behaviour: OSB-004
  Scenario: GET /api/v1/regulatory-source/status reports the context ready
    Given the ose-be service is running
    When I send GET /api/v1/regulatory-source/status
    Then the response status is 200
    And the response body has a "state" field equal to "Ready"
