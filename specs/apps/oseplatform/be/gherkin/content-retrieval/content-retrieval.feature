Feature: Content Retrieval
  As a web client
  I want to retrieve and list markdown content pages
  So that I can render the correct page or listing with all required metadata

  Background:
    Given the API is running

  Scenario: Retrieve a page by slug
    Given the content repository contains a page with slug "about"
    When the content service retrieves the page by slug "about"
    Then the response contains the page title
    And the response contains rendered HTML content
    And the response contains extracted headings

  Scenario: List all update posts sorted by date
    Given the content repository contains multiple update posts
    When the content service lists all updates
    Then the updates are returned sorted by date descending
    And each update contains title, date, summary, and tags

  Scenario: Draft pages are excluded from listings
    Given the content repository contains a draft page
    And the SHOW_DRAFTS environment variable is not set
    When the content service lists all updates
    Then the draft page is not included in the results

  Scenario: Non-existent slug returns null
    Given the content repository contains no page with slug "nonexistent"
    When the content service retrieves the page by slug "nonexistent"
    Then the response is null
