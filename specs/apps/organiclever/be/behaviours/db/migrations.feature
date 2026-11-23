Feature: Database migrations on boot

  As a platform operator
  I want the backend to automatically apply pending schema migrations on startup
  So that the database schema is always in sync without manual intervention

  # Behaviour: OBE-018
  Scenario: Backend serves requests after starting against a database with pending migrations
    Given a fresh test database has pending organiclever-be migrations
    When organiclever-be starts against that database
    Then organiclever-be reaches its public health endpoint after applying migrations

  # Behaviour: OBE-012
  Scenario: Database status endpoint reports the migration state after startup
    Given a fresh test database has pending organiclever-be migrations
    When organiclever-be starts against that database
    Then the database status endpoint reports the migrations applied

  # Behaviour: OBE-016
  Scenario: Backend aborts at startup with a clear error when DATABASE_URL is missing
    Given DATABASE_URL is unset
    When organiclever-be reads its database configuration
    Then startup aborts naming the DATABASE_URL variable
