Feature: Numeric listener port flag

  As an operator starting a service from a script
  I want a port flag given as a number to mean the same port as the same digits given as text
  So that a caller that builds the flag from a number does not get a different listener

  # Exemption(e2e): argv is always a string at the process boundary, so a numeric flag value never reaches the wrapper; alternative-proof: ts-env-loader:test:unit / A numeric flag value such as 5000 is accepted like the string "5000"
  @e2e-exempt
  # Exemption(integration): the resolver takes its flag and environment record as plain values and touches no file, network, or process; alternative-proof: ts-env-loader:test:unit / A numeric flag value such as 5000 is accepted like the string "5000"
  @integration-exempt
  # Behaviour: TEL-008
  Scenario: A numeric flag value such as 5000 is accepted like the string "5000"
    Given the app declares the prefixed variable "OSE_WWW_PORT" with fallback 3100
    And the environment does not set "OSE_WWW_PORT"
    When the port resolves with a numeric "--port" flag of 5000
    Then the resolved port is 5000
