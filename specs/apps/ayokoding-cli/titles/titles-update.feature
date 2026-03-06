@titles-update
Feature: Title Update

  As a content author
  I want to update title frontmatter fields from filenames
  So that content titles stay consistent with file organization

  Scenario: Updating titles in a content directory exits successfully
    Given a content directory with markdown files needing title updates
    When the developer runs titles update
    Then the command exits successfully
    And the output reports title update complete

  Scenario: Dry-run mode previews changes without writing files
    Given a content directory with markdown files needing title updates
    When the developer runs titles update with dry-run flag
    Then the command exits successfully

  Scenario: JSON output produces structured results
    Given a content directory with markdown files needing title updates
    When the developer runs titles update with JSON output
    Then the command exits successfully
    And the output is valid JSON with status success

  Scenario: An invalid language value causes a failure
    Given any content setup
    When the developer runs titles update with an invalid language
    Then the command exits with a failure code
