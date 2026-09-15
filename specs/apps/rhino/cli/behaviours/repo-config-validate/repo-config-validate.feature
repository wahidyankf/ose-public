@repo-config-validate
Feature: Schema-parity gate for repo-config.yml

  As a maintainer keeping rhino-cli byte-identical across ose-public and the private sibling
  I want a "repo-config validate" command that strict-deserializes repo-config.yml
  So that both repo-config.yml files are guaranteed to carry an identical key set

  Scenario: A schema-parity gate enforces the identical key set
    Given "rhino-cli repo-config validate" in each repo's pre-commit and pre-push/PR
    When repo-config.yml is validated
    Then the command strict-deserializes it against the canonical RepoConfig schema
    And it passes when only values differ
    And it fails when a required key is missing or an unknown key is present
    And running it independently against the byte-identical schema in both repos is equivalent to an identical key set across both repo-config.yml files

  Scenario: The registry declares the Codex skills mirror and its vendored exclusions
    Given the canonical repo-config.yml
    When the codex harness entry is inspected
    Then it declares ".agents/skills" as a mirror of ".claude/skills"
    And it declares every vendored skill subdirectory
    And each vendored entry names the plugin it came from
    And the schema rejects a typo'd key inside the vendored declaration

  Scenario: There is no fourth ownership class and no undeclared reason
    Given the canonical repo-config.yml
    When the harness ownership declarations are inspected
    Then every binding path a harness entry claims carries exactly one of the classes "generated", "vendored", or "source"
    And a registry entry declaring a fourth class value fails to deserialize
    And a vendored declaration carrying an empty reason fails validation
    And the canonical config carrying a non-empty reason on every vendored declaration exits 0

  Scenario: A vendored ownership declaration under skills-dir requires a matching vendored entry
    Given a synthetic registry entry whose skills-dir vendored path is declared in both hand-maintained lists
    When the vendored: entry for that path is removed
    Then rhino-cli repo-config validate fails naming the ownership path with no matching vendored entry
    And it exits 0 once the vendored entry is restored, proving the check is falsifiable in both directions

  Scenario: A vendored entry under skills-dir requires a matching ownership declaration
    Given a synthetic registry entry whose skills-dir vendored path is declared in both hand-maintained lists
    When the matching "class: vendored" ownership declaration for that path is changed to another class
    Then rhino-cli repo-config validate fails naming the vendored entry with no matching ownership declaration
    And it exits 0 once the ownership declaration is restored to "class: vendored", proving the check is falsifiable in both directions
