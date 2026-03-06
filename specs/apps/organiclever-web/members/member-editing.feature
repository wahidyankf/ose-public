@member-editing
Feature: Member Editing

  As an authenticated OrganicLever user
  I want to edit a team member's information
  So that the member registry stays accurate

  Scenario: Edit dialog opens with the member's current data pre-filled
    Given a user is logged in and on the members page
    When the user opens the edit dialog for "Alice Johnson"
    Then the name field should show "Alice Johnson"
    And the role field should show "Senior Software Engineers"
    And the email field should show "alice@example.com"
    And the GitHub field should show "alicejohnson"

  Scenario: Saving an edit updates the member in the list
    Given a user is logged in and on the members page
    And the user has opened the edit dialog for "Alice Johnson"
    When the user changes the name to "Alice Smith" and saves
    Then "Alice Smith" should appear in the member list
    And "Alice Johnson" should no longer appear in the member list

  Scenario: Editing role, email, and github fields updates the dialog inputs
    Given a user is logged in and on the members page
    And the user has opened the edit dialog for "Alice Johnson"
    When the user changes the role to "Staff Engineer"
    And the user changes the email to "ali@example.com"
    And the user changes the github to "alijohnson2"
    Then the role field should show "Staff Engineer"
    And the email field should show "ali@example.com"
    And the github field should show "alijohnson2"
