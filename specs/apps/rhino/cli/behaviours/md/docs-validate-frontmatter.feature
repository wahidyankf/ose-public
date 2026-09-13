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

  Scenario: Software-engineering doc missing title fails
    Given a software-engineering doc whose frontmatter omits the title field
    When the developer runs docs validate-frontmatter
    Then the command exits with a failure code
    And the frontmatter output identifies the missing title field

  Scenario: Software-engineering doc missing category field fails
    Given a software-engineering doc whose frontmatter omits the category field
    When the developer runs docs validate-frontmatter
    Then the command exits with a failure code
    And the frontmatter output identifies the missing category field

  Scenario: Software-engineering doc with category other than software fails
    Given a software-engineering doc whose frontmatter declares category as something other than software
    When the developer runs docs validate-frontmatter
    Then the command exits with a failure code
    And the frontmatter output identifies the wrong category value

  Scenario: Governance doc with only a description fails on the missing when_to_use
    Given a governance doc carrying only a description frontmatter field
    When the developer runs docs validate-frontmatter
    Then the command exits with a failure code
    And the frontmatter output identifies the missing when-to-use field

  Scenario: Governance doc with only a when_to_use fails on the missing description
    Given a governance doc carrying only a when_to_use frontmatter field
    When the developer runs docs validate-frontmatter
    Then the command exits with a failure code
    And the frontmatter output identifies the missing description field

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
    And the frontmatter output identifies the missing description field

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

  Scenario: Software-engineering doc with Diataxis tutorial category passes
    Given a software-engineering doc with title, description, category tutorial, subcategory, and tags frontmatter
    When the developer runs docs validate-frontmatter
    Then the command exits successfully
    And the frontmatter output reports zero fail-level findings

  Scenario: Software-engineering doc with Diataxis how-to category passes
    Given a software-engineering doc with title, description, category how-to, subcategory, and tags frontmatter
    When the developer runs docs validate-frontmatter
    Then the command exits successfully
    And the frontmatter output reports zero fail-level findings

  Scenario: Software-engineering doc with Diataxis reference category passes
    Given a software-engineering doc with title, description, category reference, subcategory, and tags frontmatter
    When the developer runs docs validate-frontmatter
    Then the command exits successfully
    And the frontmatter output reports zero fail-level findings

  Scenario: Software-engineering doc with Diataxis explanation category passes
    Given a software-engineering doc with title, description, category explanation, subcategory, and tags frontmatter
    When the developer runs docs validate-frontmatter
    Then the command exits successfully
    And the frontmatter output reports zero fail-level findings

  Scenario: Software-engineering doc with deprecated software category emits warn not fail
    Given a software-engineering doc with all required frontmatter fields
    When the developer runs docs validate-frontmatter
    Then the command exits successfully
    And the frontmatter output reports zero fail-level findings
