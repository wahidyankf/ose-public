Feature: Harness coverage is measured per course
  As a content author
  I want a coverage report with a minimum check
  So that I can see which courses prove every lesson unit

  # Behaviour: AYC-009
  Scenario: A course is covered when every unit is covered and no finding remains
    Given an opted-in course whose two units both have valid run specs and whose lessons are in sync
    When I report coverage
    Then the course is reported as covered with 2 of 2 units

  # Behaviour: AYC-009
  Scenario: Courses without code are listed as not applicable
    Given a course with no code folder and no code block
    When I report coverage
    Then the course is listed as not applicable
    And it is not counted in the percentage

  # Behaviour: AYC-023
  # Behaviour: AYC-039
  # Behaviour: AYC-064
  Scenario: Coverage below the minimum exits 1
    Given two applicable courses of which one is covered
    When I report coverage with a minimum of 100 percent
    Then the report shows 50 percent
    And the finding "ayokoding.coverage.below-minimum" is reported
    And it exits with status 1

  # Behaviour: AYC-009
  Scenario: Illustration blocks and static units are counted per course
    Given an opted-in course with three illustration blocks and one static unit
    When I report coverage
    Then the course shows 3 illustration blocks and 1 static unit
