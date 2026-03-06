@nav-regen
Feature: Navigation Regeneration

  As a content author
  I want to regenerate navigation listings in _index.md files
  So that readers can browse content sections

  Scenario: A content directory with index files regenerates successfully
    Given a content directory with _index.md files
    When the developer runs nav regen
    Then the command exits successfully
    And the output reports files processed

  Scenario: A non-existent directory causes a failure
    Given a content directory that does not exist
    When the developer runs nav regen
    Then the command exits with a failure code

  Scenario: JSON output produces structured results
    Given a content directory with _index.md files
    When the developer runs nav regen with JSON output
    Then the command exits successfully
    And the output is valid JSON with status success

  Scenario: Quiet mode suppresses output
    Given a content directory with _index.md files
    When the developer runs nav regen in quiet mode
    Then the command exits successfully
    And no output is produced

  Scenario: A positional path argument works the same as the flag
    Given a content directory with _index.md files
    When the developer runs nav regen with a positional path
    Then the command exits successfully
