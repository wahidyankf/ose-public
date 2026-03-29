Feature: Health Check
  As an operations engineer
  I want to monitor the health of the oseplatform-web backend
  So that I can detect service outages quickly

  Background:
    Given the API is running

  Scenario: Health endpoint returns ok status
    When the health endpoint is called
    Then the response contains status "ok"
