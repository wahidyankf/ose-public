Feature: Settings Screen

  Scenario: Settings screen loads user profile
    Given the settings screen is loaded
    Then the user name input is visible

  Scenario: Change rest setting
    Given the settings screen is loaded
    When the user selects 30s rest
    Then the 30s rest chip is active

  Scenario: Saved toast appears after save
    Given the settings screen is loaded
    When the user saves settings
    Then the saved toast appears
