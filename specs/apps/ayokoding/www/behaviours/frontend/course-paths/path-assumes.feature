Feature: Assumed prior courses

  As a reader choosing a path that builds on earlier knowledge
  I want the path to name and link what it assumes
  So that I can fill a gap before I start

  # Behaviour: AYW-128
  Scenario: A path names its assumed courses before the syllabus
    Given a fixture path manifest declares assumed courses
    When a reader opens that path's landing page
    Then a "Before you start" note appears before the first phase
    And it links every assumed course to its canonical course page without a path query parameter

  Scenario: A path that assumes nothing shows no Before you start note
    Given a path manifest declares no assumed courses
    When its landing page renders
    Then no "Before you start" note is rendered
