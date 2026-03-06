@links-check-oseplatform
Feature: Internal Link Validation for oseplatform-web

  As a content author
  I want to validate internal links in oseplatform-web content
  So that readers always reach the intended pages

  Scenario: A content directory with all valid internal links passes validation
    Given oseplatform-web content where all internal links resolve correctly
    When the developer runs links check
    Then the command exits successfully

  Scenario: A broken internal link is detected and reported
    Given oseplatform-web content with a link pointing to a non-existent page
    When the developer runs links check
    Then the command exits with a failure code

  Scenario: External URLs are not validated
    Given oseplatform-web content with only external HTTPS links
    When the developer runs links check
    Then the command exits successfully

  Scenario: JSON output produces structured results
    Given oseplatform-web content where all internal links resolve correctly
    When the developer runs links check with JSON output
    Then the command exits successfully
    And the output is valid JSON
