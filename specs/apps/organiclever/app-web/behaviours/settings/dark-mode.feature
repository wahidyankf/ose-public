Feature: Dark Mode

  As an app user
  I want to toggle dark mode in settings
  So that I can use the app comfortably in low-light environments

  # Behaviour: OAW-017
  Scenario: Toggle dark mode on
    Given the settings screen shows dark mode is off
    When the user toggles dark mode
    Then dark mode is enabled

  # Behaviour: OAW-017
  Scenario: Toggle dark mode off
    Given the user has enabled dark mode
    When the user toggles dark mode
    Then dark mode is disabled
