@docs-validate-frontmatter
Feature: Docs Frontmatter Validation

  As a repository maintainer
  I want to verify that documentation markdown files carry the required YAML
  frontmatter fields for their content area
  So that downstream tooling can rely on consistent metadata across the
  software-engineering knowledge base and the governance tree

  Scenario: Software-engineering doc with all required frontmatter fields passes
    Given a software-engineering doc with title, description, category, subcategory, and tags frontmatter
    When the developer runs docs validate-frontmatter
    Then the command exits successfully
    And the frontmatter output reports zero fail-level findings

  Scenario: Governance doc with description and when_to_use passes the two-key schema
    Given a governance doc with description and when_to_use frontmatter
    When the developer runs docs validate-frontmatter
    Then the command exits successfully
    And the frontmatter output reports zero fail-level findings

  Scenario: Governance doc carrying a title field fails the allow-list
    Given a governance doc with description, when_to_use, and a title field
    When the developer runs docs validate-frontmatter
    Then the command exits with a failure code
    And the frontmatter output identifies title as a key outside the allow-list

  Scenario: Governance doc carrying any other key fails the allow-list
    Given a governance doc with description, when_to_use, and a category field
    When the developer runs docs validate-frontmatter
    Then the command exits with a failure code
    And the frontmatter output identifies category as a key outside the allow-list

  Scenario: Governance subtree outside the four sub-trees is still validated
    Given a governance doc under repo-governance/glossary carrying only a title field
    When the developer runs docs validate-frontmatter
    Then the command exits with a failure code
    And the frontmatter output identifies title as a key outside the allow-list

  Scenario: A folder whose name ends in repo-governance is outside the governance tree
    Given a doc without frontmatter under a docs folder whose name ends in repo-governance
    When the developer runs docs validate-frontmatter
    Then the command exits successfully
    And the frontmatter output reports zero fail-level findings

  Scenario: The software-engineering schema is unaffected by the governance allow-list
    Given a software-engineering doc with title, description, category, subcategory, and tags frontmatter
    When the developer runs docs validate-frontmatter
    Then the command exits successfully
    And the frontmatter output reports zero fail-level findings

  Scenario: Software-engineering doc with deprecated software category emits warn not fail
    Given a software-engineering doc with all required frontmatter fields
    When the developer runs docs validate-frontmatter
    Then the command exits successfully
    And the frontmatter output reports zero fail-level findings
