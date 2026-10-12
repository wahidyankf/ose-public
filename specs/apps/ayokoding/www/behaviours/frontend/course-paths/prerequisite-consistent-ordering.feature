Feature: Prerequisite-consistent ordering

  As a path-manifest author
  I want the prerequisite-consistency check to enforce ordering without forcing completeness
  So that a manifest can curate a subset of courses while still catching a genuine ordering mistake

  # Exemption(integration): the scenario is an internal deterministic transform with no local resource boundary; alternative-proof: ayokoding-www:test:unit / A path manifest is a valid topological entry into the prerequisite DAG
  @integration-exempt
  # Exemption(e2e): the scenario is an internal deterministic transform with no public browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / A path manifest is a valid topological entry into the prerequisite DAG
  @e2e-exempt
  Scenario: A path manifest is a valid topological entry into the prerequisite DAG
    Given a path manifest lists phases of course IDs
    When the prerequisite-consistency check runs
    Then no course appears before any of its declared prerequisites that are also in the manifest
    And the check reports zero ordering violations for that manifest

  # Exemption(integration): the scenario is an internal deterministic transform with no local resource boundary; alternative-proof: ayokoding-www:test:unit / A path may link a prerequisite it does not include, without failing integrity
  @integration-exempt
  # Exemption(e2e): the scenario is an internal deterministic transform with no public browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / A path may link a prerequisite it does not include, without failing integrity
  @e2e-exempt
  Scenario: A path may link a prerequisite it does not include, without failing integrity
    Given a path manifest includes a course whose declared prerequisite is absent from that manifest
    When the prerequisite-consistency check runs
    Then the absent prerequisite is not reported as a violation
    And the absent prerequisite appears in the check's informational linkedPrerequisites list
