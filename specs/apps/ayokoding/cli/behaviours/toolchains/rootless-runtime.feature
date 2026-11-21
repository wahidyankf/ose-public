Feature: Container operations require a rootless runtime
  As a course runner
  I want a reachable rootless engine and the selected Compose provider
  So that workloads use the intended runtime safely

  # Behaviour: AYC-043
  # Behaviour: AYC-074
  Scenario: A rootful connection is rejected before workload creation
    Given a container runtime reporting a rootful connection
    When I check the runtime before creating a workload
    Then it exits with status 125
    And no workload is created

  # Behaviour: AYC-043
  Scenario: An unreachable engine preserves its environment status
    Given an unreachable container runtime
    When I check the runtime before creating a workload
    Then it exits with status 125
    And no workload is created

  # Behaviour: AYC-044
  Scenario: A failed image pull exits 125 with ayokoding.env.container-runtime-unavailable
    Given the container pull fails
    When I check the course by name
    Then it exits with status 125
    And standard error names error code "ayokoding.env.container-runtime-unavailable"
