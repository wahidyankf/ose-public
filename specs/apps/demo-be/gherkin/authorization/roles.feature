Feature: Roles

  As an administrator
  I want to create, update, and assign roles to users
  So that I can organize permissions into named groups and control user access

  Background:
    Given the IAM API is running
    And an admin user "superadmin" is registered and logged in with role "admin"

  Scenario: Create role with unique name returns 201 with role ID
    When the admin sends POST /api/v1/roles with body { "name": "editor", "description": "Can edit content" }
    Then the response status code should be 201
    And the response body should contain a non-null "id" field
    And the response body should contain "name" equal to "editor"

  Scenario: Reject role creation when name already exists
    Given a role "editor" already exists
    When the admin sends POST /api/v1/roles with body { "name": "editor", "description": "Duplicate" }
    Then the response status code should be 409
    And the response body should contain an error message about duplicate role name

  Scenario: Update role name and description
    Given a role "editor" exists with ID stored
    When the admin sends PATCH /api/v1/roles/{roleId} with body { "name": "content-editor", "description": "Updated description" }
    Then the response status code should be 200
    And the response body should contain "name" equal to "content-editor"

  Scenario: Assign a role to a user
    Given a user "bob" is registered with password "Str0ng#Pass1"
    And a role "editor" exists
    When the admin sends POST /api/v1/users/{bob_id}/roles with body { "role_id": "{editor_id}" }
    Then the response status code should be 201

  Scenario: List user roles returns all currently assigned roles
    Given a user "bob" is registered with password "Str0ng#Pass1"
    And a role "editor" exists
    And the role "editor" is assigned to user "bob"
    When the admin sends GET /api/v1/users/{bob_id}/roles
    Then the response status code should be 200
    And the response body should contain "editor" in the roles list

  Scenario: Remove a role from a user
    Given a user "bob" is registered with password "Str0ng#Pass1"
    And a role "editor" exists
    And the role "editor" is assigned to user "bob"
    When the admin sends DELETE /api/v1/users/{bob_id}/roles/{editor_id}
    Then the response status code should be 204
