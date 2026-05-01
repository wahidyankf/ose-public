Feature: Dark Mode

  Scenario: Toggle dark mode on
    Given the settings screen shows dark mode is off
    When the user toggles dark mode
    Then dark mode is enabled

  Scenario: Toggle dark mode off
    Given dark mode is enabled
    When the user toggles dark mode
    Then dark mode is disabled
