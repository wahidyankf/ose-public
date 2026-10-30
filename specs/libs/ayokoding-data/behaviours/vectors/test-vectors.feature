Feature: Shared tool test vectors

  Reference vectors pin the accepted results both runtimes must reproduce.
  These scenarios prove the vector inventories exist, reference stored
  datasets instead of inventing inputs, and keep every established
  expectation covered.

  Scenario: Vector inventories exist for every tool dataset
    Given the ayokoding-data library source tree
    When the vector inventory is checked
    Then test-vectors/benchmark.json, test-vectors/calculator.json, and test-vectors/url-state.json exist

  Scenario: Vector scenarios reference stored datasets
    Given the ayokoding-data library source tree
    When vector expectations are compared to the stored datasets
    Then every benchmark vector entry names a stored model and snapshot scenario
    And every calculator vector entry names a stored city
    And every vector scenario keeps its reference notes and url-state keys
