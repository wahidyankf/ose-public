Feature: Dropdown menu

  # Behaviour: WUI-026
  Scenario: A dropdown menu opens from its trigger and moves by keyboard
    Given a dropdown menu with the items "Profile", "Billing", and "Log out"
    When the user clicks the menu trigger
    Then the menu lists the items "Profile", "Billing", and "Log out"
    When the user presses ArrowDown in the menu
    Then the item "Profile" has keyboard focus

  # Behaviour: WUI-026
  Scenario: Checkbox and radio items show and change their selection
    Given a dropdown menu with the checkbox item "Show hidden" and the radio items "Small" and "Large"
    When the user clicks the checkbox item "Show hidden"
    Then the checkbox item "Show hidden" is checked
    When the user selects the radio item "Large"
    Then the radio item "Large" is checked and the radio item "Small" is not checked
