Feature: Path position numbers

  As a reader following a learning path
  I want every course shown with its position in that path and no other number
  So that I always know where a course sits in the path

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / A course page in path context shows no catalogue number in course titles
  @integration-exempt
  Scenario: A course page in path context shows no catalogue number in course titles
    Given a reader opens a course in path context
    When the page renders
    Then the page heading, breadcrumb, previous and next links, and prerequisite links show course titles without a leading number
    And the only course order number on the page is the course's position in the active path
