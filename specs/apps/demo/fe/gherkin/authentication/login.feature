Feature: Password Login

  As a registered user
  I want to log in with my username and password
  So that I can access my dashboard and manage my finances

  Background:
    Given the app is running
    And a user "alice" is registered with password "Str0ng#Pass1"

  Scenario: Successful login navigates to the dashboard
    When alice submits the login form with username "alice" and password "Str0ng#Pass1"
    Then alice should be on the dashboard page
    And the navigation should display alice's username

  Scenario: Successful login stores session tokens
    When alice submits the login form with username "alice" and password "Str0ng#Pass1"
    Then an authentication session should be active
    And a refresh token should be stored

  Scenario: Login with wrong password shows an error
    When alice submits the login form with username "alice" and password "Wr0ngPass!"
    Then an error message about invalid credentials should be displayed
    And alice should remain on the login page

  Scenario: Login for non-existent user shows an error
    When alice submits the login form with username "ghost" and password "Str0ng#Pass1"
    Then an error message about invalid credentials should be displayed
    And alice should remain on the login page

  Scenario: Login for deactivated account shows an error
    Given a user "alice" is registered and deactivated
    When alice submits the login form with username "alice" and password "Str0ng#Pass1"
    Then an error message about account deactivation should be displayed
    And alice should remain on the login page
