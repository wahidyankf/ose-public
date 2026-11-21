Feature: False positive skip list
  As a pdf-to-md-fixer agent
  I want to persist known false positives with deduplication
  So that the checker does not re-report already-accepted non-issues

  # Behaviour: CRN-019
  # Behaviour: CRN-034
  # Exemption(e2e): the CLI has no network, remote service, or credential boundary; its process boundary over local files is bound at integration; alternative-proof: crane-cli:test:integration / Crane process-boundary scenarios
  @e2e-exempt
  Scenario: New entry is written to the skip list file
    Given no existing skip list for "nist-sp-800-53"
    When I run "crane skiplist add nist-sp-800-53 text-completeness 'Page header on p.3'"
    Then the skip list file is created
    And it contains one entry with category "text-completeness"

  # Exemption(e2e): the CLI has no network, remote service, or credential boundary; its process boundary over local files is bound at integration; alternative-proof: crane-cli:test:integration / Crane process-boundary scenarios
  @e2e-exempt
  Scenario: Duplicate entry is not written twice
    Given a skip list for "nist-sp-800-53" already containing the entry for text-completeness "Page header on p.3"
    When I run "crane skiplist add" with the same arguments
    Then the skip list file contains exactly one matching entry

  # Behaviour: CRN-020
  # Exemption(e2e): the CLI has no network, remote service, or credential boundary; its process boundary over local files is bound at integration; alternative-proof: crane-cli:test:integration / Crane process-boundary scenarios
  @e2e-exempt
  Scenario: Known false positive returns match true
    Given a skip list containing "mermaid-syntax | nist-sp-800-53 | invalid arrow in Figure 3"
    When I run "crane skiplist check nist-sp-800-53 mermaid-syntax 'invalid arrow in Figure 3'"
    Then the JSON output contains match true
    And the exit code is 0

  # Behaviour: CRN-020
  # Exemption(e2e): the CLI has no network, remote service, or credential boundary; its process boundary over local files is bound at integration; alternative-proof: crane-cli:test:integration / Crane process-boundary scenarios
  @e2e-exempt
  Scenario: Unknown entry returns match false
    When I run "crane skiplist check nist-sp-800-53 text-completeness 'never added entry'"
    Then the JSON output contains match false
    And the exit code is 1
