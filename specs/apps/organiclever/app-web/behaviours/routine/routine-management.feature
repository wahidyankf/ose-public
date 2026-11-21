Feature: Routine Management

  As an app user
  I want to create, edit, and delete workout routines
  So that I can plan and reuse structured workout sequences

  # Behaviour: OAW-005
  Scenario: Create a new routine
    Given the edit routine screen is open for a new routine
    When the user enters a routine name
    And the user saves the routine
    Then the routine is saved

  # Behaviour: OAW-027
  Scenario: Add an exercise to a routine
    Given the edit routine screen is open
    When the user adds an exercise
    Then the exercise appears in the group

  # Behaviour: OAW-005
  Scenario: Delete a routine
    Given the edit routine screen is open for an existing routine
    When the user confirms deleting the routine
    Then the routine is deleted
