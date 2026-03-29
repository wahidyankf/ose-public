Feature: Theme
  As a site visitor
  I want to switch between light and dark mode
  So that I can read comfortably in my preferred visual environment

  Background:
    Given the app is running

  Scenario: Default theme is light mode
    Given the site loads without a stored theme preference
    Then the theme is set to light mode

  Scenario: Theme toggle switches between modes
    Given the site is in light mode
    When the user clicks the theme toggle and selects dark mode
    Then the site switches to dark mode
