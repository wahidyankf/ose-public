Feature: App Shell Navigation

  Scenario: Default tab is Home on first load
    Given the app is freshly loaded
    Then the Home tab is active
    And the app shell is visible

  Scenario: Navigate to History tab
    Given the app shell is visible
    When the user taps the History tab
    Then the History tab is active

  Scenario: Navigate to Progress tab
    Given the app shell is visible
    When the user taps the Progress tab
    Then the Progress tab is active

  Scenario: Navigate to Settings tab
    Given the app shell is visible
    When the user taps the Settings tab
    Then the Settings tab is active

  Scenario: Open and close Add Entry sheet
    Given the app shell is visible
    When the user taps the FAB button
    Then the Add Entry sheet is open
    When the user closes the Add Entry sheet
    Then the Add Entry sheet is closed
