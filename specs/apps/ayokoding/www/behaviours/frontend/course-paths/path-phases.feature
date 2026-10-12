Feature: Phase-grouped learning paths

  As a reader following a learning path
  I want the path's courses grouped into titled phases
  So that I can see the core route to the goal and the optional depth after it

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / A path landing groups its courses under titled phases
  @integration-exempt
  Scenario: A path landing groups its courses under titled phases
    Given a fixture path manifest declares a core phase and an extension phase
    When a reader opens that path's landing page under /en/learn/paths/
    Then each phase renders as a heading with its title
    And the core phase's courses appear before the extension phase's courses
    And course position numbers continue across the phase boundary

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / A core phase states what the reader can do after it
  @integration-exempt
  Scenario: A core phase states what the reader can do after it
    Given a fixture core phase declares an outcome
    When a reader opens that path's landing page
    Then the phase shows "After this phase you can" followed by the outcome
    And when the outcome declares what the reader cannot yet do, the phase also shows "You cannot yet"

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Extension phases sit under an optional heading after the core
  @integration-exempt
  Scenario: Extension phases sit under an optional heading after the core
    Given a fixture path manifest declares an extension phase
    When a reader opens that path's landing page
    Then an "Optional extensions" heading appears after the last core phase
    And every extension phase is listed under that heading

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The path rail groups the path's courses by phase
  @integration-exempt
  Scenario: The path rail groups the path's courses by phase
    Given a reader opens a course in path context on a desktop-width viewport
    When the page renders
    Then the left rail shows each phase title followed by that phase's courses
    And the current course is still marked by a marker and weight, not by colour alone

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / Next crosses from the last core course into the first extension course
  @integration-exempt
  Scenario: Next crosses from the last core course into the first extension course
    Given a reader is on the last course of a fixture path's last core phase
    When the reader reads the prev/next navigation
    Then next is the first course of the first extension phase
    And the link preserves the path context query parameter

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / The runtime path data exposes phases and the flattened order
  @integration-exempt
  Scenario: The runtime path data exposes phases and the flattened order
    Given the fixture manifest set is loaded by the running server
    When a client requests coursePaths.getRouteData for locale "en"
    Then each manifest in the response carries its phases with id, title, kind, outcome, and courses
    And each manifest also carries a courseOrder equal to its phases' courses in order

  # Exemption(integration): the scenario is an internal deterministic render with no local resource boundary; alternative-proof: ayokoding-www:test:unit / A skills path awaiting restructure renders as today's flat list
  @integration-exempt
  # Exemption(e2e): the marker is closed to the four real skills paths outside the E2E fixture-manifest boundary the test server loads; alternative-proof: ayokoding-www:test:unit / A skills path awaiting restructure renders as today's flat list
  @e2e-exempt
  Scenario: A skills path awaiting restructure renders as today's flat list
    Given a skills manifest carries its restructure marker
    When its landing page and a course in that path render
    Then the syllabus and the path rail list its courses in order without phase headings
    And no outcome line, "Optional extensions" heading, "Before you start" note, or Outline badge appears
