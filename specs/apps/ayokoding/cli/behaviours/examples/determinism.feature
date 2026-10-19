Feature: Runs are deterministic
  As a reviewer
  I want the harness to block the common sources of flakiness
  So that a green check means the same thing every time

  Background:
    Given an opted-in course

  Scenario: A run cannot reach the network
    Given a unit whose program fetches a web address and prints the response
    When I check the course by name
    Then the run is labelled "failed"

  # Exemption(e2e): the environment is fixed by the argv the unit tests compare byte for byte and the fake container process records; alternative-proof: ayokoding-cli:test:integration / A run sees only the fixed environment
  @e2e-exempt
  Scenario: A run sees only the fixed environment
    Given the host environment contains the variable "SECRET_TOKEN"
    When the harness runs a unit
    Then the run's environment does not contain "SECRET_TOKEN"
    And the run's environment sets "TZ" to "UTC" and "SOURCE_DATE_EPOCH" to "0"

  Scenario: A run whose two executions differ is reported as nondeterministic
    Given a unit whose program prints an unseeded random number
    When I check the course by name
    Then the finding "ayokoding.examples.nondeterministic" shows the first differing line

  Scenario: A run cannot change the course files
    Given a unit whose program overwrites its own source file
    When I check the course by name
    Then the source file in the course is unchanged
