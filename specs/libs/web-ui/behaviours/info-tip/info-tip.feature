Feature: InfoTip component

  # Behaviour: WUI-015
  Scenario: Trigger button renders
    When I render an InfoTip with title "Volume" and text "Adjust the volume"
    Then the trigger button with aria-label "Volume" should be visible

  # Behaviour: WUI-015
  Scenario: Click trigger opens Sheet
    Given I render an InfoTip with title "Volume" and text "Adjust the volume"
    When the user clicks the trigger button
    Then the Sheet with title "Volume" should be visible

  # Behaviour: WUI-015
  Scenario: Sheet close button closes Sheet
    Given I render an InfoTip with title "Volume" and text "Adjust the volume"
    When the user clicks the trigger button
    And the user clicks the close button
    Then the Sheet should not be visible
