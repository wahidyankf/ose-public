Feature: PDF and OCR adapters and their ports
  As crane-cli
  I want the adapter ports to carry metadata, text, and failures in one shape
  So that the converter and its tests treat the real and fake adapters the same way

  # Exemption(integration): the metadata record is a plain value built by an in-memory fake, and the real metadata boundary is the native PDF library, which has no fixture in this repo; alternative-proof: fsharp-crane-core:test:unit / PdfMetadata reports pages, title, author, file, and size
  @integration-exempt
  # Exemption(e2e): the library has no e2e level: a pure library with no process or network boundary of its own; alternative-proof: fsharp-crane-core:test:unit / PdfMetadata reports pages, title, author, file, and size
  @e2e-exempt
  # Behaviour: FCC-007
  Scenario: PdfMetadata reports pages, title, author, file, and size
    Given a fake PDF port with 4 pages and 1234 bytes
    When the metadata of "doc.pdf" is requested
    Then the metadata has 4 pages, the title "Fake Document", no author, the file "doc.pdf", and 1234 bytes

  # Exemption(integration): the fake port serves in-memory values and touches no file, process, or network; the real boundary is the native PDF library, which has no fixture in this repo; alternative-proof: fsharp-crane-core:test:unit / A fake PDF port serves its configured text, pages, and size
  @integration-exempt
  # Exemption(e2e): the library has no e2e level: a pure library with no process or network boundary of its own; alternative-proof: fsharp-crane-core:test:unit / A fake PDF port serves its configured text, pages, and size
  @e2e-exempt
  # Behaviour: FCC-022
  Scenario: A fake PDF port serves its configured text, pages, and size
    Given a fake PDF port configured with text, 4 pages, and 1234 bytes
    When the fake port is asked for sampled text, extracted pages, and metadata
    Then it returns the configured text and the configured pages and size

  # Exemption(integration): the file ports are type abbreviations for plain functions with no boundary of their own; alternative-proof: fsharp-crane-core:test:unit / The file ports are plain function aliases
  @integration-exempt
  # Exemption(e2e): the library has no e2e level: a pure library with no process or network boundary of its own; alternative-proof: fsharp-crane-core:test:unit / The file ports are plain function aliases
  @e2e-exempt
  # Behaviour: FCC-006
  Scenario: The file ports are plain function aliases
    Given a plain function that reads a file
    When the function is supplied as the ReadFile port
    Then calling the port returns the function's result

  # Exemption(e2e): the library has no e2e level: a pure library with no process or network boundary of its own; alternative-proof: fsharp-crane-core:test:unit / Extracted pages join with line breaks
  @e2e-exempt
  # Behaviour: FCC-020
  Scenario: Extracted pages join with line breaks
    Given the extracted text of two pages
    When the pages are joined
    Then the joined text has a line break between the pages

  # Exemption(integration): the failure is raised by the native Tesseract engine when it cannot start, and no integration fixture in this repo supplies a missing or corrupt tessdata directory; alternative-proof: fsharp-crane-core:test:unit / An OCR engine that cannot start reports the page that failed
  @integration-exempt
  # Exemption(e2e): the library has no e2e level: a pure library with no process or network boundary of its own; alternative-proof: fsharp-crane-core:test:unit / An OCR engine that cannot start reports the page that failed
  @e2e-exempt
  # Behaviour: FCC-025
  Scenario: An OCR engine that cannot start reports the page that failed
    Given no tessdata directory is available to the OCR adapter
    When the text of page 3 of "scan.pdf" is requested
    Then the result is an error that names "scan.pdf" and page 3
