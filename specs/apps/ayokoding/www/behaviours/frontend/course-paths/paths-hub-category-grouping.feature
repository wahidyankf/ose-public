Feature: Paths hub category grouping

  As a reader browsing every learning path
  I want the paths hub to group paths by category (careers vs. skills)
  So that I can tell at a glance which kind of path I'm looking at, not scan a flat, undifferentiated grid

  # Bound Phase 3, Cycle 3.4 (aggregate binder) — unit (route-paths-hub.test.tsx, implemented as
  # part of Cycle 3.1's GREEN step) and e2e (course-paths.steps.ts), the latter for the first time
  # here.
  # Behaviour: AYW-111
  Scenario: The paths hub groups paths by category, not a flat grid
    Given a fixture manifest set covers both a careers-shaped and a skills-shaped fixture
    When a reader opens the paths hub at /en/learn/paths
    Then the hub renders a Careers section grouped by arc and a separate Skills section
    And no path card from either category is rendered outside its category's section

  # Behaviour: AYW-116
  Scenario: A path card shows who the path is for, its size, its estimated time, its progress in words, and a View path link
    Given the immediately-effective backend track is published with its description and one core phase
    When a reader opens the paths hub at /en/learn/paths
    Then the backend track card shows its description as who the path is for
    And the card states its size in core phases and its estimated time
    And the card states its progress in words
    And the card ends with a "View path" link to that path

  # Behaviour: AYW-118
  Scenario: A paths hub offers a link to browse the course library
    When a reader opens the paths hub at /en/learn/paths
    Then the hub ends with a link that reads "Browse the full course library" and opens the course library

  # Behaviour: AYW-119
  Scenario: Path cards read singular for one core phase
    Given the immediately-effective backend track is published with one core phase
    When a reader opens the paths hub at /en/learn/paths
    Then the backend track card reads "1 core phase" and never "1 core phases"
