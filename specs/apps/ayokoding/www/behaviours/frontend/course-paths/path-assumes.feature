Feature: Assumed prior courses

  As a reader choosing a path that builds on earlier knowledge
  I want the path to name and link what it assumes
  So that I can fill a gap before I start

  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / A path names its assumed courses before the syllabus
  @integration-exempt
  Scenario: A path names its assumed courses before the syllabus
    Given a fixture path manifest declares assumed courses
    When a reader opens that path's landing page
    Then a "Before you start" note appears before the first phase
    And it links every assumed course to its canonical course page without a path query parameter

  # Exemption(integration): the scenario is an internal deterministic transform with no local resource boundary; alternative-proof: ayokoding-www:test:unit / A path that assumes nothing shows no Before you start note
  @integration-exempt
  # Exemption(e2e): the scenario is an internal deterministic transform with no public browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / A path that assumes nothing shows no Before you start note
  @e2e-exempt
  Scenario: A path that assumes nothing shows no Before you start note
    Given a path manifest declares no assumed courses
    When its landing page renders
    Then no "Before you start" note is rendered
