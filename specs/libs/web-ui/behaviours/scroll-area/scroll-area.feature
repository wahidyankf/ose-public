Feature: Scroll area

  # Behaviour: WUI-029
  Scenario: A scroll area scrolls overflowing content
    Given a scroll area 100 pixels tall holding 400 pixels of content
    When the user scrolls the area down by 150 pixels
    Then the scroll area is scrolled to 150 pixels
