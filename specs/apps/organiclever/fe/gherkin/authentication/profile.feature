Feature: User Profile Page

  As an authenticated user
  I want to view my profile page
  So that I can see my account information from Google

  Background:
    Given the app is running
    And I am logged in via Google OAuth

  Scenario: Profile page displays user information
    When I navigate to /profile
    Then I should see my name
    And I should see my email address
    And I should see my profile avatar

  Scenario: Profile page shows data from Google account
    When I navigate to /profile
    Then the displayed name should match my Google account name
    And the displayed email should match my Google account email
    And the displayed avatar should match my Google account avatar
