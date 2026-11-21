Feature: Initialize and share one local store
  As a developer who uses coding agents in several repositories
  I want one private FERRET store for my operating-system user
  So that every repository records into the same place and nothing lands inside a repository

  # Behaviour: FRT-001
  # Behaviour: FRT-039
  Scenario: ferret init from two repositories resolves one data home
    Given FERRET has not been initialized for the current operating-system user
    When the user runs ferret init from two different repositories
    Then both commands resolve the same private data home and SQLite database

  # Behaviour: FRT-001
  Scenario: Every created file and directory is owner-only
    Given FERRET has not been initialized for the current operating-system user
    When the user runs ferret init
    Then POSIX modes make every artifact private

  # Behaviour: FRT-039
  Scenario: No telemetry file is created inside a repository
    Given FERRET has not been initialized for the current operating-system user
    When the user runs ferret init from two different repositories
    Then no repository-local telemetry database is created

  # Behaviour: FRT-039
  Scenario: Capture concurrently across repositories
    Given three repositories and three harness adapters use the same initialized data home
    When each adapter submits a bounded burst of unique events concurrently
    Then every successful direct capture has exactly one durable row
    And every stored row matches its submitted event exactly and none is duplicated
    And every adapter returns within 1000 milliseconds

  # Behaviour: FRT-002
  Scenario: Running ferret init again reports already_initialized and changes nothing
    Given FERRET has already been initialized for the current operating-system user
    When the user runs ferret init again
    Then the command reports already_initialized and keeps the same installation identity and schema

  # Behaviour: FRT-032
  Scenario: FERRET_DATA_HOME relocates the data home
    Given the environment sets FERRET_DATA_HOME to /srv/ferret-data
    And the environment sets XDG_DATA_HOME to /srv/xdg
    When the user runs ferret init
    Then the data home is /srv/ferret-data

  # Behaviour: FRT-033
  Scenario: XDG_DATA_HOME sets the data home base
    Given the environment sets XDG_DATA_HOME to /srv/xdg
    When the user runs ferret init
    Then the data home is /srv/xdg/ferret

  # Behaviour: FRT-034
  Scenario: HOME is the fallback data home base
    Given neither FERRET_DATA_HOME nor XDG_DATA_HOME is set
    When the user runs ferret init
    Then the store is kept under HOME at .local/share/ferret

  # Behaviour: FRT-048
  Scenario Outline: A relative or unsafe FERRET_DATA_HOME reports ferret.storage.unsafe
    Given the environment sets FERRET_DATA_HOME to <value>
    When the user runs ferret init
    Then the command exits 2 with ferret.storage.unsafe on stderr and creates no data home

    Examples:
      | value                     |
      | relative/ferret           |
      | /users/example/../ferret  |
      | https://example.test/ferret |

  # Behaviour: FRT-049
  Scenario: A command on an uninitialized store exits 2 with ferret.storage.uninitialized
    Given FERRET has not been initialized for the current operating-system user
    When the user runs events list
    Then the command exits 2 with ferret.storage.uninitialized on stderr and nothing on stdout

  # Behaviour: FRT-007
  Scenario: status reports paths, runtime, storage, health, and adapters
    Given FERRET has already been initialized for the current operating-system user
    When the user runs status
    Then the status names the data home, the database, the runtime, the storage sizes, the health, and each adapter
