Feature: Accessibility

  As a visitor with accessibility needs using wahidyankf-web
  I want the site to follow WCAG 2.1 AA guidelines
  So that I can navigate and read content using assistive technologies

  Background:
    Given the app is running

  Scenario: Home page has zero axe-core WCAG 2.1 AA violations
    When a visitor opens the home page
    Then an axe-core scan against WCAG 2.1 AA reports zero violations

  Scenario: CV page has zero axe-core WCAG 2.1 AA violations
    When a visitor opens the CV page
    Then an axe-core scan against WCAG 2.1 AA reports zero violations

  Scenario: Every page has exactly one H1
    When a visitor opens any of the home, CV, or personal-projects pages
    Then each of those pages has exactly one H1 element

  Scenario: Interactive controls expose accessible names
    When a visitor opens the home page
    Then the theme toggle button exposes an aria-label
    And every navigation link exposes link text or an aria-label
