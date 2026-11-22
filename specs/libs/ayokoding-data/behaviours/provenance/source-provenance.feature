Feature: Shared tool data provenance

  Benchmark figures and calculator rates change over time. These scenarios
  prove the provenance record carries the snapshot date of every dataset it
  describes, so a reader can tell how old each figure is.

  # Exemption(e2e): a pure library with no process or network boundary; it is consumed only through in-process imports; alternative-proof: ayokoding-data:test:unit / Snapshot dates in the provenance record match each dataset's own date
  @e2e-exempt
  # Behaviour: ADA-007
  Scenario: Snapshot dates in the provenance record match each dataset's own date
    Given the shared provenance record
    When the provenance record is checked against the stored datasets
    Then the record carries the snapshot date of data/ai-benchmark.json, data/cost-of-living.json, and data/fx.json
