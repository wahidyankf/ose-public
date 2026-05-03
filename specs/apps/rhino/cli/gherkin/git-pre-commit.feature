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

  Scenario: Broken-link detection in step 7 reports per-link details
    Given staged markdown files contain a link to a non-existent target
    When the developer runs rhino-cli git pre-commit
    Then the command exits with a failure code
    And the stderr output identifies the source file containing the broken link
    And the stderr output identifies the line number of the broken link
    And the stderr output identifies the broken link target
