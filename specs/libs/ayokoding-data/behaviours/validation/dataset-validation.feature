Feature: Shared tool dataset validation

  The bilingual site and its tools read one neutral JSON dataset. These
  scenarios prove the dataset inventory is complete and every benchmark and
  calculator entry satisfies the shared structure, date, identifier, and
  markdown reference rules both runtimes enforce.

  Scenario: Required shared datasets exist
    Given the ayokoding-data library source tree
    When the dataset inventory is inspected
    Then data/ai-benchmark.json, data/cost-of-living.json, data/fx.json, provenance.md, and test-vectors/ exist

  Scenario: Benchmark and calculator entries validate
    Given the ayokoding-data library source tree
    When each entry is validated against the shared rules
    Then every benchmark model satisfies the structure, version, and identifier rules
    And every calculator city satisfies the structure and date rules
    And every markdown reference resolves to a repository file
