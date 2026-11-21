Feature: Course omitted from a path

  As a path curator
  I want a course that a path's manifest doesn't include to render its normal canonical view
  So that a curated subset never breaks navigation for a course it leaves out

  # Behaviour: AYW-150
  Scenario: A course omitted from a path shows no path nav for that path
    Given a course is not listed in a given path's manifest
    When a reader opens that course with that path's context
    Then the course renders the canonical standalone view
    And neither the path rail nor the path banner is shown for that path
