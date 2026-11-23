Feature: Landing Page
  As a site visitor
  I want to see the platform mission and key links on the home page
  So that I can quickly understand what OSE Platform is and where to go next

  Background:
    Given the app is running

  # Behaviour: OSW-001
  Scenario: The landing page is served at / with the site title
    When the landing page is rendered
    Then the page title is "OSE Platform"

  # Behaviour: OSW-013
  Scenario: Hero shows the title and mission description
    When the landing page is rendered
    Then the hero section displays the title "Open Sharia Enterprise Platform"
    And the hero section displays a description of the platform mission

  # Behaviour: OSW-013
  Scenario: Hero links to About and to GitHub
    When the landing page is rendered
    Then the hero section contains a "Learn More" link to "/about/"
    And the hero section contains a "GitHub" link

  # Behaviour: OSW-014
  Scenario: Social icons are displayed
    When the landing page is rendered
    Then a GitHub icon link is visible
    And an RSS feed icon link is visible
