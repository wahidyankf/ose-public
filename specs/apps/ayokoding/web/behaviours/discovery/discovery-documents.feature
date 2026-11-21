Feature: Published-content discovery

  As a reader or content crawler
  I want accurate discovery documents
  So that published pages can be found without exposing drafts or missing routes

  Background:
    Given the app is running

  Scenario: A content page carries its title, description, and canonical URL
    When a reader requests a published content page
    Then its HTML contains the current title, description, and canonical URL

  Scenario: Alternate-language links list only available translations
    When a reader requests a published content page
    Then alternate-language links identify only available translations

  # Behaviour: AYB-026
  Scenario: The sitemap reflects the current published corpus
    Given the corpus contains published pages, draft pages, and a removed page
    When a crawler requests the sitemap
    Then it receives a successful XML sitemap response
    And the sitemap lists canonical published routes
    And draft and removed routes are absent

  # Behaviour: AYB-027
  Scenario: The feed exposes the current published entries
    When a reader requests the RSS feed
    Then it receives a successful XML feed response
    And feed entries have the existing ordering, metadata, and canonical destinations
    And draft pages are absent

  # Behaviour: AYB-028
  Scenario: Robots instructions retain the current crawling contract
    When a crawler requests the robots document
    Then it receives a successful plain-text robots response
    And the crawling directives and sitemap reference match the current site contract
