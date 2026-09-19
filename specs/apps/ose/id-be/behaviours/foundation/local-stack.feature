Feature: OSE ID local service lifecycle

  As a local developer
  I want the OSE ID dependencies, backend, and web shell to start and stop as one owned unit
  So that a clean checkout becomes ready in order and leaves nothing behind afterwards

  Rule: The runner owns dependency order and cleanup

    Scenario: Start OSE ID from a clean checkout
      Given the documented local prerequisites are available and no OSE ID resources are running
      When the developer starts OSE ID locally
      Then PostgreSQL, the migrated backend, and the web shell become ready in dependency order
      And stopping the runner leaves no owned process, container, network, volume, or port reservation
