Feature: User Profile

  As an authenticated user
  I want to retrieve my profile information
  So that I can see my account details

  Background:
    Given the API is running

  Scenario: Authenticated user can fetch own profile
    Given a user "alice@example.com" is authenticated with a valid access token
    When the client sends GET /api/v1/auth/me with the access token
    Then the response status code should be 200
    And the response body should contain "email" equal to "alice@example.com"
    And the response body should contain a non-null "name" field
    And the response body should contain a non-null "avatarUrl" field

  Scenario: Unauthenticated request is rejected
    When the client sends GET /api/v1/auth/me without an access token
    Then the response status code should be 401

  Scenario: Expired access token is rejected
    Given a user "alice@example.com" has an expired access token
    When the client sends GET /api/v1/auth/me with the expired access token
    Then the response status code should be 401

  Scenario: Deleted user profile returns not found
    Given a user "alice@example.com" is authenticated with a valid access token
    And the database has been reset
    When the client sends GET /api/v1/auth/me with the access token
    Then the response status code should be 401

  Scenario: Access token with no sub claim is rejected
    Given a crafted access token with no subject claim
    When the client sends GET /api/v1/auth/me with the access token
    Then the response status code should be 401

  Scenario: Access token with non-GUID sub claim is rejected
    Given a crafted access token with a non-GUID subject claim "not-a-valid-guid"
    When the client sends GET /api/v1/auth/me with the access token
    Then the response status code should be 401
