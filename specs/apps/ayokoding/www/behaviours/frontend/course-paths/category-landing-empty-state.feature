Feature: Category landing empty state

  As a reader opening a category or arc landing before any path is published there
  I want an explicit, stated empty message instead of a blank content area
  So that I never mistake "nothing published yet" for a broken page

  # Behaviour: AYW-151
  # Exemption(integration): the empty-catalogue state is an injected manifest-repository input with no separate local resource boundary; alternative-proof: ayokoding-www:test:unit / A category landing with no populated manifest renders an explicit empty state
  @integration-exempt
  # Exemption(e2e): the deployed public boundary exposes only its configured manifest catalogue and cannot select an alternate zero-manifest catalogue per request; alternative-proof: ayokoding-www:test:unit / A category landing with no populated manifest renders an explicit empty state
  @e2e-exempt
  Scenario: A category landing with no populated manifest renders an explicit empty state
    Given a structural category index exists with zero published path manifests
    When a reader opens that category's landing page
    Then the page renders a stated "being written, check back soon" message with a fallback link
    And the page never renders a blank content area with no message
