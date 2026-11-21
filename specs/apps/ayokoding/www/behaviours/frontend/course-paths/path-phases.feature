Feature: Phase-grouped learning paths

  As a reader following a learning path
  I want the path's courses grouped into titled phases
  So that I can see the core route to the goal and the optional depth after it

  # Behaviour: AYW-121
  # Behaviour: AYW-154
  # Exemption(integration): no integration boundary of its own: the landing page renders the phases of an in-process manifest fixture, and no file system, process, database, or network boundary is crossed; alternative-proof: ayokoding-www-fe-e2e:test:e2e / A path landing groups its courses under titled phases
  @integration-exempt
  Scenario: A path landing groups its courses under titled phases
    Given a fixture path manifest declares a core phase and an extension phase
    When a reader opens that path's landing page under /en/learn/paths/
    Then each phase renders as a heading with its title
    And the core phase's courses appear before the extension phase's courses
    And course position numbers continue across the phase boundary
