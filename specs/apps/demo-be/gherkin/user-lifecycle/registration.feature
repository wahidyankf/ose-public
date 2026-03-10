Feature: User Registration

  As a new visitor
  I want to register an account with my username, email, and password
  So that I can access the IAM-protected platform

  Background:
    Given the IAM API is running

  Scenario: Successful registration returns created user profile without password
    When the client sends POST /api/v1/auth/register with body { "username": "alice", "email": "alice@example.com", "password": "Str0ng#Pass1" }
    Then the response status code should be 201
    And the response body should contain "username" equal to "alice"
    And the response body should not contain a "password" field

  Scenario: Successful registration response includes non-null user ID
    When the client sends POST /api/v1/auth/register with body { "username": "alice", "email": "alice@example.com", "password": "Str0ng#Pass1" }
    Then the response status code should be 201
    And the response body should contain a non-null "id" field

  Scenario: Reject registration when username already exists
    Given a user "alice" is registered with email "alice@example.com" and password "Str0ng#Pass1"
    When the client sends POST /api/v1/auth/register with body { "username": "alice", "email": "new@example.com", "password": "Str0ng#Pass1" }
    Then the response status code should be 409
    And the response body should contain an error message about duplicate username

  Scenario: Reject registration with invalid email format
    When the client sends POST /api/v1/auth/register with body { "username": "alice", "email": "not-an-email", "password": "Str0ng#Pass1" }
    Then the response status code should be 400
    And the response body should contain a validation error for "email"

  Scenario: Reject registration with empty password
    When the client sends POST /api/v1/auth/register with body { "username": "alice", "email": "alice@example.com", "password": "" }
    Then the response status code should be 400
    And the response body should contain a validation error for "password"

  Scenario: Reject registration with weak password — no uppercase letter
    When the client sends POST /api/v1/auth/register with body { "username": "alice", "email": "alice@example.com", "password": "str0ng#pass1" }
    Then the response status code should be 400
    And the response body should contain a validation error for "password"
