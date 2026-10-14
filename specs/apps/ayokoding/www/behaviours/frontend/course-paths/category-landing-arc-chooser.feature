Feature: Careers category landing arc chooser

  As a reader exploring careers paths
  I want the careers category landing to offer an arc chooser
  So that I can pick the career arc that matches my situation before picking a specific role

  # Bound Phase 3, Cycle 3.1b-i — unit (category-landing.test.tsx) and e2e (course-paths.steps.ts).
  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The careers category landing groups path cards by arc
  @integration-exempt
  Scenario: The careers category landing groups path cards by arc
    Given a fixture careers manifest set with three arcs is loaded
    When a reader opens the careers category landing at /en/learn/paths/careers/
    Then the page renders one section per arc, each arc heading linking to the arc page
    And the immediately-effective section shows exactly two path cards
