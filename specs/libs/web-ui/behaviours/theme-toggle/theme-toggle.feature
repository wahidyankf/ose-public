Feature: Theme toggle

  # Behaviour: WUI-022
  Scenario: The toggle switches the theme, relabels itself, and remembers the choice
    Given the theme is "light"
    When the user clicks the theme toggle
    Then the page theme is "dark" and the toggle is labelled "Switch to light theme"
    And the stored theme is "dark"
