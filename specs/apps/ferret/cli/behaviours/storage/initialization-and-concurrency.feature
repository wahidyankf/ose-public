Feature: Initialize and share one local store
  As a developer who uses coding agents in several repositories
  I want one private FERRET store for my operating-system user
  So that every repository records into the same place and nothing lands inside a repository

  Scenario: Initialize one private store from multiple repositories
    Given FERRET has not been initialized for the current operating-system user
    When the user runs ferret init from two different repositories
    Then both commands resolve the same private data home and SQLite database
    And exactly one installation identity and current schema exist
    And POSIX modes make every artifact private
    And no repository-local telemetry database is created

  Scenario: Capture concurrently across repositories
    Given three repositories and three harness adapters use the same initialized data home
    When each adapter submits a bounded burst of unique events concurrently
    Then every successful direct capture has exactly one durable row
    And no row is partially written or duplicated
    And every adapter returns within 1000 milliseconds
