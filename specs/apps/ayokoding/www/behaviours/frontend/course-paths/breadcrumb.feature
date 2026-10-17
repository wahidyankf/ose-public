Feature: Path-aware breadcrumb and URL context

  As a reader following a learning path
  I want the breadcrumb, path landing page, and legacy URLs to carry and honour path context
  So that a path stays coherent from its landing page through every course and legacy link

  # Bound Phase 3, Cycle 3.1 — unit (path-landing.test.tsx, route-paths-hub.test.tsx) and e2e
  # (course-paths.steps.ts). Rewritten to the fixture-generic wording delivery.md's Cycle 3.1
  # canonically binds (the earlier draft above named a specific not-yet-existing manifest).
  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / A path landing page lists its courses in manifest order
  @integration-exempt
  Scenario: A path landing page lists its courses in manifest order
    Given a fixture path manifest is loaded by the manifest repository
    When a reader opens that fixture path's landing page under /en/learn/paths/
    Then the courses appear in the fixture manifest's phase order
    And every course link carries the path context query parameter

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The breadcrumb reflects the active path
  @integration-exempt
  Scenario: The breadcrumb reflects the active path
    Given a reader is on a course with an active path context
    When the breadcrumb renders
    Then it shows Home, Learn, the path title, and the course title
    And the path crumb links to the path landing page /en/learn/paths/<path-id> without a self-referential path context query

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / A legacy fundamentally-strong URL redirects to the canonical course URL
  @integration-exempt
  Scenario: A legacy fundamentally-strong URL redirects to the canonical course URL
    Given a re-homed course previously lived under the legacy fundamentally-strong/software-engineer content path
    When a reader requests the legacy URL
    Then the app redirects to the course's canonical /en/learn/courses/<course-id> URL
    And the redirect preserves any path context query parameter
