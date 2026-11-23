Feature: Tooltip

  # Behaviour: WUI-028
  Scenario: A tooltip shows on hover and on keyboard focus
    Given a button labelled "Save" with the tooltip "Save draft"
    When the user hovers the button
    Then the tooltip "Save draft" is shown
    When the user moves the pointer away and focuses the button with the keyboard
    Then the tooltip "Save draft" is shown
