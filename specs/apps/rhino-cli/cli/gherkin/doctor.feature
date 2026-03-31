@doctor
Feature: Development Environment Health Check

  As a developer
  I want to verify that my local environment has all required tools installed
  So that development and build tasks run reliably

  Scenario: All required tools are installed and versions match
    Given all required development tools are present with matching versions
    When the developer runs the doctor command
    Then the command exits successfully
    And the output reports each tool as passing

  Scenario: A required tool is missing from the environment
    Given a required development tool is not found in the system PATH
    When the developer runs the doctor command
    Then the command exits with a failure code
    And the output identifies the missing tool

  Scenario: A tool is installed but its version does not match the requirement
    Given a required development tool is installed with a non-matching version
    When the developer runs the doctor command
    Then the command exits successfully
    And the output reports the tool as a warning rather than a failure

  Scenario: JSON output lists all tool check results
    Given all required development tools are present with matching versions
    When the developer runs the doctor command with JSON output
    Then the command exits successfully
    And the output is valid JSON
    And the JSON lists every checked tool with its status
