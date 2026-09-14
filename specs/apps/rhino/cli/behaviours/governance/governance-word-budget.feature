@governance-word-budget
Feature: Governance word budget

  As an AI coding agent
  I want every governance file kept under a word ceiling
  So that I can hold the whole rule in context without silent truncation

  Background:
    Given repo-config.yml declares a governance-word-budget section
    And the section sets target 650, warn 750, fail 750

  # Exemption(e2e): the ordered word-budget surface collection is parsed repository configuration state and no public command renders that collection; alternative-proof: rhino-cli:test:integration / The covered surfaces are exactly the live entry points of the supported harnesses
  @e2e-exempt
  Scenario: The covered surfaces are exactly the live entry points of the supported harnesses
    When I read repo-config.yml
    Then the covered surface globs are exactly the harness entry points and the README glob
    And the README glob is declared last

  Scenario: The config schema rejects an exemption key
    Given repo-config.yml adds "exempt: [AGENTS.md]" under governance-word-budget
    When the developer runs repo-config schema validate
    Then the word-budget command exits with a failure code

  Scenario: The old command is gone
    When the developer runs harness instruction-size validate
    Then the command exits with a usage error
    And the output reports an unknown subcommand

  # Exemption(e2e): absence of the retired YAML key is repository configuration state and no public command renders raw configuration keys; alternative-proof: rhino-cli:test:integration / The old config block is gone
  @e2e-exempt
  Scenario: The old config block is gone
    When I read repo-config.yml
    Then it contains no "instruction-size:" section
    And it contains a "governance-word-budget:" section

  Scenario: The old gate id is replaced by the armed word-budget gate
    When the developer runs gate list with surface pre-push and format text
    Then the output contains no gate id "instruction-size"
    And the output contains gate id "governance-word-budget"

  # Exemption(e2e): a passing resolved-tree total is internal policy state intentionally omitted from successful public command output; alternative-proof: rhino-cli:test:integration / The resolved tree is measured in words
  @e2e-exempt
  Scenario: The resolved tree is measured in words
    Given "CLAUDE.md" contains 480 words
    And "CLAUDE.md" imports "AGENTS.md" via an @-directive
    And "AGENTS.md" contains 490 words
    When the developer runs governance word-budget validate
    Then the word-budget command exits successfully
    And the reported resolved-tree word count is 970

  Scenario: An oversized resolved tree fails
    Given the resolved CLAUDE.md tree totals 1600 words
    When the developer runs governance word-budget validate
    Then the word-budget command exits with a failure code
    And the output contains a "fail" finding for the resolved tree

  # Exemption(e2e): the cycle guard's per-file visit count is internal traversal state absent from public command output; alternative-proof: rhino-cli:test:integration / Import cycles terminate
  @e2e-exempt
  Scenario: Import cycles terminate
    Given "CLAUDE.md" imports "AGENTS.md"
    And "AGENTS.md" imports "CLAUDE.md"
    When the developer runs governance word-budget validate
    Then the command terminates
    And each file is counted at most once

  Scenario: No inbound link to the renamed convention is left broken
    When the developer runs md links validate
    Then the word-budget command exits successfully
