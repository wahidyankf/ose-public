Feature: Search
  As a site visitor
  I want to search across all platform content
  So that I can quickly find relevant pages and updates

  Background:
    Given the API is running

  Scenario: Search returns matching results
    Given the search index contains pages about "enterprise" and "compliance"
    When a search query "enterprise" is executed
    Then the results contain pages matching "enterprise"
    And each result contains a title, slug, and excerpt

  Scenario: Search with no matches returns empty results
    Given the search index contains pages about "enterprise" and "compliance"
    When a search query "nonexistent-term-xyz" is executed
    Then the results are empty

  Scenario: Search results respect the limit parameter
    Given the search index contains 5 pages matching "phase"
    When a search query "phase" is executed with limit 2
    Then at most 2 results are returned
