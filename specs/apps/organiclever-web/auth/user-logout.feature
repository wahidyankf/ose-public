Feature: User Logout

  As an authenticated OrganicLever user
  I want to log out
  So that my session is securely ended and the next person cannot access my account

  Scenario: Logging out ends the session and redirects to the login page
    Given a user is logged in and on the dashboard
    When the user clicks the "Logout" button in the navigation sidebar
    Then the user should be redirected to the login page
    And the authentication session should be ended
    And navigating to "/dashboard" should redirect the user back to the login page
