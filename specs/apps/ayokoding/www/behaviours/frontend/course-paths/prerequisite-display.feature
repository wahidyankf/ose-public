Feature: Prerequisite display

  As a reader
  I want a course page to list its declared prerequisites regardless of path context
  So that I always know what to complete before this course, even outside a path

  # Behaviour: AYW-140
  Scenario: A course page surfaces its declared prerequisites
    Given a course declares prerequisites in its canonical metadata
    When a reader opens the course page with or without a path context
    Then the page lists each prerequisite course with a link to its canonical URL
    And the prerequisite list renders even in the canonical no-path view

  # Behaviour: AYW-141
  Scenario: A course that declares no prerequisites shows no prerequisites heading or list
    Given the just-enough-python course page declares no prerequisites in its canonical metadata
    When a reader opens the just-enough-python course page with or without a path context
    Then the page shows no "Prerequisites" heading and no prerequisites list

  # Behaviour: AYW-142
  Scenario: A prerequisite link keeps the path context only when that course belongs to the active path
    Given a course in an active path declares two prerequisites, one that is in that path and one that is not
    When a reader opens the course page in that path context
    Then the link to the prerequisite in the path keeps the path context
    And the link to the prerequisite outside the path opens its canonical course page without a path context
