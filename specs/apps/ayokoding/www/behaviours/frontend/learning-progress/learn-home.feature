Feature: Learn home

  As a learner arriving at AyoKoding Learn
  I want a landing page that shows paths and how to continue
  So that I can start or resume without scanning a long list of links

  Background:
    Given the app is running

  # Behaviour: AYW-006
  Scenario: The Learn home is a landing page, not a list of courses
    When a reader opens /en/learn
    Then the page shows an introduction, career path cards, skills path cards, and a "Browse all courses" link to the catalog
    And the page links to no individual course page

  # Behaviour: AYW-007
  Scenario: A returning reader sees a Continue learning card
    Given a reader completed some learning pages while following a path
    When the reader opens /en/learn
    Then a "Continue learning" card names that path and its next course
    And its button links to the next learning page in path context

  Scenario: A new reader sees a Start learning card in the same place
    Given a reader has no saved progress
    When the reader opens /en/learn
    Then the same card area shows "Start learning" with a link to the paths

  # Behaviour: AYW-009
  Scenario: Path cards show who it is for, the goal, size, time, and progress
    When a reader opens /en/learn
    Then each career path card shows the path title, who it is for, its goal, its core phase count, its estimated time, and its progress in words
    And each card links to its path page

  # Behaviour: AYW-008
  Scenario: The old Learn overview address redirects to the Learn home
    When a visitor requests /en/learn/overview
    Then the response is a permanent redirect with status 308 to /en/learn

  Scenario: A deeper address under the old overview is not redirected
    When a visitor requests /en/learn/overview/anything
    Then the response status is 404

  Scenario: Path hubs use the same path cards
    When a reader opens the paths hub, the careers landing, a careers arc page, or the skills landing
    Then every path on the page is shown as a path card with its progress in words
    And the careers landing groups its path cards under one heading per arc that links to the arc page
