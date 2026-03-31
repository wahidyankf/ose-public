@git-pre-commit
Feature: Pre-commit hook orchestration

  As a developer
  I want rhino-cli git pre-commit to orchestrate all pre-commit checks
  So that code quality is enforced consistently before every commit

  Scenario: Running pre-commit outside a git repository fails
    Given the developer is outside a git repository
    When the developer runs rhino-cli git pre-commit
    Then the command exits with a failure code
    And the output mentions that a git repository was not found
