Feature: Route Protection

  As the application
  I want to protect authenticated routes
  So that only logged-in users can access sensitive pages

  Background:
    Given the app is running

  Scenario: Unauthenticated user is redirected from profile to login
    Given I am not logged in
    When I navigate to /profile
    Then I should be redirected to /login

  Scenario: Authenticated user can access profile page
    Given I am logged in via Google OAuth
    When I navigate to /profile
    Then I should see the profile page

  Scenario: Root page redirects authenticated user to profile
    Given I am logged in via Google OAuth
    When I navigate to /
    Then I should be redirected to /profile

  Scenario: Root page redirects unauthenticated user to login
    Given I am not logged in
    When I navigate to /
    Then I should be redirected to /login
