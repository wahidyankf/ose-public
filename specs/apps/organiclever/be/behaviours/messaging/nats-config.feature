Feature: organiclever-be messaging configuration

  As an operations engineer
  I want organiclever-be to validate its NATS configuration at startup
  So that misconfigured deployments fail fast with a clear error rather than silently degrading

  # Behaviour: OBE-015
  # Behaviour: OBE-021
  Scenario: organiclever-be fails fast when its NATS URL is missing
    Given ORGANICLEVER_BE_NATS_URL is unset
    When organiclever-be reads its messaging configuration
    Then startup aborts with a clear missing-variable error
