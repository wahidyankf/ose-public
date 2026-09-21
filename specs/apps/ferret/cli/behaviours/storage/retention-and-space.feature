Feature: Keep local telemetry for thirty days and account for its space
  As a developer who runs coding agents all day
  I want expired telemetry to disappear immediately and its space to be reclaimed without a daemon
  So that the local store stays private, bounded, and honest about what it holds

  Scenario: Hide then prune every expired usage-derived record
    Given the database contains rows captured before and after the thirty-day cutoff
    When a read runs before physical pruning and then the next FERRET operation runs with a fixed clock
    Then no row at or beyond the cutoff is returned by the read
    And the next operation stops physical pruning at the first of 100 rows or 100 monotonic milliseconds
    And every newer row remains queryable
    And status increments expiredLocalTotal for locally expired rows
    And expiredBeforeAckTotal remains zero

  Scenario: Measure storage before and after retention
    Given a representative event fixture has populated the database and WAL
    When maintenance checkpoints, prunes expired rows, and performs the planned compaction policy
    Then status reports database, WAL, and total high-water bytes separately
    And the benchmark reports bytes per event and index share
    And a size outside the planning envelope fails the storage acceptance gate pending explanation
