Feature: OSE ID database privilege separation

  As a security reviewer
  I want the role that serves traffic to hold less privilege than the role that migrates
  So that a compromised running service cannot rewrite the OSE ID schema

  Rule: The serving role cannot change schema

    Scenario: Deny a schema change attempted by the application role
      Given the migration role has applied the current empty OSE ID schema
      When the application role attempts to create or alter a table
      Then PostgreSQL denies the operation
      And the application role can execute only the granted runtime health query
