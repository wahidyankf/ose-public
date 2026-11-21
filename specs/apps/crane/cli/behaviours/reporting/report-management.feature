Feature: Audit report initialization
  As the pdf-to-md-quality-gate workflow
  I want consistent UUID-chained reports with UTC+7 timestamps
  So that iterations are traceable and reports are uniquely named

  # Behaviour: CRN-017
  # Behaviour: CRN-032
  # Exemption(e2e): the CLI has no network, remote service, or credential boundary; its process boundary over local files is bound at integration; alternative-proof: crane-cli:test:integration / Crane process-boundary scenarios
  @e2e-exempt
  Scenario: New chain creates a 6-character UUID report
    Given no existing chain file for scope "pdf-to-md"
    When I run "crane report init" with scope "pdf-to-md"
    Then a report file is created in "local-tmp/pdf-to-md/"
    And the filename matches the pattern "pdf-to-md__{6-hex}__{YYYY-MM-DD--HH-MM}__audit.md"
    And the JSON output contains the report path

  # Behaviour: CRN-033
  # Exemption(e2e): the CLI has no network, remote service, or credential boundary; its process boundary over local files is bound at integration; alternative-proof: crane-cli:test:integration / Crane process-boundary scenarios
  @e2e-exempt
  Scenario: Chain extends when chain file is fresh (< 30s)
    Given a chain file for "pdf-to-md" created 5 seconds ago with UUID "abc123"
    When I run "crane report init" with scope "pdf-to-md"
    Then the report filename contains "abc123__" followed by a new 6-hex UUID

  # Behaviour: CRN-033
  # Exemption(e2e): the CLI has no network, remote service, or credential boundary; its process boundary over local files is bound at integration; alternative-proof: crane-cli:test:integration / Crane process-boundary scenarios
  @e2e-exempt
  Scenario: Chain resets when chain file is stale (>= 30s)
    Given a chain file for "pdf-to-md" created 60 seconds ago with UUID "abc123"
    When I run "crane report init" with scope "pdf-to-md"
    Then the report filename contains only the new 6-hex UUID (no "abc123")

  # Behaviour: CRN-018
  # Exemption(e2e): the CLI has no network, remote service, or credential boundary; its process boundary over local files is bound at integration; alternative-proof: crane-cli:test:integration / Crane process-boundary scenarios
  @e2e-exempt
  Scenario: Finalizing a report records its status in the report
    Given an audit report in progress for scope "pdf-to-md"
    When I run "crane report finalize" with status "PASSED"
    Then the report file says "Status: PASSED"
    And the JSON output names the status "PASSED" and the report path
