@hugo-commons
Feature: Hugo Site Link Checking

  As a Hugo site maintainer
  I want to validate all internal links across my content directory
  So that readers never encounter dead links

  Scenario: A content directory with all valid internal links passes validation
    Given a Hugo content directory where all internal links resolve to existing pages
    When the developer checks links in the content directory
    Then the check completes with zero broken links
    And the text output contains the link check summary

  Scenario: A content directory with broken internal links reports the broken link
    Given a Hugo content directory containing a broken internal link
    When the developer checks links in the content directory
    Then the check completes with one broken link reported
    And the text output contains the broken links section

  Scenario: Link checker produces valid JSON output for a clean site
    Given a Hugo content directory where all internal links resolve to existing pages
    When the developer checks links and requests JSON output
    Then the JSON output contains a success status field

  Scenario: Link checker produces Markdown output for a site with broken links
    Given a Hugo content directory containing a broken internal link
    When the developer checks links and requests Markdown output
    Then the Markdown output shows FAIL status with a broken links table

  Scenario: A bilingual Hugo site with links in both language subdirectories passes validation
    Given a bilingual Hugo content directory with English and Indonesian content
    When the developer checks links in the content directory
    Then the check completes with zero broken links
