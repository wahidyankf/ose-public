Feature: Runtime listener port resolution

  As an operator starting a service
  I want one precedence rule for the listener port across every app in the repository
  So that the same flag and the same prefixed variable move the port in local development and in a container alike

  # Exemption(e2e): the library exposes no public browser, HTTP, or process boundary; alternative-proof: fsharp-env-loader:test:unit / A port resolves from the highest source that supplies one
  @e2e-exempt
  # Behaviour: FEL-004
  # Behaviour: FEL-009
  # Behaviour: OBE-019
  # Behaviour: OSB-014
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

  # Exemption(e2e): the library exposes no public browser, HTTP, or process boundary; alternative-proof: fsharp-env-loader:test:unit / A bare PORT variable never moves the listener
  @e2e-exempt
  # Behaviour: FEL-012
  Scenario: A bare PORT variable never moves the listener
    Given the app declares the prefixed variable "OSE_WWW_PORT" with fallback 3100
    And the environment sets "PORT" to "4000"
    And the environment does not set "OSE_WWW_PORT"
    When the port resolves with no "--port" flag
    Then the resolved port is 3100

  # Exemption(e2e): the library exposes no public browser, HTTP, or process boundary; alternative-proof: fsharp-env-loader:test:unit / A blank value at a tier falls through to the next tier
  @e2e-exempt
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

  # Exemption(e2e): the library exposes no public browser, HTTP, or process boundary; alternative-proof: fsharp-env-loader:test:unit / A present but malformed port is rejected with an error naming its source and the valid range
  @e2e-exempt
  # Behaviour: FEL-015
  # Behaviour: OBE-017
  # Behaviour: OSB-012
  Scenario Outline: A present but malformed port is rejected with an error naming its source and the valid range
    Given the app declares the prefixed variable "OSE_WWW_PORT" with fallback 3100
    And the environment sets "OSE_WWW_PORT" to "<envValue>"
    When the port resolves with a "--port" flag of "<flagValue>"
    Then resolution is rejected, naming "<source>" and the valid range

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

  # Exemption(e2e): the library exposes no public browser, HTTP, or process boundary; alternative-proof: fsharp-env-loader:test:unit / An out-of-range fallback is rejected with an error naming the variable and the valid range
  @e2e-exempt
  # Behaviour: FEL-016
  Scenario: An out-of-range fallback is rejected with an error naming the variable and the valid range
    Given the app declares the prefixed variable "OSE_WWW_PORT" with fallback 70000
    And the environment does not set "OSE_WWW_PORT"
    When the port resolves with no "--port" flag
    Then resolution is rejected, naming "OSE_WWW_PORT" and the valid range

  # Exemption(e2e): the library exposes no public browser, HTTP, or process boundary; alternative-proof: fsharp-env-loader:test:unit / The joined form --port=4000 is accepted like --port 4000
  @e2e-exempt
  # Behaviour: FEL-010
  Scenario: The joined form --port=4000 is accepted like --port 4000
    Given the app declares the prefixed variable "OSE_WWW_PORT" with fallback 3100
    And the environment does not set "OSE_WWW_PORT"
    When the port resolves with the argument "--port=4000"
    Then the resolved port is 4000

  # Exemption(e2e): the library exposes no public browser, HTTP, or process boundary; alternative-proof: fsharp-env-loader:test:unit / A trailing bare --port with no value falls through to the variable
  @e2e-exempt
  # Behaviour: FEL-011
  Scenario: A trailing bare --port with no value falls through to the variable
    Given the app declares the prefixed variable "OSE_WWW_PORT" with fallback 3100
    And the environment sets "OSE_WWW_PORT" to "4000"
    When the port resolves with the argument "--port"
    Then the resolved port is 4000

  # Exemption(e2e): the library exposes no public browser, HTTP, or process boundary; alternative-proof: fsharp-env-loader:test:unit / A whitespace-only flag or variable is blank and falls through to the next tier
  @e2e-exempt
  # Behaviour: FEL-013
  Scenario: A whitespace-only flag or variable is blank and falls through to the next tier
    Given the app declares the prefixed variable "OSE_WWW_PORT" with fallback 3100
    And the environment sets "OSE_WWW_PORT" to "   "
    When the port resolves with a "--port" flag of "   "
    Then the resolved port is 3100

  # Exemption(e2e): the library exposes no public browser, HTTP, or process boundary; alternative-proof: fsharp-env-loader:test:unit / The listen URL binds loopback on a developer machine and wildcard inside a container
  @e2e-exempt
  # Behaviour: FEL-005
  # Behaviour: FEL-014
  # Behaviour: OBE-022
  # Behaviour: OSB-020
  Scenario Outline: The listen URL binds loopback on a developer machine and wildcard inside a container
    Given the environment sets "DOTNET_RUNNING_IN_CONTAINER" to "<container>"
    When the listen URL is shaped for port 8302
    Then the listen URL is "<url>"

    Examples:
      | container | url                   |
      |           | http://localhost:8302 |
      | true      | http://+:8302         |
