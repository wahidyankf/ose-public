Feature: Navigation
  As a site visitor
  I want clear navigation across all sections of the platform
  So that I can move between pages without losing my place

  Background:
    Given the app is running

  Scenario: Header contains navigation links
    Given the header component is rendered
    Then the header contains a link to "Updates" at "/updates/"
    And the header contains a link to "About" at "/about/"
    And the header contains an external link to "Documentation"
    And the header contains an external link to "GitHub"

  Scenario: Breadcrumb navigation shows current location
    Given the about page is rendered with breadcrumbs
    Then the breadcrumb shows "Home" linking to "/"
    And the breadcrumb shows "About" as the current page

  Scenario: Previous and next navigation between updates
    Given an update detail page is rendered with adjacent updates
    Then a "Previous" link is displayed with the previous update title
    And a "Next" link is displayed with the next update title
