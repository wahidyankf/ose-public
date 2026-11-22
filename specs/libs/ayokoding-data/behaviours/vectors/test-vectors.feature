Feature: Shared tool test vectors

  Reference vectors pin the accepted results both runtimes must reproduce.
  These scenarios prove the vectors reference stored datasets instead of
  inventing inputs, and keep the url-state keys each tool reads.

  # Exemption(e2e): a pure library with no process or network boundary; it is consumed only through in-process imports; alternative-proof: ayokoding-data:test:unit / Benchmark vectors name stored models
  @e2e-exempt
  # Behaviour: ADA-004
  Scenario: Benchmark vectors name stored models
    Given the ayokoding-data library source tree
    When the benchmark vectors are compared to the stored models
    Then every composite-index entry names a stored model
    And every substitute-finder target and option names a stored model

  # Exemption(e2e): a pure library with no process or network boundary; it is consumed only through in-process imports; alternative-proof: ayokoding-data:test:unit / Calculator vectors name stored cities
  @e2e-exempt
  # Behaviour: ADA-005
  Scenario: Calculator vectors name stored cities
    Given the ayokoding-data library source tree
    When the calculator vectors are compared to the stored cities
    Then every essentials row and every savings row names a stored city

  # Exemption(e2e): a pure library with no process or network boundary; it is consumed only through in-process imports; alternative-proof: ayokoding-data:test:unit / URL-state vectors keep their benchmark and calculator keys
  @e2e-exempt
  # Behaviour: ADA-006
  Scenario: URL-state vectors keep their benchmark and calculator keys
    Given the ayokoding-data library source tree
    When the url-state vectors are read
    Then the url-state vectors keep the "benchmark" and "calculator" keys
    And every calculator state key is a known calculator query key
