Feature: Keep local telemetry for thirty days and account for its space
  As a developer who runs coding agents all day
  I want expired telemetry to disappear immediately and its space to be reclaimed without a daemon
  So that the local store stays private, bounded, and honest about what it holds

  Scenario: Hide then prune every expired usage-derived record
    Given the database contains rows captured before and after the thirty-day cutoff
    When a read runs before physical pruning and then the next two FERRET operations run
    Then no row at or beyond the cutoff is returned by the read
    And each of those operations stops physical pruning at the first of 100 rows or 100 monotonic milliseconds
    And every newer row remains queryable
    And status increments expiredLocalTotal for locally expired rows
    And expiredBeforeAckTotal remains zero

  Scenario: Measure storage before and after retention
    Given a representative event fixture has populated the database and WAL
    When maintenance checkpoints, prunes expired rows, and performs the planned compaction policy
    Then maintenance reports the database bytes before and after it and the largest footprint it measured
    And status reports the database, WAL, and free-list bytes on disk separately with their current total
