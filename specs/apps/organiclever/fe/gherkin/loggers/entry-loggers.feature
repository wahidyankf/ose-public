Feature: Entry Loggers
  Scenario: Open Add Entry sheet
    Given the app shell is visible
    When the user taps the FAB
    Then the Add Entry sheet is open with all entry kinds

  Scenario: Close Add Entry sheet
    Given the Add Entry sheet is open
    When the user closes the Add Entry sheet
    Then the Add Entry sheet is closed

  Scenario: Open reading logger from Add Entry sheet
    Given the Add Entry sheet is open
    When the user selects the Reading entry kind
    Then the reading logger is open

  Scenario: Log a reading entry
    Given the reading logger is open
    When the user enters title "Atomic Habits"
    And the user saves the entry
    Then the entry is saved and the logger closes

  Scenario: Reading logger save is disabled without title
    Given the reading logger is open
    When the user has not entered a title
    Then the save button is disabled

  Scenario: Open learning logger from Add Entry sheet
    Given the Add Entry sheet is open
    When the user selects the Learning entry kind
    Then the learning logger is open

  Scenario: Log a learning entry
    Given the learning logger is open
    When the user enters subject "TypeScript generics"
    And the user saves the entry
    Then the entry is saved and the logger closes

  Scenario: Open meal logger from Add Entry sheet
    Given the Add Entry sheet is open
    When the user selects the Meal entry kind
    Then the meal logger is open

  Scenario: Log a meal entry
    Given the meal logger is open
    When the user enters meal name "Oatmeal with berries"
    And the user saves the entry
    Then the entry is saved and the logger closes

  Scenario: Open focus logger from Add Entry sheet
    Given the Add Entry sheet is open
    When the user selects the Focus entry kind
    Then the focus logger is open

  Scenario: Log a focus entry
    Given the focus logger is open
    When the user selects the 25min preset
    And the user saves the entry
    Then the entry is saved and the logger closes

  Scenario: Focus logger save requires task or duration
    Given the focus logger is open
    When the user has not entered task or duration
    Then the save button is disabled

  Scenario: Open custom entry logger
    Given the Add Entry sheet is open
    When the user selects the custom entry kind
    Then the custom entry logger is open

  Scenario: Log a custom entry
    Given the custom entry logger is open
    When the user enters custom entry name "Evening walk"
    And the user saves the custom entry
    Then the custom entry is saved and the logger closes
