Feature: Navigation
  As a site visitor
  I want clear navigation across all sections of the platform
  So that I can move between pages without losing my place

  Background:
    Given the app is running

  # Exemption(integration): the local-resource boundary cannot observe rendered browser navigation without crossing the public browser boundary; alternative-proof: ose-www-fe-e2e:test:e2e / Header contains navigation links
  @integration-exempt
  Scenario: Header contains navigation links
    When the header component is rendered
    Then the header contains a link to "Updates" at "/updates/"
    And the header contains a link to "About" at "/about/"
    And the header contains an external link to "Documentation"
    And the header contains an external link to "GitHub"

  # Exemption(integration): the local-resource boundary cannot observe rendered breadcrumb layout without crossing the public browser boundary; alternative-proof: ose-www-fe-e2e:test:e2e / Breadcrumb shows ancestor hierarchy without current page
  @integration-exempt
  Scenario: Breadcrumb shows ancestor hierarchy without current page
    When the about page is rendered with breadcrumbs
    Then the breadcrumb shows "Home" linking to "/"
    And the current page should not appear in the breadcrumb
    And all breadcrumb segments should be clickable links
    And breadcrumb text should wrap naturally without horizontal truncation

  # Exemption(integration): the local-resource boundary cannot observe browser link navigation without crossing the public browser boundary; alternative-proof: ose-www-fe-e2e:test:e2e / Previous and next navigation between updates
  @integration-exempt
  Scenario: Previous and next navigation between updates
    When an update detail page is rendered with adjacent updates
    Then a "Previous" link is displayed with the previous update title
    And a "Next" link is displayed with the next update title

  # Exemption(integration): the local-resource boundary cannot observe the rendered footer link without crossing the public browser boundary; alternative-proof: ose-www-fe-e2e:test:e2e / Footer links to AyoKoding on its canonical host
  @integration-exempt
  Scenario: Footer links to AyoKoding on its canonical host
    When the footer component is rendered
    Then the footer contains an external link to "AyoKoding" on the canonical host "www.ayokoding.com"
