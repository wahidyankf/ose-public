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
