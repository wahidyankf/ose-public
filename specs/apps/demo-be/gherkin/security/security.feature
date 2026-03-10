Feature: Security

  As a security administrator
  I want password complexity rules enforced and accounts locked after repeated failures
  So that weak credentials and brute-force attacks are blocked

  Background:
    Given the IAM API is running

  Scenario: Reject password shorter than 12 characters
    When the client sends POST /api/v1/auth/register with body { "username": "alice", "email": "alice@example.com", "password": "Short1!Ab" }
    Then the response status code should be 400
    And the response body should contain a validation error for "password"

  Scenario: Reject password with no special character
    When the client sends POST /api/v1/auth/register with body { "username": "alice", "email": "alice@example.com", "password": "AllUpperCase1234" }
    Then the response status code should be 400
    And the response body should contain a validation error for "password"

  Scenario: Account is locked after exceeding the maximum failed login threshold
    Given a user "alice" is registered with password "Str0ng#Pass1"
    And "alice" has had the maximum number of failed login attempts
    When the client sends POST /api/v1/auth/login with body { "username": "alice", "password": "Str0ng#Pass1" }
    Then the response status code should be 401
    And alice's account status should be "locked"

  Scenario: Admin unlocks a locked account
    Given a user "alice" is registered and locked after too many failed logins
    And an admin user "superadmin" is registered and logged in with role "admin"
    When the admin sends POST /api/v1/admin/users/{alice_id}/unlock
    Then the response status code should be 200

  Scenario: Unlocked account can log in with correct password
    Given a user "alice" is registered and locked after too many failed logins
    And an admin has unlocked alice's account
    When the client sends POST /api/v1/auth/login with body { "username": "alice", "password": "Str0ng#Pass1" }
    Then the response status code should be 200
    And the response body should contain a non-null "access_token" field
