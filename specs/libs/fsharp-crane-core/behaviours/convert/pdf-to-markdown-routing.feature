Feature: PDF-to-Markdown conversion routing
  As crane-cli
  I want convertPdfToMarkdown to return the page text of a PDF with a text layer and the OCR text of one without
  So that both PDF kinds produce a Markdown conversion

  # Exemption(integration): the converter reaches its PDF and OCR ports only through injected values, and the real native PDF and Tesseract calls have no fixture in this repo; alternative-proof: fsharp-crane-core:test:unit / A PDF with a real text layer converts to its extracted page text
  @integration-exempt
  # Exemption(e2e): the library has no e2e level: a pure library with no process or network boundary of its own; alternative-proof: fsharp-crane-core:test:unit / A PDF with a real text layer converts to its extracted page text
  @e2e-exempt
  # Behaviour: FCC-001
  # Behaviour: FCC-004
  Scenario: A PDF with a real text layer converts to its extracted page text
    Given a PDF whose sampled text has more than 10 words
    When I call convertPdfToMarkdown
    Then the returned Markdown is the extracted page text

  # Exemption(integration): the converter reaches its PDF and OCR ports only through injected values, and the real native PDF and Tesseract calls have no fixture in this repo; alternative-proof: fsharp-crane-core:test:unit / A PDF with no usable text layer converts to its OCR text
  @integration-exempt
  # Exemption(e2e): the library has no e2e level: a pure library with no process or network boundary of its own; alternative-proof: fsharp-crane-core:test:unit / A PDF with no usable text layer converts to its OCR text
  @e2e-exempt
  # Behaviour: FCC-001
  # Behaviour: FCC-005
  Scenario: A PDF with no usable text layer converts to its OCR text
    Given a PDF whose sampled text has 10 words or fewer
    When I call convertPdfToMarkdown
    Then the returned Markdown is the OCR text
