Feature: Security

  As a security-conscious user
  I want password complexity enforced during registration and accounts locked after repeated failures
  So that weak credentials and brute-force attacks are blocked

  Background:
    Given the app is running

  Scenario: Registration form rejects password shorter than 12 characters
    When a visitor fills in the registration form with username "alice", email "alice@example.com", and password "Short1!Ab"
    And the visitor submits the registration form
    Then a validation error for the password field should be displayed
    And the error should mention minimum length requirements

  Scenario: Registration form rejects password with no special character
    When a visitor fills in the registration form with username "alice", email "alice@example.com", and password "AllUpperCase1234"
    And the visitor submits the registration form
    Then a validation error for the password field should be displayed
    And the error should mention special character requirements

  Scenario: Account is locked after exceeding maximum failed login attempts
    Given a user "alice" is registered with password "Str0ng#Pass1"
    And alice has entered the wrong password the maximum number of times
    When alice submits the login form with username "alice" and password "Str0ng#Pass1"
    Then an error message about account lockout should be displayed
    And alice should remain on the login page

  Scenario: Admin unlocks a locked account via the admin panel
    Given a user "alice" is registered and locked after too many failed logins
    And an admin user "superadmin" is logged in
    When the admin navigates to alice's user detail in the admin panel
    And the admin clicks the "Unlock" button
    Then alice's status should display as "active"

  Scenario: Unlocked account can log in with correct password
    Given a user "alice" was locked and has been unlocked by an admin
    When alice submits the login form with username "alice" and password "Str0ng#Pass1"
    Then alice should be on the dashboard page
