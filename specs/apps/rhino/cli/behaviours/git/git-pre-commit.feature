@pre-commit-hook
Feature: Pre-commit hook orchestration

  As a developer
  I want the pre-commit hook to orchestrate all pre-commit checks
  So that code quality is enforced consistently before every commit

  Note: the `git pre-commit` CLI command was removed in §2a-names (2026-06-26).
  Pre-commit steps now call rhino-cli commands directly from .husky/pre-commit
  (env staged-guard validate, harness bindings generate, etc.).

  Scenario: Broken-link detection in step 7 reports per-link details
    Given staged markdown files contain a link to a non-existent target
    When the pre-commit hook runs md links validate on staged files
    Then the command exits with a failure code
    And the stderr output identifies the source file containing the broken link
    And the stderr output identifies the line number of the broken link
    And the stderr output identifies the broken link target

  Scenario: staged-mermaid-blocks — staged malformed mermaid diagram blocks commit
    Given a staged markdown file under docs containing a mermaid diagram with a label exceeding the maximum length
    When the pre-commit hook runs md mermaid validate on the staged file
    Then the command exits with a failure code
    And the output indicates a mermaid violation was found

  Scenario: link-step-honors-exclusions — staged plans/done broken link does not block commit
    Given a staged markdown file under plans/done containing a broken internal link
    When the pre-commit hook runs md links validate on staged files
    Then the link validation step does not report a broken link for the plans/done file
