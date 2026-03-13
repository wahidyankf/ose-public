Feature: Session Lifecycle

  As an authenticated user
  I want my session to refresh automatically and log out securely
  So that I stay signed in while active and can end my session when done

  Background:
    Given the app is running
    And a user "alice" is registered with password "Str0ng#Pass1"
    And alice has logged in

  Scenario: Session refreshes automatically before the access token expires
    Given alice's access token is about to expire
    When the app performs a background token refresh
    Then a new access token should be stored
    And a new refresh token should be stored

  Scenario: Expired refresh token redirects to login
    Given alice's refresh token has expired
    When the app attempts a background token refresh
    Then alice should be redirected to the login page
    And an error message about session expiration should be displayed

  Scenario: Original refresh token is rejected after rotation
    Given alice has refreshed her session and received a new token pair
    When the app attempts to refresh using the original refresh token
    Then alice should be redirected to the login page

  Scenario: Deactivated user is redirected to login on next action
    Given alice's account has been deactivated
    When alice navigates to a protected page
    Then alice should be redirected to the login page
    And an error message about account deactivation should be displayed

  Scenario: Clicking logout ends the current session
    When alice clicks the "Logout" button
    Then alice should be redirected to the login page
    And the authentication session should be cleared

  Scenario: Clicking "Log out all devices" ends all sessions
    When alice clicks the "Log out all devices" option
    Then alice should be redirected to the login page
    And the authentication session should be cleared

  Scenario: Clicking logout twice does not cause an error
    Given alice has already clicked logout
    When alice navigates to the login page
    Then no error should be displayed
