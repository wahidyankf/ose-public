Feature: JWT Protected Endpoints

  Background:
    Given the OrganicLever API is running

  Scenario: Request to protected endpoint without token is rejected
    When a client sends GET /api/v1/hello without an Authorization header
    Then the response status code should be 401

  Scenario: Request to protected endpoint with valid JWT is accepted
    Given a user "alice" is already registered with password "s3cur3Pass!"
    And the client has logged in as "alice" and stored the JWT token
    When a client sends GET /api/v1/hello with the stored Bearer token
    Then the response status code should be 200

  Scenario: Request to protected endpoint with expired JWT is rejected
    When a client sends GET /api/v1/hello with an expired Bearer token
    Then the response status code should be 401

  Scenario: Request to protected endpoint with malformed JWT is rejected
    When a client sends GET /api/v1/hello with Authorization header "Bearer not.a.jwt"
    Then the response status code should be 401

  Scenario: Health endpoint is accessible without authentication
    When a client sends GET /health
    Then the response status code should be 200

  Scenario: Auth endpoints are accessible without authentication
    When a client sends POST /api/v1/auth/register with body:
      """
      { "username": "newuser99", "password": "Passw0rd!!" }
      """
    Then the response status code should be 201
