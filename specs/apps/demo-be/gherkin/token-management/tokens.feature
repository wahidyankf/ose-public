Feature: Tokens

  As a service integrator
  I want access tokens to contain standard claims and be revocable
  So that downstream services can authorize requests and compromised tokens can be invalidated

  Background:
    Given the IAM API is running
    And a user "alice" is registered with role "editor" and password "Str0ng#Pass1"
    And "alice" has logged in and stored the access token

  Scenario: Access token payload contains user ID claim
    When alice decodes her access token payload
    Then the token should contain a non-null "sub" claim

  Scenario: Access token payload contains roles claim listing assigned roles
    When alice decodes her access token payload
    Then the token should contain a "roles" claim
    And the "roles" claim should include "editor"

  Scenario: JWKS endpoint returns the public key for token signature verification
    When the client sends GET /.well-known/jwks.json
    Then the response status code should be 200
    And the response body should contain at least one key in the "keys" array

  Scenario: Logout blacklists the access token
    When alice sends POST /api/v1/auth/logout with her access token
    Then the response status code should be 200
    And alice's access token should be recorded as revoked

  Scenario: Blacklisted access token is rejected with 401 on protected endpoints
    Given alice has logged out and her access token is blacklisted
    When the client sends GET /api/v1/users/me with alice's access token
    Then the response status code should be 401

  Scenario: Deactivating a user revokes all their active tokens
    Given an admin user "superadmin" is registered and logged in with role "admin"
    And the admin has disabled alice's account via POST /api/v1/admin/users/{alice_id}/disable
    When the client sends GET /api/v1/users/me with alice's access token
    Then the response status code should be 401
