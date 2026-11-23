Feature: Command palette

  # Behaviour: WUI-025
  Scenario: A command palette filters items as the user types and runs the chosen item
    Given a command palette lists the items "Home", "Settings", and "Sign out"
    When the user types "set" into the command palette
    Then only the item "Settings" is listed
    When the user chooses the item "Settings"
    Then the chosen item is "Settings"

  # Behaviour: WUI-025
  Scenario: A command palette shows its empty message when nothing matches
    Given a command palette lists the items "Home", "Settings", and "Sign out"
    When the user types "zzz" into the command palette
    Then the empty message "No matching commands" is shown
