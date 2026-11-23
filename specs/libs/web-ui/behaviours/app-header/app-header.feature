Feature: AppHeader component

  # Behaviour: WUI-012
  Scenario: Renders title
    When I render an AppHeader with title "Workouts"
    Then the heading "Workouts" should be visible

  # Behaviour: WUI-012
  Scenario Outline: The back button is shown only when onBack is provided
    When I render an AppHeader with title "Details" <setup>
    Then the back button should be <presence>

    Examples:
      | setup                 | presence |
      | and an onBack handler | shown    |
      | without onBack        | absent   |

  # Behaviour: WUI-012
  Scenario: Back button click triggers onBack
    Given I render an AppHeader with title "Details" and an onBack handler
    When the user clicks the back button
    Then onBack should be called

  # Behaviour: WUI-012
  Scenario: Renders subtitle when provided
    When I render an AppHeader with title "Workouts" and subtitle "Today"
    Then the text "Today" should be visible
