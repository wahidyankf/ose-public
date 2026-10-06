Feature: IA navigation revamp

  As a reader visiting AyoKoding after the information architecture revamp
  I want content to be reachable at its bare URL with proper navigation chrome
  So that I can browse and read content through the new URL structure

  Background:
    Given the app is running

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / English content resolves at its bare URL
  @integration-exempt
  Scenario: English content resolves at its bare URL
    When a visitor navigates to "/en/learn/legacy/software-engineering"
    Then the page should respond with HTTP 200
    And a breadcrumb nav should be present

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The browse index lists all content sections
  @integration-exempt
  Scenario: The browse index lists all content sections
    When a visitor navigates to "/en/browse"
    Then the page should load successfully
    And the browse index should show a section card for "learn"
    And the browse index should show a section card for "rants"
    And a breadcrumb nav should be present
    And the breadcrumb should start with a Home link

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Header shows primary nav links on desktop
  @integration-exempt
  Scenario: Header shows primary nav links on desktop
    Given the viewport is set to desktop width
    When a visitor navigates to "/en"
    Then the header primary nav should contain a link to "/en/browse" labelled "Learn"
    And the header primary nav should contain a link to "/en/tools" labelled "Tools"

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Mobile navigation mirrors the header links
  @integration-exempt
  Scenario: Mobile navigation mirrors the header links
    Given the viewport is set to mobile width
    When a visitor navigates to "/en"
    And the visitor opens the mobile navigation menu
    Then the mobile nav should contain a link to "/en/browse" labelled "Learn"
    And the mobile nav should contain a link to "/en/tools" labelled "Tools"

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Footer shows grouped navigation with localized labels
  @integration-exempt
  Scenario: Footer shows grouped navigation with localized labels
    When a visitor navigates to "/id"
    Then the footer should display a "Learn" column
    And the footer should display a "Tools" column
    And the footer should display an "About" column
    And the footer "About" column should link to "/id/tentang-ayokoding"
    And the footer "About" column should link to "/id/syarat-dan-ketentuan"

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Landing homepage renders hero, sections, and tools teaser in English
  @integration-exempt
  Scenario: Landing homepage renders hero, sections, and tools teaser in English
    When a visitor navigates to "/en"
    Then the hero heading should be visible on the landing page
    And the hero intro should be visible on the landing page
    And the landing section grid should include a card linking to "/en/rants"
    And the tools teaser should link to "/en/tools/cost-of-living-calculator"

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Landing homepage renders hero, sections, and tools teaser in Indonesian
  @integration-exempt
  Scenario: Landing homepage renders hero, sections, and tools teaser in Indonesian
    When a visitor navigates to "/id"
    Then the hero heading should be visible on the landing page
    And the hero intro should be visible on the landing page
    And the landing section grid should include a card linking to "/id/celoteh"
    And the tools teaser should link to "/id/tools/cost-of-living-calculator"

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Breadcrumb segments link to their bare content URLs
  @integration-exempt
  Scenario: Breadcrumb segments link to their bare content URLs
    Given a visitor is on "/en/learn/legacy/software-engineering/data"
    When the breadcrumb renders its ancestor segments
    Then each ancestor crumb links to its bare content URL

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Internal content links emit bare URLs directly without relying on redirects
  @integration-exempt
  Scenario: Internal content links emit bare URLs directly without relying on redirects
    Given the sidebar tree, breadcrumb, prev-next, and search results render content links
    When their hrefs are computed via the central content URL helper
    Then every content link resolves directly to its bare URL with status 200
    And no internal content link resolves through a 308 redirect

  Scenario: Sitemap lists every content URL bare, with no distinct content namespace
    Given the sitemap is generated from the content index
    When the sitemap entries are produced
    Then every moved-content entry uses a bare URL
    And every sitemap entry is on the canonical host "www.ayokoding.com"
    But top-level pages (about, terms, tools) use that same bare form — no longer namespace-distinct

  Scenario: RSS feed item links use bare content URLs
    Given the feed is generated from the content index
    When the feed items are produced
    Then every content item link uses a bare URL
    And every feed link is on the canonical host "www.ayokoding.com"

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Canonical link for moved content points to its bare URL
  @integration-exempt
  Scenario: Canonical link for moved content points to its bare URL
    Given the content page at "/en/learn/legacy/software-engineering"
    When its metadata is generated
    Then the canonical alternate is "/en/learn/legacy/software-engineering"
    And the language alternates include en and x-default
    And the canonical link and the language alternates are on the canonical host "www.ayokoding.com"
