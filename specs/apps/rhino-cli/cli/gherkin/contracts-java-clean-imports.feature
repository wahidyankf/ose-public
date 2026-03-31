@contracts-java-clean-imports
Feature: Java Import Cleaning for Generated Contracts

  As a developer using OpenAPI-generated Java code
  I want unused and same-package imports automatically removed
  So that the generated code compiles cleanly without IDE warnings

  Scenario: Unused imports are removed from generated Java files
    Given a generated-contracts directory with Java files containing unused imports
    When the developer runs contracts java-clean-imports on the directory
    Then the command exits successfully
    And unused imports are removed from the Java files

  Scenario: Same-package imports are removed from generated Java files
    Given a generated-contracts directory with Java files containing same-package imports
    When the developer runs contracts java-clean-imports on the directory
    Then the command exits successfully
    And same-package imports are removed from the Java files

  Scenario: Duplicate imports are deduplicated
    Given a generated-contracts directory with Java files containing duplicate imports
    When the developer runs contracts java-clean-imports on the directory
    Then the command exits successfully
    And only one copy of each import remains

  Scenario: Files with only required imports are unchanged
    Given a generated-contracts directory with Java files having only required imports
    When the developer runs contracts java-clean-imports on the directory
    Then the command exits successfully
    And the Java files are unchanged

  Scenario: Empty directory produces no errors
    Given an empty generated-contracts directory
    When the developer runs contracts java-clean-imports on the directory
    Then the command exits successfully
    And the command reports no files modified
