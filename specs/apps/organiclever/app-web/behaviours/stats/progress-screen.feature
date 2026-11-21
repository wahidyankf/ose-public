Feature: Progress Screen
  As a user
  I want to view my activity analytics
  So that I can track my progress over time

  # Behaviour: OAW-003
  Scenario: Progress screen shows workout module by default
    When the progress screen is loaded
    Then the workout module is active

  # Behaviour: OAW-022
  Scenario: Switch to reading module
    Given the progress screen is loaded
    When the user selects the Reading module
    Then the reading module content is shown

  # Behaviour: OAW-023
  Scenario: Tapping an exercise card shows its progress chart
    Given there is exercise progress data
    When the user taps an exercise card
    Then the progress chart is visible
