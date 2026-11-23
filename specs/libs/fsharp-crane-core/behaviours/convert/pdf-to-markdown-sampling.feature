Feature: PDF sampling and page range for conversion
  As crane-cli
  I want a PDF that cannot be sampled to fail with its reason and never reach OCR or extraction
  So that a broken PDF is reported rather than converted from nothing

  # Exemption(integration): the converter reaches its PDF port only through an injected value, and the real native PDF call has no fixture in this repo; alternative-proof: fsharp-crane-core:test:unit / A PDF that cannot be sampled is reported as a sampling failure
  @integration-exempt
  # Exemption(e2e): the library has no e2e level: a pure library with no process or network boundary of its own; alternative-proof: fsharp-crane-core:test:unit / A PDF that cannot be sampled is reported as a sampling failure
  @e2e-exempt
  # Behaviour: FCC-002
  Scenario: A PDF that cannot be sampled is reported as a sampling failure
    Given a PDF port whose sampling fails with "cannot open file"
    When I call convertPdfToMarkdown
    Then the conversion returns an error that starts with "Failed to sample PDF: cannot open file"

  # Exemption(integration): the converter reaches its PDF port only through an injected value, and the real native PDF call has no fixture in this repo; alternative-proof: fsharp-crane-core:test:unit / Text extraction reads pages 1 to 999 only
  @integration-exempt
  # Exemption(e2e): the library has no e2e level: a pure library with no process or network boundary of its own; alternative-proof: fsharp-crane-core:test:unit / Text extraction reads pages 1 to 999 only
  @e2e-exempt
  # Behaviour: FCC-003
  Scenario: Text extraction reads pages 1 to 999 only
    Given a PDF port whose sampled text has more than 10 words
    When I call convertPdfToMarkdown
    Then the PDF port is asked for pages 1 to 999
