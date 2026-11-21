Feature: Text completeness validation
  As a pdf-to-md-checker agent
  I want to verify that all PDF text exists in the Markdown
  So that no content is silently lost during conversion

  # Behaviour: CRN-004
  # Behaviour: CRN-027
  # Exemption(e2e): the CLI has no network, remote service, or credential boundary; its process boundary over local files is bound at integration; alternative-proof: crane-cli:test:integration / Crane process-boundary scenarios
  @e2e-exempt
  Scenario: Complete conversion produces no findings
    Given a PDF fixture and its complete Markdown pair
    When I run "crane text check" on the pair
    Then the JSON output is an empty array
    And the exit code is 0

  # Behaviour: CRN-028
  # Behaviour: CRN-030
  # Exemption(e2e): the CLI has no network, remote service, or credential boundary; its process boundary over local files is bound at integration; alternative-proof: crane-cli:test:integration / Crane process-boundary scenarios
  @e2e-exempt
  Scenario: Missing section produces a CRITICAL finding
    Given a PDF fixture and a Markdown missing one section
    When I run "crane text check" on the pair
    Then the JSON output contains a finding
    And the finding criticality is "CRITICAL"
    And the finding category is "text-completeness"
    And the exit code is 1

  # Exemption(e2e): the CLI has no network, remote service, or credential boundary; its process boundary over local files is bound at integration; alternative-proof: crane-cli:test:integration / Crane process-boundary scenarios
  @e2e-exempt
  Scenario: Whitespace normalization prevents false positives
    Given a PDF with multiple consecutive spaces and its normalized Markdown
    When I run "crane text check" on the pair
    Then the JSON output is an empty array
    And the exit code is 0

  # Exemption(e2e): the CLI has no network, remote service, or credential boundary; its process boundary over local files is bound at integration; alternative-proof: crane-cli:test:integration / Crane process-boundary scenarios
  @e2e-exempt
  Scenario: Fuzzy match accepts minor OCR spelling variation
    Given a PDF with "Organisation" and a Markdown with "Organization"
    When I run "crane text check" on the pair
    Then no CRITICAL or HIGH finding is raised for that word

  # Behaviour: CRN-005
  # Exemption(e2e): the CLI has no network, remote service, or credential boundary; its process boundary over local files is bound at integration; alternative-proof: crane-cli:test:integration / Crane process-boundary scenarios
  @e2e-exempt
  Scenario: crane text search reports a present segment with its similarity and exits 0
    Given a Markdown document containing "Whitespace normalization prevents false positives"
    When I run "crane text search" for "Whitespace normalization prevents"
    Then the JSON output contains found true
    And the JSON output contains a similarity score
    And the exit code is 0

  # Behaviour: CRN-005
  # Exemption(e2e): the CLI has no network, remote service, or credential boundary; its process boundary over local files is bound at integration; alternative-proof: crane-cli:test:integration / Crane process-boundary scenarios
  @e2e-exempt
  Scenario: crane text search reports an absent segment as not found and exits 1
    Given a Markdown document containing "Whitespace normalization prevents false positives"
    When I run "crane text search" for "Quarterly revenue table"
    Then the JSON output contains found false
    And the exit code is 1
