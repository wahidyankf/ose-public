Feature: Google Login Page

  As a visitor
  I want to sign in with my Google account
  So that I can access my OrganicLever profile

  Background:
    Given the app is running

  Scenario: Login page displays Google sign-in button
    When I navigate to /login
    Then I should see a "Sign in with Google" button
    And there should be no email/password form

  Scenario: Successful Google sign-in redirects to profile
    Given I am on the /login page
    When I click "Sign in with Google"
    And I complete the Google OAuth flow successfully
    Then I should be redirected to /profile
    And I should see my profile information
