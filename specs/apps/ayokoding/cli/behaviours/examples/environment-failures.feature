Feature: Environment failures use the supervisor statuses
  As a script author
  I want environment problems distinguished from failing examples
  So that a broken runner is never read as a broken course

  Background:
    Given an opted-in course with one unit

  Scenario: A missing container command exits 127
    Given the container command does not exist
    When I check the course by name
    Then it exits with status 127
    And standard error names error code "ayokoding.env.container-cli-not-found"

  # Exemption(e2e): a non-executable container command cannot be arranged on this operating system without replacing the runner's real Podman; alternative-proof: ayokoding-cli:test:integration / A container command that cannot run exits 126
  @e2e-exempt
  Scenario: A container command that cannot run exits 126
    Given the container command exists but is not executable
    When I check the course by name
    Then it exits with status 126

  # Exemption(e2e): making the runner's rootless Podman engine unreachable would break the shared local socket the other scenarios need; alternative-proof: ayokoding-cli:test:integration / An unavailable container runtime exits 125
  @e2e-exempt
  Scenario: An unavailable container runtime exits 125
    Given the container runtime reports that it is unavailable
    When I check the course by name
    Then it exits with status 125
    And standard error names error code "ayokoding.env.container-runtime-unavailable"

  # Exemption(e2e): a service that never becomes ready cannot be arranged with a pinned real image on the internal network; alternative-proof: ayokoding-cli:test:integration / A service that never becomes ready exits 124
  @e2e-exempt
  Scenario: A service that never becomes ready exits 124
    Given the unit declares a service that never reports ready
    When I check the course by name
    Then it exits with status 124
    And no service container or network remains afterwards

  Scenario: The runner defaults to Podman when no runtime override is set
    Given no container runtime override is set
    When I check the course by name
    Then the runner uses podman
