Feature: Mermaid block validation
  As a pdf-to-md-checker agent
  I want to validate Mermaid syntax in the Markdown
  So that generated diagrams are renderable

  # Behaviour: CRN-014
  # Exemption(e2e): the CLI has no network, remote service, or credential boundary; its process boundary over local files is bound at integration; alternative-proof: crane-cli:test:integration / Crane process-boundary scenarios
  @e2e-exempt
  Scenario Outline: valid Mermaid produces no finding
    Given a Markdown fixture with a syntactically valid "<diagram>" block
    When I run "crane mermaid validate" on the fixture
    Then the JSON output is an empty array
    And the exit code is 0

    Examples:
      | diagram            |
      | graph TD           |
      | graph              |
      | flowchart          |
      | sequenceDiagram    |
      | stateDiagram       |
      | stateDiagram-v2    |
      | classDiagram       |
      | gantt              |
      | pie                |
      | erDiagram          |
      | journey            |
      | gitGraph           |
      | mindmap            |
      | timeline           |
      | quadrantChart      |
      | xychart-beta       |
      | sankey-beta        |
      | block-beta         |
      | architecture-beta  |

  # Behaviour: CRN-014
  # Exemption(e2e): the CLI has no network, remote service, or credential boundary; its process boundary over local files is bound at integration; alternative-proof: crane-cli:test:integration / Crane process-boundary scenarios
  @e2e-exempt
  Scenario: Unknown diagram type produces a HIGH finding
    Given a Markdown fixture with a Mermaid block starting with "xyz"
    When I run "crane mermaid validate" on the fixture
    Then a finding with criticality "HIGH" and category "mermaid-syntax" is returned
    And the exit code is 1

  # Exemption(e2e): the CLI has no network, remote service, or credential boundary; its process boundary over local files is bound at integration; alternative-proof: crane-cli:test:integration / Crane process-boundary scenarios
  @e2e-exempt
  Scenario: Unmatched bracket produces a HIGH finding
    Given a Markdown fixture with a Mermaid block containing unbalanced "["
    When I run "crane mermaid validate" on the fixture
    Then a finding with criticality "HIGH" is returned
    And the finding description mentions "bracket"
