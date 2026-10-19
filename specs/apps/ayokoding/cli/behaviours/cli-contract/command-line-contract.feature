Feature: The command line contract
  As a maintainer
  I want ayokoding-cli to follow the repository's command line convention
  So that scripts and people can rely on its statuses and streams

  Scenario: Help lists every command and every exit status
    When I ask ayokoding-cli for help
    Then it exits with status 0
    And standard output lists the commands "examples" and "toolchains"
    And standard output lists the exit statuses 0, 1, 2, 124, 125, 126, 127, 130, and 141 with their meanings

  Scenario: A bare invocation prints help to standard error
    When I run ayokoding-cli with no arguments
    Then it exits with status 2
    And standard output is empty
    And standard error shows the usage

  Scenario: The version names the build, the commit, and the catalog
    Given a build stamped with version "v0.0.0-test" and an all-zero commit
    When I ask ayokoding-cli for its version
    Then standard output names version "v0.0.0-test", the all-zero commit, and the catalog hash

  Scenario: An unknown flag is a usage error
    When I run ayokoding-cli with the flag "--no-such-flag"
    Then it exits with status 2
    And standard output is empty

  Scenario: A machine-readable error goes to standard error only
    When I run "examples run" with JSON output and no selection
    Then it exits with status 2
    And standard output is empty
    And standard error is one JSON document with error code "ayokoding.usage.missing-selection"

  Scenario: NO_COLOR removes colour from both streams
    Given the environment variable NO_COLOR is set
    And a fixture course with a failing run
    When I check that course with colour set to auto
    Then neither stream contains an escape sequence
    And each failed run is labelled with the word "failed"

  # Exemption(e2e): forcing an internal failure needs an in-process fault hook that the shipped binary does not expose; alternative-proof: ayokoding-cli:test:integration / An internal failure exits 2 without a stack trace
  @e2e-exempt
  Scenario: An internal failure exits 2 without a stack trace
    Given the harness fails internally while checking a course
    When the command ends
    Then it exits with status 2
    And standard error names error code "ayokoding.internal.panic"
    And standard error contains no stack trace

  # Exemption(e2e): the interrupt timing against real container processes is not deterministically observable from the local test process; alternative-proof: ayokoding-cli:test:integration / An interrupt removes started containers and exits 130
  @e2e-exempt
  Scenario: An interrupt removes started containers and exits 130
    Given a fixture course whose run is still executing
    When the harness receives an interrupt
    Then every container and network labelled with this run is removed
    And it exits with status 130

  Scenario: A closed output pipe exits 141
    Given a reader that closes standard output after one line
    When I check a fixture course with many findings
    Then the exit status is 141
