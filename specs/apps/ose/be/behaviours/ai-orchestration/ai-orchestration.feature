Feature: AI orchestration context
  As a product engineer
  I want AI orchestration capabilities declared
  So that the bounded context boundary is established for future feature plans

  # Stub — detailed scenarios added in ai-orchestration feature plan
  # Behaviour: OSB-007
  Scenario: GET /api/v1/ai-orchestration/status reports the context ready
    Given the ose-be service is running
    When I send GET /api/v1/ai-orchestration/status
    Then the response status is 200
    And the response body has a "state" field equal to "Ready"

  # Exemption(e2e): the e2e level runs against a deployed ose-be environment, and none exists; alternative-proof: ose-be:test:integration / real environment adapter falls back to the documented defaults when unset
  @e2e-exempt
  # Behaviour: OSB-017
  # Behaviour: OSB-018
  # Behaviour: OSB-019
  Scenario: OpenRouter settings fall back to their defaults when unset
    Given OSE_BE_OPENROUTER_API_KEY, OSE_BE_OPENROUTER_MODEL, and OSE_BE_OPENROUTER_BASE_URL are unset
    When ose-be loads its OpenRouter settings
    Then the model is "openrouter/auto"
    And the base URL is "https://openrouter.ai/api/v1"
    And LLM calls stay disabled until an API key is configured
