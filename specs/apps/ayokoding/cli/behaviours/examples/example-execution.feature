Feature: Examples run and print what the lesson shows
  As a content author
  I want each run compared with its expectation
  So that a course is green only when its code works

  Background:
    Given an opted-in course

  # Behaviour: AYC-007
  # Behaviour: AYC-008
  # Behaviour: AYC-013
  # Behaviour: AYC-038
  Scenario: An example whose output matches its expected file passes
    Given a unit whose program prints exactly its expected output and exits 0
    When I check the course by name
    Then the run is labelled "passed"
    And it exits with status 0

  # Behaviour: AYC-039
  # Behaviour: AYC-060
  Scenario: A different exit status fails the run
    Given a unit whose program exits 3 where the run spec expects 0
    When I check the course by name
    Then the finding "ayokoding.examples.exit-mismatch" names expected 0 and actual 3
    And it exits with status 1

  # Behaviour: AYC-060
  Scenario: Different standard output fails the run with the first differing line
    Given a unit whose program prints a different second line than its expected file
    When I check the course by name
    Then the finding "ayokoding.examples.stdout-mismatch" shows line 2 expected and actual

  # Behaviour: AYC-060
  Scenario: Unexpected standard error fails the run
    Given a unit whose program writes a warning to standard error where the run spec expects it empty
    When I check the course by name
    Then the finding "ayokoding.examples.stderr-mismatch" is reported

  # Behaviour: AYC-060
  Scenario: A run that exceeds its timeout fails as a timed-out result
    Given a unit whose program runs longer than its two-second timeout
    When I check the course by name
    Then the finding "ayokoding.examples.run-timeout" is reported
    And it exits with status 1

  # Behaviour: AYC-021
  Scenario: Recording writes only missing expected files
    Given a unit with two runs, one with an expected output file and one without
    When I run the course by name with recording enabled
    Then the missing expected file is written with the run's output
    And the existing expected file is unchanged

  # Behaviour: AYC-071
  Scenario: An example with a service reaches it by name
    Given a unit that declares the "postgres" service and queries it at host "postgres"
    When I check the course by name
    Then the run is labelled "passed"
    And no service container or network remains afterwards

  # Behaviour: AYC-019
  Scenario: --unit runs one unit of the selected course only
    Given a course with two units whose programs both print their expected output
    When I run the course by name with the unit "learning/code/ex-01-hello"
    Then only the unit "learning/code/ex-01-hello" is run

  # Behaviour: AYC-022
  Scenario: --single-run skips the determinism double run
    Given a unit whose program prints an unseeded random number
    When I run the course by name with a single run
    Then the run reports its first comparison and no nondeterministic finding
