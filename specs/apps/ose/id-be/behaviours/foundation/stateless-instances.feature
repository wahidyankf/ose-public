Feature: OSE ID stateless backend instances

  As a local developer
  I want any backend instance to answer as well as any other
  So that correctness never depends on a request reaching the same process twice

  Rule: Correctness does not depend on affinity

    Scenario: Alternate requests between backend instances
      Given two backend instances share the same PostgreSQL schema and immutable configuration
      When health and database-backed diagnostic requests alternate between the instances
      Then every response is consistent with the shared dependency state
      And stopping either instance does not change the surviving instance's correctness
