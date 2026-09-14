@repo-governance-frontmatter-audit
Feature: Governance Frontmatter Date-Metadata Audit

  As a repository maintainer
  I want to scan governance markdown files for forbidden manual date metadata
  So that git history remains the single source of truth for change dates

  Scenario: Clean directory passes the audit
    Given a governance directory with no forbidden date metadata in markdown files
    When the developer runs md frontmatter validate on the directory
    Then the command exits successfully
    And the output reports zero frontmatter findings

  Scenario: Body containing Last Updated footer block fails
    Given a governance markdown file whose body contains a Last Updated footer block
    When the developer runs md frontmatter validate on the file
    Then the command exits with a failure code
    And the output identifies the forbidden footer block and its location

  Scenario: Body containing standalone Created annotation fails
    Given a governance markdown file whose body contains a standalone Created date annotation
    When the developer runs md frontmatter validate on the file
    Then the command exits with a failure code
    And the output identifies the forbidden inline annotation and its location

  Scenario: File under website app directory is exempt and passes
    Given a markdown file with forbidden date metadata under a website app directory
    When the developer runs md frontmatter validate on the file
    Then the command exits successfully
    And the output reports zero frontmatter findings
