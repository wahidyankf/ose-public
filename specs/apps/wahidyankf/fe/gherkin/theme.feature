Feature: Theme toggle

  As a visitor to wahidyankf-web
  I want to switch between light and dark themes
  So that I can read comfortably in any lighting condition

  Background:
    Given the app is running

  Scenario: Default theme is dark
    When a visitor opens the home page for the first time
    Then the html element has no "light-theme" class
    And the theme toggle aria-label is "Switch to light theme"

  Scenario: Clicking the toggle switches to light theme
    When a visitor opens the home page
    And the visitor clicks the theme toggle
    Then the html element has the "light-theme" class
    And the theme toggle aria-label is "Switch to dark theme"

  Scenario: Theme persists across navigation
    When a visitor opens the home page
    And the visitor clicks the theme toggle
    And the visitor navigates to the CV page
    Then the html element still has the "light-theme" class

  Scenario: Theme choice persists across reloads
    When a visitor opens the home page
    And the visitor clicks the theme toggle
    And the visitor reloads the page
    Then the html element still has the "light-theme" class
