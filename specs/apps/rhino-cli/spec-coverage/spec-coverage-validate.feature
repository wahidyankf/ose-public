@spec-coverage-validate
Feature: BDD Spec-to-Test Coverage Validation

  As a developer
  I want to ensure every Gherkin feature file has a matching test implementation
  So that new specs are never silently skipped

  Scenario: All feature files have matching test implementations
    Given a specs directory where every feature file has a corresponding test file
    When the developer runs spec-coverage validate on the specs and app directories
    Then the command exits successfully
    And the output reports all specs as covered

  Scenario: A feature file without a matching test is reported as a gap
    Given a specs directory containing a feature file with no corresponding test file
    When the developer runs spec-coverage validate on the specs and app directories
    Then the command exits with a failure code
    And the output identifies the feature file as an uncovered spec

  Scenario: A scenario without a matching implementation is reported as a gap
    Given a feature file with a scenario whose title does not appear in any test file
    When the developer runs spec-coverage validate on the specs and app directories
    Then the command exits with a failure code
    And the output identifies the scenario as an unimplemented scenario

  Scenario: A step without a matching step definition is reported as a gap
    Given a feature file with a step text that does not appear in any test file
    When the developer runs spec-coverage validate on the specs and app directories
    Then the command exits with a failure code
    And the output identifies the step as an undefined step
