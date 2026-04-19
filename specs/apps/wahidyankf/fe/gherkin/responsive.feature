Feature: Responsive layout across viewports

  As a visitor to wahidyankf-web on any device
  I want the layout to adapt to my viewport size
  So that navigation and content remain usable on phones, tablets, and desktops

  Background:
    Given the app is running

  Scenario: Desktop viewport shows a fixed left sidebar
    When a visitor opens the home page at 1440 by 900 viewport
    Then a left sidebar is visible with Home, CV, and Personal Projects links
    And no bottom tab bar is rendered

  Scenario: Tablet viewport hides the sidebar and renders a bottom tab bar
    When a visitor opens the home page at 768 by 1024 viewport
    Then no left sidebar is visible
    And a bottom tab bar is visible with Home, CV, and Personal Projects items

  Scenario: Mobile viewport hides the sidebar and renders a bottom tab bar
    When a visitor opens the home page at 375 by 812 viewport
    Then no left sidebar is visible
    And a bottom tab bar is visible with Home, CV, and Personal Projects items

  Scenario: The theme toggle is always reachable
    When a visitor opens the home page at any viewport
    Then the theme toggle button is present in the DOM and clickable
