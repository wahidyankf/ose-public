Feature: User Account

  As an authenticated user
  I want to manage my profile, password, and account status
  So that I can keep my account information current and control my access

  Background:
    Given the IAM API is running
    And a user "alice" is registered with email "alice@example.com" and password "Str0ng#Pass1"
    And "alice" has logged in and stored the access token

  Scenario: Get own profile returns username, email, and display name
    When alice sends GET /api/v1/users/me
    Then the response status code should be 200
    And the response body should contain "username" equal to "alice"
    And the response body should contain "email" equal to "alice@example.com"
    And the response body should contain a non-null "display_name" field

  Scenario: Update display name succeeds
    When alice sends PATCH /api/v1/users/me with body { "display_name": "Alice Smith" }
    Then the response status code should be 200
    And the response body should contain "display_name" equal to "Alice Smith"

  Scenario: Successful password change returns 200
    When alice sends POST /api/v1/users/me/password with body { "old_password": "Str0ng#Pass1", "new_password": "NewPass#456" }
    Then the response status code should be 200

  Scenario: Reject password change with incorrect old password
    When alice sends POST /api/v1/users/me/password with body { "old_password": "Wr0ngOld!", "new_password": "NewPass#456" }
    Then the response status code should be 401
    And the response body should contain an error message about invalid credentials

  Scenario: Authenticated user self-deactivates their account
    When alice sends POST /api/v1/users/me/deactivate
    Then the response status code should be 200

  Scenario: Deactivated user cannot log in
    Given a user "alice" is registered and deactivated
    When the client sends POST /api/v1/auth/login with body { "username": "alice", "password": "Str0ng#Pass1" }
    Then the response status code should be 401
    And the response body should contain an error message about account deactivation
