Feature: The command line contract
  As a maintainer
  I want ayokoding-cli to follow the repository's command line convention
  So that scripts and people can rely on its statuses and streams

  # Behaviour: AYC-001
  # Behaviour: AYC-002
  # Behaviour: AYC-031
  Scenario: Help lists every command and every exit status
    When I ask ayokoding-cli for help
    Then it exits with status 0
    And standard output lists the commands "examples" and "toolchains"
    And standard output lists the exit statuses 0, 1, 2, 124, 125, 126, 127, 130, and 141 with their meanings

  # Behaviour: AYC-003
  # Behaviour: AYC-051
  Scenario: A bare invocation prints help to standard error
    When I run ayokoding-cli with no arguments
    Then it exits with status 2
    And standard output is empty
    And standard error shows the usage

  # Behaviour: AYC-004
  Scenario: The version names the build, the commit, and the catalog
    Given a build stamped with version "v0.0.0-test" and an all-zero commit
    When I ask ayokoding-cli for its version
    Then standard output names version "v0.0.0-test", the all-zero commit, and the catalog hash

  # Behaviour: AYC-040
  # Behaviour: AYC-051
  Scenario: An unknown flag is a usage error
    When I run ayokoding-cli with the flag "--no-such-flag"
    Then it exits with status 2
    And standard output is empty

  # Behaviour: AYC-026
  # Behaviour: AYC-032
  Scenario: NO_COLOR removes colour from both streams
    Given the environment variable NO_COLOR is set
    And a fixture course with a failing run
    When I check that course with colour set to auto
    Then neither stream contains an escape sequence
    And each failed run is labelled with the word "failed"

  # Behaviour: AYC-027
  Scenario Outline: A colour flag overrides the automatic colour choice
    Given a fixture course with a failing run
    When I check that course with colour set to "<mode>"
    Then the colour in the output is "<colour>"

    Examples:
      | mode   | colour  |
      | always | present |
      | never  | absent  |

  # Behaviour: AYC-028
  Scenario: --no-input is accepted and the toolchain list still prints
    Given the embedded catalog
    When I list the toolchains with --no-input
    Then it exits with status 0
    And each line shows an id, a kind, a version, and a digest-pinned image

  # Behaviour: AYC-025
  Scenario: --output json prints one JSON document on standard output when the command succeeds
    When I list the toolchains with JSON output
    Then it exits with status 0
    And standard output is one JSON document

  # Behaviour: AYC-034
  # Behaviour: AYC-041
  Scenario: An internal failure exits 2 without a stack trace
    Given the harness fails internally while checking a course
    When the command ends
    Then it exits with status 2
    And standard error names error code "ayokoding.internal.panic"
    And standard error contains no stack trace

  # Behaviour: AYC-048
  Scenario: An interrupt removes started containers and exits 130
    Given a fixture course whose run is still executing
    When the harness receives an interrupt
    Then every container and network labelled with this run is removed
    And it exits with status 130

  # Behaviour: AYC-049
  Scenario: A closed output pipe exits 141
    Given a reader that closes standard output after one line
    When I check a fixture course with many findings
    Then the exit status is 141
