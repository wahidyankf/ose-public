Feature: Conversion reports and the skiplist
  As crane-cli
  I want report stamps, skiplist keys, and skiplist paths to be stable and recoverable
  So that a run leaves a dated report and a repeated finding is recognised rather than re-raised

  # Exemption(e2e): the library has no e2e level: a pure library with no process or network boundary of its own; alternative-proof: fsharp-crane-core:test:unit / Report stamps use UTC+7
  @e2e-exempt
  # Behaviour: FCC-017
  Scenario: Report stamps use UTC+7
    Given a UTC instant of midnight on 2026-01-01
    When the report stamp is formed for that instant
    Then the stamp is "2026-01-01--07-00"

  # Exemption(e2e): the library has no e2e level: a pure library with no process or network boundary of its own; alternative-proof: fsharp-crane-core:test:unit / A skiplist finding is keyed by a stable hash and never added twice
  @e2e-exempt
  # Behaviour: FCC-018
  Scenario: A skiplist finding is keyed by a stable hash and never added twice
    Given a skiplist finding for a Markdown basename, category, and description
    When the finding is keyed and added twice
    Then the same key is produced both times and the second add reports a duplicate

  # Exemption(e2e): the library has no e2e level: a pure library with no process or network boundary of its own; alternative-proof: fsharp-crane-core:test:unit / CRANE_SKIPLIST_PATH overrides the skiplist file path
  @e2e-exempt
  # Behaviour: FCC-023
  Scenario: CRANE_SKIPLIST_PATH overrides the skiplist file path
    Given CRANE_SKIPLIST_PATH is set to a path
    When the skiplist path is resolved
    Then the resolved path is that path

  # Exemption(integration): the skiplist entry is a pure record with no file or process boundary of its own; the file boundary is bound by the skiplist add and check integration tests; alternative-proof: fsharp-crane-core:test:unit / A skiplist entry carries its Markdown basename
  @integration-exempt
  # Exemption(e2e): the library has no e2e level: a pure library with no process or network boundary of its own; alternative-proof: fsharp-crane-core:test:unit / A skiplist entry carries its Markdown basename
  @e2e-exempt
  # Behaviour: FCC-009
  Scenario: A skiplist entry carries its Markdown basename
    Given a skiplist entry for "doc.md"
    When the entry is serialised to JSON
    Then the JSON carries the "md_basename" field with "doc.md"

  # Exemption(e2e): the library has no e2e level: a pure library with no process or network boundary of its own; alternative-proof: fsharp-crane-core:test:unit / A report that cannot be written or finalized returns an Error
  @e2e-exempt
  # Behaviour: FCC-026
  Scenario: A report that cannot be written or finalized returns an Error
    Given a report path that does not exist
    When the report is finalized
    Then the result is an Error and no exception escapes
