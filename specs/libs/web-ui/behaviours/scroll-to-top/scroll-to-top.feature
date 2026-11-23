Feature: Scroll to top button

  # Behaviour: WUI-020
  Scenario: The button appears past the threshold and scrolls the page to the top
    Given the page is scrolled to 100 pixels with a threshold of 300 pixels
    Then the scroll to top button is hidden
    When the user scrolls the page to 400 pixels
    Then the scroll to top button is shown
    When the user clicks the scroll to top button
    Then the page is scrolled to 0 pixels
