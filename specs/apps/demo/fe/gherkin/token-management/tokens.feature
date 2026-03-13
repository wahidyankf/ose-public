Feature: Token Management

  As a service integrator
  I want access tokens to contain standard claims and be properly managed
  So that the frontend can authorize requests and handle token revocation

  Background:
    Given the app is running
    And a user "alice" is registered with password "Str0ng#Pass1"
    And alice has logged in

  Scenario: Session info displays the authenticated user's identity
    When alice opens the session info panel
    Then the panel should display alice's user ID

  Scenario: Session info shows the token issuer
    When alice opens the session info panel
    Then the panel should display a non-empty issuer value

  Scenario: JWKS endpoint is accessible for token verification
    Given the app is running
    When the app fetches the JWKS endpoint
    Then at least one public key should be available

  Scenario: Logging out marks the session as ended
    When alice clicks the "Logout" button
    Then the authentication session should be cleared
    And navigating to a protected page should redirect to login

  Scenario: Blacklisted token is rejected on protected page navigation
    Given alice has logged out
    When alice attempts to access the dashboard directly
    Then alice should be redirected to the login page

  Scenario: Disabled user is immediately logged out
    Given an admin has disabled alice's account
    When alice navigates to a protected page
    Then alice should be redirected to the login page
    And an error message about account being disabled should be displayed
