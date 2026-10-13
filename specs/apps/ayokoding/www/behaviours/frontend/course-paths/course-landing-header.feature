Feature: Course landing header

  As a learner arriving at a course
  I want a short summary and a clear place to start
  So that I can decide whether to take the course and begin in one click

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The header summarizes the course
  @integration-exempt
  Scenario: The header summarizes the course
    Given a course with a description, a format, an estimated time, a category, and prerequisites
    When a reader opens the course landing page
    Then the header shows the description under the title
    And the header shows the format, the estimated time, and the category
    And the header lists the prerequisites as links
    And the header lists the paths that use the course as links

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Start opens the learning overview
  @integration-exempt
  Scenario: Start opens the learning overview
    Given a course has a learning overview page
    When a reader activates "Start course" on the course landing page
    Then the learning overview page of that course opens

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Start falls back to the first learning page
  @integration-exempt
  Scenario: Start falls back to the first learning page
    Given a course has a learning folder without an overview page
    When a reader activates "Start course" on the course landing page
    Then the first learning page in reading order opens
    And that page is not inside a folder that has no index page

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Start falls back to the course overview
  @integration-exempt
  Scenario: Start falls back to the course overview
    Given a course has no learning folder but has a top-level overview page
    When a reader activates "Start course" on the course landing page
    Then the course's overview page opens

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The page list stays below the header
  @integration-exempt
  Scenario: The page list stays below the header
    When a reader opens the course landing page
    Then the "Course contents" heading and the list of course pages appear after the header
    And the page has exactly one prerequisites list
    And the page has at most one "This course is part of" list

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / An outline course header says it is an outline
  @integration-exempt
  Scenario: An outline course header says it is an outline
    Given a course is marked as an outline
    When a reader opens the course landing page
    Then the header shows an "Outline" badge
    And the header shows no estimated time

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Pages inside a course have no header
  @integration-exempt
  Scenario: Pages inside a course have no header
    When a reader opens a learning page inside a course
    Then no course header is shown
