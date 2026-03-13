Feature: User Profile

  As an authenticated user
  I want to view and manage my profile, password, and account status
  So that I can keep my information current and control my access

  Background:
    Given the app is running
    And a user "alice" is registered with email "alice@example.com" and password "Str0ng#Pass1"
    And alice has logged in

  Scenario: Profile page displays username, email, and display name
    When alice navigates to the profile page
    Then the profile should display username "alice"
    And the profile should display email "alice@example.com"
    And the profile should display a display name

  Scenario: Updating display name shows the new value
    When alice navigates to the profile page
    And alice changes the display name to "Alice Smith"
    And alice saves the profile changes
    Then the profile should display display name "Alice Smith"

  Scenario: Changing password with correct old password succeeds
    When alice navigates to the change password form
    And alice enters old password "Str0ng#Pass1" and new password "NewPass#456"
    And alice submits the password change
    Then a success message about password change should be displayed

  Scenario: Changing password with incorrect old password shows an error
    When alice navigates to the change password form
    And alice enters old password "Wr0ngOld!" and new password "NewPass#456"
    And alice submits the password change
    Then an error message about invalid credentials should be displayed

  Scenario: Self-deactivating account redirects to login
    When alice navigates to the profile page
    And alice clicks the "Deactivate Account" button
    And alice confirms the deactivation
    Then alice should be redirected to the login page

  Scenario: Self-deactivated user cannot log in
    Given alice has deactivated her account
    When alice submits the login form with username "alice" and password "Str0ng#Pass1"
    Then an error message about account deactivation should be displayed
    And alice should remain on the login page
