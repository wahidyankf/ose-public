Feature: Course metadata

  As a content maintainer
  I want every course's catalog metadata validated against its content
  So that the catalog, sidebar, and course header never show missing or stale facts

  # Exemption(e2e): the scenario reads the local content directory and has no public browser or HTTP boundary; alternative-proof: ayokoding-www:test:integration / Every course in the library carries valid metadata
  @e2e-exempt
  Scenario: Every course in the library carries valid metadata
    Given the real course library on disk
    When the course metadata check runs
    Then every course has a known category and a one-sentence description
    And every course that is not an outline has a format and an estimated time
    And every course resolves a Start page

  # Exemption(integration): the scenario is an internal deterministic transform with no local resource boundary; alternative-proof: ayokoding-www:test:unit / An outline course may omit format and estimated time
  @integration-exempt
  # Exemption(e2e): the scenario is an internal deterministic transform with no public browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / An outline course may omit format and estimated time
  @e2e-exempt
  Scenario: An outline course may omit format and estimated time
    Given a course marked as an outline with a category and a description only
    When the course metadata check runs
    Then the course passes

  # Exemption(integration): the scenario is an internal deterministic transform with no local resource boundary; alternative-proof: ayokoding-www:test:unit / Invalid metadata names the course and the field
  @integration-exempt
  # Exemption(e2e): the scenario is an internal deterministic transform with no public browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / Invalid metadata names the course and the field
  @e2e-exempt
  Scenario: Invalid metadata names the course and the field
    Given a course that is not an outline has the category "databases" and no format
    When the course metadata check runs
    Then the check fails
    And the failure names the course slug, the "category" field, and the "format" field

  # Exemption(e2e): the scenario reads the local content directory and has no public browser or HTTP boundary; alternative-proof: ayokoding-www:test:integration / A stale estimate fails with the expected value
  @e2e-exempt
  Scenario: A stale estimate fails with the expected value
    Given a course whose stored estimated time differs from the computed estimate
    When the course metadata check runs
    Then the check fails
    And the failure prints the course slug, the stored value, and the expected value

  # Exemption(integration): the scenario is an internal deterministic transform with no local resource boundary; alternative-proof: ayokoding-www:test:unit / A metadata typo does not hide the page
  @integration-exempt
  # Exemption(e2e): the scenario is an internal deterministic transform with no public browser or HTTP boundary; alternative-proof: ayokoding-www:test:unit / A metadata typo does not hide the page
  @e2e-exempt
  Scenario: A metadata typo does not hide the page
    Given a course page whose frontmatter has an unknown category value
    When the content index is built
    Then the page is still in the content index
