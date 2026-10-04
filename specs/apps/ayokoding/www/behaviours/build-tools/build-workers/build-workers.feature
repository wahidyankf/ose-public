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
