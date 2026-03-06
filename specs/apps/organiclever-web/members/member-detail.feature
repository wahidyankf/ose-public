Feature: Member Detail

  As an authenticated OrganicLever user
  I want to view the full profile of a team member
  So that I can see their role, contact, and GitHub handle in one place

  Scenario: Member detail page displays all member fields
    Given a user is logged in
    When the user navigates to the detail page for member 1
    Then the page should display the name "Alice Johnson"
    And the page should display the role "Senior Software Engineers"
    And the page should display the email "alice@example.com"
    And the page should display a GitHub link for "alicejohnson"

  Scenario: Navigating to a non-existent member redirects to the members list
    Given a user is logged in
    When the user navigates to the detail page for a member id that does not exist
    Then the user should be redirected to the members list page
