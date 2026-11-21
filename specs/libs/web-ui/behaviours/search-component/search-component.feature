Feature: Search component

  # Behaviour: WUI-021
  Scenario: Typing updates the term and URL; Clear search empties both
    Given the search box is empty
    When the user types "salt" into the search box
    Then the search term is "salt" and the page URL has the query "q" set to "salt"
    When the user clicks Clear search
    Then the search term is empty and the page URL has no query "q"
