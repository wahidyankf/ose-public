Feature: Token Lifecycle

  As an authenticated user
  I want to refresh my session and log out securely
  So that my tokens are kept valid or invalidated as needed

  Background:
    Given the IAM API is running
    And a user "alice" is registered with password "Str0ng#Pass1"
    And "alice" has logged in and stored the access token and refresh token

  Scenario: Successful refresh returns a new access token and refresh token
    When the client sends POST /api/v1/auth/refresh with alice's refresh token
    Then the response status code should be 200
    And the response body should contain a non-null "access_token" field
    And the response body should contain a non-null "refresh_token" field

  Scenario: Reject refresh with an expired refresh token
    Given alice's refresh token has expired
    When the client sends POST /api/v1/auth/refresh with alice's refresh token
    Then the response status code should be 401
    And the response body should contain an error message about token expiration

  Scenario: Original refresh token is rejected after rotation (single-use)
    Given alice has used her refresh token to get a new token pair
    When alice sends POST /api/v1/auth/refresh with her original refresh token
    Then the response status code should be 401
    And the response body should contain an error message about invalid token

  Scenario: Refresh fails for a deactivated user
    Given the user "alice" has been deactivated
    When the client sends POST /api/v1/auth/refresh with alice's refresh token
    Then the response status code should be 401
    And the response body should contain an error message about account deactivation

  Scenario: Logout current session invalidates the access token
    When the client sends POST /api/v1/auth/logout with alice's access token
    Then the response status code should be 200
    And subsequent requests using alice's access token return 401

  Scenario: Logout all devices invalidates tokens from all sessions
    When the client sends POST /api/v1/auth/logout-all with alice's access token
    Then the response status code should be 200
    And subsequent requests using alice's access token return 401

  Scenario: Logout is idempotent — repeating logout on the same token returns 200
    When the client sends POST /api/v1/auth/logout with alice's access token
    And the client sends POST /api/v1/auth/logout with alice's access token again
    Then the response status code should be 200
