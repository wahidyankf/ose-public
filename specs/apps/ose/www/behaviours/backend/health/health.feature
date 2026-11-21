Feature: Health Check
  As an operations engineer
  I want to monitor the health of the ose-web backend
  So that I can detect service outages quickly

  Background:
    Given the API is running

  # Behaviour: OSW-012
  Scenario: Health endpoint returns ok status
    When the health endpoint is called
    Then the response contains status "ok"
