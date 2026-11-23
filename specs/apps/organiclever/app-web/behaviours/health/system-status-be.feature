Feature: BE Status Page

  As an app user
  I want the app to show the backend connectivity status
  So that I can diagnose whether the backend service is reachable

  # Behaviour: OAW-008
  # Behaviour: OAW-029
  Scenario: BE status page shows Not Configured when env unset
    Given ORGANICLEVER_BE_URL is unset
    When a visitor requests GET /system/status/be
    Then the response status is 200
    And the body contains "Not configured"

  # Behaviour: OAW-028
  Scenario: Backend health-check page is excluded from search indexes
    When a crawler requests GET /system/status/be
    Then the response declares the page non-indexable

  @local-fullstack
  # Exemption(e2e): the page reads ORGANICLEVER_BE_URL from the server process once, at start, so one browser run cannot make that backend answer UP, refuse, stall, or answer 503 per scenario; alternative-proof: organiclever-app-web:test:integration / BE status page shows UP when backend healthy
  @e2e-exempt
  # Behaviour: OAW-008
  # Behaviour: OAW-029
  Scenario: BE status page shows UP when backend healthy
    Given ORGANICLEVER_BE_URL is "http://be.example.test"
    And the backend health endpoint returns 200 with body {"status":"UP"}
    When a visitor requests GET /system/status/be
    Then the response status is 200
    And the body contains "UP"
    And the body contains the backend URL

  @local-fullstack
  # Exemption(e2e): the page reads ORGANICLEVER_BE_URL from the server process once, at start, so one browser run cannot make that backend answer UP, refuse, stall, or answer 503 per scenario; alternative-proof: organiclever-app-web:test:integration / BE status page shows DOWN with the failure reason when backend unreachable
  @e2e-exempt
  # Behaviour: OAW-033
  Scenario: BE status page shows DOWN with the failure reason when backend unreachable
    Given ORGANICLEVER_BE_URL is "http://be.example.test"
    And the backend health endpoint fails with connection refused
    When a visitor requests GET /system/status/be
    Then the response status is 200
    And the body contains "DOWN"
    And the body contains the failure reason

  @local-fullstack
  # Exemption(e2e): the page reads ORGANICLEVER_BE_URL from the server process once, at start, so one browser run cannot make that backend answer UP, refuse, stall, or answer 503 per scenario; alternative-proof: organiclever-app-web:test:integration / BE status page shows DOWN with the HTTP status when the backend answers with an error status
  @e2e-exempt
  # Behaviour: OAW-033
  Scenario: BE status page shows DOWN with the HTTP status when the backend answers with an error status
    Given ORGANICLEVER_BE_URL is "http://be.example.test"
    And the backend health endpoint answers with HTTP status 503
    When a visitor requests GET /system/status/be
    Then the response status is 200
    And the body contains "DOWN"
    And the body contains "HTTP 503"

  @local-fullstack
  # Exemption(e2e): the page reads ORGANICLEVER_BE_URL from the server process once, at start, so one browser run cannot make that backend answer UP, refuse, stall, or answer 503 per scenario; alternative-proof: organiclever-app-web:test:integration / BE status page shows DOWN when backend times out
  @e2e-exempt
  # Behaviour: OAW-033
  Scenario: BE status page shows DOWN when backend times out
    Given ORGANICLEVER_BE_URL is "http://be.example.test"
    And the backend health endpoint does not respond within 3 seconds
    When a visitor requests GET /system/status/be
    Then the response status is 200
    And the body contains "DOWN"
    And the body contains "timeout"
