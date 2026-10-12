Feature: Core closure and path model integrity

  As a path-manifest maintainer
  I want every path's core to be self-sufficient and complete
  So that a reader who follows only the core never meets an unmet prerequisite or an empty course

  # Exemption(integration): the scenario is an internal deterministic transform with no local resource boundary; alternative-proof: ayokoding-www:test:unit / A core course whose prerequisite is neither earlier nor assumed fails
  @integration-exempt
  # Exemption(e2e): the scenario is an internal deterministic transform with no public browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / A core course whose prerequisite is neither earlier nor assumed fails
  @e2e-exempt
  Scenario: A core course whose prerequisite is neither earlier nor assumed fails
    Given a manifest whose core course declares a prerequisite outside the path
    And the manifest does not list that prerequisite in assumes
    When the path model integrity check runs
    Then it reports a closure violation naming the course and the missing prerequisite

  # Exemption(integration): the scenario is an internal deterministic transform with no local resource boundary; alternative-proof: ayokoding-www:test:unit / A prerequisite listed in assumes satisfies the closure rule
  @integration-exempt
  # Exemption(e2e): the scenario is an internal deterministic transform with no public browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / A prerequisite listed in assumes satisfies the closure rule
  @e2e-exempt
  Scenario: A prerequisite listed in assumes satisfies the closure rule
    Given a manifest whose core course declares a prerequisite outside the path
    And the manifest lists that prerequisite in assumes
    When the path model integrity check runs
    Then it reports no closure violation for that course

  # Exemption(integration): the scenario is an internal deterministic transform with no local resource boundary; alternative-proof: ayokoding-www:test:unit / An outline course in a core phase fails
  @integration-exempt
  # Exemption(e2e): the scenario is an internal deterministic transform with no public browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / An outline course in a core phase fails
  @e2e-exempt
  Scenario: An outline course in a core phase fails
    Given a manifest whose core phase lists a course with status outline
    And the manifest carries no skills restructure marker
    When the path model integrity check runs
    Then it reports an outline-in-core violation naming the course

  # Exemption(integration): the scenario is an internal deterministic transform with no local resource boundary; alternative-proof: ayokoding-www:test:unit / The core equals the goals plus their prerequisite closure
  @integration-exempt
  # Exemption(e2e): the scenario is an internal deterministic transform with no public browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / The core equals the goals plus their prerequisite closure
  @e2e-exempt
  Scenario: The core equals the goals plus their prerequisite closure
    Given a manifest that declares goals
    When the path model integrity check runs
    Then the set of core courses equals the goals plus every transitive prerequisite not in assumes
    And any missing or extra core course is reported by ID

  # Exemption(integration): the scenario is an internal deterministic transform with no local resource boundary; alternative-proof: ayokoding-www:test:unit / An assumed course that no core course needs fails
  @integration-exempt
  # Exemption(e2e): the scenario is an internal deterministic transform with no public browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / An assumed course that no core course needs fails
  @e2e-exempt
  Scenario: An assumed course that no core course needs fails
    Given a manifest whose assumes lists a course that no core course declares as a prerequisite
    When the path model integrity check runs
    Then it reports an unused-assumes violation naming that course

  # Exemption(integration): the scenario is an internal deterministic transform with no local resource boundary; alternative-proof: ayokoding-www:test:unit / Phases are well formed
  @integration-exempt
  # Exemption(e2e): the scenario is an internal deterministic transform with no public browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / Phases are well formed
  @e2e-exempt
  Scenario: Phases are well formed
    Given a manifest with a duplicate phase ID, an empty phase, or a core phase after an extension phase
    When the path model integrity check runs
    Then it reports each malformed phase

  # Exemption(integration): the scenario is an internal deterministic transform with no local resource boundary; alternative-proof: ayokoding-www:test:unit / A skills path has no extension phase
  @integration-exempt
  # Exemption(e2e): the scenario is an internal deterministic transform with no public browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / A skills path has no extension phase
  @e2e-exempt
  Scenario: A skills path has no extension phase
    Given a skills manifest that declares an extension phase
    When the path model integrity check runs
    Then it reports a skills-extension violation

  # Exemption(integration): the scenario is an internal deterministic transform with no local resource boundary; alternative-proof: ayokoding-www:test:unit / A career manifest cannot carry the skills restructure marker
  @integration-exempt
  # Exemption(e2e): the scenario is an internal deterministic transform with no public browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / A career manifest cannot carry the skills restructure marker
  @e2e-exempt
  Scenario: A career manifest cannot carry the skills restructure marker
    Given a career path manifest file that declares restructurePendingIn
    When the manifest schema parses it
    Then parsing fails

  # Exemption(integration): the scenario is an internal deterministic transform with no local resource boundary; alternative-proof: ayokoding-www:test:unit / Only an allowlisted skills path may carry the marker, with its own plan
  @integration-exempt
  # Exemption(e2e): the scenario is an internal deterministic transform with no public browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / Only an allowlisted skills path may carry the marker, with its own plan
  @e2e-exempt
  Scenario: Only an allowlisted skills path may carry the marker, with its own plan
    Given a skills manifest file that declares restructurePendingIn
    And its path ID is not in the allowlist, or its value is not the allowlisted plan for that path
    When the manifest schema parses it
    Then parsing fails

  # Exemption(integration): the scenario is an internal deterministic transform with no local resource boundary; alternative-proof: ayokoding-www:test:unit / A marked skills manifest is exempt only from the core rules
  @integration-exempt
  # Exemption(e2e): the scenario is an internal deterministic transform with no public browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / A marked skills manifest is exempt only from the core rules
  @e2e-exempt
  Scenario: A marked skills manifest is exempt only from the core rules
    Given an allowlisted skills manifest with its marker, outline courses, and outside prerequisites
    When the path model integrity check runs
    Then it reports no closure, outline-in-core, goals, assumes, skills-shape, or outcome violation
    But it still reports unresolved and duplicate course IDs
