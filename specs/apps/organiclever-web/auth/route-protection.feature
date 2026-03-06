Feature: Protected Route Access Control

  As the OrganicLever application
  I want to prevent unauthenticated access to protected pages
  So that user data is not exposed to visitors who have not logged in

  Scenario: Unauthenticated access to the dashboard redirects to login
    Given a visitor has not logged in
    When the visitor navigates directly to "/dashboard"
    Then the visitor should be redirected to the login page

  Scenario: Unauthenticated access to the members page redirects to login
    Given a visitor has not logged in
    When the visitor navigates directly to "/dashboard/members"
    Then the visitor should be redirected to the login page

  Scenario: After login the user is sent to the page they originally requested
    Given a visitor navigated to "/dashboard/members" without being logged in
    And the visitor was redirected to the login page
    When the visitor successfully logs in
    Then the visitor should be on the "/dashboard/members" page
