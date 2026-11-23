Feature: PDF extraction cache
  As crane-cli
  I want the extraction cache to be transparent to callers and to live in a configurable directory
  So that repeated conversions reuse extracted text without changing what a caller receives

  # Exemption(e2e): the library has no e2e level: a pure library with no process or network boundary of its own; alternative-proof: fsharp-crane-core:test:unit / The extraction cache proxies metadata to the PDF port
  @e2e-exempt
  # Behaviour: FCC-019
  Scenario: The extraction cache proxies metadata to the PDF port
    Given a PDF port wrapped by the extraction cache
    When the metadata of a PDF is requested through the cache
    Then the metadata is the one the wrapped port returns

  # Exemption(e2e): the library has no e2e level: a pure library with no process or network boundary of its own; alternative-proof: fsharp-crane-core:test:unit / XDG_CACHE_HOME sets the extraction cache directory
  @e2e-exempt
  # Behaviour: FCC-024
  Scenario: XDG_CACHE_HOME sets the extraction cache directory
    Given XDG_CACHE_HOME is set to a directory
    When the default cache directory is resolved
    Then the cache directory is inside that directory
