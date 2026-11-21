Feature: Heading level accuracy check
  As a pdf-to-md-checker agent
  I want to verify heading depths match PDF visual hierarchy
  So that document structure is faithfully represented

  # Behaviour: CRN-007
  # Exemption(e2e): the CLI has no network, remote service, or credential boundary; its process boundary over local files is bound at integration; alternative-proof: crane-cli:test:integration / Crane process-boundary scenarios
  @e2e-exempt
  Scenario: Section "2.3.1" expects H4 and MD has H3 — HIGH finding
    Given a PDF fixture where heading "2.3.1 Title" implies depth 4
    And the Markdown has that heading at depth 3
    When I run "crane heading check" on the pair
    Then a finding with criticality "HIGH" is returned
    And the finding states expected_depth 4 and found_depth 3

  # Exemption(e2e): the CLI has no network, remote service, or credential boundary; its process boundary over local files is bound at integration; alternative-proof: crane-cli:test:integration / Crane process-boundary scenarios
  @e2e-exempt
  Scenario: Correct heading depth produces no finding
    Given a PDF fixture where heading "2.3 Overview" implies depth 3
    And the Markdown has that heading at depth 3
    When I run "crane heading check" on the pair
    Then the JSON output is an empty array

  # Behaviour: CRN-006
  # Exemption(e2e): the CLI has no network, remote service, or credential boundary; its process boundary over local files is bound at integration; alternative-proof: crane-cli:test:integration / Crane process-boundary scenarios
  @e2e-exempt
  Scenario: Heading depth inference from section number
    Given the text "3.1.2 Details"
    When I run "crane heading infer" on that text
    Then the JSON output shows depth 4 and confidence "HIGH"
