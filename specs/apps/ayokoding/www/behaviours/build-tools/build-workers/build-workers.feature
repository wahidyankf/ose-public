Feature: ayokoding-www build worker cap

  As a developer building ayokoding-www on a workstation
  I want the build to cap its worker count outside CI and Vercel
  So that a local build leaves the machine responsive while CI and Vercel keep the default worker count

  # Exemption(e2e): the build-time script writes repository files and is not part of the served site, so no end-to-end boundary exists for it; alternative-proof: ayokoding-www:test:unit / A local build uses two workers while CI and Vercel builds keep the default worker count
  @e2e-exempt
  # Behaviour: AYW-072
  Scenario Outline: A local build uses two workers while CI and Vercel builds keep the default worker count
    Given the ayokoding-www build configuration
    When it is evaluated with CI <ci>, VERCEL <vercel>, and worker override <workers>
    Then the experimental worker options are <result>

    # An unset or empty variable counts as absent; a quoted value is the literal string.
    # Hosted rows (CI or VERCEL set) ignore the local worker override, so they keep the default count.
    Examples:
      | ci     | vercel | workers | result      |
      | unset  | unset  | unset   | { cpus: 2 } |
      | "true" | unset  | unset   | {}          |
      | unset  | "1"    | unset   | {}          |
      | "true" | "1"    | unset   | {}          |
      | ""     | ""     | unset   | { cpus: 2 } |
      | "true" | unset  | "1"     | {}          |
      | unset  | "1"    | "3"     | {}          |
      | "0"    | ""     | ""      | {}          |
      | ""     | "0"    | "1.5"   | {}          |

  # Exemption(e2e): the build-time script writes repository files and is not part of the served site, so no end-to-end boundary exists for it; alternative-proof: ayokoding-www:test:unit / A local build accepts AYOKODING_WWW_BUILD_WORKERS of 1 or 2
  @e2e-exempt
  # Behaviour: AYW-071
  Scenario Outline: A local build accepts AYOKODING_WWW_BUILD_WORKERS of 1 or 2
    Given the ayokoding-www build configuration
    When it is evaluated locally with worker override <workers>
    Then the experimental worker options are <result>

    Examples:
      | workers | result      |
      | ""      | { cpus: 2 } |
      | "1"     | { cpus: 1 } |
      | "2"     | { cpus: 2 } |

  # Exemption(e2e): the build-time script writes repository files and is not part of the served site, so no end-to-end boundary exists for it; alternative-proof: ayokoding-www:test:unit / A local build fails with a message naming AYOKODING_WWW_BUILD_WORKERS when its value is not 1 or 2
  @e2e-exempt
  # Behaviour: AYW-076
  Scenario Outline: A local build fails with a message naming AYOKODING_WWW_BUILD_WORKERS when its value is not 1 or 2
    Given the ayokoding-www build configuration
    When it is evaluated locally with worker override <workers>
    Then the build configuration fails with a message naming AYOKODING_WWW_BUILD_WORKERS

    Examples:
      | workers |
      | "0"     |
      | "3"     |
      | "-1"    |
      | "1.5"   |
      | "abc"   |
