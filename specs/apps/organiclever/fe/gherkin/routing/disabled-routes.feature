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
