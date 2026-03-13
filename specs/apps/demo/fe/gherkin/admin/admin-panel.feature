Feature: Admin Panel

  As an administrator
  I want to search, list, and control user accounts through the admin panel
  So that I can monitor the user base and respond to security incidents

  Background:
    Given the app is running
    And an admin user "superadmin" is logged in
    And users "alice", "bob", and "carol" are registered

  Scenario: Admin panel displays a paginated user list
    When the admin navigates to the user management page
    Then the user list should display registered users
    And the list should include pagination controls
    And the list should display total user count

  Scenario: Searching users by email filters the list
    When the admin navigates to the user management page
    And the admin types "alice@example.com" in the search field
    Then the user list should display only users matching "alice@example.com"

  Scenario: Admin disables a user account from the user detail page
    When the admin navigates to alice's user detail page
    And the admin clicks the "Disable" button with reason "Policy violation"
    Then alice's status should display as "disabled"

  Scenario: Disabled user sees an error when trying to access their dashboard
    Given alice's account has been disabled by the admin
    When alice attempts to access the dashboard
    Then alice should be redirected to the login page
    And an error message about account being disabled should be displayed

  Scenario: Admin re-enables a disabled user account
    Given alice's account has been disabled
    When the admin navigates to alice's user detail page
    And the admin clicks the "Enable" button
    Then alice's status should display as "active"

  Scenario: Admin generates a password-reset token for a user
    When the admin navigates to alice's user detail page
    And the admin clicks the "Generate Reset Token" button
    Then a password reset token should be displayed
    And a copy-to-clipboard button should be available
