Feature: Courses without a run spec are inert
  As a maintainer
  I want courses that have not opted in to be ignored
  So that the harness changes nothing until a content plan migrates a course

  Scenario: A content tree with no opted-in course runs nothing and passes
    Given a content tree in which no course has a run spec
    When I check the content tree for changes since the base revision
    Then it exits with status 0
    And standard output says "0 opted-in courses; nothing to run"
    And no container was started

  # Exemption(e2e): selection is decided in the local process before any container starts, so the built binary adds no proof beyond the integration run against a real git repository; alternative-proof: ayokoding-cli:test:integration / A changed course without a run spec is reported as inert
  @e2e-exempt
  Scenario: A changed course without a run spec is reported as inert
    Given a course without a run spec whose lesson changed since the base revision
    When I check the content tree for changes since the base revision
    Then the course is listed as "inert"
    And it exits with status 0

  # Exemption(e2e): previewing reads the lesson and its file from the local filesystem with no container involved; alternative-proof: ayokoding-cli:test:integration / An explicitly named course is previewed before it opts in
  @e2e-exempt
  Scenario: An explicitly named course is previewed before it opts in
    Given a course without a run spec whose lesson block differs from its file
    When I sync that course by name
    Then the mismatch is reported with code "ayokoding.sync.mismatch"
    And it exits with status 1
