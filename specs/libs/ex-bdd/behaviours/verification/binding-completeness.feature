Feature: Static binding completeness

  As an application maintainer
  I want missing or ambiguous behavior bindings rejected before runtime
  So that static coverage cannot pass for an unproved contract

  Background:
    Given the library is imported

  # Exemption(e2e): the library has no public browser or HTTP boundary; alternative-proof: ex-bdd:test:integration / A complete corpus verifies without executing steps
  @e2e-exempt
  Scenario: A complete corpus verifies without executing steps
    Given a non-empty corpus has explicit actions and outcomes with exactly one binding per step
    When the engine statically verifies the corpus
    Then verification succeeds with a positive scenario and step count
    And none of the scenario's step actions executes

  # Exemption(e2e): the library has no public browser or HTTP boundary; alternative-proof: ex-bdd:test:integration / An empty feature selection fails verification
  @e2e-exempt
  Scenario: An empty feature selection fails verification
    Given the configured feature selection contains no executable scenario
    When the engine statically verifies the selection
    Then verification fails with an empty-corpus diagnostic

  # Exemption(e2e): the library has no public browser or HTTP boundary; alternative-proof: ex-bdd:test:integration / A scenario must state an explicit action and outcome
  @e2e-exempt
  Scenario Outline: A scenario must state an explicit action and outcome
    Given an expanded scenario is missing its explicit "<keyword>" step
    When the engine statically verifies the corpus
    Then verification fails and identifies that scenario's missing "<keyword>" phase

    Examples:
      | keyword |
      | When    |
      | Then    |

  # Exemption(e2e): the library has no public browser or HTTP boundary; alternative-proof: ex-bdd:test:integration / A step without a binding fails verification
  @e2e-exempt
  Scenario: A step without a binding fails verification
    Given a scenario contains a step with no matching definition
    When the engine statically verifies the corpus
    Then verification fails and identifies the undefined step and source location

  # Exemption(e2e): the library has no public browser or HTTP boundary; alternative-proof: ex-bdd:test:integration / Multiple matching definitions fail verification
  @e2e-exempt
  Scenario: Multiple matching definitions fail verification
    Given a scenario step matches two definitions
    When the engine statically verifies the corpus
    Then verification fails with an ambiguous-binding diagnostic
    And neither definition is accepted as the unique proof

  # Exemption(e2e): the library has no public browser or HTTP boundary; alternative-proof: ex-bdd:test:integration / An unused definition fails completeness verification
  @e2e-exempt
  Scenario: An unused definition fails completeness verification
    Given the configured definitions include a binding unused by the selected corpus
    When the engine statically verifies the corpus
    Then completeness verification fails and identifies the unused definition

  # Exemption(e2e): the library has no public browser or HTTP boundary; alternative-proof: ex-bdd:test:integration / Outline examples participate in binding verification
  @e2e-exempt
  Scenario: Outline examples participate in binding verification
    Given one outline example expands to a step with no matching definition
    When the engine statically verifies the corpus
    Then verification fails for that expanded example
    And valid neighboring examples do not hide the missing proof
