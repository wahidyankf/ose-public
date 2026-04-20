Feature: Landing Page

  Scenario: Root renders landing without BE
    Given ORGANICLEVER_BE_URL is unset
    When a visitor requests GET /
    Then the response status is 200
    And the body contains the landing page heading
    And no request is made to organiclever-be
    And the page loads at / without intermediate redirect
