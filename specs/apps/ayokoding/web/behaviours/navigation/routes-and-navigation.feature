Feature: Canonical routes and learning navigation

  As a reader following site links
  I want stable destinations and clear navigation
  So that existing bookmarks and learning journeys continue to work

  Background:
    Given the app is running

  Scenario: The root enters the default locale
    When a visitor requests the root URL
    Then the visitor is redirected to "/en"
    And the redirect does not loop

  Scenario Outline: Uppercase locale entries resolve to lowercase URLs
    When a visitor requests "<source>"
    Then the response permanently redirects with status 308 to "<destination>"

    Examples:
      | source            | destination       |
      | /EN               | /en               |
      | /ID               | /id               |
      | /EN/learn/courses | /en/learn/courses |

  Scenario: An established redirect preserves its current destination and query
    Given an old content URL has a redirect in the current committed redirect inventory
    When a visitor requests that URL with a query string
    Then the response is a 308 redirect to the inventory's canonical destination
    And the query string is preserved
    And the redirect does not depend on the old page still existing

  Scenario: Sidebar and breadcrumbs identify the current page
    When a reader opens a nested published lesson
    Then the sidebar expands its ancestors and identifies the active page
    And the breadcrumbs link to its current section and course ancestors
    And every link stays within the selected locale

  Scenario: A lesson follows the selected path's sequence
    Given a reader opened a lesson through a valid learning path
    When the reader follows the next or previous lesson control
    Then the destination follows the path's current phase and course order
    And the path context remains in the destination URL

  Scenario: Browser back restores the previous content location
    Given a reader has followed an internal link to another content page
    When the reader navigates back
    Then the previous content route and its URL state are restored
    And navigation controls reflect the restored location
