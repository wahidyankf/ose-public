Feature: Agent Configuration Synchronisation

  As a repository maintainer
  I want to manage AI tooling configuration between .claude/ and .opencode/
  So that both systems stay aligned after every configuration change

  @agents-sync
  Rule: agents sync converts .claude/ configuration to .opencode/ format

    Scenario: Syncing converts Claude agents to OpenCode format and leaves skills in place
      Given a .claude/ directory with valid agents and skills
      When the developer runs agents sync
      Then the command exits successfully
      And the .opencode/ directory contains the converted configuration

    Scenario: The --dry-run flag previews changes without modifying files
      Given a .claude/ directory with agents and skills to convert
      When the developer runs agents sync with the --dry-run flag
      Then the command exits successfully
      And the output describes the planned operations
      And no files are written to the .opencode/ directory

    Scenario: The --agents-only flag syncs agents without touching skills
      Given a .claude/ directory with both agents and skills
      When the developer runs agents sync with the --agents-only flag
      Then the command exits successfully
      And only agent files are written to the .opencode/ directory

    Scenario: Model names are correctly translated to OpenCode equivalents
      Given a .claude/ agent configured with the "sonnet" model
      When the developer runs agents sync
      Then the command exits successfully
      And the corresponding .opencode/ agent uses the "zai-coding-plan/glm-5.1" model identifier

  @agents-validate-sync
  Rule: agents validate-sync confirms .claude/ and .opencode/ are semantically equivalent

    Scenario: Directories that are in sync pass validation
      Given .claude/ and .opencode/ configurations that are fully synchronised
      When the developer runs agents validate-sync
      Then the command exits successfully
      And the output reports all sync checks as passing

    Scenario: A description mismatch between directories fails validation
      Given an agent in .claude/ whose description differs from its .opencode/ counterpart
      When the developer runs agents validate-sync
      Then the command exits with a failure code
      And the output identifies the agent with the mismatched description

    Scenario: A count mismatch between directories fails validation
      Given .claude/ containing more agents than .opencode/
      When the developer runs agents validate-sync
      Then the command exits with a failure code
      And the output reports the agent count mismatch
