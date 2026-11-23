Feature: OCR quality assessment
  As a pdf-to-md-checker agent
  I want to quantify OCR quality in image-extracted sections
  So that unreadably garbled pages are flagged for manual review

  # Behaviour: CRN-015
  # Exemption(e2e): the CLI has no network, remote service, or credential boundary; its process boundary over local files is bound at integration; alternative-proof: crane-cli:test:integration / Crane process-boundary scenarios
  @e2e-exempt
  Scenario: High error rate produces CRITICAL finding
    Given a Markdown fixture with an OCR-tagged section at 15% estimated error rate
    When I run "crane ocr quality" on the fixture
    Then a finding with criticality "CRITICAL" is returned
    And the finding includes the OCR page number

  # Exemption(e2e): the CLI has no network, remote service, or credential boundary; its process boundary over local files is bound at integration; alternative-proof: crane-cli:test:integration / Crane process-boundary scenarios
  @e2e-exempt
  Scenario: Clean OCR section produces no finding
    Given a Markdown fixture with an OCR-tagged section at 1% estimated error rate
    When I run "crane ocr quality" on the fixture
    Then the JSON output is an empty array

  # Exemption(e2e): the CLI has no network, remote service, or credential boundary; its process boundary over local files is bound at integration; alternative-proof: crane-cli:test:integration / Crane process-boundary scenarios
  @e2e-exempt
  Scenario: No OCR-tagged sections produces no finding
    Given a Markdown fixture with no OCR page tags
    When I run "crane ocr quality" on the fixture
    Then the JSON output is an empty array

  # Behaviour: CRN-016
  # Exemption(e2e): the CLI has no network, remote service, or credential boundary; its process boundary over local files is bound at integration; alternative-proof: crane-cli:test:integration / Crane process-boundary scenarios
  @e2e-exempt
  Scenario: OCR extraction lists each OCR-tagged section of a PDF
    Given a PDF fixture with one OCR-tagged section
    When I run "crane ocr extract" on the PDF fixture
    Then the JSON output names 1 OCR section
