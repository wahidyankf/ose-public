@agents-validate-claude
Feature: Claude Code Agent and Skill Configuration Validation

  As a repository maintainer
  I want to verify that all Claude Code agents and skills are correctly configured
  So that agents behave as expected when invoked

  Scenario: A directory with all agents and skills correctly configured passes validation
    Given a .claude/ directory where all agents and skills are valid
    When the developer runs agents validate-claude
    Then the command exits successfully
    And the output reports all checks as passing

  Scenario: An agent file missing a required frontmatter field fails validation
    Given a .claude/ directory where one agent is missing the required "description" field
    When the developer runs agents validate-claude
    Then the command exits with a failure code
    And the output identifies the agent and the missing field

  Scenario: Two agents with the same name fail validation
    Given a .claude/ directory containing two agent files declaring the same name
    When the developer runs agents validate-claude
    Then the command exits with a failure code
    And the output reports the duplicate agent name

  Scenario: --agents-only validates agents without checking skills
    Given a .claude/ directory where agents are valid but skills have issues
    When the developer runs agents validate-claude with the --agents-only flag
    Then the command exits successfully

  Scenario: --skills-only validates skills without checking agents
    Given a .claude/ directory where skills are valid but agents have issues
    When the developer runs agents validate-claude with the --skills-only flag
    Then the command exits successfully
