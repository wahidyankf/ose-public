Feature: Simulation runs follow the seed convention
  As a content author teaching distributed systems
  I want simulations checked for their seed summary and replayable by seed
  So that failures are reproducible and visible

  Background:
    Given an opted-in course

  # Behaviour: AYC-062
  Scenario: A simulation run must end with the seed summary
    Given a simulation unit whose program prints no summary line
    When I check the course by name
    Then the finding "ayokoding.examples.simulation-summary" is reported

  # Behaviour: AYC-062
  Scenario: A simulation with fewer than 32 seeds is rejected
    Given a simulation unit whose summary reads "seeds: 8 passed, 0 failed (of 8)"
    When I check the course by name
    Then the finding "ayokoding.examples.simulation-summary" names the total 8

  # Behaviour: AYC-020
  # Behaviour: AYC-035
  Scenario: Replaying one seed prints its trace and skips the expected output
    Given a simulation unit with 64 seeds
    When I run that unit with seed 17
    Then the run receives AYOKODING_SEED set to "17"
    And standard output shows the trace for seed 17
    And no expected-output comparison is made

  # Behaviour: AYC-062
  Scenario: A simulation expected to find failing seeds passes when it finds them
    Given a simulation unit that expects exit status 1 and an output listing seeds 4 and 31 as failing
    When I check the course by name
    Then the run is labelled "passed"
