Feature: Settings Screen

  As an app user
  I want to view and update my profile and preferences in the settings screen
  So that the app reflects my personal configuration

  # Behaviour: OAW-004
  Scenario: Settings screen loads user profile
    When the settings screen is loaded
    Then the user name input is visible

  # Behaviour: OAW-019
  Scenario: Change rest setting
    Given the settings screen is loaded
    When the user selects 30s rest
    Then the 30s rest chip is active

  # Behaviour: OAW-021
  Scenario: Saved toast appears after save
    Given the settings screen is loaded
    When the user saves settings
    Then the saved toast appears

  # Behaviour: OAW-020
  Scenario: Saving a changed name in Settings shows the new name in the profile header
    Given the settings screen is loaded
    When the user changes the name to "Sam" and leaves the name field
    Then the profile header shows "Sam"
