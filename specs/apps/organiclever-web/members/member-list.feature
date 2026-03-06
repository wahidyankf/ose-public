Feature: Member List

  As an authenticated OrganicLever user
  I want to browse and search the team member list
  So that I can find the right person quickly

  Scenario: Members page shows all team members
    Given a user is logged in and on the members page
    Then the member list should show 6 members

  Scenario: Searching by name filters the list
    Given a user is logged in and on the members page
    When the user types "Alice" in the search field
    Then only members whose name contains "Alice" should be displayed

  Scenario: Searching by role filters the list
    Given a user is logged in and on the members page
    When the user types "Product Manager" in the search field
    Then only members whose role is "Product Manager" should be displayed

  Scenario: Searching by email filters the list
    Given a user is logged in and on the members page
    When the user types "alice@example.com" in the search field
    Then only "Alice Johnson" should appear in the results

  Scenario: Searching with no matches shows an empty list
    Given a user is logged in and on the members page
    When the user types "zzznomatch" in the search field
    Then the member list should show 0 members

  Scenario: Clicking a member row navigates to that member's detail page
    Given a user is logged in and on the members page
    When the user clicks the row for "Alice Johnson"
    Then the user should be on the detail page for Alice Johnson
