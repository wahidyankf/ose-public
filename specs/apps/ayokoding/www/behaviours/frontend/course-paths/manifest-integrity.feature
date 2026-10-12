Feature: Manifest integrity

  As a path-manifest author
  I want every course reference in a manifest to resolve to a real, unique course
  So that a manifest never links a reader to a missing or ambiguous course

  # Exemption(integration): the scenario is an internal deterministic transform with no local resource boundary; alternative-proof: ayokoding-www:test:unit / Every manifest course reference resolves to a real course
  @integration-exempt
  # Exemption(e2e): the scenario is an internal deterministic transform with no public browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / Every manifest course reference resolves to a real course
  @e2e-exempt
  Scenario: Every manifest course reference resolves to a real course
    Given a path manifest lists phases of course IDs
    When the manifest-integrity check runs
    Then every listed course ID resolves to an existing course in the library
    And no course ID appears more than once in the manifest
