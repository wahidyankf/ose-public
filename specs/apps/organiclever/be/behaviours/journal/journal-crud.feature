Feature: Backend journal CRUD

  As a future server-of-record migration
  I want the organiclever-be backend to persist journal entries over HTTP
  So that the PGlite client journal can one day be backed by PostgreSQL

  Background:
    Given the journal API is running

  # Behaviour: OBE-004
  Scenario: Create a journal entry
    When a client posts a valid journal entry
    Then the journal response status code should be 201
    And the journal response body should include an id

  # Behaviour: OBE-013
  Scenario: Reject a journal entry with a blank name
    When a client posts a journal entry with a blank name
    Then the journal response status code should be 400

  # Behaviour: OBE-014
  Scenario: Reject a journal entry whose name is not a lowercase kind slug
    When a client posts a journal entry with an uppercase name
    Then the journal response status code should be 400

  # Behaviour: OBE-003
  Scenario: List journal entries
    Given a journal entry has been created
    When a client lists the journal entries
    Then the journal response status code should be 200
    And the journal list should include the created entry

  # Behaviour: OBE-003
  Scenario: List journal entries returns the newest first
    Given a journal entry has been created
    And a second journal entry has been created after it
    When a client lists the journal entries
    Then the journal list should start with the most recent entry

  # Behaviour: OBE-005
  Scenario: Fetch an existing journal entry by id returns it
    Given a journal entry has been created
    When a client fetches the journal entry that was created
    Then the journal response status code should be 200
    And the journal response should carry the id of the created entry

  # Behaviour: OBE-006
  Scenario: Fetch a missing journal entry
    When a client fetches a journal entry that does not exist
    Then the journal response status code should be 404

  # Behaviour: OBE-008
  Scenario: Update a missing journal entry returns 404
    When a client updates a journal entry that does not exist
    Then the journal response status code should be 404

  # Behaviour: OBE-007
  Scenario: Update a journal entry
    Given a journal entry has been created
    When a client updates the journal entry name
    Then the journal response status code should be 200
    And the updated journal entry should reflect the new name

  # Behaviour: OBE-010
  Scenario: Delete a missing journal entry returns 404
    When a client deletes a journal entry that does not exist
    Then the journal response status code should be 404

  # Behaviour: OBE-009
  Scenario: Delete a journal entry
    Given a journal entry has been created
    When a client deletes the journal entry
    Then the journal response status code should be 204
    And fetching the deleted journal entry should return 404
