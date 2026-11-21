Feature: APP_ENV tier env-file loading
  As a developer setting up an app's composition root
  I want a single shared loader to apply exactly the current tier's env file
  So that every app enforces the same APP_ENV tier-loading contract without duplicating the logic

  # Exemption(e2e): the public next-with-port process boundary does not invoke the library's tier-file loader; alternative-proof: ts-env-loader:test:integration / Loads the selected tier's file
  @e2e-exempt
  # Behaviour: OAW-032
  # Behaviour: OWW-014
  # Behaviour: OSA-005
  # Behaviour: TEL-003
  # Behaviour: TEL-005
  # Behaviour: TEL-009
  Scenario: Loads the selected tier's file
    Given only ".env.stag" exists in the app directory
    When the loader runs with APP_ENV set to "stag"
    Then every variable defined in ".env.stag" is applied

  # Exemption(e2e): the public next-with-port process boundary does not invoke the library's tier-file loader; alternative-proof: ts-env-loader:test:integration / Process env always wins over the tier file
  @e2e-exempt
  # Behaviour: TEL-006
  # Behaviour: TEL-010
  Scenario: Process env always wins over the tier file
    Given ".env.local" sets a variable to a file value
    When the process already has that variable set at tier "local"
    Then the process value is used
    And the ".env.local" value is not applied over it

  # Exemption(e2e): the public next-with-port process boundary does not invoke the library's tier-file loader; alternative-proof: ts-env-loader:test:integration / Tolerates a missing tier file
  @e2e-exempt
  Scenario: Tolerates a missing tier file
    Given no ".env.stag" file exists in the app directory
    When the loader runs with APP_ENV set to "stag"
    Then the loader does not throw
    And the process environment is left otherwise untouched

  # Exemption(e2e): the public next-with-port process boundary does not invoke the library's tier-file loader; alternative-proof: ts-env-loader:test:integration / Fails loudly on a stray auto-loaded env file
  @e2e-exempt
  # Behaviour: TEL-015
  Scenario Outline: Fails loudly on a stray auto-loaded env file
    Given a stray "<file>" sits beside the tier file
    When the loader runs with APP_ENV set to a non-local tier
    Then the loader throws, naming "<file>" and the correct ".env.<tier>" replacement

    Examples:
      | file            |
      | .env            |
      | .env.production |
      | .env.local      |

  # Exemption(e2e): the public next-with-port process boundary does not invoke the library's tier-file loader; alternative-proof: ts-env-loader:test:integration / Tolerates a stray file at the local tier
  @e2e-exempt
  Scenario: Tolerates a stray file at the local tier
    Given a stray ".env" sits beside ".env.local"
    When the loader runs with APP_ENV set to "local"
    Then the loader does not throw

  # Exemption(e2e): the public next-with-port process boundary does not invoke the library's tier-file loader; alternative-proof: ts-env-loader:test:integration / The tier is local when APP_ENV is unset or empty
  @e2e-exempt
  # Behaviour: TEL-001
  Scenario: The tier is local when APP_ENV is unset or empty
    Given the app directory has a ".env.local" file setting "LOCAL_TIER_VAR" to "local-value"
    When the loader runs with APP_ENV unset or empty
    Then the ".env.local" file is applied in both cases

  # Exemption(e2e): the public next-with-port process boundary does not invoke the library's tier-file loader; alternative-proof: ts-env-loader:test:integration / The tier file path is the tier's dotenv file inside the app directory
  @e2e-exempt
  # Behaviour: TEL-002
  Scenario: The tier file path is the tier's dotenv file inside the app directory
    Given the app directory is the virtual app directory
    When the tier file path is built for tier "stag"
    Then the path is the ".env.stag" file inside the app directory

  # Exemption(e2e): the public next-with-port process boundary does not invoke the library's tier-file loader; alternative-proof: ts-env-loader:test:integration / With no options the loader reads the working directory and process.env
  @e2e-exempt
  # Behaviour: TEL-004
  Scenario: With no options the loader reads the working directory and process.env
    Given the working directory has a ".env.stag" file setting "CWD_TIER_VAR" to "from-cwd"
    When the loader runs with no options and APP_ENV set to "stag"
    Then the process environment has "CWD_TIER_VAR" set to "from-cwd"

  # Exemption(e2e): the public next-with-port process boundary does not invoke the library's tier-file loader; alternative-proof: ts-env-loader:test:integration / Importing the package never loads a tier file
  @e2e-exempt
  # Behaviour: TEL-018
  Scenario: Importing the package never loads a tier file
    Given the working directory has a ".env.stag" file setting "IMPORT_PROBE_VAR" to "from-file"
    When the package is imported with APP_ENV set to "stag"
    Then the process environment has no "IMPORT_PROBE_VAR" value
