Feature: OrganicLever marketing home page

  The public marketing site (organiclever-www) renders the OrganicLever
  landing experience at the domain root, carried over from the former
  organiclever-app-web landing context.

  # Behaviour: OWW-001
  # Behaviour: OWW-002
  Scenario: Hero heading visible
    When I navigate to the marketing home page
    Then I see text "Your life,"
    And I see text "tracked."
    And I see text "Analyzed."

  # Behaviour: OWW-003
  Scenario: Primary call-to-action button present
    When I navigate to the marketing home page
    Then I see a button "Open the app"

  # Behaviour: OWW-004
  Scenario: The Open the app button takes the visitor to /app/home
    When I navigate to the marketing home page
    And I click the "Open the app" button
    Then the visitor lands on "/app/home"

  # Behaviour: OWW-010
  Scenario: The hero links to the project on GitHub
    When I navigate to the marketing home page
    Then the hero links "Open source" to the project on GitHub
    And the hero links "Fork & make it yours" to the project fork on GitHub

  # Behaviour: OWW-005
  Scenario: Footer link present
    When I navigate to the marketing home page
    Then I see text "Open app →"

  # Behaviour: OWW-006
  Scenario: Home page tells the visitor the product is Pre-Alpha
    When I navigate to the marketing home page
    Then I see text "Pre-Alpha"
    And I see text "Pre-Alpha — expect bugs, rough edges, and breaking changes"

  # Behaviour: OWW-007
  Scenario: Home page shows the five event types and the custom event card
    When I navigate to the marketing home page
    Then I see text "Workouts"
    And I see text "Reading"
    And I see text "Learning"
    And I see text "Meals"
    And I see text "Focus"
    And I see text "Plus your own."

  # Behaviour: OWW-008
  Scenario: Weekly rhythm demo visible
    When I navigate to the marketing home page
    Then I see text "Last 7 days"

  # Behaviour: OWW-009
  Scenario: All six principles visible
    When I navigate to the marketing home page
    Then I see text "Local-first"
    And I see text "Yours to take"
    And I see text "Flexible"
    And I see text "Quiet"
    And I see text "Open"
    And I see text "Multilingual"
