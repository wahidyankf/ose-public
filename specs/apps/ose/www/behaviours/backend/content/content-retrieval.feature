Feature: Content Retrieval
  As a web client
  I want to retrieve and list markdown content pages
  So that I can render the correct page or listing with all required metadata

  Background:
    Given the API is running

  # Behaviour: OSW-009
  Scenario: Retrieve a page by slug
    Given the content repository contains a page with slug "about"
    When the content service retrieves the page by slug "about"
    Then the response contains the page title
    And the response contains rendered HTML content
    And the response contains extracted headings

  # Behaviour: OSW-010
  Scenario: Updates are listed newest first
    Given the content repository contains multiple update posts
    When the content service lists all updates
    Then the updates are returned sorted by date descending

  # Behaviour: OSW-010
  Scenario: Each update shows title, date, summary, and tags
    Given the content repository contains multiple update posts
    When the content service lists all updates
    Then each update contains title, date, summary, and tags

  # Behaviour: OSW-026
  Scenario: Draft pages are excluded from listings
    Given the content repository contains a draft page
    And the OSE_WEB_SHOW_DRAFTS environment variable is not set
    When the content service lists all updates
    Then the draft page is not included in the results

  # Behaviour: OSW-009
  Scenario: Non-existent slug returns null
    Given the content repository contains no page with slug "nonexistent"
    When the content service retrieves the page by slug "nonexistent"
    Then the response is null

  # Behaviour: OSW-002
  Scenario: The About page renders at /about with its title and content
    Given the content repository contains a page with slug "about"
    When a visitor opens the About page
    Then the page heading is the title of the About page
    And the page shows the headings of the About page

  # Behaviour: OSW-003
  Scenario: The Updates page lists the published updates newest first
    Given the content repository contains multiple update posts
    When a visitor opens the Updates page
    Then the update titles are listed newest first

  # Behaviour: OSW-005
  Scenario: Opening an unknown update URL returns 404
    When a visitor opens the update page for the slug "no-such-update"
    Then the response status is 404

  # Exemption(e2e): the e2e home starts one server that reads OSE_WEB_SHOW_DRAFTS once at process start and starts it with the variable false, so no public request reaches the true setting; alternative-proof: ose-www:test:unit / Setting OSE_WEB_SHOW_DRAFTS to true includes draft pages in listings
  @e2e-exempt
  # Behaviour: OSW-026
  Scenario: Setting OSE_WEB_SHOW_DRAFTS to true includes draft pages in listings
    Given the content repository contains a draft page
    And the OSE_WEB_SHOW_DRAFTS environment variable is "true"
    When the content service lists all updates
    Then the draft page is included in the results

  # Behaviour: OSW-024
  Scenario: Content is read from the directory named by OSE_WEB_CONTENT_DIR
    Given the OSE_WEB_CONTENT_DIR environment variable names the content directory
    When the content service lists all updates
    Then every listed update is read from that directory

  # Behaviour: OSW-025
  Scenario: Search reads the index at the path named by OSE_WEB_SEARCH_DATA_PATH
    Given the OSE_WEB_SEARCH_DATA_PATH environment variable names a search index file
    When a search query "synthetic" is executed
    Then the results contain the page indexed in that file
