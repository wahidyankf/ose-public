Feature: Landing hero surfaces goal paths

  As a first-time visitor
  I want the site landing page's hero to show the goal-labeled paths directly
  So that I can pick a learning path without hunting through a generic menu first

  # Behaviour: AYW-132
  Scenario: The landing hero shows a card for each published path
    Given a first-time visitor opens the site landing page at /en
    When the hero section renders
    Then the hero shows a goal-labeled path card for each published path

  # Behaviour: AYW-132
  Scenario: The landing hero links to compare all paths
    Given a first-time visitor opens the site landing page at /en
    When the hero section renders
    Then a "Compare all paths" link to /en/learn/paths is visible below the cards
