Feature: Responsive Design
  As a site visitor on any device
  I want the layout to adapt to my screen size
  So that navigation and content remain accessible on mobile and desktop

  Background:
    Given the app is running

  Scenario: Mobile viewport shows hamburger navigation
    Given the viewport width is less than 640 pixels
    When the header is rendered
    Then the hamburger menu button is visible
    And the desktop navigation links are hidden

  Scenario: Desktop viewport shows full navigation
    Given the viewport width is greater than 1024 pixels
    When the header is rendered
    Then the desktop navigation links are visible
    And the hamburger menu button is hidden
