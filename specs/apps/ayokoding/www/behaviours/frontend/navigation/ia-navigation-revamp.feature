Feature: IA navigation revamp

  As a reader visiting AyoKoding after the information architecture revamp
  I want content to be reachable at its bare URL with proper navigation chrome
  So that I can browse and read content through the new URL structure

  Background:
    Given the app is running

  @e2e-home
  Scenario: English content resolves at its bare URL
    When a visitor navigates to "/en/learn/legacy/software-engineering"
    Then the page should respond with HTTP 200
    And a breadcrumb nav should be present

  @e2e-home
  # Behaviour: AYW-041
  Scenario: The browse index lists all content sections
    When a visitor navigates to "/en/browse"
    Then the page should load successfully
    And the browse index should show a section card for "learn"
    And the browse index should show a section card for "rants"
    And a breadcrumb nav should be present
    And the breadcrumb should start with a Home link

  @e2e-home
  # Behaviour: AYW-042
  Scenario: Header shows primary nav links on desktop
    Given the viewport is set to desktop width
    When a visitor navigates to "/en"
    Then the header primary nav should contain a link to "/en/browse" labelled "Learn"
    And the header primary nav should contain a link to "/en/tools" labelled "Tools"

  @e2e-home
  Scenario: Mobile navigation mirrors the header links
    Given the viewport is set to mobile width
    When a visitor navigates to "/en"
    And the visitor opens the mobile navigation menu
    Then the mobile nav should contain a link to "/en/browse" labelled "Learn"
    And the mobile nav should contain a link to "/en/tools" labelled "Tools"

  @e2e-home
  Scenario: Footer shows grouped navigation with localized labels
    When a visitor navigates to "/id"
    Then the footer should display a "Learn" column
    And the footer should display a "Tools" column
    And the footer should display an "About" column
    And the footer "About" column should link to "/id/tentang-ayokoding"
    And the footer "About" column should link to "/id/syarat-dan-ketentuan"

  @e2e-home
  Scenario: Landing homepage renders hero, sections, and tools teaser in English
    When a visitor navigates to "/en"
    Then the hero heading should be visible on the landing page
    And the hero intro should be visible on the landing page
    And the landing section grid should include a card linking to "/en/rants"
    And the tools teaser should link to "/en/tools/cost-of-living-calculator"

  @e2e-home
  Scenario: Landing homepage renders hero, sections, and tools teaser in Indonesian
    When a visitor navigates to "/id"
    Then the hero heading should be visible on the landing page
    And the hero intro should be visible on the landing page
    And the landing section grid should include a card linking to "/id/celoteh"
    And the tools teaser should link to "/id/tools/cost-of-living-calculator"

  @e2e-home
  Scenario: Breadcrumb segments link to their bare content URLs
    Given a visitor is on "/en/learn/legacy/software-engineering/data"
    When the breadcrumb renders its ancestor segments
    Then each ancestor crumb links to its bare content URL

  @e2e-home
  Scenario: Sidebar, breadcrumb, previous and next, and search links go straight to their page with no redirect
    Given the sidebar tree, breadcrumb, prev-next, and search results render content links
    When their hrefs are computed via the central content URL helper
    Then every content link resolves directly to its bare URL with status 200
    And no internal content link resolves through a 308 redirect

  # Behaviour: AYW-043
  Scenario: The sitemap lists every content page by its public URL on www.ayokoding.com
    Given the sitemap is generated from the content index
    When the sitemap entries are produced
    Then every moved-content entry uses a bare URL
    And every sitemap entry is on the canonical host "www.ayokoding.com"
    But top-level pages (about, terms, tools) use that same bare form — no longer namespace-distinct

  # Behaviour: AYW-044
  Scenario: RSS feed item links use bare content URLs
    Given the feed is generated from the content index
    When the feed items are produced
    Then every content item link uses a bare URL
    And every feed link is on the canonical host "www.ayokoding.com"

  @e2e-home
  # Behaviour: AYW-045
  Scenario: A content page declares its own URL as canonical, with language alternates on www.ayokoding.com
    Given the content page at "/en/learn/legacy/software-engineering"
    When its metadata is generated
    Then the canonical alternate is "/en/learn/legacy/software-engineering"
    And the language alternates include en and x-default
    And the canonical link and the language alternates are on the canonical host "www.ayokoding.com"

  # Behaviour: AYW-047
  Scenario: robots.txt allows crawling and names the sitemap
    When a search engine requests the robots.txt file
    Then every page of the site is open to crawling
    And the robots.txt file names the sitemap

  @e2e-home
  # Behaviour: AYW-048
  Scenario: A missing page shows Page Not Found with a Go Home link
    When a visitor opens a page that does not exist
    Then the reader sees a "Page Not Found" heading
    And the page offers a Go Home link to the English home page
