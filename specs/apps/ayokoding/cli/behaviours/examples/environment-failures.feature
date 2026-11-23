Feature: Environment failures use the supervisor statuses
  As a script author
  I want environment problems distinguished from failing examples
  So that a broken runner is never read as a broken course

  Background:
    Given an opted-in course with one unit

  # Behaviour: AYC-046
  Scenario: A missing container command exits 127
    Given the container command does not exist
    When I check the course by name
    Then it exits with status 127
    And standard error names error code "ayokoding.env.container-cli-not-found"

  # Behaviour: AYC-045
  Scenario: A container command that cannot run exits 126
    Given the container command exists but is not executable
    When I check the course by name
    Then it exits with status 126

  # Behaviour: AYC-066
  Scenario: An unavailable container runtime exits 125
    Given the container runtime reports that it is unavailable
    When I check the course by name
    Then it exits with status 125
    And standard error names error code "ayokoding.env.container-runtime-unavailable"

  # Behaviour: AYC-042
  # Behaviour: AYC-065
  Scenario: A service that never becomes ready exits 124
    Given the unit declares a service that never reports ready
    When I check the course by name
    Then it exits with status 124
    And no service container or network remains afterwards

  # Behaviour: AYC-033
  Scenario: AYOKODING_CONTAINER_CLI replaces the default podman command
    Given the container command is replaced by a fake that logs its calls
    When I check the course by name
    Then the fake container CLI logs a started container

  # Behaviour: AYC-047
  Scenario: A missing git with --since exits 127 with ayokoding.env.git-not-found
    Given git is not on the search path
    When I run the examples changed since the base revision
    Then it exits with status 127
    And standard error names error code "ayokoding.env.git-not-found"
