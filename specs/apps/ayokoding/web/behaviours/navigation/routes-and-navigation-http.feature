Feature: Canonical routes and learning navigation over HTTP

  As a reader following site links
  I want stable destinations and clear navigation
  So that existing bookmarks and learning journeys continue to work

  Background:
    Given the app is running

  # Behaviour: AYB-012
  Scenario: The root enters the default locale
    When a visitor requests the root URL
    Then the visitor is redirected to "/en"
    And the redirect does not loop

  # Behaviour: AYB-013
  Scenario Outline: Uppercase locale entries resolve to lowercase URLs
    When a visitor requests "<source>"
    Then the response permanently redirects with status 308 to "<destination>"

    Examples:
      | source            | destination       |
      | /EN               | /en               |
      | /ID               | /id               |
      | /EN/learn/courses | /en/learn/courses |

  # Behaviour: AYB-022
  Scenario Outline: An old URL redirects 308 to its current page
    When a visitor requests "<source>"
    Then the response permanently redirects with status 308 to "<destination>"
    And the query string is preserved
    And the redirect does not depend on the old page still existing

    Examples:
      | source                                                                            | destination                                         |
      | /en/learn/fundamentally-strong/software-engineer/just-enough-python/learning/intro | /en/learn/courses/just-enough-python/learning/intro |

  # Behaviour: AYB-022
  @fixture
  Scenario: A fixture-only old URL redirects 308 to its current page
    When a visitor requests "/en/old-guide?from=local"
    Then the response permanently redirects with status 308 to "/en/learn/courses/go-basics/learning/hello-world?from=local"
    And the query string is preserved
    And the redirect does not depend on the old page still existing

  # Behaviour: AYB-021
  Scenario: A legacy archived page URL shows the archived page
    When a reader opens a legacy archived page
    Then the archived page shows its title and canonical body
