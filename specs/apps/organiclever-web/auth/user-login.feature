Feature: User Login

  As a registered OrganicLever user
  I want to log in with my email and password
  So that I can access the productivity dashboard

  Scenario: Successful login redirects to the dashboard
    Given a registered user with email "user@example.com" and password "password123"
    When the user submits the login form with those credentials
    Then the user should be on the dashboard page
    And an authentication session should be active

  Scenario: Login with a wrong password shows an error
    Given a visitor is on the login page
    When the visitor submits email "user@example.com" and password "wrongpassword"
    Then the error "Invalid email or password" should be displayed
    And the visitor should remain on the login page

  Scenario: Login with an unrecognised email shows an error
    Given a visitor is on the login page
    When the visitor submits email "nobody@example.com" and password "password123"
    Then the error "Invalid email or password" should be displayed
    And the visitor should remain on the login page

  Scenario: Already authenticated user is redirected away from the login page
    Given a user is already logged in as "user@example.com"
    When the user navigates to the login page
    Then the user should be redirected to the dashboard
