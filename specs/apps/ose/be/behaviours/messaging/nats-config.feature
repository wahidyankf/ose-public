Feature: ose-be messaging configuration

  As an operations engineer
  I want ose-be to validate its NATS configuration at startup
  So that misconfigured deployments fail fast with a clear error rather than silently degrading

  # Behaviour: OSB-010
  # Behaviour: OSB-016
  Scenario: ose-be fails fast when its NATS URL is missing
    Given OSE_BE_NATS_URL is unset
    When ose-be reads its messaging configuration
    Then startup aborts with a clear missing-variable error
