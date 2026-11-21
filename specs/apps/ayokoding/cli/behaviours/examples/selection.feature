Feature: The harness selects affected or all opted-in courses
  As a reviewer
  I want pull requests to run only what changed, and toolchain changes to run everything
  So that checks stay fast without missing version drift

  # Behaviour: AYC-010
  # Behaviour: AYC-016
  Scenario: Only opted-in courses with changed files are selected
    Given opted-in courses "alpha" and "beta" and an inert course "gamma"
    And files changed in "alpha" and "gamma" since the base revision
    When I list the affected selection since the base revision
    Then the mode is "affected"
    And the selected courses are exactly "alpha"
    And "gamma" is listed as inert

  Scenario: A toolchain catalog change selects every opted-in course
    Given opted-in courses "alpha" and "beta"
    And the toolchain catalog changed since the base revision
    When I list the affected selection since the base revision
    Then the mode is "full"
    And the selected courses are "alpha" and "beta"

  # Behaviour: AYC-018
  Scenario: Shards split the selection by slug without overlap
    Given opted-in courses "a1", "a2", "a3", "a4", and "a5"
    When I select all courses as shard 2 of 2
    Then the selected courses are exactly "a2" and "a4"

  # Behaviour: AYC-017
  # Behaviour: AYC-029
  Scenario: --all selects every opted-in course in the named content directory
    Given opted-in courses "alpha" and "beta"
    When I select all opted-in courses
    Then the selected courses are "alpha" and "beta"

  # Behaviour: AYC-024
  # Behaviour: AYC-050
  Scenario Outline: A run without a selection is a usage error
    When I run "examples run" with "<output>" output and no selection
    Then it exits with status 2
    And standard output is empty
    And <error check>

    Examples:
      | output | error check                                                                                                  |
      | text   | standard error names error code "ayokoding.usage.missing-selection"                                          |
      | json   | standard error is one JSON document with error code "ayokoding.usage.missing-selection"                      |
