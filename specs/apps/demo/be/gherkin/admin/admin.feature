Feature: Admin

  As an administrator
  I want to search, list, and control user accounts and generate password reset tokens
  So that I can monitor the user base and respond to security incidents

  Background:
    Given the API is running
    And an admin user "superadmin" is registered and logged in
    And users "alice", "bob", and "carol" are registered

  Scenario: List all users returns a paginated response
    When the admin sends GET /api/v1/admin/users
    Then the response status code should be 200
    And the response body should contain a non-null "data" field
    And the response body should contain a non-null "total" field
    And the response body should contain a non-null "page" field

  Scenario: Search users by email returns matching results
    When the admin sends GET /api/v1/admin/users?email=alice@example.com
    Then the response status code should be 200
    And the response body should contain at least one user with "email" equal to "alice@example.com"

  Scenario: Admin disables a user account
    Given "alice" has logged in and stored the access token
    When the admin sends POST /api/v1/admin/users/{alice_id}/disable with body { "reason": "Policy violation" }
    Then the response status code should be 200
    And alice's account status should be "disabled"

  Scenario: Disabled user's access token is rejected with 401
    Given "alice" has logged in and stored the access token
    And alice's account has been disabled by the admin
    When the client sends GET /api/v1/users/me with alice's access token
    Then the response status code should be 401

  Scenario: Admin re-enables a disabled user account
    Given alice's account has been disabled
    When the admin sends POST /api/v1/admin/users/{alice_id}/enable
    Then the response status code should be 200
    And alice's account status should be "active"

  Scenario: Admin generates a password-reset token for a user
    When the admin sends POST /api/v1/admin/users/{alice_id}/force-password-reset
    Then the response status code should be 200
    And the response body should contain a non-null "reset_token" field
