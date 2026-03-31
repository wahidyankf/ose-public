@env-backup
Feature: Env file backup

  As a developer
  I want rhino-cli env backup to copy all .env files outside the repository
  So that environment configuration is preserved safely before destructive operations

  @env-backup
  Scenario: Backup discovers and copies all .env files
    Given a git repository containing .env files at the root and in app subdirectories
    When the developer runs rhino-cli env backup
    Then the command exits successfully
    And each .env file is copied to the backup directory preserving its relative path
    And the output lists each backed-up file

  @env-backup
  Scenario: Backup with custom directory
    Given a git repository containing a .env file at the root
    When the developer runs rhino-cli env backup with --dir pointing to a directory outside the repository
    Then the command exits successfully
    And the .env file is copied to the specified directory preserving its relative path

  @env-backup
  Scenario: Backup rejects a directory inside the repository
    Given a git repository containing a .env file at the root
    When the developer runs rhino-cli env backup with --dir pointing to a path inside the git root
    Then the command exits with a failure code
    And the output warns that the backup directory must be outside the repository

  @env-backup
  Scenario: Symlinks and oversized files are skipped
    Given a git repository containing a symlinked .env file, a .env file larger than 1 MB, and a regular .env file
    When the developer runs rhino-cli env backup
    Then the command exits successfully
    And the symlinked .env file is skipped with a warning
    And the oversized .env file is skipped with a warning
    And the regular .env file is copied to the backup directory

  @env-backup
  Scenario: Backup with zero .env files
    Given a git repository containing no .env files
    When the developer runs rhino-cli env backup
    Then the command exits successfully
    And the output reports that zero files were backed up

  @env-backup
  Scenario: JSON output for backup
    Given a git repository containing a .env file at the root
    When the developer runs rhino-cli env backup with --output json
    Then the command exits successfully
    And the output is valid JSON
    And the JSON includes the direction, backup directory, list of files, copied count, and skipped count

  @env-backup
  Scenario: Env files inside auto-generated directories are not discovered
    Given a git repository containing .env files inside node_modules, dist, build, .next, __pycache__, target, vendor, coverage, and generated-contracts directories
    When the developer runs rhino-cli env backup
    Then the command exits successfully
    And none of the .env files inside auto-generated directories are backed up

  @env-backup
  Scenario: Env files inside nested auto-generated directories are not discovered
    Given a git repository where apps/web/node_modules contains a .env file and apps/web contains a .env.local file
    When the developer runs rhino-cli env backup
    Then the command exits successfully
    And only apps/web/.env.local is copied to the backup directory
    And the .env file inside apps/web/node_modules is not backed up

  @env-backup
  Scenario: Backup works in a git worktree
    Given a git worktree containing a .env file at its root
    When the developer runs rhino-cli env backup
    Then the command exits successfully
    And the .env file is copied to the backup directory with a flat structure

  @env-backup
  Scenario: Worktree-aware backup namespaces by worktree name
    Given a git worktree named "feature-branch" containing a .env file at its root
    When the developer runs rhino-cli env backup with --worktree-aware
    Then the command exits successfully
    And the .env file is copied under a feature-branch subdirectory inside the backup directory

  @env-backup
  Scenario: Main repo with worktree-aware uses repository directory name
    Given the main git repository named "open-sharia-enterprise" containing a .env file at its root
    When the developer runs rhino-cli env backup with --worktree-aware
    Then the command exits successfully
    And the .env file is copied under an open-sharia-enterprise subdirectory inside the backup directory

  @env-backup-confirm
  Scenario: Backup prompts when destination files already exist
    Given a git repository containing a .env file at the root
    And the backup directory already contains a backed-up .env file
    When the developer runs rhino-cli env backup and confirms the overwrite
    Then the command exits successfully
    And the .env file is overwritten in the backup directory

  @env-backup-confirm
  Scenario: Backup aborts when user declines overwrite
    Given a git repository containing a .env file at the root
    And the backup directory already contains a backed-up .env file
    When the developer runs rhino-cli env backup and declines the overwrite
    Then the command exits successfully
    And the output reports that backup was cancelled
    And the existing backup file is unchanged

  @env-backup-confirm
  Scenario: Backup with --force skips confirmation
    Given a git repository containing a .env file at the root
    And the backup directory already contains a backed-up .env file
    When the developer runs rhino-cli env backup with --force
    Then the command exits successfully
    And the .env file is overwritten in the backup directory without prompting

  @env-backup-confirm
  Scenario: Backup proceeds without prompt when no conflicts exist
    Given a git repository containing a .env file at the root
    And the backup directory is empty
    When the developer runs rhino-cli env backup
    Then the command exits successfully
    And no confirmation prompt is shown
    And the .env file is copied to the backup directory

  @env-backup-config
  Scenario: Backup includes config files with --include-config
    Given a git repository containing a .env file and a .claude/settings.local.json file
    When the developer runs rhino-cli env backup with --include-config and --force
    Then the command exits successfully
    And the .env file is copied to the backup directory
    And the .claude/settings.local.json is copied to the backup directory preserving its relative path

  @env-backup-config
  Scenario: Backup without --include-config ignores config files
    Given a git repository containing a .env file and a .claude/settings.local.json file
    When the developer runs rhino-cli env backup with --force
    Then the command exits successfully
    And the .env file is copied to the backup directory
    And the .claude/settings.local.json is not copied to the backup directory

  @env-backup-config
  Scenario: Backup with --include-config and no config files found
    Given a git repository containing a .env file but no known config files
    When the developer runs rhino-cli env backup with --include-config and --force
    Then the command exits successfully
    And only the .env file is copied to the backup directory
