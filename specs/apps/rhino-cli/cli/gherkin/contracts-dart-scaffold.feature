@contracts-dart-scaffold
Feature: Dart Package Scaffolding for Generated Contracts

  As a developer using OpenAPI-generated Dart code
  I want the package scaffolding automatically created
  So that the generated models are importable as a Dart package

  Scenario: Normal scaffold with model files
    Given a generated-contracts directory with model Dart files
    When the developer runs contracts dart-scaffold on the directory
    Then the command exits successfully
    And pubspec.yaml is created with correct content
    And the barrel library is created with part directives for each model

  Scenario: Scaffold with no model files
    Given a generated-contracts directory with no model files
    When the developer runs contracts dart-scaffold on the directory
    Then the command exits successfully
    And pubspec.yaml is created
    And the barrel library is created without part directives

  Scenario: Scaffold overwrites existing files
    Given an existing generated-contracts directory with old scaffold files
    When the developer runs contracts dart-scaffold on the directory
    Then the command exits successfully
    And the existing files are overwritten with fresh scaffold
