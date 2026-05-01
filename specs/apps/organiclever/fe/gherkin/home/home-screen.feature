Feature: Home Screen
  Scenario: Home screen shows entry list
    Given the home screen is loaded with entries
    Then the entry list is visible

  Scenario: Filter entries by kind
    Given the home screen is loaded with workout and reading entries
    When the user selects the Workout filter
    Then only workout entries are shown

  Scenario: Open entry detail sheet
    Given the home screen shows an entry
    When the user taps the entry
    Then the entry detail sheet opens
    When the user closes the sheet
    Then the entry detail sheet is closed
