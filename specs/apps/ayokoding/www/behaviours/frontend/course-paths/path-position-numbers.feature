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

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The path syllabus numbers each course by its position in the path
  @integration-exempt
  Scenario: The path syllabus numbers each course by its position in the path
    Given a learning path lists its courses in manifest order
    When a reader opens that path's landing page
    Then each syllabus row shows its position number starting at 1 before the course title
    And the position numbers follow the manifest order with no gaps

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The path rail numbers each course by its position in the path
  @integration-exempt
  Scenario: The path rail numbers each course by its position in the path
    Given a reader opens a course in path context on a desktop-width viewport
    When the page renders
    Then each rail row shows its position number before the course title
    And the current course's row shows its own position number with the current-course marker

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The arc card preview numbers its courses by their path position
  @integration-exempt
  Scenario: The arc card preview numbers its courses by their path position
    Given a fixture arc manifest lists exactly one role
    When a reader opens that arc's landing page
    Then the role card's "Starts with" preview numbers its courses 1, 2, and so on in path order
    And no preview item shows a second number inside the course title
