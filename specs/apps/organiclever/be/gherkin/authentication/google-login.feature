Feature: Google OAuth Login

  As a user
  I want to log in with my Google account
  So that I can access OrganicLever without managing a separate password

  Background:
    Given the API is running

  Scenario: Successful Google login returns access and refresh tokens
    Given a valid Google ID token for user "alice@example.com" with name "Alice" and avatar "https://example.com/alice.jpg"
    When the client sends POST /api/v1/auth/google with the Google ID token
    Then the response status code should be 200
    And the response body should contain a non-null "accessToken" field
    And the response body should contain a non-null "refreshToken" field
    And the response body should contain "tokenType" equal to "Bearer"

  Scenario: First-time Google login creates a new user record
    Given no user exists with Google ID "google-123"
    And a valid Google ID token for "newuser@example.com" with Google ID "google-123"
    When the client sends POST /api/v1/auth/google with the Google ID token
    Then the response status code should be 200
    And a user record should be created with email "newuser@example.com"

  Scenario: Returning Google login updates user profile from Google
    Given a user exists with Google ID "google-456" and name "Old Name"
    And a valid Google ID token for Google ID "google-456" with name "New Name"
    When the client sends POST /api/v1/auth/google with the Google ID token
    Then the response status code should be 200
    And the user name should be updated to "New Name"

  Scenario: Invalid Google ID token is rejected
    Given an invalid Google ID token
    When the client sends POST /api/v1/auth/google with the Google ID token
    Then the response status code should be 401
    And the response body should contain an error message about invalid token

  Scenario: Malformed JSON body to google login is rejected
    When the client sends POST /api/v1/auth/google with a malformed request body
    Then the response status code should be 400
    And the response body should contain an error message about bad request

  Scenario: Empty idToken in google login is rejected
    When the client sends POST /api/v1/auth/google with an empty idToken
    Then the response status code should be 400
    And the response body should contain an error message about bad request

  Scenario: Refresh token rotation returns new token pair
    Given a user "alice@example.com" has a valid refresh token
    When the client sends POST /api/v1/auth/refresh with the refresh token
    Then the response status code should be 200
    And the response body should contain a new "accessToken"
    And the response body should contain a new "refreshToken"
    And the old refresh token should be invalidated

  Scenario: Expired refresh token is rejected
    Given a user "alice@example.com" has an expired refresh token
    When the client sends POST /api/v1/auth/refresh with the expired refresh token
    Then the response status code should be 401
    And the response body should contain an error message about expired token

  Scenario: Malformed JSON body to refresh is rejected
    When the client sends POST /api/v1/auth/refresh with a malformed request body
    Then the response status code should be 400
    And the response body should contain an error message about bad request

  Scenario: Refresh token for deleted user is rejected
    Given a user "alice@example.com" has a valid refresh token
    And the user records have been deleted while keeping tokens
    When the client sends POST /api/v1/auth/refresh with the refresh token
    Then the response status code should be 401
    And the response body should contain an error message about user not found
