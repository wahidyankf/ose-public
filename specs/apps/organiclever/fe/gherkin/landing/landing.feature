Feature: OrganicLever landing page

  Background:
    Given I navigate to "/"

  Scenario: Hero heading visible
    Then I see text "Your life,"
    And I see text "tracked."
    And I see text "Analyzed."

  Scenario: CTA button present and functional
    Given I see a button "Open the app"
    When I click "Open the app"
    Then the URL hash contains "/app"

  Scenario: Footer link navigates to app
    Given I see text "Open app →"
    When I click "Open app →"
    Then the URL hash contains "/app"

  Scenario: Pre-Alpha badge visible in nav
    Then I see text "Pre-Alpha"

  Scenario: Alpha warning banner visible
    Then I see text "Pre-Alpha — expect breaking changes"

  Scenario: All five event type cards visible
    Then I see text "Workouts"
    And I see text "Reading"
    And I see text "Learning"
    And I see text "Meals"
    And I see text "Focus"

  Scenario: Custom event card visible
    Then I see text "Plus your own."

  Scenario: Weekly rhythm demo visible
    Then I see text "Last 7 days"

  Scenario: All six principles visible
    Then I see text "Local-first"
    And I see text "Yours to take"
    And I see text "Flexible"
    And I see text "Quiet"
    And I see text "Open"
    And I see text "Multilingual"
