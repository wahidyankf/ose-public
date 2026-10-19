Feature: The harness selects affected or all opted-in courses
  As a reviewer
  I want pull requests to run only what changed, and toolchain changes to run everything
  So that checks stay fast without missing version drift

  # Exemption(e2e): selection is decided in the local process from files and git before any container starts; alternative-proof: ayokoding-cli:test:integration / Only opted-in courses with changed files are selected
  @e2e-exempt
  Scenario: Only opted-in courses with changed files are selected
    Given opted-in courses "alpha" and "beta" and an inert course "gamma"
    And files changed in "alpha" and "gamma" since the base revision
    When I list the affected selection since the base revision
    Then the mode is "affected"
    And the selected courses are exactly "alpha"
    And "gamma" is listed as inert

  # Exemption(e2e): the toolchain trigger is decided in the local process from the changed paths before any container starts; alternative-proof: ayokoding-cli:test:integration / A toolchain catalog change selects every opted-in course
  @e2e-exempt
  Scenario: A toolchain catalog change selects every opted-in course
    Given opted-in courses "alpha" and "beta"
    And the toolchain catalog changed since the base revision
    When I list the affected selection since the base revision
    Then the mode is "full"
    And the selected courses are "alpha" and "beta"

  # Exemption(e2e): sharding splits sorted slugs in the local process with no container involved; alternative-proof: ayokoding-cli:test:integration / Shards split the selection by slug without overlap
  @e2e-exempt
  Scenario: Shards split the selection by slug without overlap
    Given opted-in courses "a1", "a2", "a3", "a4", and "a5"
    When I select all courses as shard 2 of 2
    Then the selected courses are exactly "a2" and "a4"

  # Exemption(e2e): the usage error is raised in the local process before any selection is read; alternative-proof: ayokoding-cli:test:integration / A run without a selection is a usage error
  @e2e-exempt
  Scenario: A run without a selection is a usage error
    When I run "examples check" with no course, no base revision, and no "all"
    Then it exits with status 2
    And standard error names error code "ayokoding.usage.missing-selection"
