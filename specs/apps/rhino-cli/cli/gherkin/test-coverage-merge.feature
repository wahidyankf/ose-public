@test-coverage-merge
Feature: Coverage File Merging

  As a developer
  I want to merge multiple coverage files into one
  So that I can get a unified coverage view across test runs

  Scenario: Merging two LCOV files produces correct combined coverage
    Given two LCOV coverage files with different source files
    When the developer runs test-coverage merge with an output file
    Then the command exits successfully
    And the merged output file exists in LCOV format

  Scenario: Merging with validation passes when coverage meets threshold
    Given two LCOV coverage files with high coverage
    When the developer runs test-coverage merge with validation at 80% threshold
    Then the command exits successfully

  Scenario: Merging with validation fails when coverage is below threshold
    Given two LCOV coverage files with low coverage
    When the developer runs test-coverage merge with validation at 95% threshold
    Then the command exits with a failure code
