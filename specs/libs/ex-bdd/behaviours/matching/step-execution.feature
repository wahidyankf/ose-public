Feature: Step execution

  As an Elixir application test author
  I want predictable step matching and failure diagnostics
  So that a failing behavior points to its actual cause

  Background:
    Given the library is imported

  # Exemption(e2e): the library has no public browser or HTTP boundary; alternative-proof: ex-bdd:test:integration / An expression passes typed arguments to its binding
  @e2e-exempt
  Scenario: An expression passes typed arguments to its binding
    Given a step expression contains supported string and numeric parameters
    When a matching scenario step executes
    Then its binding receives the extracted arguments in declaration order

  # Exemption(e2e): the library has no public browser or HTTP boundary; alternative-proof: ex-bdd:test:integration / A regular expression can bind a scenario step
  @e2e-exempt
  Scenario: A regular expression can bind a scenario step
    Given a regular-expression definition matches one scenario step
    When that scenario step executes
    Then the selected binding receives its captured values
    And the matching semantics remain those of the Elixir engine

  # Exemption(e2e): the library has no public browser or HTTP boundary; alternative-proof: ex-bdd:test:integration / A step context update reaches the following step
  @e2e-exempt
  Scenario: A step context update reaches the following step
    Given a step binding returns an updated scenario context
    When the next scenario step executes
    Then that step receives the updated context

  # Exemption(e2e): the library has no public browser or HTTP boundary; alternative-proof: ex-bdd:test:integration / A failing step prevents later scenario actions
  @e2e-exempt
  Scenario: A failing step prevents later scenario actions
    Given a scenario has an assertion failure followed by a state-changing step
    When the scenario executes
    Then the scenario reports the original failure and source location
    And the later state-changing step does not run

  # Exemption(e2e): the library has no public browser or HTTP boundary; alternative-proof: ex-bdd:test:integration / Scenario contexts remain isolated
  @e2e-exempt
  Scenario: Scenario contexts remain isolated
    Given two scenarios use the same step definitions
    When one scenario changes its context
    Then the other scenario does not receive that changed context
