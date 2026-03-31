@docs-validate-naming
Feature: Documentation File Naming Convention Enforcement

  As a documentation maintainer
  I want every docs/ file to carry the correct hierarchical prefix
  So that file locations are always encoded in the filename

  Scenario: A docs directory with correctly named files passes validation
    Given a docs directory where every file follows the naming convention
    When the developer runs docs validate-naming
    Then the command exits successfully
    And the output reports zero violations

  Scenario: A file missing the required prefix separator fails validation
    Given a docs directory containing a file without the double-underscore prefix separator
    When the developer runs docs validate-naming
    Then the command exits with a failure code
    And the output identifies the file with the naming violation

  Scenario: A file with the wrong prefix for its location fails validation
    Given a docs directory containing a file whose prefix does not match its directory path
    When the developer runs docs validate-naming
    Then the command exits with a failure code
    And the output reports the expected prefix alongside the actual filename

  Scenario: The --fix flag previews renames without modifying files
    Given a docs directory containing files with naming violations
    When the developer runs docs validate-naming with the --fix flag
    Then the command exits successfully
    And the output shows the planned renames
    And no files are renamed on disk

  Scenario: The --fix --apply flags rename files using git mv
    Given a docs directory containing files with naming violations
    When the developer runs docs validate-naming with --fix and --apply flags
    Then the command exits successfully
    And the files are renamed to follow the naming convention
