Feature: Keep local telemetry for thirty days and account for its space
  As a developer who runs coding agents all day
  I want expired telemetry to disappear immediately and its space to be reclaimed without a daemon
  So that the local store stays private, bounded, and honest about what it holds

  # Behaviour: FRT-037
  Scenario: Events older than thirty days are never returned
    Given the database contains rows captured before and after the thirty-day cutoff
    When a read runs before physical pruning and then the next two FERRET operations run
    Then no row at or beyond the cutoff is returned by the read
    And every newer row remains queryable

  Scenario: status reports how many events expired
    Given the database contains rows captured before and after the thirty-day cutoff
    When a read runs before physical pruning and then the next two FERRET operations run
    Then status reports as many locally expired events as the operations pruned

  # Behaviour: FRT-014
  Scenario: maintenance reports database bytes before and after and the largest footprint
    Given a representative event fixture has populated the database and WAL
    When maintenance checkpoints, prunes expired rows, and performs the planned compaction policy
    Then maintenance reports the database bytes before and after it and the largest footprint it measured

  Scenario: status reports database, WAL, and free-list bytes with a total
    Given a representative event fixture has populated the database and WAL
    When maintenance checkpoints, prunes expired rows, and performs the planned compaction policy
    Then status reports the database, WAL, and free-list bytes on disk separately with their current total

  # Behaviour: FRT-015
  Scenario Outline: maintenance --if-due does nothing unless maintenance is due
    Given the database holds expired events and maintenance <state>
    When the user runs maintenance with --if-due
    Then the expired events are <pruned>

    Examples:
      | state            | pruned      |
      | ran a moment ago | left in place |
      | has never run    | pruned      |
