Feature: User Registration

  As a new visitor
  I want to register an account with my username, email, and password
  So that I can start using the application

  Background:
    Given the app is running

  Scenario: Successful registration navigates to the login page with success message
    When a visitor fills in the registration form with username "alice", email "alice@example.com", and password "Str0ng#Pass1"
    And the visitor submits the registration form
    Then the visitor should be on the login page
    And a success message about account creation should be displayed

  Scenario: Successful registration does not display the password in any confirmation
    When a visitor fills in the registration form with username "alice", email "alice@example.com", and password "Str0ng#Pass1"
    And the visitor submits the registration form
    Then no password value should be visible on the page

  Scenario: Registration with duplicate username shows an error
    Given a user "alice" is registered with email "alice@example.com" and password "Str0ng#Pass1"
    When a visitor fills in the registration form with username "alice", email "new@example.com", and password "Str0ng#Pass1"
    And the visitor submits the registration form
    Then an error message about duplicate username should be displayed
    And the visitor should remain on the registration page

  Scenario: Registration with invalid email shows a validation error
    When a visitor fills in the registration form with username "alice", email "not-an-email", and password "Str0ng#Pass1"
    And the visitor submits the registration form
    Then a validation error for the email field should be displayed
    And the visitor should remain on the registration page

  Scenario: Registration with empty password shows a validation error
    When a visitor fills in the registration form with username "alice", email "alice@example.com", and password ""
    And the visitor submits the registration form
    Then a validation error for the password field should be displayed
    And the visitor should remain on the registration page

  Scenario: Registration with weak password shows a validation error
    When a visitor fills in the registration form with username "alice", email "alice@example.com", and password "str0ng#pass1"
    And the visitor submits the registration form
    Then a validation error for the password field should be displayed
    And the visitor should remain on the registration page
