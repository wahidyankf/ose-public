@env-restore
Feature: Env file restore

  As a developer
  I want rhino-cli env restore to copy .env files back from a backup directory
  So that environment configuration is recovered after destructive operations

  @env-restore
  Scenario: Restore copies files back from backup
    Given a backup directory containing previously backed-up .env files from the repository
    When the developer runs rhino-cli env restore
    Then the command exits successfully
    And each .env file is copied back to its original path in the repository
    And the output lists each restored file

  @env-restore
  Scenario: Restore with custom source directory
    Given a backup directory at /tmp/my-env-backup containing a backed-up .env file
    When the developer runs rhino-cli env restore with --dir /tmp/my-env-backup
    Then the command exits successfully
    And the .env file is copied back to its original path in the repository

  @env-restore
  Scenario: Restore fails when backup directory does not exist
    Given no directory exists at /nonexistent
    When the developer runs rhino-cli env restore with --dir /nonexistent
    Then the command exits with a failure code
    And the output reports that the directory does not exist

  @env-restore
  Scenario: JSON output for restore
    Given a backup directory containing a previously backed-up .env file
    When the developer runs rhino-cli env restore with --output json
    Then the command exits successfully
    And the output is valid JSON
    And the JSON includes the direction, backup directory, list of files, copied count, and skipped count

  @env-restore
  Scenario: Restore only restores .env files
    Given a backup directory containing a backed-up .env file and a README.md file
    When the developer runs rhino-cli env restore
    Then the command exits successfully
    And the .env file is copied back to its original path in the repository
    And README.md is not restored

  @env-restore
  Scenario: Restore with zero .env files in backup
    Given a backup directory containing no .env files
    When the developer runs rhino-cli env restore
    Then the command exits successfully
    And the output reports that zero files were restored

  @env-restore
  Scenario: Worktree-aware restore reads from correct namespace
    Given a backup directory containing a .env file backed up under a feature-branch namespace
    When the developer runs rhino-cli env restore with --worktree-aware from a worktree named "feature-branch"
    Then the command exits successfully
    And the .env file is read from the feature-branch namespace inside the backup directory
    And the .env file is copied back to its original path in the worktree

  @env-restore-confirm
  Scenario: Restore prompts when destination files already exist
    Given a backup directory containing a previously backed-up .env file
    And the repository already contains a .env file at the original path
    When the developer runs rhino-cli env restore and confirms the overwrite
    Then the command exits successfully
    And the .env file in the repository is overwritten with the backup

  @env-restore-confirm
  Scenario: Restore aborts when user declines overwrite
    Given a backup directory containing a previously backed-up .env file
    And the repository already contains a .env file at the original path
    When the developer runs rhino-cli env restore and declines the overwrite
    Then the command exits successfully
    And the output reports that restore was cancelled
    And the existing repository file is unchanged

  @env-restore-confirm
  Scenario: Restore with --force skips confirmation
    Given a backup directory containing a previously backed-up .env file
    And the repository already contains a .env file at the original path
    When the developer runs rhino-cli env restore with --force
    Then the command exits successfully
    And the .env file in the repository is overwritten without prompting

  @env-restore-confirm
  Scenario: Restore proceeds without prompt when no conflicts exist
    Given a backup directory containing a previously backed-up .env file
    And the repository does not contain a .env file at the original path
    When the developer runs rhino-cli env restore
    Then the command exits successfully
    And no confirmation prompt is shown
    And the .env file is restored to the repository

  @env-restore-config
  Scenario: Restore includes config files with --include-config
    Given a backup directory containing a .env file and a .claude/settings.local.json file
    When the developer runs rhino-cli env restore with --include-config and --force
    Then the command exits successfully
    And the .env file is restored to the repository
    And the .claude/settings.local.json is restored to the repository preserving its relative path

  @env-restore-config
  Scenario: Restore without --include-config ignores config files in backup
    Given a backup directory containing a .env file and a .claude/settings.local.json file
    When the developer runs rhino-cli env restore with --force
    Then the command exits successfully
    And the .env file is restored to the repository
    And the .claude/settings.local.json is not restored to the repository
