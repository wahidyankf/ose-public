Feature: App Routes URL Scheme

  As an app user
  I want each section of the app to have a stable URL
  So that I can bookmark, share, and refresh pages without losing my navigation state

  Background:
    Given the application is running

  # AC-1 and AC-8 — Old /app bookmark and default route redirect to /app/home with 308
  # @local-fullstack — Verified in dev-workflow E2E against the real container stack.
  # On Vercel staging the Deployment Protection auth wall and edge redirect handling
  # can intercept the request before Next.js runs, returning a non-308 status; the
  # contract itself (next.config.ts redirects()) is exercised by dev E2E.
  @local-fullstack
  # Behaviour: OAW-010
  Scenario: Visiting /app permanent-redirects to /app/home
    When a visitor requests GET "/app"
    Then the response is a 308 redirect to "/app/home"
    When the user navigates to "/app"
    Then the URL becomes "/app/home"
    And the Home screen is visible

  # Behaviour: OAW-009
  Scenario: Visiting / redirects to /app/home
    When a visitor requests GET "/"
    Then the response redirects to "/app/home"

  # AC-2 — Each tab has a route
  # Behaviour: OAW-001
  # Behaviour: OAW-002
  # Behaviour: OAW-003
  # Behaviour: OAW-004
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

  # AC-5 — Browser back returns to previous screen
  # Behaviour: OAW-003
  Scenario: Back from Progress returns to Home
    Given the user navigated from "/app/home" to "/app/progress"
    When the user presses the browser back button
    Then the URL becomes "/app/home"
    And the Home screen is visible

  # AC-12 — Unknown sub-paths return 404
  # Behaviour: OAW-011
  Scenario: Unknown segment under /app returns 404
    When a visitor requests GET "/app/does-not-exist"
    Then the response status is 404
