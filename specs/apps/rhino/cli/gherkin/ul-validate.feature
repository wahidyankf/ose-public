@ul-validate
Feature: rhino-cli ul validate — glossary parity enforcement

  Background:
    Given the repository has a valid bounded-contexts.yaml for "organiclever"

  @ul-validate
  Scenario: All glossaries are valid — exits successfully with no findings
    Given every registered glossary file has correct frontmatter keys
    And every terms table header is well-formed
    And every code identifier resolves in the BC code path
    And every feature reference resolves to an existing .feature file
    When I run "rhino-cli ul validate organiclever"
    Then the command exits successfully
    And there are no findings in the output

  @ul-validate
  Scenario: Glossary is missing a required frontmatter key
    Given a glossary file is missing the "Maintainer" frontmatter key
    When I run "rhino-cli ul validate organiclever"
    Then the command exits with failure
    And the output mentions "missing frontmatter key"

  @ul-validate
  Scenario: Terms table has a malformed header
    Given a glossary file has a terms table with a wrong column header
    When I run "rhino-cli ul validate organiclever"
    Then the command exits with failure
    And the output mentions "malformed terms table header"

  @ul-validate
  Scenario: A code identifier is stale (not found in BC code path)
    Given a glossary file has a term with a code identifier not present in any source file
    When I run "rhino-cli ul validate organiclever"
    Then the command exits with failure
    And the output mentions "stale identifier"

  @ul-validate
  Scenario: A feature reference does not resolve to an existing .feature file
    Given a glossary file has a term referencing a non-existent feature file
    When I run "rhino-cli ul validate organiclever"
    Then the command exits with failure
    And the output mentions "missing feature reference"

  @ul-validate
  Scenario: Same term appears in two glossaries without mutual Forbidden-synonyms cross-link
    Given two glossaries declare the same term without cross-linking via Forbidden synonyms
    When I run "rhino-cli ul validate organiclever"
    Then the command exits with failure
    And the output mentions "term collision"

  @ul-validate
  Scenario: --severity=warn downgrades findings — exits successfully with warnings
    Given a glossary file has a term with a code identifier not present in any source file
    When I run "rhino-cli ul validate organiclever" with the "--severity=warn" flag
    Then the command exits successfully
    And the output contains a warning
