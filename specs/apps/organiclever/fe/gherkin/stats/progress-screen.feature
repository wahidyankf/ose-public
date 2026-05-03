Feature: Progress Screen
  As a user
  I want to view my activity analytics
  So that I can track my progress over time

  Scenario: Progress screen shows workout module by default
    Given the progress screen is loaded
    Then the workout module is active

  Scenario: Switch to reading module
    Given the progress screen is loaded
    When the user selects the Reading module
    Then the reading module content is shown

  Scenario: Exercise progress card expands
    Given there is exercise progress data
    When the user taps an exercise card
    Then the SVG chart is visible
