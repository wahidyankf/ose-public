Feature: Runs are deterministic
  As a reviewer
  I want the harness to block the common sources of flakiness
  So that a green check means the same thing every time

  Background:
    Given an opted-in course

  # Behaviour: AYC-068
  Scenario: A run cannot reach the network
    Given a unit whose program fetches a web address and prints the response
    When I check the course by name
    Then the run is labelled "failed"

  # Behaviour: AYC-072
  Scenario: A program cannot read host secrets
    Given the host environment contains the variable "SECRET_TOKEN"
    When the harness runs a unit
    Then the run's environment does not contain "SECRET_TOKEN"

  # Behaviour: AYC-072
  Scenario: A program sees TZ UTC and SOURCE_DATE_EPOCH 0
    Given a unit whose program records its environment
    When the harness runs a unit
    Then the run's environment sets "TZ" to "UTC" and "SOURCE_DATE_EPOCH" to "0"

  # Behaviour: AYC-061
  Scenario: A run whose two executions differ is reported as nondeterministic
    Given a unit whose program prints an unseeded random number
    When I check the course by name
    Then the finding "ayokoding.examples.nondeterministic" shows the first differing line

  # Behaviour: AYC-069
  Scenario: A run cannot change the course files
    Given a unit whose program overwrites its own source file
    When I check the course by name
    Then the source file in the course is unchanged
