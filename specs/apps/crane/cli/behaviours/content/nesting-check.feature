Feature: Content nesting accuracy check
  As a pdf-to-md-checker agent
  I want to verify list nesting depths match the PDF layout
  So that nested content hierarchy is faithfully represented

  # Exemption(e2e): the CLI has no network, remote service, or credential boundary; its process boundary over local files is bound at integration; alternative-proof: crane-cli:test:integration / Crane process-boundary scenarios
  @e2e-exempt
  Scenario: Correct single-level list produces no finding
    Given a PDF fixture with a single-level bullet list
    And its Markdown conversion with matching single-level nesting
    When I run "crane nesting check" on the pair
    Then the JSON output is an empty array

  # Behaviour: CRN-009
  # Exemption(e2e): the CLI has no network, remote service, or credential boundary; its process boundary over local files is bound at integration; alternative-proof: crane-cli:test:integration / Crane process-boundary scenarios
  @e2e-exempt
  Scenario: Inverted nesting detected as HIGH finding
    Given a PDF fixture where nested items appear under a parent
    And a Markdown with those items at the wrong nesting level
    When I run "crane nesting check" on the pair
    Then a finding with criticality "HIGH" is returned

  # Exemption(e2e): the CLI has no network, remote service, or credential boundary; its process boundary over local files is bound at integration; alternative-proof: crane-cli:test:integration / Crane process-boundary scenarios
  @e2e-exempt
  Scenario: Off-by-one nesting detected as MEDIUM finding
    Given a PDF fixture with two-level nesting
    And a Markdown with the second level at depth three instead of two
    When I run "crane nesting check" on the pair
    Then a finding with criticality "MEDIUM" is returned

  # Behaviour: CRN-008
  # Exemption(e2e): the CLI has no network, remote service, or credential boundary; its process boundary over local files is bound at integration; alternative-proof: crane-cli:test:integration / Crane process-boundary scenarios
  @e2e-exempt
  Scenario: Nesting inference lists each list item with its nesting level
    Given a PDF fixture where nested items appear under a parent
    When I run "crane nesting infer" on the PDF fixture
    Then the JSON output lists "child" at nesting level 2
