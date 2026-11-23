Feature: PDF commands
  As a pdf-to-md-maker agent
  I want reliable PDF operations via crane
  So that I can plan extraction and validate PDF properties

  # Behaviour: CRN-001
  # Exemption(e2e): the CLI has no network, remote service, or credential boundary; its process boundary over local files is bound at integration; alternative-proof: crane-cli:test:integration / Crane process-boundary scenarios
  @e2e-exempt
  Scenario: Get page count from text PDF
    Given a text-based PDF fixture with a known page count
    When I run "crane pdf info" on the fixture
    Then the JSON output is valid
    And the JSON field "pages" matches the known page count
    And the JSON field "size_bytes" is greater than 0

  # Behaviour: CRN-002
  # Exemption(e2e): the CLI has no network, remote service, or credential boundary; its process boundary over local files is bound at integration; alternative-proof: crane-cli:test:integration / Crane process-boundary scenarios
  @e2e-exempt
  Scenario: Text-based PDF is detected
    Given a text-based PDF fixture exists
    When I run "crane pdf type" on the fixture
    Then the JSON output contains type "text"
    And the exit code is 0

  # Exemption(e2e): the CLI has no network, remote service, or credential boundary; its process boundary over local files is bound at integration; alternative-proof: crane-cli:test:integration / Crane process-boundary scenarios
  @e2e-exempt
  Scenario: Image-only PDF is detected
    Given an image-only PDF fixture exists
    When I run "crane pdf type" on the fixture
    Then the JSON output contains type "image"
    And the exit code is 1

  # Behaviour: CRN-003
  # Exemption(e2e): the CLI has no network, remote service, or credential boundary; its process boundary over local files is bound at integration; alternative-proof: crane-cli:test:integration / Crane process-boundary scenarios
  @e2e-exempt
  Scenario: crane pdf extract writes the requested page range to standard output
    Given a PDF whose page text is "Page one heading and body"
    When I run "crane pdf extract" for pages 1 to 1
    Then standard output is "Page one heading and body"
    And the exit code is 0

  # Behaviour: CRN-029
  # Exemption(e2e): the CLI has no network, remote service, or credential boundary; its process boundary over local files is bound at integration; alternative-proof: crane-cli:test:integration / Crane process-boundary scenarios
  @e2e-exempt
  Scenario: A missing or unreadable PDF prints "Error:" on standard error and exits 1
    Given a PDF path that cannot be read
    When I run "crane pdf extract" for pages 1 to 1
    Then standard error starts with "Error:"
    And the exit code is 1
