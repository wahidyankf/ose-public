Feature: Shared tool data provenance

  Benchmark figures and calculator rates change over time. These scenarios
  prove the provenance record names every dataset file, snapshot date, and
  consumer contract, and explains the sourcing rules each dataset obeys.

  Scenario: Provenance names every dataset, date, and consumer contract
    Given the shared provenance record
    When the provenance record is checked against the stored datasets
    Then the record names data/ai-benchmark.json, data/cost-of-living.json, and data/fx.json
    And the record carries every dataset snapshot date and the consumer contracts

  Scenario: Sourcing rules stay written down
    Given the shared provenance record
    When the sourcing rules are read
    Then each dataset section names its sources and re-sourcing prompt
    And the format migration promises are recorded
