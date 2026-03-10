Feature: Permissions

  As an administrator
  I want to assign and remove permissions on roles and enforce them on endpoints
  So that I can control what actions each role can perform and protect resources

  Background:
    Given the IAM API is running
    And an admin user "superadmin" is registered and logged in with role "admin"
    And a role "editor" exists
    And a user "bob" is registered with role "editor"

  Scenario: Assign a single permission to a role
    When the admin sends POST /api/v1/roles/{roleId}/permissions with body { "permission": "content:write" }
    Then the response status code should be 201

  Scenario: List permissions on a role returns current assignments
    Given the role "editor" has permissions "content:write" and "content:publish"
    When the admin sends GET /api/v1/roles/{roleId}/permissions
    Then the response status code should be 200
    And the response body should contain "content:write" in the permissions list
    And the response body should contain "content:publish" in the permissions list

  Scenario: Remove a permission from a role
    Given the role "editor" has the permission "content:write"
    When the admin sends DELETE /api/v1/roles/{roleId}/permissions/content:write
    Then the response status code should be 204

  Scenario: Request to permission-protected endpoint without required permission returns 403
    Given "bob" has logged in and stored the access token
    When bob sends a request to a permission-protected endpoint requiring "content:write"
    Then the response status code should be 403

  Scenario: Request to permission-protected endpoint with required permission returns 200
    Given the role "editor" has the permission "content:write"
    And "bob" has logged in and stored the access token
    When bob sends a request to a permission-protected endpoint requiring "content:write"
    Then the response status code should be 200
