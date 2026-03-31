Feature: Accessibility compliance

  As a visitor with accessibility needs
  I want the OSE Platform site to follow WCAG 2.1 AA standards
  So that I can navigate and read content using assistive technologies

  Background:
    Given the app is running

  Scenario: Home page passes axe-core accessibility scan
    When a visitor opens the home page
    Then the page should have no accessibility violations

  Scenario: Headings follow a proper hierarchy
    When a visitor opens the home page
    Then headings should follow a proper hierarchy starting with a single h1

  Scenario: All interactive elements are keyboard accessible
    When a visitor opens the home page
    And the visitor presses Tab repeatedly
    Then focus should move through all interactive elements in logical order
    And no interactive element should be skipped or unreachable by keyboard

  Scenario: Text color contrast meets WCAG AA standard
    When a visitor opens any page on the site
    Then all body text should meet a minimum contrast ratio of 4.5:1 against its background
    And large text and headings should meet a minimum contrast ratio of 3:1 against their background

  Scenario: Focus indicators are visible on interactive elements
    When a visitor navigates to an interactive element using the keyboard
    Then a visible focus indicator should be displayed on that element
    And the focus indicator should have sufficient contrast against the surrounding background
