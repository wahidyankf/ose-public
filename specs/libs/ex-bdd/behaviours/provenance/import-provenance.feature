Feature: BDD engine import provenance

  As a maintainer importing the BDD engine
  I want its original ownership and source history retained
  So that local maintenance does not erase upstream attribution

  # Exemption(e2e): the library has no public browser or HTTP boundary; alternative-proof: ex-bdd:test:integration / The import identifies its exact BeaverNest source
  @e2e-exempt
  Scenario: The import identifies its exact BeaverNest source
    Given the selected BeaverNest source revision is recorded
    When the tracked library subtree is imported
    Then the import record names the repository, source revision, and source path
    And the source owner and maintainer remain identified as BeaverNest and wahidyankf

  # Exemption(e2e): the library has no public browser or HTTP boundary; alternative-proof: ex-bdd:test:integration / The original license and fixture notices remain intact
  @e2e-exempt
  Scenario: The original license and fixture notices remain intact
    Given the source includes the original MIT license and compatibility-fixture notices
    When the library is imported
    Then the Micah Woods 2024 license text remains unchanged
    And the original Cucumber version and revision remain in the upstream record
    And the Cucumber Ltd and contributors 2020 fixture notice remains present

  # Exemption(e2e): the library has no public browser or HTTP boundary; alternative-proof: ex-bdd:test:integration / Local changes append to rather than replace upstream history
  @e2e-exempt
  Scenario: Local changes append to rather than replace upstream history
    Given the imported library needs repository-local adaptations
    When a maintainer records those adaptations
    Then the upstream record preserves the original history
    And it adds the actual import date, local changes, and manual future-update procedure

  # Exemption(e2e): the library has no public browser or HTTP boundary; alternative-proof: ex-bdd:test:integration / Compatibility fixtures do not become consumer acceptance tests
  @e2e-exempt
  Scenario: Compatibility fixtures do not become consumer acceptance tests
    Given retained compatibility fixtures include intentionally failing examples
    When a consumer discovers its configured application feature corpus
    Then only that consumer's canonical feature files join its acceptance suite
    And the retained compatibility fixtures stay under the engine's own fixture suite
