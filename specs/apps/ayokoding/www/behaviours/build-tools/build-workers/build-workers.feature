Feature: ayokoding-www build worker cap

  As a developer building ayokoding-www on a workstation
  I want the build to cap its worker count outside CI and Vercel
  So that a local build leaves the machine responsive while CI and Vercel keep the default worker count

  # Exemption(integration): the scenario is pure in-process option selection with no local-resource boundary; alternative-proof: ayokoding-www:test:unit / ayokoding-www build workers follow the environment
  @integration-exempt
  # Exemption(e2e): the scenario is pure in-process option selection with no public browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / ayokoding-www build workers follow the environment
  @e2e-exempt
  Scenario Outline: ayokoding-www build workers follow the environment
    Given the ayokoding-www build configuration
    When it is evaluated with CI <ci> and VERCEL <vercel>
    Then the experimental worker options are <result>

    # An unset or empty variable counts as absent; a quoted value is the literal string.
    Examples:
      | ci     | vercel | result      |
      | unset  | unset  | { cpus: 2 } |
      | "true" | unset  | {}          |
      | unset  | "1"    | {}          |
      | "true" | "1"    | {}          |
      | ""     | ""     | { cpus: 2 } |

  # Exemption(integration): worker-count parsing is pure in-process configuration; no local-resource boundary is touched; alternative-proof: ayokoding-www:test:unit / local build worker counts are validated
  @integration-exempt
  # Exemption(e2e): worker-count parsing has no public browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / local build worker counts are validated
  @e2e-exempt
  Scenario Outline: local build worker counts are validated
    Given the ayokoding-www build configuration
    When it is evaluated with AYOKODING_WWW_BUILD_WORKERS <workers>
    Then the experimental worker options are <result>

    # An unset or empty variable uses the default; quoted values are literal environment strings.
    Examples:
      | workers | result      |
      | unset   | { cpus: 2 } |
      | ""      | { cpus: 2 } |
      | "1"     | { cpus: 1 } |
      | "2"     | { cpus: 2 } |

  # Exemption(integration): invalid worker-count parsing is a pure in-process configuration failure; alternative-proof: ayokoding-www:test:unit / invalid local build worker counts fail safely
  @integration-exempt
  # Exemption(e2e): invalid worker-count parsing has no public browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / invalid local build worker counts fail safely
  @e2e-exempt
  Scenario Outline: invalid local build worker counts fail safely
    Given the ayokoding-www build configuration
    When it is evaluated with AYOKODING_WWW_BUILD_WORKERS <workers>
    Then the worker configuration error is sanitized

    Examples:
      | workers  |
      | "0"      |
      | "3"      |
      | "many"   |
      | " 1 "    |

  # Exemption(integration): deployment build-worker selection is pure in-process configuration; alternative-proof: ayokoding-www:test:unit / deployment build workers ignore local overrides
  @integration-exempt
  # Exemption(e2e): deployment build-worker selection has no public browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / deployment build workers ignore local overrides
  @e2e-exempt
  Scenario Outline: deployment build workers ignore local overrides
    Given the ayokoding-www build configuration
    When it is evaluated with <platform> and AYOKODING_WWW_BUILD_WORKERS <workers>
    Then the experimental worker options are {}

    Examples:
      | platform | workers    |
      | CI       | "invalid"  |
      | VERCEL   | "0"        |
