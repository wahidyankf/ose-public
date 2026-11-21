Feature: Home Screen

  As an app user
  I want to see my recent journal entries on the home screen
  So that I can review and manage what I have logged

  # Behaviour: OAW-001
  Scenario: Home screen shows entry list
    When the home screen is loaded with entries
    Then the entry list is visible

  # Behaviour: OAW-015
  Scenario: Filter entries by kind
    Given the home screen is loaded with workout and reading entries
    When the user selects the Workout filter
    Then only workout entries are shown

  # Behaviour: OAW-016
  Scenario: Tapping an entry opens its detail sheet
    Given the home screen shows an entry
    When the user taps the entry
    Then the entry detail sheet opens

  # Behaviour: OAW-016
  Scenario: Closing the detail sheet returns to the entry list
    Given the entry detail sheet is open
    When the user closes the sheet
    Then the entry list is visible
