@member-deletion
Feature: Member Deletion

  As an authenticated OrganicLever user
  I want to remove a team member from the registry
  So that the list reflects only current team members

  Scenario: Clicking delete opens a confirmation dialog
    Given a user is logged in and on the members page
    When the user clicks the delete button for "Charlie Davis"
    Then a confirmation dialog should appear with the text "Are you absolutely sure?"

  Scenario: Confirming deletion removes the member from the list
    Given a user is logged in and on the members page
    And the user has clicked the delete button for "Bob Smith"
    When the user confirms the deletion
    Then "Bob Smith" should no longer appear in the member list

  Scenario: Cancelling deletion keeps the member in the list
    Given a user is logged in and on the members page
    And the user has clicked the delete button for "Bob Smith"
    When the user cancels the deletion
    Then "Bob Smith" should still appear in the member list

  Scenario: A server error during deletion shows an error message
    Given the member list page is displayed with all members
    When the user clicks the delete button for the first member
    And the user confirms the deletion
    And the server returns an error
    Then an error message should be displayed
    And all members should still be visible in the list
