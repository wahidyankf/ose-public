Feature: Shared tool dataset validation

  The bilingual site and its tools read one neutral JSON dataset. These
  scenarios prove the dataset inventory is complete and every benchmark and
  calculator entry satisfies the shared identifier, rate, date, and tier rules
  both runtimes enforce.

  # Exemption(e2e): a pure library with no process or network boundary; it is consumed only through in-process imports; alternative-proof: ayokoding-data:test:unit / A consumer finds all datasets and test vectors at their documented paths
  @e2e-exempt
  Scenario: A consumer finds all datasets and test vectors at their documented paths
    Given the ayokoding-data library source tree
    When the dataset inventory is inspected
    Then data/ai-benchmark.json, data/cost-of-living.json, data/fx.json, provenance.md, and test-vectors/ exist
    And test-vectors/benchmark.json, test-vectors/calculator.json, and test-vectors/url-state.json exist

  # Exemption(e2e): a pure library with no process or network boundary; it is consumed only through in-process imports; alternative-proof: ayokoding-data:test:unit / Every benchmark model has a known id, a pinned figure version, and a source
  @e2e-exempt
  # Behaviour: ADA-001
  Scenario: Every benchmark model has a known id, a pinned figure version, and a source
    Given the ayokoding-data library source tree
    When each benchmark model is checked against the benchmark specs
    Then every model id is unique and every figure names a known benchmark
    And every figure is pinned to that benchmark's version and carries a source

  # Exemption(e2e): a pure library with no process or network boundary; it is consumed only through in-process imports; alternative-proof: ayokoding-data:test:unit / Every calculator city resolves through the shared FX table
  @e2e-exempt
  # Behaviour: ADA-002
  Scenario: Every calculator city resolves through the shared FX table
    Given the ayokoding-data library source tree
    When each calculator city is checked against the country and FX tables
    Then every city names a listed country
    And every city currency has a positive rate in the shared FX table

  # Exemption(e2e): a pure library with no process or network boundary; it is consumed only through in-process imports; alternative-proof: ayokoding-data:test:unit / The FX table is the only home for rates, USD is 1, and every rate is positive
  @e2e-exempt
  # Behaviour: ADA-003
  Scenario: The FX table is the only home for rates, USD is 1, and every rate is positive
    Given the ayokoding-data library source tree
    When the rate tables are read
    Then data/fx.json holds every rate and no other dataset file holds a rate table
    And the USD rate is 1
    And every rate is greater than 0

  # Exemption(e2e): a pure library with no process or network boundary; it is consumed only through in-process imports; alternative-proof: ayokoding-data:test:unit / Snapshot dates are ISO dates and no source check is later than the dataset date
  @e2e-exempt
  # Behaviour: ADA-010
  Scenario: Snapshot dates are ISO dates and no source check is later than the dataset date
    Given the ayokoding-data library source tree
    When the snapshot dates are read
    Then every snapshot date is an ISO date
    And no operator or price source was checked after the dataset's last update

  # Exemption(e2e): a pure library with no process or network boundary; it is consumed only through in-process imports; alternative-proof: ayokoding-data:test:unit / Tier anchors are general-access models with descending floors on every benchmark
  @e2e-exempt
  # Behaviour: ADA-011
  Scenario: Tier anchors are general-access models with descending floors on every benchmark
    Given the ayokoding-data library source tree
    When the tier anchors are read
    Then every anchor model is general-access and has a figure on its benchmark
    And on every benchmark the ultra floor is above the planning floor, which is above the execution floor

  # Exemption(e2e): a pure library with no process or network boundary; it is consumed only through in-process imports; alternative-proof: ayokoding-data:test:unit / Substitute-finder harnesses stay inside the offered catalog harnesses
  @e2e-exempt
  # Behaviour: ADA-012
  Scenario: Substitute-finder harnesses stay inside the offered catalog harnesses
    Given the ayokoding-data library source tree
    When the substitute-finder settings are read
    Then every substitute harness is an offered catalog harness
    And the default substitute harness is one of the substitute harnesses

  # Exemption(e2e): a pure library with no process or network boundary; it is consumed only through in-process imports; alternative-proof: ayokoding-data:test:unit / The role matrix keeps a 15-rung ladder with ordered percentile salaries
  @e2e-exempt
  # Behaviour: ADA-013
  Scenario: The role matrix keeps a 15-rung ladder with ordered percentile salaries
    Given the ayokoding-data library source tree
    When the role matrix is read
    Then the ladder has 15 ranked rungs
    And every country lists 15 roles whose 25th, 50th, and 75th percentile salaries ascend

  # Exemption(e2e): a pure library with no process or network boundary; it is consumed only through in-process imports; alternative-proof: ayokoding-data:test:unit / Country effective-rate bands ascend from low to mid to high
  @e2e-exempt
  # Behaviour: ADA-014
  Scenario: Country effective-rate bands ascend from low to mid to high
    Given the ayokoding-data library source tree
    When each country's effective-rate band is read
    Then the mid band is at least the low band and the high band is at least the mid band

  # Exemption(integration): the library has no process, network, or database boundary; the site's decode is an in-process read of checked-in JSON; alternative-proof: ayokoding-www:test:unit / carries the same models in the same order
  @integration-exempt
  # Exemption(e2e): the library and the site's decode cross no process or network boundary; the JSON is read in-process from checked-in files; alternative-proof: ayokoding-www:test:unit / carries the same models in the same order
  @e2e-exempt
  # Behaviour: ADA-015
  Scenario: The site decodes the same dataset values the library publishes
    Given the neutral dataset files the library publishes
    When the site reads its benchmark and cost-of-living data from those files
    Then the models, countries, cities, and rates it shows equal the library's values
