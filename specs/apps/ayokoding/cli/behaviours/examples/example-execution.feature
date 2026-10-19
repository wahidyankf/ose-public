Feature: Examples run and print what the lesson shows
  As a content author
  I want each run compared with its expectation
  So that a course is green only when its code works

  Background:
    Given an opted-in course

  Scenario: An example whose output matches its expected file passes
    Given a unit whose program prints exactly its expected output and exits 0
    When I check the course by name
    Then the run is labelled "passed"
    And it exits with status 0

  # Exemption(e2e): comparing a recorded exit status is decided in the local process after the container exits, so the passing scenario already covers the container boundary; alternative-proof: ayokoding-cli:test:integration / A different exit status fails the run
  @e2e-exempt
  Scenario: A different exit status fails the run
    Given a unit whose program exits 3 where the run spec expects 0
    When I check the course by name
    Then the finding "ayokoding.examples.exit-mismatch" names expected 0 and actual 3
    And it exits with status 1

  # Exemption(e2e): output comparison runs in the local process on bytes the passing scenario already produced through a real container; alternative-proof: ayokoding-cli:test:integration / Different standard output fails the run with the first differing line
  @e2e-exempt
  Scenario: Different standard output fails the run with the first differing line
    Given a unit whose program prints a different second line than its expected file
    When I check the course by name
    Then the finding "ayokoding.examples.stdout-mismatch" shows line 2 expected and actual

  # Exemption(e2e): the stderr rule is decided in the local process after the container exits; alternative-proof: ayokoding-cli:test:integration / Unexpected standard error fails the run
  @e2e-exempt
  Scenario: Unexpected standard error fails the run
    Given a unit whose program writes a warning to standard error where the run spec expects it empty
    When I check the course by name
    Then the finding "ayokoding.examples.stderr-mismatch" is reported

  # Exemption(e2e): a real two-second timeout cannot be arranged against the local process clock without stalling the shared suite; the fake clock proves the same timeout boundary; alternative-proof: ayokoding-cli:test:integration / A run that exceeds its timeout fails as a timed-out result
  @e2e-exempt
  Scenario: A run that exceeds its timeout fails as a timed-out result
    Given a unit whose program runs longer than its two-second timeout
    When I check the course by name
    Then the finding "ayokoding.examples.run-timeout" is reported
    And it exits with status 1

  # Exemption(e2e): recording writes files to the local filesystem after runs complete and is proved with fake container outputs; alternative-proof: ayokoding-cli:test:integration / Recording writes only missing expected files
  @e2e-exempt
  Scenario: Recording writes only missing expected files
    Given a unit with two runs, one with an expected output file and one without
    When I run the course by name with recording enabled
    Then the missing expected file is written with the run's output
    And the existing expected file is unchanged

  Scenario: An example with a service reaches it by name
    Given a unit that declares the "postgres" service and queries it at host "postgres"
    When I check the course by name
    Then the run is labelled "passed"
    And no service container or network remains afterwards
