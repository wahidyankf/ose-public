Feature: Learn home

  As a learner arriving at AyoKoding Learn
  I want a landing page that shows paths and how to continue
  So that I can start or resume without scanning a long list of links

  Background:
    Given the app is running

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The Learn home is a landing page, not a list of courses
  @integration-exempt
  Scenario: The Learn home is a landing page, not a list of courses
    When a reader opens /en/learn
    Then the page shows an introduction, career path cards, skills path cards, and a "Browse all courses" link to the catalog
    And the page links to no individual course page

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / A returning reader sees a Continue learning card
  @integration-exempt
  Scenario: A returning reader sees a Continue learning card
    Given a reader completed some learning pages while following a path
    When the reader opens /en/learn
    Then a "Continue learning" card names that path and its next course
    And its button links to the next learning page in path context

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / A new reader sees a Start learning card in the same place
  @integration-exempt
  Scenario: A new reader sees a Start learning card in the same place
    Given a reader has no saved progress
    When the reader opens /en/learn
    Then the same card area shows "Start learning" with a link to the paths

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Path cards show who it is for, the goal, size, time, and progress
  @integration-exempt
  Scenario: Path cards show who it is for, the goal, size, time, and progress
    When a reader opens /en/learn
    Then each career path card shows the path title, who it is for, its goal, its core phase count, its estimated time, and its progress in words
    And each card links to its path page

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The old Learn overview address redirects to the Learn home
  @integration-exempt
  Scenario: The old Learn overview address redirects to the Learn home
    When a visitor requests /en/learn/overview
    Then the response is a permanent redirect with status 308 to /en/learn

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / A deeper address under the old overview is not redirected
  @integration-exempt
  Scenario: A deeper address under the old overview is not redirected
    When a visitor requests /en/learn/overview/anything
    Then the response status is 404
