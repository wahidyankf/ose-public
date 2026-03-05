@validate-docs-links
Feature: Markdown Internal Link Validation

  As a documentation author
  I want to detect broken internal links in markdown files
  So that readers always reach the intended documents

  Scenario: A document set with all valid internal links passes validation
    Given markdown files where all internal links point to existing files
    When the developer runs validate-docs-links
    Then the command exits successfully
    And the output reports no broken links found

  Scenario: A broken internal link is detected and reported
    Given a markdown file with a link pointing to a non-existent file
    When the developer runs validate-docs-links
    Then the command exits with a failure code
    And the output identifies the file containing the broken link

  Scenario: External URLs are not validated
    Given a markdown file containing only external HTTPS links
    When the developer runs validate-docs-links
    Then the command exits successfully
    And the output reports no broken links found

  Scenario: With --staged-only only staged files are checked
    Given a markdown file with a broken link that has not been staged in git
    When the developer runs validate-docs-links with the --staged-only flag
    Then the command exits successfully
