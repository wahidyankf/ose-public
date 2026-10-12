Feature: Plain path page copy

  As a reader comparing paths
  I want path pages written in plain language
  So that I never meet internal planning vocabulary

  # Exemption(integration): the scenario reads committed content files only and has no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / Career path pages contain no internal planning vocabulary
  @integration-exempt
  # Exemption(e2e): the scenario reads committed content files only and has no public browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / Career path pages contain no internal planning vocabulary
  @e2e-exempt
  Scenario: Career path pages contain no internal planning vocabulary
    Given the paths hub page and every markdown page under content/en/learn/paths/careers
    When the page text is searched case-insensitively
    Then no page contains "Dangerous", "OI-2", "append", "manifest", or "from scratch" in any spelling

  # Exemption(integration): the scenario reads committed content and manifest files only and has no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / The AI Engineer path says who it is for
  @integration-exempt
  # Exemption(e2e): the scenario reads committed content and manifest files only and has no public browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / The AI Engineer path says who it is for
  @e2e-exempt
  Scenario: The AI Engineer path says who it is for
    Given the AI Engineer path manifest and its path page
    When their descriptions are read
    Then both descriptions say the path is for developers who already code
