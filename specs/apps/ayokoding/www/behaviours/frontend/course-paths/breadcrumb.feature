Feature: Path-aware breadcrumb and URL context

  As a reader following a learning path
  I want the breadcrumb, path landing page, and legacy URLs to carry and honour path context
  So that a path stays coherent from its landing page through every course and legacy link

  # Behaviour: AYW-133
  Scenario: The breadcrumb reflects the active path
    Given a reader is on a course with an active path context
    When the breadcrumb renders
    Then it shows Home, Learn, the path title, and the course title
    And the path crumb links to the path landing page /en/learn/paths/<path-id> without a self-referential path context query

  # Behaviour: AYW-153
  Scenario: A legacy fundamentally-strong URL redirects to the canonical course URL
    Given a re-homed course previously lived under the legacy fundamentally-strong/software-engineer content path
    When a reader requests the legacy URL
    Then the app redirects to the course's canonical /en/learn/courses/<course-id> URL
    And the redirect preserves any path context query parameter
