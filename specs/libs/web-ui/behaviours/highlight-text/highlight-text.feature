Feature: Highlight text

  # Behaviour: WUI-019
  Scenario: Every case-insensitive match is marked
    Given the text "Salt and salt, not pepper" is highlighted for the search "salt"
    Then the marked parts are "Salt" and "salt"
