Feature: Conversion quality checks
  As a reviewer of a converted document
  I want each checker to report a problem as a Finding with a criticality
  So that the report ranks what is wrong in the conversion

  # Exemption(integration): the checker is a pure function over in-memory text and touches no file, process, or network; alternative-proof: fsharp-crane-core:test:unit / A text chunk missing from the Markdown is reported
  @integration-exempt
  # Exemption(e2e): the library has no e2e level: a pure library with no process or network boundary of its own; alternative-proof: fsharp-crane-core:test:unit / A text chunk missing from the Markdown is reported
  @e2e-exempt
  # Behaviour: FCC-010
  Scenario: A text chunk missing from the Markdown is reported
    Given a PDF text chunk that does not appear in the Markdown
    When the text checker runs
    Then one Finding reports the missing chunk

  # Exemption(integration): the checker is a pure function over in-memory text and touches no file, process, or network; alternative-proof: fsharp-crane-core:test:unit / A heading whose depth differs from the PDF is a HIGH finding
  @integration-exempt
  # Exemption(e2e): the library has no e2e level: a pure library with no process or network boundary of its own; alternative-proof: fsharp-crane-core:test:unit / A heading whose depth differs from the PDF is a HIGH finding
  @e2e-exempt
  # Behaviour: FCC-011
  Scenario: A heading whose depth differs from the PDF is a HIGH finding
    Given a PDF heading at depth 2 that the Markdown writes at depth 3
    When the heading checker runs
    Then the Finding has criticality HIGH

  # Exemption(integration): the checker is a pure function over in-memory text and touches no file, process, or network; alternative-proof: fsharp-crane-core:test:unit / A figure with no Mermaid, placeholder, or label is a HIGH finding
  @integration-exempt
  # Exemption(e2e): the library has no e2e level: a pure library with no process or network boundary of its own; alternative-proof: fsharp-crane-core:test:unit / A figure with no Mermaid, placeholder, or label is a HIGH finding
  @e2e-exempt
  # Behaviour: FCC-012
  Scenario: A figure with no Mermaid, placeholder, or label is a HIGH finding
    Given a PDF figure reference that the Markdown does not cover
    When the figure checker runs
    Then the Finding has criticality HIGH

  # Exemption(integration): the checker is a pure function over in-memory text and touches no file, process, or network; alternative-proof: fsharp-crane-core:test:unit / A table missing from the Markdown is CRITICAL
  @integration-exempt
  # Exemption(e2e): the library has no e2e level: a pure library with no process or network boundary of its own; alternative-proof: fsharp-crane-core:test:unit / A table missing from the Markdown is CRITICAL
  @e2e-exempt
  # Behaviour: FCC-013
  Scenario: A table missing from the Markdown is CRITICAL
    Given a PDF table that the Markdown does not contain
    When the table checker runs
    Then the Finding has criticality CRITICAL

  # Exemption(integration): the checker is a pure function over in-memory text and touches no file, process, or network; alternative-proof: fsharp-crane-core:test:unit / Inverted list nesting is a HIGH finding
  @integration-exempt
  # Exemption(e2e): the library has no e2e level: a pure library with no process or network boundary of its own; alternative-proof: fsharp-crane-core:test:unit / Inverted list nesting is a HIGH finding
  @e2e-exempt
  # Behaviour: FCC-014
  Scenario: Inverted list nesting is a HIGH finding
    Given a PDF list whose nesting the Markdown inverts
    When the nesting checker runs
    Then the Finding has criticality HIGH

  # Exemption(integration): the checker is a pure function over in-memory text and touches no file, process, or network; alternative-proof: fsharp-crane-core:test:unit / An invalid Mermaid block is reported as a finding
  @integration-exempt
  # Exemption(e2e): the library has no e2e level: a pure library with no process or network boundary of its own; alternative-proof: fsharp-crane-core:test:unit / An invalid Mermaid block is reported as a finding
  @e2e-exempt
  # Behaviour: FCC-015
  Scenario: An invalid Mermaid block is reported as a finding
    Given a Markdown document with an invalid Mermaid block
    When the Mermaid validator runs
    Then one Finding reports the invalid block

  # Exemption(integration): the checker is a pure function over in-memory text and touches no file, process, or network; alternative-proof: fsharp-crane-core:test:unit / OCR text with a high error rate is CRITICAL
  @integration-exempt
  # Exemption(e2e): the library has no e2e level: a pure library with no process or network boundary of its own; alternative-proof: fsharp-crane-core:test:unit / OCR text with a high error rate is CRITICAL
  @e2e-exempt
  # Behaviour: FCC-016
  Scenario: OCR text with a high error rate is CRITICAL
    Given OCR text in which most characters are not ASCII
    When the OCR assessor runs
    Then the Finding has criticality CRITICAL

  # Exemption(integration): the checker is a pure function over in-memory values and touches no file, process, or network; alternative-proof: fsharp-crane-core:test:unit / A finding serialises with the report field names
  @integration-exempt
  # Exemption(e2e): the library has no e2e level: a pure library with no process or network boundary of its own; alternative-proof: fsharp-crane-core:test:unit / A finding serialises with the report field names
  @e2e-exempt
  # Behaviour: FCC-008
  Scenario: A finding serialises with the report field names
    Given a Finding with every field set
    When the Finding is serialised to JSON
    Then the JSON carries the report field names
