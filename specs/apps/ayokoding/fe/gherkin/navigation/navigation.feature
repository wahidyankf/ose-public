Feature: Site Navigation

  As a reader visiting AyoKoding
  I want intuitive navigation controls throughout the site
  So that I can find content, understand my location, and move between pages efficiently

  Background:
    Given the app is running

  Scenario: Sidebar shows section tree with collapsible nodes
    When a visitor opens a content page that has child sections
    Then the sidebar should display the section tree
    And parent nodes should be expandable and collapsible
    When the visitor clicks a collapsed parent node
    Then its child items should become visible

  Scenario: Breadcrumb shows ancestor path hierarchy without current page
    When a visitor opens a nested content page
    Then a breadcrumb trail should be displayed above the page title
    And each breadcrumb segment should reflect an ancestor level of the URL hierarchy
    And the current page should not appear in the breadcrumb
    And all breadcrumb segments should be clickable links
    And breadcrumb text should wrap naturally without horizontal truncation

  Scenario: Table of contents shows heading links for H2 to H4
    When a visitor opens a content page with multiple headings
    Then a table of contents should be visible on the page
    And the table of contents should list all H2, H3, and H4 headings as anchor links
    And H1 headings should not appear in the table of contents

  Scenario: Previous and Next links navigate between siblings
    When a visitor is on a content page that has sibling pages
    Then a previous link should point to the preceding sibling page
    And a next link should point to the following sibling page
    When the visitor clicks the next link
    Then they should be taken to the next sibling page

  Scenario: Active page is highlighted in the sidebar
    When a visitor is on a specific content page
    Then the corresponding item in the sidebar should be visually highlighted as active
    And no other sidebar item should be highlighted as active
