Feature: Canonical routes and learning navigation

  As a reader following site links
  I want stable destinations and clear navigation
  So that existing bookmarks and learning journeys continue to work

  Background:
    Given the app is running

  # Behaviour: AYB-047
  Scenario: The sidebar marks the active page and opens its ancestors
    When a reader opens a nested published lesson
    Then the sidebar expands its ancestors and identifies the active page
    And every link stays within the selected locale

  # Behaviour: AYB-047
  Scenario: Breadcrumbs link to the section and course ancestors
    When a reader opens a nested published lesson
    Then the breadcrumbs link to its current section and course ancestors
    And every link stays within the selected locale

  # Behaviour: AYB-047
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

  # Behaviour: AYB-015
  # Behaviour: AYB-019
  Scenario Outline: The learn home and learning paths hub pages list their entries in the selected locale
    When a reader opens the "<page>" page in the "<locale>" locale
    Then the page lists its entries in the "<locale>" locale

    Examples:
      | page       | locale |
      | learn home | en     |
      | paths hub  | en     |
