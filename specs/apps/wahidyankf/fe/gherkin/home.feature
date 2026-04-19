Feature: Home page

  As a visitor to wahidyankf-web
  I want the home page to show the portfolio summary
  So that I can quickly understand what the site is about

  Background:
    Given the app is running

  Scenario: Home renders the welcome heading
    When a visitor opens the home page
    Then the H1 shows "Welcome to My Portfolio"

  Scenario: Home renders the About Me card
    When a visitor opens the home page
    Then an About Me card is visible

  Scenario: Home renders the Skills & Expertise card with three subsections
    When a visitor opens the home page
    Then a Skills & Expertise card is visible
    And the card has a "Top Skills Used in The Last 5 Years" subsection
    And the card has a "Top Programming Languages Used in The Last 5 Years" subsection
    And the card has a "Top Frameworks & Libraries Used in The Last 5 Years" subsection

  Scenario: Home renders the Quick Links card with two internal links
    When a visitor opens the home page
    Then a Quick Links card is visible
    And the card contains a "View My CV" link to /cv
    And the card contains a "Browse My Personal Projects" link to /personal-projects

  Scenario: Home renders the Connect With Me card with five external links
    When a visitor opens the home page
    Then a Connect With Me card is visible
    And the card has Github, GithubOrg, Linkedin, Website, and Email links
