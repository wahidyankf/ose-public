Feature: SEO
  As a search engine
  I want access to accurate SEO artifacts from the platform
  So that all public pages are indexed and crawlable

  Background:
    Given the API is running

  Scenario: Sitemap contains all public pages
    Given the content repository contains public pages
    When the sitemap is generated
    Then the sitemap contains a URL for the landing page
    And the sitemap contains a URL for the about page
    And the sitemap contains URLs for all update pages
    And every sitemap URL is on the canonical host "www.oseplatform.com"

  # Exemption(integration): the robots contract has no local resource boundary and is observable only through the public HTTP response; alternative-proof: ose-www-be-e2e:test:e2e / Robots.txt allows all crawlers
  @integration-exempt
  Scenario: Robots.txt allows all crawlers
    When the robots.txt is generated
    Then it allows all user agents
    And it references the sitemap URL
    And the sitemap URL is on the canonical host "www.oseplatform.com"
