Feature: Check-all aggregator
  As a pdf-to-md-checker agent
  I want to run all check dimensions in one process invocation
  So that I share a single PDF extraction across text, heading, nesting, table, figure, and mermaid checks

  # Behaviour: CRN-022
  # Exemption(e2e): the CLI has no network, remote service, or credential boundary; its process boundary over local files is bound at integration; alternative-proof: crane-cli:test:integration / Crane process-boundary scenarios
  @e2e-exempt
  Scenario: Aggregator with matching PDF and MD produces no findings
    Given a PDF fixture and an MD that matches across all dimensions
    When I run "crane check-all" on the pair
    Then the JSON output is an empty array
    And the exit code is 0

  # Behaviour: CRN-022
  # Exemption(e2e): the CLI has no network, remote service, or credential boundary; its process boundary over local files is bound at integration; alternative-proof: crane-cli:test:integration / Crane process-boundary scenarios
  @e2e-exempt
  Scenario: Aggregator with mismatched Markdown exits 1 with findings that name their category
    Given a PDF fixture and an MD missing content
    When I run "crane check-all" on the pair
    Then the JSON output contains a finding
    And every finding names its category
    And the exit code is 1

  # Behaviour: CRN-025
  # Exemption(e2e): the CLI has no network, remote service, or credential boundary; its process boundary over local files is bound at integration; alternative-proof: crane-cli:test:integration / Crane process-boundary scenarios
  @e2e-exempt
  Scenario: An unknown command prints usage and exits 1
    When I run the unknown command "crane no-such-command"
    Then standard output contains "USAGE"
    And the exit code is 1

  # Behaviour: CRN-023
  # Exemption(e2e): the CLI has no network, remote service, or credential boundary; its process boundary over local files is bound at integration; alternative-proof: crane-cli:test:integration / Crane process-boundary scenarios
  @e2e-exempt
  Scenario: Check-all reuses the PDF text cached by an earlier run
    Given a PDF fixture and an MD that matches across all dimensions
    When I run "crane check-all" twice with the same cache directory
    Then the cache directory holds 1 extraction entry
