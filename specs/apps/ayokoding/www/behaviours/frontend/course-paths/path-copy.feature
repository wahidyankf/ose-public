Feature: Plain path page copy

  As a reader comparing paths
  I want path pages written in plain language
  So that I never meet internal planning vocabulary

  # Behaviour: AYW-145
  # Exemption(e2e): the scenario scans every committed content file under content/en/learn/paths/careers in one pass, not one served route, so no single route is the boundary it checks; alternative-proof: ayokoding-www:test:unit / Career path pages contain no internal planning vocabulary
  @e2e-exempt
  Scenario: Career path pages contain no internal planning vocabulary
    Given the paths hub page and every markdown page under content/en/learn/paths/careers
    When the page text is searched case-insensitively
    Then no page contains "Dangerous", "OI-2", "append", "manifest", or "from scratch" in any spelling

  # Behaviour: AYW-146
  # Exemption(e2e): the scenario reads the committed AI Engineer path description and its card text in one read, not one served route, so no single route is the boundary it checks; alternative-proof: ayokoding-www:test:unit / The AI Engineer path page and card say the path is for developers who already code
  @e2e-exempt
  Scenario: The AI Engineer path page and card say the path is for developers who already code
    Given the AI Engineer path page and its card
    When their descriptions are read
    Then both descriptions say the path is for developers who already code
