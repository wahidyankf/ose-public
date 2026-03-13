Feature: Service Health Status

  As an operations engineer
  I want to see the health status of the backend service in the app
  So that I can confirm the frontend is connected to a healthy backend

  Background:
    Given the app is running

  Scenario: Health indicator shows the service is UP
    When the user opens the app
    Then the health status indicator should display "UP"

  Scenario: Health indicator does not expose component details to regular users
    When an unauthenticated user opens the app
    Then the health status indicator should display "UP"
    And no detailed component health information should be visible
