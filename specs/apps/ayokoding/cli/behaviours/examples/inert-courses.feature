Feature: Courses without a run spec are inert
  As a maintainer
  I want courses that have not opted in to be ignored
  So that the harness changes nothing until a content plan migrates a course

  # Behaviour: AYC-067
  Scenario: A content tree with no opted-in course runs nothing and passes
    Given a content tree in which no course has a run spec
    When I check the content tree for changes since the base revision
    Then it exits with status 0
    And standard output says "0 opted-in courses; nothing to run"
    And no container was started

  # Behaviour: AYC-016
  # Behaviour: AYC-036
  Scenario: A changed course without a run spec is reported as inert
    Given a course without a run spec whose lesson changed since the base revision
    When I check the content tree for changes since the base revision
    Then the course is listed as "inert"
    And it exits with status 0

  # Behaviour: AYC-014
  Scenario: --include-inert previews a course that has not opted in
    Given the content tree holds the course "inert-course" without a run spec
    When I sync the content tree with --include-inert
    Then the sync finding "ayokoding.sync.unreferenced-unit" names "inert-course"

  Scenario: An explicitly named course is previewed before it opts in
    Given a course without a run spec whose lesson block differs from its file
    When I sync that course by name
    Then the mismatch is reported with code "ayokoding.sync.mismatch"
    And it exits with status 1
