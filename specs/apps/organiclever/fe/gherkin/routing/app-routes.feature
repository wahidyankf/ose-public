Feature: App Routes URL Scheme

  Background:
    Given the application is running

  # AC-1 — Default route shows Home (redirect)
  Scenario: Visiting /app redirects to /app/home
    Given the app is freshly loaded
    When the user navigates to "/app"
    Then the URL becomes "/app/home"
    And the Home screen is visible

  Scenario: Visiting /app/home renders the Home screen
    Given the app is freshly loaded
    When the user navigates to "/app/home"
    Then the Home screen is visible
    And the Home tab is marked active in the navigation

  # AC-2 — Each tab has a route
  Scenario Outline: Each tab is reachable by URL
    Given the app shell is visible
    When the user navigates to "<path>"
    Then the "<screen>" screen is visible
    And the "<tab>" tab is marked active

    Examples:
      | path           | screen   | tab      |
      | /app/home      | Home     | Home     |
      | /app/history   | History  | History  |
      | /app/progress  | Progress | Progress |
      | /app/settings  | Settings | Settings |

  # AC-4 — Refresh stays on current tab
  Scenario Outline: Refreshing a tab URL keeps the user on that tab
    Given the user is on "<path>"
    When the user refreshes the page
    Then the URL is still "<path>"
    And the "<screen>" screen is visible

    Examples:
      | path           | screen   |
      | /app/history   | History  |
      | /app/progress  | Progress |
      | /app/settings  | Settings |

  # AC-5 — Browser back returns to previous screen
  Scenario: Back from Progress returns to Home
    Given the user navigated from "/app/home" to "/app/progress"
    When the user presses the browser back button
    Then the URL becomes "/app/home"
    And the Home screen is visible

  # AC-8 — Old /app bookmark redirects to /app/home with 308
  Scenario: Old /app URL permanent-redirects to /app/home
    When a visitor requests GET "/app"
    Then the response is a 308 redirect to "/app/home"

  # AC-12 — Unknown sub-paths return 404
  Scenario: Unknown segment under /app returns 404
    When a visitor requests GET "/app/does-not-exist"
    Then the response status is 404
