@test-coverage-validate
Feature: Coverage Threshold Enforcement

  As a developer
  I want to verify that code coverage meets a required threshold
  So that the project maintains consistent test quality standards

  Scenario: A Go coverage file above the threshold reports success
    Given a Go coverage file recording 90% line coverage
    When the developer runs test-coverage validate with an 85% threshold
    Then the command exits successfully
    And the output reports the measured coverage percentage
    And the output indicates the coverage passes the threshold

  Scenario: A Go coverage file below the threshold reports failure
    Given a Go coverage file recording 70% line coverage
    When the developer runs test-coverage validate with an 85% threshold
    Then the command exits with a failure code
    And the output indicates the coverage fails the threshold

  Scenario: An LCOV file above the threshold reports success
    Given an LCOV coverage file recording 90% line coverage
    When the developer runs test-coverage validate with an 85% threshold
    Then the command exits successfully
    And the output indicates the coverage passes the threshold

  Scenario: Coverage at exactly the threshold passes
    Given a Go coverage file recording 85% line coverage
    When the developer runs test-coverage validate with an 85% threshold
    Then the command exits successfully

  Scenario: JSON output includes structured coverage metrics
    Given a Go coverage file recording 90% line coverage
    When the developer runs test-coverage validate with an 85% threshold requesting JSON output
    Then the command exits successfully
    And the output is valid JSON
    And the JSON includes the coverage percentage and pass/fail status

  Scenario: Per-file flag shows individual file coverage
    Given an LCOV coverage file with multiple source files
    When the developer runs test-coverage validate with an 85% threshold and per-file flag
    Then the command exits successfully
    And the output contains per-file coverage breakdown

  Scenario: A Cobertura XML file above the threshold reports success
    Given a Cobertura XML coverage file recording 90% line coverage
    When the developer runs test-coverage validate with an 85% threshold
    Then the command exits successfully
    And the output indicates the coverage passes the threshold

  Scenario: A Cobertura XML file with partial branches classifies correctly
    Given a Cobertura XML coverage file with partial branch coverage
    When the developer runs test-coverage validate with an 85% threshold
    Then the command exits with a failure code
    And the output indicates the coverage fails the threshold

  Scenario: Exclude flag removes files from coverage calculation
    Given an LCOV coverage file with multiple source files
    When the developer runs test-coverage validate with exclusion of a source file
    Then the command exits successfully
    And the output does not contain the excluded file

  Scenario: A non-existent coverage file reports an error
    Given no coverage file exists at the specified path
    When the developer runs test-coverage validate with an 85% threshold
    Then the command exits with a failure code
    And the output describes the missing file
