Feature: Run specs are strict
  As a content author
  I want an invalid run spec rejected with a precise reason
  So that a typo never silently weakens a check

  # Behaviour: AYC-053
  Scenario: An unknown key is rejected
    Given a unit whose run spec has the key "expected_output"
    When I validate the course
    Then the finding "ayokoding.runspec.unknown-key" names the unit and line of "expected_output"

  # Behaviour: AYC-053
  Scenario: An unknown toolchain is rejected
    Given a unit whose run spec names the toolchain "cobol"
    When I validate the course
    Then the finding "ayokoding.runspec.unknown-toolchain" names "cobol"

  # Behaviour: AYC-053
  Scenario: A path that leaves the unit is rejected
    Given a unit whose run expects standard output from "../shared/out.txt"
    When I validate the course
    Then the finding "ayokoding.runspec.path-escape" names "../shared/out.txt"

  # Behaviour: AYC-053
  Scenario: A timeout above the maximum is rejected
    Given a unit whose run has the timeout "601s"
    When I validate the course
    Then the finding "ayokoding.runspec.timeout-out-of-range" names "601s"

  # Behaviour: AYC-053
  Scenario: Ignored example output needs a stated invariant
    Given a unit whose example run ignores standard output and states no invariant
    When I validate the course
    Then the finding "ayokoding.runspec.missing-invariant" names the run

  # Behaviour: AYC-053
  Scenario: A complete run spec passes validation
    Given a unit whose run spec declares a toolchain, a command, an exit status, and an expected output file
    When I validate the course
    Then no finding is reported for the unit

  # Behaviour: AYC-054
  Scenario Outline: Other run spec findings name their code
    Given the run spec of the unit "<unit>" in the broken course
    When I validate the course
    Then the run spec finding "<code>" names "<unit>"

    Examples:
      | unit                        | code                              |
      | ex-02-duplicate-key         | ayokoding.runspec.duplicate-key   |
      | ex-03-no-schema             | ayokoding.runspec.missing-schema  |
      | ex-04-bad-schema            | ayokoding.runspec.invalid-schema  |
      | ex-05-bad-type              | ayokoding.runspec.invalid-type    |
      | ex-06-no-toolchain          | ayokoding.runspec.missing-toolchain |
      | ex-08-bad-mode              | ayokoding.runspec.unknown-mode    |
      | ex-10-static-bad-reason     | ayokoding.runspec.unknown-static-reason |
      | ex-11-static-no-note        | ayokoding.runspec.missing-static-note |
      | ex-12-static-services       | ayokoding.runspec.static-with-services |
      | ex-13-bad-service           | ayokoding.runspec.unknown-service |
      | ex-14-no-runs               | ayokoding.runspec.missing-runs    |
      | ex-15-many-runs             | ayokoding.runspec.too-many-runs   |
      | ex-16-duplicate-run         | ayokoding.runspec.duplicate-run   |
      | ex-17-bad-name              | ayokoding.runspec.invalid-run-name |
      | ex-18-bad-kind              | ayokoding.runspec.unknown-run-kind |
      | ex-19-no-command            | ayokoding.runspec.missing-command |
      | ex-21-bad-memory            | ayokoding.runspec.memory-out-of-range |
      | ex-22-bad-cpus              | ayokoding.runspec.cpus-out-of-range |
      | ex-23-bad-exit              | ayokoding.runspec.exit-out-of-range |
      | ex-24-no-exit              | ayokoding.runspec.missing-exit    |
      | ex-25-no-stdout             | ayokoding.runspec.missing-stdout  |
      | ex-26-bad-stderr            | ayokoding.runspec.invalid-stderr  |
      | ex-27-bad-file              | ayokoding.runspec.invalid-expected-file |
      | ex-30-bad-env-name          | ayokoding.runspec.invalid-env-name |
      | ex-31-reserved-env          | ayokoding.runspec.reserved-env    |
