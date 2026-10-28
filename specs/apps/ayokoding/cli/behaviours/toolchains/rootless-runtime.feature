Feature: Container operations require a rootless runtime
  As a course runner
  I want a reachable rootless engine and the selected Compose provider
  So that workloads use the intended runtime safely

  # Exemption(e2e): rootful refusal is tested at the injected process boundary because a real rootful workload would mutate shared engine state; alternative-proof: ayokoding-cli:test:integration / A rootful connection is rejected before workload creation
  @e2e-exempt
  Scenario: A rootful connection is rejected before workload creation
    Given a container runtime reporting a rootful connection
    When I check the runtime before creating a workload
    Then it exits with status 125
    And no workload is created

  Scenario: An unreachable engine preserves its environment status
    Given an unreachable container runtime
    When I check the runtime before creating a workload
    Then it exits with status 125
    And no workload is created

  Scenario: An installed Docker Compose cannot override the selected provider
    Given podman-compose version 1.6.0 is selected and Docker Compose is installed
    When I check the Compose provider
    Then the selected podman-compose provider is used
    And Docker Compose is not used
