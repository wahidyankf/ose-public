Feature: Navigation
  As a site visitor
  I want clear navigation across all sections of the platform
  So that I can move between pages without losing my place

  Background:
    Given the app is running

  # Behaviour: OSW-015
  Scenario: Header contains navigation links
    When the header component is rendered
    Then the header contains a link to "Updates" at "/updates/"
    And the header contains a link to "About" at "/about/"
    And the header contains an external link to "Documentation"
    And the header contains an external link to "GitHub"

  # Behaviour: OSW-019
  Scenario: Breadcrumb lists the ancestors without the current page
    When the about page is rendered with breadcrumbs
    Then the breadcrumb shows "Home" linking to "/"
    And the current page should not appear in the breadcrumb
    And all breadcrumb segments should be clickable links

  # Behaviour: OSW-019
  Scenario: Breadcrumb text wraps without horizontal truncation
    When the about page is rendered with breadcrumbs
    Then breadcrumb text should wrap naturally without horizontal truncation

  # Behaviour: OSW-004
  Scenario: Previous and next navigation between updates
    When an update detail page is rendered with adjacent updates
    Then a "Previous" link is displayed with the previous update title
    And a "Next" link is displayed with the next update title

  # Behaviour: OSW-020
  Scenario: Footer links to AyoKoding on its canonical host
    When the footer component is rendered
    Then the footer contains an external link to "AyoKoding" on the canonical host "www.ayokoding.com"

  # Behaviour: OSW-018
  Scenario: Visitor opens the search dialog, types a query, and opens a result
    When the visitor opens the search dialog
    And the visitor types the query "Synthetic"
    And the visitor opens the first search result
    Then the visitor lands on the page at "/about/"

  # Behaviour: OSW-016
  Scenario: Mobile menu opens from the hamburger button and lists the navigation links
    Given the viewport width is less than 640 pixels
    When the visitor opens the navigation menu from the hamburger button
    Then the navigation menu lists the links "Updates", "About", "Documentation", and "GitHub"
