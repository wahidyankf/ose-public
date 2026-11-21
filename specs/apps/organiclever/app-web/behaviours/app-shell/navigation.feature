Feature: App Shell Navigation

  As an app user
  I want consistent bottom-tab navigation across all screens
  So that I can move between sections of the app without losing my place

  # Behaviour: OAW-013
  Scenario Outline: Tapping a tab opens its screen and marks the tab active
    Given the app shell is visible
    When the user taps the "<tab>" tab
    Then the "<screen>" screen is visible
    And the "<tab>" tab is marked active

    Examples:
      | tab      | screen   |
      | History  | History  |
      | Progress | Progress |
      | Settings | Settings |

  # Behaviour: OAW-002
  # Behaviour: OAW-003
  # Behaviour: OAW-004
  Scenario Outline: URL persists across page refresh on each tab
    Given the user is on "<path>"
    When the user refreshes the page
    Then the URL is still "<path>"
    And the "<screen>" screen is visible

    Examples:
      | path          | screen   |
      | /app/home     | Home     |
      | /app/history  | History  |
      | /app/progress | Progress |
      | /app/settings | Settings |
