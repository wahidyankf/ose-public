Feature: Password Login

  As a registered user
  I want to log in with my username and password
  So that I can obtain tokens to access protected resources

  Background:
    Given the IAM API is running
    And a user "alice" is registered with password "Str0ng#Pass1"

  Scenario: Successful login returns access token and refresh token
    When the client sends POST /api/v1/auth/login with body { "username": "alice", "password": "Str0ng#Pass1" }
    Then the response status code should be 200
    And the response body should contain a non-null "access_token" field
    And the response body should contain a non-null "refresh_token" field

  Scenario: Successful login response includes token type "Bearer"
    When the client sends POST /api/v1/auth/login with body { "username": "alice", "password": "Str0ng#Pass1" }
    Then the response status code should be 200
    And the response body should contain "token_type" equal to "Bearer"

  Scenario: Reject login with wrong password
    When the client sends POST /api/v1/auth/login with body { "username": "alice", "password": "Wr0ngPass!" }
    Then the response status code should be 401
    And the response body should contain an error message about invalid credentials

  Scenario: Reject login for non-existent user
    When the client sends POST /api/v1/auth/login with body { "username": "ghost", "password": "Str0ng#Pass1" }
    Then the response status code should be 401
    And the response body should contain an error message about invalid credentials

  Scenario: Reject login for deactivated account
    Given a user "alice" is registered and deactivated
    When the client sends POST /api/v1/auth/login with body { "username": "alice", "password": "Str0ng#Pass1" }
    Then the response status code should be 401
    And the response body should contain an error message about account deactivation
