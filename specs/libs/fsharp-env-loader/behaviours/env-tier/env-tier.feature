Feature: Tiered .env file loading

  As an F# backend starting up
  I want exactly one tier file loaded, chosen by APP_ENV, with the process environment always winning
  So that a CI-injected variable is never silently overridden and every backend boots the same way

  # Exemption(e2e): the library exposes no public browser, HTTP, or process boundary; alternative-proof: fsharp-env-loader:test:unit / APP_ENV unset or empty defaults to the "local" tier
  @e2e-exempt
  # Behaviour: FEL-006
  Scenario Outline: APP_ENV unset or empty defaults to the "local" tier
    Given <appEnv>
    When the env tier resolves
    Then the resolved tier is "local"

    Examples:
      | appEnv               |
      | APP_ENV is unset     |
      | APP_ENV is set to "" |

  # Exemption(e2e): the library exposes no public browser, HTTP, or process boundary; alternative-proof: fsharp-env-loader:test:unit / APP_ENV set to a tier name resolves to that tier
  @e2e-exempt
  # Behaviour: FEL-001
  Scenario: APP_ENV set to a tier name resolves to that tier
    Given APP_ENV is set to "stag"
    When the env tier resolves
    Then the resolved tier is "stag"

  # Exemption(e2e): the library exposes no public browser, HTTP, or process boundary; alternative-proof: fsharp-env-loader:test:unit / Only the file matching APP_ENV is read
  @e2e-exempt
  # Behaviour: OBE-023
  # Behaviour: OSB-021
  Scenario Outline: Only the file matching APP_ENV is read
    Given a fresh temporary search directory
    And the search directory has a ".env.<tier>" file setting "GREETING" to "from-<tier>"
    And the search directory has a ".env.local" file setting "GREETING" to "from-local"
    And the search directory has a ".env.stag" file setting "GREETING" to "from-stag"
    And APP_ENV is set to "<tier>"
    When the env tier loads from the search directory
    Then "GREETING" is "from-<tier>"

    Examples:
      | tier  |
      | local |
      | test  |
      | stag  |
      | prod  |

  # Exemption(e2e): the library exposes no public browser, HTTP, or process boundary; alternative-proof: fsharp-env-loader:test:unit / The first search directory that holds the tier file wins
  @e2e-exempt
  # Behaviour: FEL-002
  # Behaviour: FEL-003
  Scenario Outline: The first search directory that holds the tier file wins
    Given a fresh temporary search directory named "first"
    And a fresh temporary search directory named "second"
    And directory "second" has a ".env.test" file setting "GREETING" to "from-second"
    And directory "first" has a "<firstFile>" file setting "GREETING" to "from-first"
    And APP_ENV is set to "test"
    When the env tier loads from search directories "first" then "second"
    Then "GREETING" is "<expected>"

    Examples:
      | firstFile | expected    |
      | .env.test | from-first  |
      | .env.local | from-second |

  # Exemption(e2e): the library exposes no public browser, HTTP, or process boundary; alternative-proof: fsharp-env-loader:test:unit / Missing or empty tier input is never an error
  @e2e-exempt
  # Behaviour: FEL-017
  Scenario Outline: Missing or empty tier input is never an error
    Given <setup>
    And APP_ENV is set to "<tier>"
    When the env tier loads from the search directory
    Then loading completes without raising

    Examples:
      | setup                                                      | tier             |
      | a fresh temporary search directory                         | nonexistent-tier |
      | a search directory that does not exist                     | test             |
      | the search directory has a ".env.test" file with no content | test             |

  # Exemption(e2e): the library exposes no public browser, HTTP, or process boundary; alternative-proof: fsharp-env-loader:test:unit / A value containing "=" keeps only the substring after the first "="
  @e2e-exempt
  Scenario: A value containing "=" keeps only the substring after the first "="
    Given the search directory has a ".env.test" file with the raw line "GREETING=key=value=with=equals"
    And APP_ENV is set to "test"
    When the env tier loads from the search directory
    Then "GREETING" is "key=value=with=equals"

  # Exemption(e2e): the library exposes no public browser, HTTP, or process boundary; alternative-proof: fsharp-env-loader:test:unit / CRLF-terminated lines parse the same as LF-terminated lines
  @e2e-exempt
  # Behaviour: FEL-008
  Scenario: CRLF-terminated lines parse the same as LF-terminated lines
    Given the search directory has a ".env.test" file with CRLF lines setting "VAR_A" to "value-a" and "VAR_B" to "value-b"
    And APP_ENV is set to "test"
    When the env tier loads from the search directory
    Then "VAR_A" is "value-a"
    And "VAR_B" is "value-b"

  # Exemption(e2e): the library exposes no public browser, HTTP, or process boundary; alternative-proof: fsharp-env-loader:test:unit / Blank lines and full-line "#" comments are skipped
  @e2e-exempt
  Scenario: Blank lines and full-line "#" comments are skipped
    Given the search directory has a ".env.test" file with a leading comment, a blank line, then "GREETING" set to "actual-value", then a trailing comment
    And APP_ENV is set to "test"
    When the env tier loads from the search directory
    Then "GREETING" is "actual-value"

  # Exemption(e2e): the library exposes no public browser, HTTP, or process boundary; alternative-proof: fsharp-env-loader:test:unit / A line with no "=" is skipped without throwing
  @e2e-exempt
  Scenario: A line with no "=" is skipped without throwing
    Given the search directory has a ".env.test" file with a line with no "=" followed by "GREETING" set to "set"
    And APP_ENV is set to "test"
    When the env tier loads from the search directory
    Then "GREETING" is "set"

  # Exemption(e2e): the library exposes no public browser, HTTP, or process boundary; alternative-proof: fsharp-env-loader:test:unit / Surrounding whitespace is trimmed from both key and value
  @e2e-exempt
  Scenario: Surrounding whitespace is trimmed from both key and value
    Given the search directory has a ".env.test" file setting padded "GREETING" to "padded-value"
    And APP_ENV is set to "test"
    When the env tier loads from the search directory
    Then "GREETING" is "padded-value"

  # Exemption(e2e): the library exposes no public browser, HTTP, or process boundary; alternative-proof: fsharp-env-loader:test:unit / The process environment wins over a tier file value
  @e2e-exempt
  # Behaviour: FEL-007
  Scenario Outline: The process environment wins over a tier file value
    Given a fresh temporary search directory
    And the search directory has a ".env.test" file setting "GREETING" to "from-file"
    And <processEnv>
    And APP_ENV is set to "test"
    When the env tier loads from the search directory
    Then "GREETING" is "<expected>"

    Examples:
      | processEnv                                                    | expected         |
      | the process environment already has "GREETING" set to "from-process-env" | from-process-env |
      | the process environment does not have "GREETING" set          | from-file        |
      | the process environment already has "GREETING" set to ""      |                  |

  # Exemption(e2e): the library exposes no public browser, HTTP, or process boundary; alternative-proof: fsharp-env-loader:test:unit / Referencing the library never loads a tier file
  @e2e-exempt
  # Behaviour: FEL-018
  Scenario: Referencing the library never loads a tier file
    Given the search directory has a ".env.test" file setting "GREETING" to "from-file"
    And APP_ENV is set to "test"
    When the env tier resolves
    Then the process environment has no "GREETING" value
