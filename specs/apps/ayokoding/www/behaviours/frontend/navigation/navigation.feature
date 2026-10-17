Feature: Site Navigation

  As a reader visiting AyoKoding
  I want intuitive navigation controls throughout the site
  So that I can find content, understand my location, and move between pages efficiently

  Background:
    Given the app is running

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Sidebar shows section tree with collapsible nodes
  @integration-exempt
  Scenario: Sidebar shows section tree with collapsible nodes
    When a visitor opens a content page that has child sections
    Then the sidebar should display the section tree
    And parent nodes should be expandable and collapsible
    And the visitor clicks a collapsed parent node
    And its child items should become visible

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Breadcrumb shows ancestor path hierarchy without current page
  @integration-exempt
  Scenario: Breadcrumb shows ancestor path hierarchy without current page
    When a visitor opens a nested content page
    Then a breadcrumb trail should be displayed above the page title
    And each breadcrumb segment should reflect an ancestor level of the URL hierarchy
    And the current page should not appear in the breadcrumb
    And all breadcrumb segments should be clickable links
    And the breadcrumb should render on a single row without horizontally truncating link text

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Table of contents shows heading links for H2 to H4
  @integration-exempt
  Scenario: Table of contents shows heading links for H2 to H4
    When a visitor opens a content page with multiple headings
    Then a table of contents should be visible on the page
    And the table of contents should list all H2, H3, and H4 headings as anchor links
    And H1 headings should not appear in the table of contents

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Previous and Next links navigate between siblings
  @integration-exempt
  Scenario: Previous and Next links navigate between siblings
    When a visitor is on a content page that has sibling pages
    Then a previous link should point to the preceding sibling page
    And a next link should point to the following sibling page
    And the visitor clicks the next link
    And they should be taken to the next sibling page

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Active page is highlighted in the sidebar
  @integration-exempt
  Scenario: Active page is highlighted in the sidebar
    When a visitor is on a specific content page
    Then the corresponding item in the sidebar should be visually highlighted as active
    And no other sidebar item should be highlighted as active

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / In-body relative markdown links resolve to real site routes
  @integration-exempt
  Scenario: In-body relative markdown links resolve to real site routes
    Given a content page's markdown body contains a relative link to another content file
    When the page is rendered to HTML
    Then the rendered link's href should be the linked page's real site URL
    And the href should not contain a literal ".md" extension
    And the href should not be a raw filesystem-relative path

  # Exemption(integration): relative-link normalization is pure Markdown rendering with no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / In-body relative markdown links authored from a section index page resolve to real site routes
  @integration-exempt
  # Exemption(e2e): section indexes are generated resources whose published links are canonical absolute URLs, so the public app has no request state that supplies a relative-link section index; alternative-proof: ayokoding-www:test:unit / In-body relative markdown links authored from a section index page resolve to real site routes
  @e2e-exempt
  Scenario: In-body relative markdown links authored from a section index page resolve to real site routes
    Given a section index page's markdown body contains a relative link to a sibling content file
    When the page is rendered to HTML
    Then the rendered link's href should be resolved relative to the section's own directory
    And the href should not contain a literal ".md" extension

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The Learn sidebar lists Paths, Courses, and Legacy in that order
  @integration-exempt
  Scenario: The Learn sidebar lists Paths, Courses, and Legacy in that order
    When a visitor opens the Learn home
    Then the entries under Learn in the sidebar are "Paths", "Courses", and "Legacy" in that order
