Feature: Arc landing with one role

  As a reader opening a career arc that offers a single role
  I want that role's card to render full detail
  So that I never see a sparse stub or an empty placeholder card next to it

  # Bound Phase 3, Cycle 3.1c-ii — unit (arc-landing.test.tsx) and e2e (course-paths.steps.ts).
  # Exemption(integration): the scenario is observable at the public browser or HTTP boundary and has no separate local resource boundary; alternative-proof: ayokoding-www-fe-e2e:test:e2e / An arc landing with one path renders a full card, not a sparse stub
  @integration-exempt
  Scenario: An arc landing with one path renders a full card, not a sparse stub
    Given a fixture arc manifest lists exactly one role
    When a reader opens that arc's landing page
    Then the single role card renders with a preview that names the first phase and lists its courses
    And the layout does not reserve or render a visibly empty second card
