Feature: Figure coverage check
  As a pdf-to-md-checker agent
  I want to verify every figure reference has a representation in the Markdown
  So that diagrams are not silently dropped during conversion

  # Exemption(e2e): the CLI has no network, remote service, or credential boundary; its process boundary over local files is bound at integration; alternative-proof: crane-cli:test:integration / Crane process-boundary scenarios
  @e2e-exempt
  Scenario: Figure with Mermaid block produces no finding
    Given a PDF fixture referencing "Figure 1"
    And its Markdown with a Mermaid code block near that reference
    When I run "crane figure check" on the pair
    Then the JSON output is an empty array

  # Exemption(e2e): the CLI has no network, remote service, or credential boundary; its process boundary over local files is bound at integration; alternative-proof: crane-cli:test:integration / Crane process-boundary scenarios
  @e2e-exempt
  Scenario: Figure with placeholder produces no finding
    Given a PDF fixture referencing "Figure 2"
    And its Markdown with a "[FIGURE 2: ...]" placeholder
    When I run "crane figure check" on the pair
    Then the JSON output is an empty array

  # Behaviour: CRN-013
  # Exemption(e2e): the CLI has no network, remote service, or credential boundary; its process boundary over local files is bound at integration; alternative-proof: crane-cli:test:integration / Crane process-boundary scenarios
  @e2e-exempt
  Scenario: Figure with no representation produces a HIGH finding
    Given a PDF fixture referencing "Figure 3"
    And a Markdown with no Mermaid block or placeholder for Figure 3
    When I run "crane figure check" on the pair
    Then a finding with criticality "HIGH" is returned
