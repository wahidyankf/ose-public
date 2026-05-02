# /login and /profile rows remain as guards against accidental re-introduction of
# Google auth UI. They MUST stay 404 in local-first mode.
Feature: Disabled Routes

  Scenario Outline: Disabled routes return 404
    Given the application is running in local-first mode
    When a visitor requests <method> <path>
    Then the response status is 404

    Examples:
      | method | path     |
      | GET    | /login   |
      | GET    | /profile |

  # AC-8 — /app permanent-redirect to /app/home (308). Listed alongside disabled-routes
  # so the redirect contract is colocated with the 404 guard rows.
  Scenario: Old /app URL permanent-redirects to /app/home
    Given the application is running in local-first mode
    When a visitor requests GET "/app"
    Then the response is a 308 redirect to "/app/home"
