Feature: Accessibility Compliance

  As a user with disabilities
  I want the application to meet WCAG AA standards
  So that I can use OrganicLever with assistive technologies

  Background:
    Given the app is running

  Scenario: Pages have proper heading hierarchy
    When I navigate to any page
    Then each page should have exactly one h1 element
    And heading levels should not skip (no h1 followed by h3)

  Scenario: Form elements have associated labels
    When I navigate to /login
    Then all interactive elements should have accessible labels
    And buttons should have descriptive text

  Scenario: Keyboard navigation works throughout the app
    When I navigate to /login using only the keyboard
    Then I should be able to tab to all interactive elements
    And focus indicators should be visible

  Scenario: Color contrast meets WCAG AA requirements
    When I navigate to any page
    Then all text should meet WCAG AA contrast ratio (4.5:1 for normal text)
    And all interactive elements should have sufficient contrast

  Scenario: ARIA attributes are properly used
    When I navigate to any page
    Then images should have alt attributes
    And navigation landmarks should be properly labeled
    And dynamic content changes should be announced to screen readers
