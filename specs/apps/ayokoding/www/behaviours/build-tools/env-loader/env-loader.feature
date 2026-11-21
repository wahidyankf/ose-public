Feature: APP_ENV tier env-file loading

  As a developer running ayokoding-www across local, staging, and production tiers
  I want the app to load exactly one .env.<tier> file selected by APP_ENV
  So that .env.stag and .env.prod stay agent-restricted while builds still resolve correct config

  # Exemption(e2e): the build-time script writes repository files and is not part of the served site, so no end-to-end boundary exists for it; alternative-proof: ayokoding-www:test:unit / ayokoding-www bootstrap loads staging configuration
  @e2e-exempt
  # Behaviour: AYW-073
  Scenario: ayokoding-www bootstrap loads staging configuration
    Given only ".env.stag" exists in the app directory
    When the ayokoding-www environment bootstrap runs with APP_ENV set to "stag"
    Then each Ayokoding configuration value resolves to its ".env.stag" value

  # Exemption(e2e): the build-time script writes repository files and is not part of the served site, so no end-to-end boundary exists for it; alternative-proof: ayokoding-www:test:unit / ayokoding-www process env wins over the local tier file
  @e2e-exempt
  # Behaviour: AYW-074
  Scenario: ayokoding-www process env wins over the local tier file
    Given ".env.local" sets an app variable to a file value
    When the process starts with that variable already exported at tier "local"
    Then the exported process value is used
    And the ".env.local" value is not applied over it

  # Exemption(e2e): the build-time script writes repository files and is not part of the served site, so no end-to-end boundary exists for it; alternative-proof: ayokoding-www:test:unit / ayokoding-www tolerates a missing tier file
  @e2e-exempt
  Scenario: ayokoding-www tolerates a missing tier file
    Given no ".env.stag" file exists in the app directory
    When the loader runs with APP_ENV set to "stag"
    Then the loader does not throw
    And startup proceeds using whatever the process environment already supplies

  # Exemption(e2e): the build-time script writes repository files and is not part of the served site, so no end-to-end boundary exists for it; alternative-proof: ayokoding-www:test:unit / ayokoding-www fails loudly on a stray auto-loaded env file
  @e2e-exempt
  # Behaviour: AYW-077
  Scenario Outline: ayokoding-www fails loudly on a stray auto-loaded env file
    Given a stray "<file>" sits beside the app's tier file
    When the loader runs with APP_ENV set to a non-local tier
    Then the loader throws, naming "<file>" and the correct ".env.<tier>" replacement

    Examples:
      | file            |
      | .env            |
      | .env.production |
      | .env.local      |
