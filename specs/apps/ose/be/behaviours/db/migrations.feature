Feature: Database migrations on boot

  As a platform operator
  I want the backend to automatically apply pending schema migrations on startup
  So that the database schema is always in sync without manual intervention

  # Behaviour: OSB-013
  Scenario: Backend serves requests after starting against a database with pending migrations
    Given a fresh test database has pending ose-be migrations
    When ose-be starts against that database
    Then ose-be reaches its public health endpoint after applying migrations

  # Behaviour: OSB-002
  Scenario: Database status endpoint reports the migration state after startup
    Given a fresh test database has pending ose-be migrations
    When ose-be starts against that database
    Then the database status endpoint reports the migration state "applied"

  # Behaviour: OSB-011
  Scenario: Backend aborts at startup with a clear error when DATABASE_URL is missing
    Given DATABASE_URL is unset
    When ose-be reads its database configuration
    Then startup aborts with a clear error that names DATABASE_URL

  # Behaviour: OSB-009
  Scenario: Unknown route returns 404 Not Found
    Given the ose-be service is running
    When I send GET /api/v1/unknown-route
    Then the response status is 404
    And the response body contains "Not Found"
