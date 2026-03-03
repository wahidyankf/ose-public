Feature: Dashboard Overview

  As an authenticated OrganicLever user
  I want to see a summary of my team's activity on the dashboard
  So that I can quickly check key metrics without drilling into details

  Scenario: Dashboard displays the active projects count
    Given a user is logged in and on the dashboard
    Then the dashboard should display "12" active projects

  Scenario: Dashboard displays the team members count
    Given a user is logged in and on the dashboard
    Then the dashboard should display "24" team members

  Scenario: Clicking the Team Members card navigates to the members list
    Given a user is logged in and on the dashboard
    When the user clicks the "Team Members" card
    Then the user should be on the members list page

  @sidebar-collapse
  Scenario: Collapsing the sidebar persists across page refreshes
    Given a user is logged in and on the dashboard
    When the user clicks the sidebar collapse button
    And the user refreshes the page
    Then the sidebar should remain collapsed
