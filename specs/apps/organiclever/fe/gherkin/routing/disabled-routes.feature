Feature: Disabled Routes

  Scenario Outline: Disabled routes return 404
    Given the application is running in local-first mode
    When a visitor requests <method> <path>
    Then the response status is 404

    Examples:
      | method | path              |
      | GET    | /login            |
      | GET    | /profile          |
      | POST   | /api/auth/google  |
      | GET    | /api/auth/refresh |
      | GET    | /api/auth/me      |
