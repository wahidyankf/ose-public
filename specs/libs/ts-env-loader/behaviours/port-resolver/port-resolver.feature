Feature: Runtime listener port resolution
  As an operator starting a service
  I want one precedence rule for the listener port across every app in the repository
  So that the same flag and the same prefixed variable move the port in local development and in a container alike

  # Behaviour: OAW-030
  # Behaviour: OWW-012
  # Behaviour: OSA-003
  # Behaviour: TEL-007
  # Behaviour: TEL-011
  # Behaviour: TEL-013
  Scenario Outline: A port resolves from the highest source that supplies one
    Given the app declares the prefixed variable "OSE_WWW_PORT" with fallback 3100
    And the environment sets "OSE_WWW_PORT" to "<envValue>"
    When the port resolves with a "--port" flag of "<flagValue>"
    Then the resolved port is <expected>

    Examples:
      | flagValue | envValue | expected |
      | 5000      | 4000     | 5000     |
      |           | 4000     | 4000     |
      |           |          | 3100     |

  # Behaviour: TEL-012
  Scenario: A bare PORT variable never moves the listener
    Given the app declares the prefixed variable "OSE_WWW_PORT" with fallback 3100
    And the environment sets "PORT" to "4000"
    And the environment does not set "OSE_WWW_PORT"
    When the port resolves with no "--port" flag
    Then the resolved port is 3100

  Scenario Outline: A blank value at a tier falls through to the next tier
    Given the app declares the prefixed variable "OSE_WWW_PORT" with fallback 3100
    And the environment sets "OSE_WWW_PORT" to "<envValue>"
    When the port resolves with a "--port" flag of "<flagValue>"
    Then the resolved port is <expected>

    Examples:
      | flagValue | envValue | expected |
      |           | 4000     | 4000     |
      |           |          | 3100     |
      | 5000      |          | 5000     |

  # Behaviour: TEL-016
  Scenario Outline: A malformed port is rejected with an error naming its source and the valid range
    Given the app declares the prefixed variable "OSE_WWW_PORT" with fallback 3100
    And the environment sets "OSE_WWW_PORT" to "<envValue>"
    When the port resolves with a "--port" flag of "<flagValue>"
    Then resolution throws, naming "<source>" and the valid range

    Examples:
      | source       | flagValue | envValue   |
      | --port       | 0         |            |
      | --port       | 65536     |            |
      | --port       | abc       |            |
      | --port       | 3100abc   |            |
      | --port       | 31.5      |            |
      | --port       | -1        |            |
      | --port       | 0x10      |            |
      | --port       | 0b1010    |            |
      | --port       | 1e3       |            |
      | --port       | +3100     |            |
      | OSE_WWW_PORT |           | not-a-port |

  # Behaviour: TEL-017
  Scenario: An out-of-range compiled-in fallback is caught at startup
    Given the app declares the prefixed variable "OSE_WWW_PORT" with fallback 70000
    And the environment does not set "OSE_WWW_PORT"
    When the port resolves with no "--port" flag
    Then resolution throws, naming "OSE_WWW_PORT" and the valid range

  # Behaviour: TEL-014
  Scenario: A whitespace-only flag or variable is blank and falls through to the next tier
    Given the app declares the prefixed variable "OSE_WWW_PORT" with fallback 3100
    And the environment sets "OSE_WWW_PORT" to "   "
    When the port resolves with a "--port" flag of "   "
    Then the resolved port is 3100
