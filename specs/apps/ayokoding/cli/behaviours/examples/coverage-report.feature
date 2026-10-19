Feature: Harness coverage is measured per course
  As the plan 14 executor
  I want a coverage report with a minimum check
  So that the series end state is measured

  # Exemption(e2e): coverage is computed in the local process from files and starts no container; alternative-proof: ayokoding-cli:test:integration / A course is covered when every unit is covered and no finding remains
  @e2e-exempt
  Scenario: A course is covered when every unit is covered and no finding remains
    Given an opted-in course whose two units both have valid run specs and whose lessons are in sync
    When I report coverage
    Then the course is reported as covered with 2 of 2 units

  # Exemption(e2e): coverage is computed in the local process from files and starts no container; alternative-proof: ayokoding-cli:test:integration / Courses without code are listed as not applicable
  @e2e-exempt
  Scenario: Courses without code are listed as not applicable
    Given a course with no code folder and no code block
    When I report coverage
    Then the course is listed as not applicable
    And it is not counted in the percentage

  # Exemption(e2e): coverage is computed in the local process from files and starts no container; alternative-proof: ayokoding-cli:test:integration / Coverage below the minimum exits 1
  @e2e-exempt
  Scenario: Coverage below the minimum exits 1
    Given two applicable courses of which one is covered
    When I report coverage with a minimum of 100 percent
    Then the report shows 50 percent
    And the finding "ayokoding.coverage.below-minimum" is reported
    And it exits with status 1

  # Exemption(e2e): coverage is computed in the local process from files and starts no container; alternative-proof: ayokoding-cli:test:integration / Illustration blocks and static units are counted per course
  @e2e-exempt
  Scenario: Illustration blocks and static units are counted per course
    Given an opted-in course with three illustration blocks and one static unit
    When I report coverage
    Then the course shows 3 illustration blocks and 1 static unit
