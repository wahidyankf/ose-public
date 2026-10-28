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

  # Exemption(integration): option selection is pure in-process logic; alternative-proof: ayokoding-www:test:unit / a local build accepts a bounded worker override
  @integration-exempt
  # Exemption(e2e): the build option has no browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / a local build accepts a bounded worker override
  @e2e-exempt
  Scenario Outline: a local build accepts a bounded worker override
    Given the ayokoding-www build configuration
    When it is evaluated locally with worker override <workers>
    Then the experimental worker options are <result>

    Examples:
      | workers | result      |
      | ""      | { cpus: 2 } |
      | "1"     | { cpus: 1 } |
      | "2"     | { cpus: 2 } |

  # Exemption(integration): validation is pure in-process logic; alternative-proof: ayokoding-www:test:unit / a local build rejects an invalid worker override
  @integration-exempt
  # Exemption(e2e): the build option has no browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / a local build rejects an invalid worker override
  @e2e-exempt
  Scenario Outline: a local build rejects an invalid worker override
    Given the ayokoding-www build configuration
    When it is evaluated locally with worker override <workers>
    Then the build configuration rejects the worker override without echoing its value

    Examples:
      | workers |
      | "0"     |
      | "3"     |
      | "-1"    |
      | "1.5"   |
      | "abc"   |

  # Exemption(integration): option selection is pure in-process logic; alternative-proof: ayokoding-www:test:unit / hosted builds ignore the local worker override
  @integration-exempt
  # Exemption(e2e): the build option has no browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / hosted builds ignore the local worker override
  @e2e-exempt
  Scenario Outline: hosted builds ignore the local worker override
    Given the ayokoding-www build configuration
    When it is evaluated with CI <ci>, VERCEL <vercel>, and worker override <workers>
    Then the experimental worker options are {}

    Examples:
      | ci     | vercel | workers |
      | "true" | unset  | "1"     |
      | unset  | "1"    | "3"     |
      | "0"    | ""     | ""      |
      | ""     | "0"    | "1.5"   |

  # Exemption(integration): the supplied environment is an in-process value; alternative-proof: ayokoding-www:test:unit / evaluating a local build leaves the supplied environment unchanged
  @integration-exempt
  # Exemption(e2e): caller environment identity has no browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / evaluating a local build leaves the supplied environment unchanged
  @e2e-exempt
  Scenario: evaluating a local build leaves the supplied environment unchanged
    Given a frozen local build environment with an empty worker override
    When the build configuration is evaluated with that environment
    Then the experimental worker options are { cpus: 2 }
    And the supplied environment retains its CI, VERCEL, and worker override values
