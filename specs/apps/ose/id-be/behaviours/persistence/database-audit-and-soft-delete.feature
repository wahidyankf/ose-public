Feature: OSE ID database record lifecycle

  As a security reviewer
  I want stored OSE ID rows to stay attributable instead of disappearing
  So that every state change keeps the evidence of who made it and when

  Rule: Migration history remains attributable and cannot be physically deleted

    Scenario: Reject physical deletion of migration history
      Given the migrated OSE ID database contains an active migration-history record
      When the serving role attempts to physically delete that record
      Then PostgreSQL rejects the operation
      And the record remains stored with all six audit columns
      And an ordinary readiness check still sees the active migration state
