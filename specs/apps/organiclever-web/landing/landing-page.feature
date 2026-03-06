Feature: Landing Page

  As a visitor to OrganicLever
  I want to see what the product offers
  So that I can decide whether to sign up

  Scenario: Unauthenticated visitor sees login call-to-action in the header
    Given a visitor has not logged in
    When the visitor opens the OrganicLever home page
    Then the header should display a "Login" link
    And the page should display a "Get Started" button
    And the page headline should read "Boost Your Software Team's Productivity"

  Scenario: Authenticated user sees dashboard link instead of login
    Given a user is logged in as "user@example.com"
    When the user opens the OrganicLever home page
    Then the header should display a "Dashboard" link
    And a "Login" link should not be visible in the header

  Scenario: Clicking "Get Started" takes the visitor to the login page
    Given a visitor has not logged in
    And the visitor is on the OrganicLever home page
    When the visitor clicks the "Get Started" button
    Then the visitor should be on the login page
