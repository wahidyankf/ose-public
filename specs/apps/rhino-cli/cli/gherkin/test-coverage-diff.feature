@test-coverage-diff
Feature: Diff Coverage Analysis

  As a developer
  I want to see coverage for only the lines I changed
  So that I can ensure new code is adequately tested

  Scenario: No changed lines reports 100% coverage
    Given a coverage file and no git changes
    When the developer runs test-coverage diff
    Then the command exits successfully
    And the output reports 100% coverage

  Scenario: Changed lines with full coverage pass threshold
    Given a coverage file where all changed lines are covered
    When the developer runs test-coverage diff with a threshold
    Then the command exits successfully

  Scenario: Changed lines with missing coverage fail threshold
    Given a coverage file where some changed lines are missed
    When the developer runs test-coverage diff with a high threshold
    Then the command exits with a failure code

  Scenario: Excluded files are not counted in diff coverage
    Given a coverage file and changes in excluded files
    When the developer runs test-coverage diff with exclusion
    Then the excluded files do not affect the diff coverage result
